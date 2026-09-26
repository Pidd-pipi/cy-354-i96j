import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LostFoundPost } from "./entities/lost-found-post.entity";
import { LostFoundClaim } from "./entities/lost-found-claim.entity";
import { LostFoundService } from "./lost-found.service";
import { LostFoundController } from "./lost-found.controller";

@Module({
  imports: [TypeOrmModule.forFeature([LostFoundPost, LostFoundClaim])],
  controllers: [LostFoundController],
  providers: [LostFoundService],
})
export class LostFoundModule {}
