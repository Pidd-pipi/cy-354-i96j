import { API_BASE_URL } from "../constants/app";
import type {
  ClaimRecord,
  CreateClaimPayload,
  CreatePostPayload,
  LostFoundMeta,
  LostFoundOverview,
  LostFoundPost,
  PostView,
} from "../types/lost-found";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    let message = `请求失败（${response.status}）`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) {
        message = body.message.join("；");
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      // 非 JSON 错误响应时保留默认提示
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function fetchMeta(): Promise<LostFoundMeta> {
  return request<LostFoundMeta>("/lost-found/meta");
}

export function fetchStats(): Promise<LostFoundOverview> {
  return request<LostFoundOverview>("/lost-found/overview");
}

export function fetchPosts(view: PostView, campus?: string): Promise<LostFoundPost[]> {
  const params = new URLSearchParams({ view });
  if (campus) {
    params.set("campus", campus);
  }
  return request<LostFoundPost[]>(`/lost-found/posts?${params.toString()}`);
}

export function createPost(payload: CreatePostPayload): Promise<LostFoundPost> {
  return request<LostFoundPost>("/lost-found/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

interface ClaimResult {
  message: string;
  post: LostFoundPost;
  claim: ClaimRecord;
}

export function createClaim(postId: number, payload: CreateClaimPayload): Promise<ClaimResult> {
  return request<ClaimResult>(`/lost-found/posts/${postId}/claims`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

interface SimpleResult {
  message: string;
}

export function confirmHandover(claimId: number, result: string): Promise<SimpleResult> {
  return request<SimpleResult>(`/lost-found/claims/${claimId}/confirm`, {
    method: "POST",
    body: JSON.stringify({ result }),
  });
}

export function rejectClaim(claimId: number, reason: string): Promise<SimpleResult> {
  return request<SimpleResult>(`/lost-found/claims/${claimId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function closePost(postId: number, result: string): Promise<SimpleResult> {
  return request<SimpleResult>(`/lost-found/posts/${postId}/close`, {
    method: "POST",
    body: JSON.stringify({ result }),
  });
}
