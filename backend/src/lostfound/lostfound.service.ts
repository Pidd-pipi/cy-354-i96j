import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ClaimRecord,
  ClaimResult,
  CloseReason,
  BaseNotice,
} from "./lostfound.types";
import { CreateClaimDto, CreateNoticeDto } from "./lostfound.dto";
import { seedNotices, seedClaims } from "./lostfound.seed";

const CLAIM_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
// 特征双字组 Jaccard 相似度达到该值即视为特征相符
const FEATURE_MATCH_THRESHOLD = 0.3;
const SWEEP_INTERVAL_MS = 60 * 60 * 1000;

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// 去掉标点空白后切双字组，用于特征相似度核对
function bigrams(text: string): Set<string> {
  const normalized = text.replace(/[\s\p{P}\p{S}]/gu, "").toLowerCase();
  const grams = new Set<string>();
  for (let i = 0; i < normalized.length - 1; i += 1) {
    grams.add(normalized.slice(i, i + 2));
  }
  return grams;
}

export function featureSimilarity(a: string, b: string): number {
  const ga = bigrams(a);
  const gb = bigrams(b);
  if (ga.size === 0 || gb.size === 0) return 0;
  let overlap = 0;
  ga.forEach((g) => {
    if (gb.has(g)) overlap += 1;
  });
  return overlap / (ga.size + gb.size - overlap);
}

@Injectable()
export class LostFoundService {
  private readonly notices = new Map<string, BaseNotice>();
  private readonly claims = new Map<string, ClaimRecord>();
  private readonly timers: NodeJS.Timeout[] = [];

  constructor() {
    seedNotices().forEach((notice) => this.notices.set(notice.id, notice));
    seedClaims().forEach((claim) => this.claims.set(claim.id, claim));
    this.sweepPublicList();
    // 每小时扫描一次，把满 7 天仍无人认领的启事转入公开列表
    this.timers.push(setInterval(() => this.sweepPublicList(), SWEEP_INTERVAL_MS));
  }

