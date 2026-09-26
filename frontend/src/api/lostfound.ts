import { API_BASE_URL } from "../constants/app";
import type {
  ClaimResult,
  CreateClaimPayload,
  CreateNoticePayload,
  LostFoundStats,
  NoticeDetail,
  NoticeItem,
  NoticeTab,
} from "../types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/lostfound${path}`, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...options,
  });

  let body: unknown = null;
  const text = await response.text();
  if (text) {
    body = JSON.parse(text);
  }

  if (!response.ok) {
    const payload = body as { message?: string | string[] } | null;
    const message = Array.isArray(payload?.message)
      ? payload.message.join("；")
      : payload?.message ?? `请求失败（${response.status}）`;
    throw new Error(message);
  }

  return body as T;
}

export function fetchStats(): Promise<LostFoundStats> {
  return request<LostFoundStats>("/overview");
}

export function fetchNotices(tab: NoticeTab, campus = ""): Promise<{ tab: string; items: NoticeItem[] }> {
  const params = new URLSearchParams({ tab });
  if (campus) params.set("campus", campus);
  return request(`/notices?${params.toString()}`);
}

export function fetchNoticeDetail(id: string): Promise<NoticeDetail> {
  return request<NoticeDetail>(`/notices/${id}`);
}

export function fetchCampuses(): Promise<{ campuses: string[] }> {
  return request<{ campuses: string[] }>("/campuses");
}

export function createNotice(payload: CreateNoticePayload): Promise<NoticeItem> {
  return request<NoticeItem>("/notices", { method: "POST", body: JSON.stringify(payload) });
}

export function closeNotice(id: string, note?: string): Promise<NoticeItem> {
  return request<NoticeItem>(`/notices/${id}/close`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export function submitClaim(
  noticeId: string,
  payload: CreateClaimPayload,
): Promise<ClaimResult> {
  return request<ClaimResult>(`/notices/${noticeId}/claims`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function completeClaim(
  claimId: string,
  resultNote?: string,
): Promise<{ notice: NoticeItem; claim: { id: string; status: string } }> {
  return request(`/claims/${claimId}/complete`, {
    method: "POST",
    body: JSON.stringify({ resultNote }),
  });
}
