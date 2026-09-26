export type PostType = "lost" | "found";
export type PostStatus = "open" | "matched" | "closed";
export type ClaimStatus = "pending" | "confirmed" | "rejected";
export type PostView = "lost" | "found" | "public" | "done";

export interface ClaimRecord {
  id: number;
  postId: number;
  claimerName: string;
  claimerContact: string;
  featureProof: string;
  status: ClaimStatus;
  rejectReason: string | null;
  createdAt: string;
}

export interface LostFoundPost {
  id: number;
  type: PostType;
  title: string;
  category: string;
  campus: string;
  location: string;
  happenedAt: string;
  features: string;
  contactName: string;
  contactInfo: string;
  status: PostStatus;
  publicAt: string | null;
  result: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  claims?: ClaimRecord[];
}

export interface LostFoundOverview {
  lost: number;
  found: number;
  public: number;
  done: number;
  matching: number;
  sevenDays: number;
}

export interface LostFoundMeta {
  campuses: string[];
  categories: string[];
}

export interface CreatePostPayload {
  type: PostType;
  title: string;
  category: string;
  campus: string;
  location: string;
  happenedAt: string;
  features: string;
  contactName: string;
  contactInfo: string;
}

export interface CreateClaimPayload {
  claimerName: string;
  claimerContact: string;
  featureProof: string;
}
