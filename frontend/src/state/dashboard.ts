import { localFeatures, localKpis, operationRecords } from "../data/workbench";
import type { OverviewResponse } from "../types";
import { APP_CODE, APP_NAME } from "../constants/app";

export function createFallbackOverview(): OverviewResponse {
  return {
    appName: APP_NAME,
    appCode: APP_CODE,
    description: "面向高校学生，提供校内二手物品交易、书籍交换和失物招领的C2C平台。",
    features: localFeatures,
    kpis: localKpis,
    records: operationRecords,
  };
}
