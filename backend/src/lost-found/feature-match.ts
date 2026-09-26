// 物品特征核对：把启事特征与认领人描述规范化后做关键词与字符重合度比对。
// 纯启发式判断，结果只作为提交认领时的初筛，最终仍以线下核对为准。

function normalize(text: string): string {
  return text.toLowerCase().replace(/[\s，。、；：？！“”‘’（）()\[\]【】.,;:?!"'/-]+/g, "");
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9一-龥]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function uniqueChars(text: string): Set<string> {
  return new Set(normalize(text).split(""));
}

export function featuresMatch(postFeatures: string, claimProof: string): boolean {
  const normalizedPost = normalize(postFeatures);
  const normalizedClaim = normalize(claimProof);
  if (!normalizedPost || !normalizedClaim) {
    return false;
  }

  // 任一关键词（长度 >= 2 的中文/英文/数字片段）互相包含即视为特征相关
  const postKeywords = extractKeywords(postFeatures);
  const claimKeywords = extractKeywords(claimProof);
  const keywordHit =
    claimKeywords.some((keyword) => normalizedPost.includes(keyword)) ||
    postKeywords.some((keyword) => normalizedClaim.includes(keyword));
  if (keywordHit) {
    return true;
  }

  // 兜底：字符级重合度，覆盖“黑色耳机”对“黑耳机”这类写法
  const postChars = uniqueChars(postFeatures);
  const claimChars = uniqueChars(claimProof);
  if (postChars.size === 0 || claimChars.size === 0) {
    return false;
  }
  let shared = 0;
  for (const char of claimChars) {
    if (postChars.has(char)) {
      shared += 1;
    }
  }
  const overlapRatio = shared / Math.max(postChars.size, claimChars.size);
  return overlapRatio >= 0.5;
}
