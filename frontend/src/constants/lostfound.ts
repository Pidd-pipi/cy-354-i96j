import type { CloseReason, NoticeStatus, NoticeTab, NoticeType } from "../types";

export const CAMPUS_OPTIONS = ["东校区", "西校区", "南校区", "北校区", "中心校区"];

export const NOTICE_TYPE_LABEL: Record<NoticeType, string> = {
  lost: "寻物启事",
  found: "招领启事",
};

export const NOTICE_STATUS_LABEL: Record<NoticeStatus, string> = {
  open: "待认领",
  claimed: "已认领·待核对",
  closed: "已关闭",
};

export const NOTICE_STATUS_TAG_TYPE: Record<NoticeStatus, "success" | "warning" | "info"> = {
  open: "success",
  claimed: "warning",
  closed: "info",
};

export const CLOSE_REASON_LABEL: Record<NonNullable<CloseReason>, string> = {
  handover: "已完成线下交接",
  owner_closed: "发布人主动关闭",
  expired: "超期未认领",
};

export const TABS: { key: NoticeTab; label: string; hint: string }[] = [
  { key: "lost", label: "寻物", hint: "失主发布的寻物启事" },
  { key: "found", label: "招领", hint: "拾取者登记的招领物品" },
  { key: "public", label: "公开列表（7 天无人认领）", hint: "发布满 7 天仍无人认领，转入公开列表继续等待" },
  { key: "completed", label: "已完成", hint: "线下核对交接完成或已关闭的启事" },
];

export const CLAIM_WINDOW_DAYS = 7;

export function formatDateTime(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function daysLeft(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
