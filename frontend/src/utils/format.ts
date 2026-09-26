import type { PostStatus, PostType } from "../types/lost-found";

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export const POST_TYPE_LABEL: Record<PostType, string> = {
  lost: "寻物启事",
  found: "招领登记",
};

export const POST_STATUS_LABEL: Record<PostStatus, string> = {
  open: "待认领",
  matched: "已认领·核对中",
  closed: "已关闭",
};

export const POST_STATUS_TAG_TYPE: Record<PostStatus, "success" | "warning" | "info"> = {
  open: "success",
  matched: "warning",
  closed: "info",
};

export function daysUntilPublic(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  const deadline = created + 7 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((deadline - Date.now()) / (24 * 60 * 60 * 1000)));
}
