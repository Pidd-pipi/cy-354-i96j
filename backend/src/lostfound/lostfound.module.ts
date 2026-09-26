import { Module } from "@nestjs/common";
import { LostFoundController } from "./lostfound.controller";
import { LostFoundService } from "./lostfound.service";

@Module({
  controllers: [LostFoundController],
  providers: [LostFoundService],
  exports: [LostFoundService],
})
export class LostFoundModule {}
