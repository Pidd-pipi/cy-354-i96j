import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import {
  CompleteClaimDto,
  CreateClaimDto,
  CreateNoticeDto,
  ListNoticeQueryDto,
} from "./lostfound.dto";
import { LostFoundService } from "./lostfound.service";

@Controller(["lostfound", "api/lostfound"])
export class LostFoundController {
  constructor(private readonly lostFoundService: LostFoundService) {}

  @Get("overview")
  overview() {
    return this.lostFoundService.getOverview();
  }

  @Get("campuses")
  campuses() {
    return { campuses: this.lostFoundService.listCampuses() };
  }

  @Get("notices")
  list(@Query() query: ListNoticeQueryDto) {
    return {
      tab: query.tab ?? "all",
      items: this.lostFoundService.listNotices(query.tab ?? "all", query.campus),
    };
  }

  @Get("notices/:id")
  detail(@Param("id") id: string) {
    return this.lostFoundService.getNotice(id);
  }

  @Post("notices")
  create(@Body() dto: CreateNoticeDto) {
    return this.lostFoundService.createNotice(dto);
  }

  @Post("notices/:id/close")
  close(@Param("id") id: string, @Body() body: { note?: string }) {
    return this.lostFoundService.closeNotice(id, body?.note);
  }

  @Post("notices/:id/claims")
  claim(@Param("id") id: string, @Body() dto: CreateClaimDto) {
    return this.lostFoundService.submitClaim(id, dto);
  }

  @Post("claims/:claimId/complete")
  complete(@Param("claimId") claimId: string, @Body() dto: CompleteClaimDto) {
    return this.lostFoundService.completeClaim(claimId, dto.resultNote);
  }
}
