import { BaseNotice, ClaimRecord } from "./lostfound.types";

const DAY = 24 * 60 * 60 * 1000;

function isoDaysAgo(days: number, hour = 10): string {
  const d = new Date(Date.now() - days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * DAY).toISOString();
}

export function seedNotices(): BaseNotice[] {
  return [
    {
      id: "LF-seed-1001",
      type: "lost",
      campus: "东校区",
      location: "第三教学楼 302 教室",
      happenAt: "2026-09-23 14:00",
      itemName: "黑色双肩包",
      features: "黑色北面双肩包，侧面有白色划痕，内装高数教材和一个蓝色保温杯，拉链头挂小熊挂件",
      contact: "微信 lin_xiaowu",
      publisher: "林小伍",
      status: "open",
      createdAt: isoDaysAgo(1, 20),
      expiresAt: isoDaysFromNow(6),
      publicSince: null,
      activeClaimId: null,
      closeReason: null,
      resultNote: null,
      closedAt: null,
    },
    {
      id: "LF-seed-1002",
      type: "found",
      campus: "西校区",
      location: "图书馆二层自习区 B17 座位",
      happenAt: "2026-09-24 18:30",
      itemName: "校园卡",
      features: "校园卡一张，卡面贴有星黛露贴纸，挂灰色编织绳，姓名尾字为“然”",
      contact: "电话 138****2041",
      publisher: "图书馆服务台",
      status: "open",
      createdAt: isoDaysAgo(1, 9),
      expiresAt: isoDaysFromNow(6),
      publicSince: null,
      activeClaimId: null,
      closeReason: null,
      resultNote: null,
      closedAt: null,
    },
    {
      id: "LF-seed-1003",
      type: "found",
      campus: "东校区",
      location: "一食堂二楼收餐台旁",
      happenAt: "2026-09-20 12:10",
      itemName: "银色 AirPods Pro",
      features: "银色 AirPods Pro 二代，充电盒左侧有磕碰凹痕，盒内刻字缩写 ZY",
      contact: "微信 finder_zhou",
      publisher: "周同学",
      status: "claimed",
      createdAt: isoDaysAgo(4, 13),
      expiresAt: isoDaysFromNow(3),
      publicSince: null,
      activeClaimId: "CL-seed-2001",
      closeReason: null,
      resultNote: null,
      closedAt: null,
    },
    {
      id: "LF-seed-1004",
      type: "lost",
      campus: "南校区",
      location: "体育馆篮球场 3 号场",
      happenAt: "2026-09-15 19:00",
      itemName: "机械键盘",
      features: "黑色 87 键机械键盘，红轴，键帽 ESC 键为红色，USB 线缆有魔术贴绑带",
      contact: "QQ 57210033",
      publisher: "陈默",
      status: "open",
      createdAt: isoDaysAgo(9, 22),
      expiresAt: isoDaysFromNow(-2),
      publicSince: isoDaysAgo(2, 22),
      activeClaimId: null,
      closeReason: null,
      resultNote: null,
      closedAt: null,
    },
    {
      id: "LF-seed-1005",
      type: "lost",
      campus: "西校区",
      location: "校医院门口共享单车车筐",
      happenAt: "2026-09-16 09:20",
      itemName: "透明文件袋",
      features: "透明 A4 文件袋，内装实习报告纸质版和两张证件照，封面写“实习鉴定”",
      contact: "微信 shen_doc",
      publisher: "沈同学",
      status: "closed",
      createdAt: isoDaysAgo(8, 10),
      expiresAt: isoDaysFromNow(-1),
      publicSince: null,
      activeClaimId: "CL-seed-2002",
      closeReason: "handover",
      resultNote: "经保卫处值班台核对实习报告内容后，失主当场领回。",
      closedAt: isoDaysAgo(7, 16),
    },
  ];
}

export function seedClaims(): ClaimRecord[] {
  return [
    {
      id: "CL-seed-2001",
      noticeId: "LF-seed-1003",
      claimant: "赵屿",
      contact: "微信 zhaoyu_99",
      featureAnswer: "银色 AirPods Pro 二代，盒子左边有磕碰，里面刻了 ZY 两个字母",
      status: "pending",
      rejectReason: null,
      createdAt: isoDaysAgo(3, 21),
      decidedAt: null,
    },
    {
      id: "CL-seed-2002",
      noticeId: "LF-seed-1005",
      claimant: "沈同学",
      contact: "微信 shen_doc",
      featureAnswer: "透明文件袋，里面是实习鉴定报告，还有两张一寸证件照",
      status: "matched",
      rejectReason: null,
      createdAt: isoDaysAgo(8, 14),
      decidedAt: isoDaysAgo(7, 16),
    },
    {
      id: "CL-seed-2003",
      noticeId: "LF-seed-1003",
      claimant: "路人甲",
      contact: "微信 try_luck",
      featureAnswer: "白色耳机，好像是苹果的",
      status: "rejected",
      rejectReason: "特征不符（相似度 8%，需达到 30%）：您描述的特征与启事登记特征对不上",
      createdAt: isoDaysAgo(2, 10),
      decidedAt: isoDaysAgo(2, 10),
    },
  ];
}
