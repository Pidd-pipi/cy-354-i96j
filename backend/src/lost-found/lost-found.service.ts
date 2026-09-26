import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { LostFoundPost } from "./entities/lost-found-post.entity";
import { LostFoundClaim } from "./entities/lost-found-claim.entity";
import { CreatePostDto } from "./dto/create-post.dto";
import { CreateClaimDto } from "./dto/create-claim.dto";
import { ConfirmHandoverDto } from "./dto/confirm-handover.dto";
import { RejectClaimDto } from "./dto/reject-claim.dto";
import { ClosePostDto } from "./dto/close-post.dto";
import { ListPostsQuery } from "./dto/list-posts.query.dto";
import { featuresMatch } from "./feature-match";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class LostFoundService {
  constructor(
    @InjectRepository(LostFoundPost)
    private readonly postsRepository: Repository<LostFoundPost>,
    @InjectRepository(LostFoundClaim)
    private readonly claimsRepository: Repository<LostFoundClaim>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // 招领启事开放满七天仍无人认领，转入公开列表（懒提升，读取时按截止时间落库）
  private async promoteExpiredPosts(now = new Date()): Promise<void> {
    const cutoff = new Date(now.getTime() - SEVEN_DAYS_MS);
    await this.postsRepository
      .createQueryBuilder()
      .update(LostFoundPost)
      .set({ publicAt: () => "CURRENT_TIMESTAMP(6)" })
      .where("type = :type AND status = :status AND public_at IS NULL AND created_at <= :cutoff", {
        type: "found",
        status: "open",
        cutoff,
      })
      .execute();
  }

  async listPosts(query: ListPostsQuery): Promise<LostFoundPost[]> {
    await this.promoteExpiredPosts();

    const qb = this.postsRepository
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.claims", "claim")
      .orderBy("post.created_at", "DESC")
      .addOrderBy("claim.created_at", "ASC");

    if (query.campus) {
      qb.andWhere("post.campus = :campus", { campus: query.campus });
    }

    switch (query.view) {
      case "lost":
        qb.andWhere("post.type = :type AND post.status != :closed", {
          type: "lost",
          closed: "closed",
        });
        break;
      case "found":
        qb.andWhere(
          "post.type = :type AND post.status != :closed AND post.public_at IS NULL",
          { type: "found", closed: "closed" },
        );
        break;
      case "public":
        qb.andWhere("post.type = :type AND post.status != :closed AND post.public_at IS NOT NULL", {
          type: "found",
          closed: "closed",
        });
        qb.orderBy("post.public_at", "DESC");
        break;
      case "done":
        qb.andWhere("post.status = :closed", { closed: "closed" });
        qb.orderBy("post.closed_at", "DESC");
        break;
    }

    return qb.getMany();
  }

  async getPost(id: number): Promise<LostFoundPost> {
    await this.promoteExpiredPosts();
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: { claims: true },
      order: { claims: { createdAt: "ASC" } },
    });
    if (!post) {
      throw new NotFoundException("启事不存在或已被删除");
    }
    return post;
  }

  async createPost(dto: CreatePostDto): Promise<LostFoundPost> {
    const post = this.postsRepository.create({
      type: dto.type,
      title: dto.title,
      category: dto.category,
      campus: dto.campus,
      location: dto.location,
      happenedAt: new Date(dto.happenedAt),
      features: dto.features,
      contactName: dto.contactName,
      contactInfo: dto.contactInfo,
      status: "open",
      publicAt: null,
    });
    return this.postsRepository.save(post);
  }

  // 提交认领匹配：行级悲观锁保证并发时先提交的人生效
  async claimPost(postId: number, dto: CreateClaimDto) {
    return this.dataSource.transaction(async (manager) => {
      const post = await manager.findOne(LostFoundPost, {
        where: { id: postId },
        lock: { mode: "pessimistic_write" },
      });

      if (!post) {
        throw new NotFoundException("启事不存在或已被删除");
      }
      if (post.status === "closed") {
        throw new ConflictException(`启事已关闭，无法继续认领（${post.result ?? "已结束"}）`);
      }
      if (post.status === "matched") {
        throw new ConflictException("该启事已被其他同学认领，先提交的认领已生效，本次重复认领未受理");
      }
      if (!featuresMatch(post.features, dto.featureProof)) {
        throw new BadRequestException("物品特征不符：你描述的特征与启事登记的特征对不上，请核对后再提交");
      }

      post.status = "matched";
      await manager.save(post);

      const claim = await manager.save(
        manager.create(LostFoundClaim, {
          postId: post.id,
          claimerName: dto.claimerName,
          claimerContact: dto.claimerContact,
          featureProof: dto.featureProof,
          status: "pending",
        }),
      );

      return {
        message: "认领提交成功，已成为该启事唯一有效匹配，请与对方线下核对物品后确认交接",
        post,
        claim,
      };
    });
  }

  private async loadClaimWithPost(claimId: number) {
    const claim = await this.claimsRepository.findOne({
      where: { id: claimId },
      relations: { post: true },
    });
    if (!claim) {
      throw new NotFoundException("认领记录不存在");
    }
    return claim;
  }

  // 线下核对一致，确认交接：关闭启事并留下结果
  async confirmHandover(claimId: number, dto: ConfirmHandoverDto) {
    const claim = await this.loadClaimWithPost(claimId);
    if (claim.status === "confirmed") {
      throw new ConflictException("该认领已确认交接，启事已关闭");
    }
    if (claim.status === "rejected") {
      throw new ConflictException(`该认领此前已被驳回（${claim.rejectReason ?? "原因未填写"}），无法确认交接`);
    }
    if (claim.post.status === "closed") {
      throw new ConflictException(`启事已关闭（${claim.post.result ?? "已结束"}），无法确认交接`);
    }

    return this.dataSource.transaction(async (manager) => {
      claim.status = "confirmed";
      claim.post.status = "closed";
      claim.post.result = dto.result;
      claim.post.closedAt = new Date();
      await manager.save(claim.post);
      await manager.save(claim);
      return {
        message: "线下交接已确认，启事关闭并记录处理结果",
        post: claim.post,
        claim,
      };
    });
  }

  // 特征不符等原因驳回：认领标记驳回，启事重新开放给其他人
  async rejectClaim(claimId: number, dto: RejectClaimDto) {
    const claim = await this.loadClaimWithPost(claimId);
    if (claim.status !== "pending") {
      throw new ConflictException(`该认领已处理（当前状态：${claim.status}），不能重复驳回`);
    }
    if (claim.post.status === "closed") {
      throw new ConflictException(`启事已关闭（${claim.post.result ?? "已结束"}），无法驳回认领`);
    }

    return this.dataSource.transaction(async (manager) => {
      claim.status = "rejected";
      claim.rejectReason = dto.reason;
      if (claim.post.status === "matched") {
        claim.post.status = "open";
      }
      await manager.save(claim.post);
      await manager.save(claim);
      return {
        message: `认领已驳回（原因：${dto.reason}），启事已重新开放`,
        post: claim.post,
        claim,
      };
    });
  }

  // 发布人自行关闭启事（如已自行找回），留下结果；有待核对认领的一并说明原因
  async closePost(postId: number, dto: ClosePostDto) {
    const post = await this.postsRepository.findOne({
      where: { id: postId },
      relations: { claims: true },
    });
    if (!post) {
      throw new NotFoundException("启事不存在或已被删除");
    }
    if (post.status === "closed") {
      throw new ConflictException("启事已关闭，不能重复关闭");
    }

    return this.dataSource.transaction(async (manager) => {
      for (const claim of post.claims) {
        if (claim.status === "pending") {
          claim.status = "rejected";
          claim.rejectReason = `启事被发布人关闭：${dto.result}`;
          await manager.save(claim);
        }
      }
      post.status = "closed";
      post.result = dto.result;
      post.closedAt = new Date();
      await manager.save(post);
      return { message: "启事已关闭并记录处理结果", post };
    });
  }

  async getOverview() {
    await this.promoteExpiredPosts();
    const [lost, foundFresh, publicFound, done, matched] = await Promise.all([
      this.postsRepository
        .createQueryBuilder("post")
        .where("post.type = :type", { type: "lost" })
        .andWhere("post.status != :closed", { closed: "closed" })
        .getCount(),
      this.postsRepository
        .createQueryBuilder("post")
        .where("post.type = :type", { type: "found" })
        .andWhere("post.status != :closed", { closed: "closed" })
        .andWhere("post.public_at IS NULL")
        .getCount(),
      this.postsRepository
        .createQueryBuilder("post")
        .where("post.type = :type", { type: "found" })
        .andWhere("post.status != :closed", { closed: "closed" })
        .andWhere("post.public_at IS NOT NULL")
        .getCount(),
      this.postsRepository.count({ where: { status: "closed" } }),
      this.postsRepository.count({ where: { status: "matched" } }),
    ]);

    return {
      lost,
      found: foundFresh,
      public: publicFound,
      done,
      matching: matched,
      sevenDays: 7,
    };
  }
}
