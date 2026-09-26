export type NoticeType = "lost" | "found";

// open：待匹配；claimed：已有一条生效认领，待线下核对；closed：已关闭（完成或撤销）
export type NoticeStatus = "open" | "claimed" | "closed";

// pending：待线下核对；matched：已确认交接；rejected：特征不符或启事已关闭
export type ClaimStatus = "pending" | "matched" | "rejected";

// 关闭原因类别
export type CloseReason = "handover" | "owner_closed" | "expired";

export interface BaseNotice {
  id: string;
  type: NoticeType;
  campus: string;
  location: string;
  happenAt: string;
  itemName: string;
  features: string;
  contact: string;
  publisher: string;
  status: NoticeStatus;
  createdAt: string;
  expiresAt: string;
  publicSince: string | null;
  activeClaimId: string | null;
  closeReason: CloseReason | null;
  resultNote: string | null;
  closedAt: string | null;
}

export interface ClaimRecord {
  id: string;
  noticeId: string;
  claimant: string;
  contact: string;
  featureAnswer: string;
  status: ClaimStatus;
  rejectReason: string | null;
  createdAt: string;
  decidedAt: string | null;
}

export interface ClaimResult {
  claim: ClaimRecord;
  accepted: boolean;
  reason: string | null;
}
