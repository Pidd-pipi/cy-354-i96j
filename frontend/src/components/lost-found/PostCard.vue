<script setup lang="ts">
import { computed } from "vue";
import type { LostFoundPost } from "../../types/lost-found";
import {
  POST_STATUS_LABEL,
  POST_STATUS_TAG_TYPE,
  POST_TYPE_LABEL,
  daysUntilPublic,
  formatDateTime,
} from "../../utils/format";

const props = defineProps<{ post: LostFoundPost }>();

const emit = defineEmits<{
  claim: [post: LostFoundPost];
  confirm: [post: LostFoundPost];
  reject: [post: LostFoundPost];
  close: [post: LostFoundPost];
}>();

const pendingClaim = computed(() => props.post.claims?.find((c) => c.status === "pending"));
const happenedLabel = computed(() => (props.post.type === "lost" ? "丢失时间" : "拾取时间"));
const publicCountdown = computed(() =>
  props.post.type === "found" && props.post.status === "open" && !props.post.publicAt
    ? daysUntilPublic(props.post.createdAt)
    : null,
);
</script>

<template>
  <article class="post-card">
    <header class="post-head">
      <div class="post-tags">
        <el-tag size="small" :type="post.type === 'lost' ? 'danger' : 'primary'" effect="light">
          {{ POST_TYPE_LABEL[post.type] }}
        </el-tag>
        <el-tag size="small" :type="POST_STATUS_TAG_TYPE[post.status]">
          {{ POST_STATUS_LABEL[post.status] }}
        </el-tag>
        <el-tag v-if="post.publicAt" size="small" type="warning" effect="plain">已转入公开列表</el-tag>
        <el-tag v-else-if="publicCountdown !== null" size="small" type="info" effect="plain">
          {{ publicCountdown }} 天后转入公开列表
        </el-tag>
      </div>
      <h3 class="post-title">{{ post.title }}</h3>
    </header>

    <dl class="post-meta">
      <div><dt>类别</dt><dd>{{ post.category }}</dd></div>
      <div><dt>校区</dt><dd>{{ post.campus }}</dd></div>
      <div><dt>地点</dt><dd>{{ post.location }}</dd></div>
      <div><dt>{{ happenedLabel }}</dt><dd>{{ formatDateTime(post.happenedAt) }}</dd></div>
      <div><dt>联系人</dt><dd>{{ post.contactName }} · {{ post.contactInfo }}</dd></div>
      <div><dt>发布时间</dt><dd>{{ formatDateTime(post.createdAt) }}</dd></div>
    </dl>

    <p class="post-features"><strong>物品特征：</strong>{{ post.features }}</p>

    <div v-if="post.claims?.length" class="claim-list">
      <div
        v-for="claim in post.claims"
        :key="claim.id"
        class="claim-item"
        :class="`claim-${claim.status}`"
      >
        <div class="claim-line">
          <span class="claim-name">{{ claim.claimerName }}</span>
          <el-tag
            size="small"
            :type="claim.status === 'confirmed' ? 'success' : claim.status === 'rejected' ? 'info' : 'warning'"
          >
            {{ claim.status === "confirmed" ? "已交接" : claim.status === "rejected" ? "已驳回" : "待线下核对" }}
          </el-tag>
          <span class="claim-time">{{ formatDateTime(claim.createdAt) }}</span>
        </div>
        <p class="claim-proof">特征说明：{{ claim.featureProof }}</p>
        <p v-if="claim.rejectReason" class="claim-reason">原因：{{ claim.rejectReason }}</p>
      </div>
    </div>

    <p v-if="post.status === 'closed' && post.result" class="post-result">
      <strong>处理结果：</strong>{{ post.result }}
      <span class="claim-time">（{{ formatDateTime(post.closedAt) }}）</span>
    </p>

    <footer class="post-actions">
      <el-button
        v-if="post.status === 'open'"
        type="primary"
        size="small"
        @click="emit('claim', post)"
      >
        {{ post.type === "lost" ? "我捡到了，提供线索" : "认领这件物品" }}
      </el-button>
      <template v-if="post.status === 'matched' && pendingClaim">
        <el-button type="success" size="small" @click="emit('confirm', post)">线下核对无误，确认交接</el-button>
        <el-button type="warning" size="small" plain @click="emit('reject', post)">特征不符，驳回认领</el-button>
      </template>
      <el-button
        v-if="post.status !== 'closed'"
        type="info"
        size="small"
        plain
        @click="emit('close', post)"
      >
        关闭启事
      </el-button>
    </footer>
  </article>
</template>

<style scoped>
.post-card {
  border: 1px solid color-mix(in srgb, #1f2417 13%, transparent);
  border-radius: 8px;
  padding: 18px 20px;
  background: color-mix(in srgb, #f6f5ee 88%, white 12%);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.post-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.post-title {
  margin: 0;
  font-size: 18px;
}

.post-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 6px 16px;
  margin: 0;
}

.post-meta div {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.post-meta dt {
  color: color-mix(in srgb, #1f2417 55%, transparent);
  flex-shrink: 0;
}

.post-meta dd {
  margin: 0;
}

.post-features {
  margin: 0;
  line-height: 1.7;
  background: color-mix(in srgb, #7d8f2d 10%, transparent);
  border-radius: 6px;
  padding: 10px 12px;
}

.claim-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.claim-item {
  border-left: 3px solid color-mix(in srgb, #1f2417 25%, transparent);
  padding: 6px 10px;
  font-size: 14px;
}

.claim-item.claim-pending {
  border-left-color: #b55239;
}

.claim-item.claim-confirmed {
  border-left-color: #7d8f2d;
}

.claim-line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.claim-name {
  font-weight: 700;
}

.claim-time {
  color: color-mix(in srgb, #1f2417 50%, transparent);
  font-size: 12px;
}

.claim-proof,
.claim-reason {
  margin: 4px 0 0;
  color: color-mix(in srgb, #1f2417 75%, transparent);
}

.claim-reason {
  color: #b55239;
}

.post-result {
  margin: 0;
  padding: 10px 12px;
  border-radius: 6px;
  background: color-mix(in srgb, #1f2417 7%, transparent);
}

.post-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
