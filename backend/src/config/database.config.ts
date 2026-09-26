import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { LostFoundPost } from "../lost-found/entities/lost-found-post.entity";
import { LostFoundClaim } from "../lost-found/entities/lost-found-claim.entity";

// 优先读取 DB_HOST 等单项配置（docker-compose 注入），本地缺省时回退到本机 MySQL
export const databaseConfig: TypeOrmModuleOptions = {
  type: "mysql",
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "app",
  entities: [LostFoundPost, LostFoundClaim],
  // 当前为单库快速交付阶段，实体变更自动同步表结构；database/init.sql 提供等价建表脚本
  synchronize: true,
  charset: "utf8mb4",
  timezone: "+08:00",
  autoLoadEntities: true,
  retryAttempts: 20,
  retryDelay: 3000,
};
