export type NoticeType = "lost" | "found";
export type NoticeStatus = "open" | "claimed" | "closed";
export type ClaimStatus = "pending" | "matched" | "rejected";
export type CloseReason = "handover" | "owner_closed" | "expired";
export type NoticeTab = "lost" | "found" | "completed" | "public";

export interface NoticeItem {
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

export interface NoticeDetail extends NoticeItem {
  claims: ClaimRecord[];
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

export interface LostFoundStats {
  lostOpen: number;
  foundOpen: number;
  waitingHandover: number;
  completed: number;
  publicList: number;
  claimWindowDays: number;
}

export interface NoticeListResponse {
  tab: string;
  items: NoticeItem[];
}

export interface CreateNoticePayload {
  type: NoticeType;
  campus: string;
  location: string;
  happenAt: string;
  itemName: string;
  features: string;
  contact: string;
  publisher: string;
}

export interface CreateClaimPayload {
  claimant: string;
  contact: string;
  featureAnswer: string;
}
