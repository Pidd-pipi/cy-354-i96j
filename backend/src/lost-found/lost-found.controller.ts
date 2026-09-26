import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import { LostFoundService } from "./lost-found.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { CreateClaimDto } from "./dto/create-claim.dto";
import { ConfirmHandoverDto } from "./dto/confirm-handover.dto";
import { RejectClaimDto } from "./dto/reject-claim.dto";
import { ClosePostDto } from "./dto/close-post.dto";
import { ListPostsQuery } from "./dto/list-posts.query.dto";
import { LOST_FOUND_CAMPUSES, LOST_FOUND_CATEGORIES } from "./lost-found.constants";

// 同时注册 /lost-found 与 /api/lost-found：经 nginx/vite 代理时 /api 前缀被剥离，
// 直连后端时保留 /api 前缀，两种访问方式都可用（与 overview 双路由一致）
@Controller(["lost-found", "api/lost-found"])
export class LostFoundController {
  constructor(private readonly lostFoundService: LostFoundService) {}

  @Get("meta")
  meta() {
    return { campuses: LOST_FOUND_CAMPUSES, categories: LOST_FOUND_CATEGORIES };
  }

  @Get("overview")
  overview() {
    return this.lostFoundService.getOverview();
  }

  @Get("posts")
  list(@Query() query: ListPostsQuery) {
    return this.lostFoundService.listPosts(query);
  }

  @Get("posts/:id")
  detail(@Param("id", ParseIntPipe) id: number) {
    return this.lostFoundService.getPost(id);
  }

  @Post("posts")
  create(@Body() dto: CreatePostDto) {
    return this.lostFoundService.createPost(dto);
  }

  @Post("posts/:id/claims")
  claim(@Param("id", ParseIntPipe) id: number, @Body() dto: CreateClaimDto) {
    return this.lostFoundService.claimPost(id, dto);
  }

  @Post("posts/:id/close")
  close(@Param("id", ParseIntPipe) id: number, @Body() dto: ClosePostDto) {
    return this.lostFoundService.closePost(id, dto);
  }

  @Post("claims/:claimId/confirm")
  confirm(@Param("claimId", ParseIntPipe) claimId: number, @Body() dto: ConfirmHandoverDto) {
    return this.lostFoundService.confirmHandover(claimId, dto);
  }

  @Post("claims/:claimId/reject")
  reject(@Param("claimId", ParseIntPipe) claimId: number, @Body() dto: RejectClaimDto) {
    return this.lostFoundService.rejectClaim(claimId, dto);
  }
}