  createNotice(dto: CreateNoticeDto): BaseNotice {
    const now = Date.now();
    const notice: BaseNotice = {
      id: makeId("LF"),
      type: dto.type,
      campus: dto.campus.trim(),
      location: dto.location.trim(),
      happenAt: dto.happenAt,
      itemName: dto.itemName.trim(),
      features: dto.features.trim(),
      contact: dto.contact.trim(),
      publisher: dto.publisher.trim(),
      status: "open",
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + CLAIM_WINDOW_MS).toISOString(),
      publicSince: null,
      activeClaimId: null,
      closeReason: null,
      resultNote: null,
      closedAt: null,
    };
    this.notices.set(notice.id, notice);
    return notice;
  }

  listNotices(tab: string, campus?: string): BaseNotice[] {
    this.sweepPublicList();
    let items = [...this.notices.values()];
    if (campus) {
      items = items.filter((n) => n.campus === campus);
    }
    switch (tab) {
      case "lost":
        items = items.filter((n) => n.type === "lost" && n.status !== "closed");
        break;
      case "found":
        items = items.filter((n) => n.type === "found" && n.status !== "closed");
        break;
      case "completed":
        items = items.filter((n) => n.status === "closed");
        break;
      case "public":
        items = items.filter((n) => n.publicSince !== null && n.status !== "closed");
        break;
      default:
        break;
    }
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getNotice(id: string): BaseNotice & { claims: ClaimRecord[] } {
    this.sweepPublicList();
    const notice = this.notices.get(id);
    if (!notice) {
      throw new NotFoundException("启事不存在或已删除");
    }
    const claims = [...this.claims.values()]
      .filter((c) => c.noticeId === id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { ...notice, claims };
  }

  // Node 单线程事件循环：整个判断-写入过程同步执行，先到达的请求先生效
  submitClaim(noticeId: string, dto: CreateClaimDto): ClaimResult {
    const notice = this.notices.get(noticeId);
    if (!notice) {
      throw new NotFoundException("启事不存在或已删除");
    }

    const claim: ClaimRecord = {
      id: makeId("CL"),
      noticeId,
      claimant: dto.claimant.trim(),
      contact: dto.contact.trim(),
      featureAnswer: dto.featureAnswer.trim(),
      status: "pending",
      rejectReason: null,
      createdAt: new Date().toISOString(),
      decidedAt: null,
    };

    if (notice.status === "closed") {
      return this.rejectClaim(claim, "启事已关闭，无法继续认领（关闭原因：" + this.closeReasonText(notice.closeReason) + "）");
    }

    if (notice.status === "claimed" || notice.activeClaimId) {
      const active = this.claims.get(notice.activeClaimId ?? "");
      const who = active ? `，认领人「${active.claimant}」` : "";
      return this.rejectClaim(claim, `该启事已被认领${who}：重复或同时认领时先提交的生效，您来晚了一步`);
    }

    const score = featureSimilarity(notice.features, claim.featureAnswer);
    if (score < FEATURE_MATCH_THRESHOLD) {
      return this.rejectClaim(
        claim,
        `特征不符（相似度 ${(score * 100).toFixed(0)}%，需达到 ${(FEATURE_MATCH_THRESHOLD * 100).toFixed(0)}%）：您描述的特征与启事登记特征对不上`,
      );
    }

    claim.status = "pending";
    this.claims.set(claim.id, claim);
    notice.status = "claimed";
    notice.activeClaimId = claim.id;
    return { claim, accepted: true, reason: null };
  }

  // 线下核对无误后确认交接：启事关闭并留结果
  completeClaim(claimId: string, resultNote?: string): { notice: BaseNotice; claim: ClaimRecord } {
    const claim = this.claims.get(claimId);
    if (!claim) {
      throw new NotFoundException("认领记录不存在");
    }
    const notice = this.notices.get(claim.noticeId);
    if (!notice) {
      throw new NotFoundException("启事不存在或已删除");
    }
    if (claim.status !== "pending") {
      throw new NotFoundException(`该认领已结束（当前状态：${claim.status}），不能重复确认`);
    }

    claim.status = "matched";
    claim.decidedAt = new Date().toISOString();
    notice.status = "closed";
    notice.closeReason = "handover";
    notice.resultNote = resultNote?.trim() || "线下核对物品特征无误，双方已完成交接。";
    notice.closedAt = claim.decidedAt;
    return { notice, claim };
  }

  closeNotice(noticeId: string, note?: string): BaseNotice {
    const notice = this.notices.get(noticeId);
    if (!notice) {
      throw new NotFoundException("启事不存在或已删除");
    }
    if (notice.status === "closed") {
      return notice;
    }
    notice.status = "closed";
    notice.closeReason = "owner_closed";
    notice.resultNote = note?.trim() || "发布人主动关闭启事。";
    notice.closedAt = new Date().toISOString();
    if (notice.activeClaimId) {
      const active = this.claims.get(notice.activeClaimId);
      if (active && active.status === "pending") {
        active.status = "rejected";
        active.rejectReason = "发布人关闭了启事，线下交接取消。";
        active.decidedAt = notice.closedAt;
      }
    }
    return notice;
  }

  getOverview() {
    this.sweepPublicList();
    const all = [...this.notices.values()];
    return {
      lostOpen: all.filter((n) => n.type === "lost" && n.status !== "closed").length,
      foundOpen: all.filter((n) => n.type === "found" && n.status !== "closed").length,
      waitingHandover: all.filter((n) => n.status === "claimed").length,
      completed: all.filter((n) => n.status === "closed").length,
      publicList: all.filter((n) => n.publicSince !== null && n.status !== "closed").length,
      claimWindowDays: 7,
    };
  }

  listCampuses(): string[] {
    return [...new Set([...this.notices.values()].map((n) => n.campus))].sort();
  }

  private rejectClaim(claim: ClaimRecord, reason: string): ClaimResult {
    claim.status = "rejected";
    claim.rejectReason = reason;
    claim.decidedAt = new Date().toISOString();
    this.claims.set(claim.id, claim);
    return { claim, accepted: false, reason };
  }

  private closeReasonText(reason: CloseReason | null): string {
    switch (reason) {
      case "handover":
        return "已完成线下交接";
      case "owner_closed":
        return "发布人主动关闭";
      case "expired":
        return "超期未认领";
      default:
        return "未知";
    }
  }

  // 发布满 7 天仍处于 open（无生效认领）的启事转入公开列表
  private sweepPublicList(): number {
    const now = Date.now();
    let moved = 0;
    this.notices.forEach((notice) => {
      if (notice.status === "open" && notice.publicSince === null) {
        if (now - new Date(notice.createdAt).getTime() >= CLAIM_WINDOW_MS) {
          // 仅转入公开列表，启事仍可继续被认领
          notice.publicSince = new Date().toISOString();
          moved += 1;
        }
      }
    });
    return moved;
  }
}
