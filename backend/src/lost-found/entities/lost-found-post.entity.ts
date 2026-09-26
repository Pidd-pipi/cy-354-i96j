import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { LostFoundClaim } from "./lost-found-claim.entity";

export type LostFoundType = "lost" | "found";
export type LostFoundPostStatus = "open" | "matched" | "closed";

@Entity("lost_found_posts")
export class LostFoundPost {
  @PrimaryGeneratedColumn()
  id!: number;

  // lost：失主发布的寻物启事；found：拾取者登记的招领物品
  @Column({ type: "varchar", length: 8 })
  type!: LostFoundType;

  @Column({ type: "varchar", length: 80 })
  title!: string;

  @Column({ type: "varchar", length: 40 })
  category!: string;

  @Column({ type: "varchar", length: 60 })
  campus!: string;

  @Column({ type: "varchar", length: 120 })
  location!: string;

  @Column({ name: "happened_at", type: "datetime" })
  happenedAt!: Date;

  @Column({ type: "text" })
  features!: string;

  @Column({ name: "contact_name", type: "varchar", length: 40 })
  contactName!: string;

  @Column({ name: "contact_info", type: "varchar", length: 120 })
  contactInfo!: string;

  // open：待认领；matched：已有人认领、线下核对中；closed：已完成交接或被关闭
  @Column({ type: "varchar", length: 12, default: "open" })
  status!: LostFoundPostStatus;

  // 招领启事满七天无人认领后转入公开列表的时间
  @Column({ name: "public_at", type: "datetime", nullable: true })
  publicAt!: Date | null;

  // 关闭启事时留下的处理结果
  @Column({ type: "varchar", length: 255, nullable: true })
  result!: string | null;

  @Column({ name: "closed_at", type: "datetime", nullable: true })
  closedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "datetime", precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime", precision: 6 })
  updatedAt!: Date;

  @OneToMany(() => LostFoundClaim, (claim) => claim.post)
  claims!: LostFoundClaim[];
}
