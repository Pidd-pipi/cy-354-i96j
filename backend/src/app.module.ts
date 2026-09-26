import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OverviewController } from "./overview/overview.controller";
import { OverviewService } from "./overview/overview.service";
import { LostFoundModule } from "./lost-found/lost-found.module";
import { AppLogger } from "./common/app.logger";
import { databaseConfig } from "./config/database.config";

@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig), LostFoundModule],
  controllers: [OverviewController],
  providers: [OverviewService, AppLogger],
})
export class AppModule {}
