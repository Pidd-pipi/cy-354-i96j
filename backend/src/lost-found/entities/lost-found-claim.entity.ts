import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { LostFoundPost } from "./lost-found-post.entity";

export type LostFoundClaimStatus = "pending" | "confirmed" | "rejected";

@Entity("lost_found_claims")
export class LostFoundClaim {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => LostFoundPost, (post) => post.claims, { onDelete: "CASCADE" })
  @JoinColumn({ name: "post_id" })
  post!: LostFoundPost;

  @Column({ name: "post_id", type: "int" })
  postId!: number;

  @Column({ name: "claimer_name", type: "varchar", length: 40 })
  claimerName!: string;

  @Column({ name: "claimer_contact", type: "varchar", length: 120 })
  claimerContact!: string;

  // 认领人描述的物品特征，用于与启事特征核对
  @Column({ name: "feature_proof", type: "text" })
  featureProof!: string;

  // pending：待线下核对；confirmed：核对一致已交接；rejected：特征不符等原因驳回
  @Column({ type: "varchar", length: 12, default: "pending" })
  status!: LostFoundClaimStatus;

  @Column({ name: "reject_reason", type: "varchar", length: 255, nullable: true })
  rejectReason!: string | null;

  @CreateDateColumn({ name: "created_at", type: "datetime", precision: 6 })
  createdAt!: Date;
}
