<script setup lang="ts">
import { computed } from "vue";
import {
  CLOSE_REASON_LABEL,
  NOTICE_STATUS_LABEL,
  NOTICE_STATUS_TAG_TYPE,
  NOTICE_TYPE_LABEL,
  daysLeft,
  formatDateTime,
} from "../../constants/lostfound";
import type { NoticeItem } from "../../types";

const props = defineProps<{ notice: NoticeItem }>();
const emit = defineEmits<{ (e: "view", notice: NoticeItem): void; (e: "claim", notice: NoticeItem): void }>();

const actionText = computed(() => (props.notice.type === "lost" ? "我捡到了，去匹配" : "我是失主，去认领"));

const isPublic = computed(() => props.notice.publicSince !== null && props.notice.status !== "closed");
</script>

<template>
  <el-card class="notice-card" shadow="hover" :body-style="{ padding: '18px' }">
    <div class="card-head">
      <div class="card-tags">
        <el-tag :type="notice.type === 'lost' ? 'danger' : 'primary'" effect="dark" size="small">
          {{ NOTICE_TYPE_LABEL[notice.type] }}
        </el-tag>
        <el-tag :type="NOTICE_STATUS_TAG_TYPE[notice.status]" size="small" effect="plain">
          {{ NOTICE_STATUS_LABEL[notice.status] }}
        </el-tag>
        <el-tag v-if="isPublic" type="warning" size="small" effect="plain">公开列表</el-tag>
      </div>
      <span class="card-campus">{{ notice.campus }}</span>
    </div>

    <h3 class="card-title">{{ notice.itemName }}</h3>
    <p class="card-feature">{{ notice.features }}</p>

    <ul class="card-meta">
      <li><span>地点</span>{{ notice.location }}</li>
      <li><span>时间</span>{{ notice.happenAt }}</li>
      <li><span>发布人</span>{{ notice.publisher }} · {{ notice.contact }}</li>
      <li v-if="notice.status === 'open'"><span>认领期限</span>剩余 {{ daysLeft(notice.expiresAt) }} 天</li>
      <li v-else-if="notice.status === 'closed' && notice.closedAt">
        <span>关闭时间</span>{{ formatDateTime(notice.closedAt) }}
      </li>
      <li v-else><span>认领时间</span>{{ "已有生效认领，等待线下核对" }}</li>
    </ul>

    <div v-if="notice.status === 'closed'" class="card-result">
      <strong>关闭原因：{{ notice.closeReason ? CLOSE_REASON_LABEL[notice.closeReason] : "—" }}</strong>
      <span>{{ notice.resultNote }}</span>
    </div>

    <div class="card-actions">
      <el-button size="small" @click="emit('view', notice)">查看启事与匹配记录</el-button>
      <el-button
        v-if="notice.status !== 'closed'"
        size="small"
        type="primary"
        @click="emit('claim', notice)"
      >
        {{ actionText }}
      </el-button>
    </div>
  </el-card>
</template>

<style scoped>
.notice-card {
  border-radius: 8px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.card-campus {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
}

.card-title {
  margin: 12px 0 8px;
  font-size: 18px;
}

.card-feature {
  margin: 0 0 12px;
  color: #4b5563;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  list-style: none;
  margin: 0;
  padding: 10px 12px;
  border-radius: 6px;
  background: rgba(125, 143, 45, 0.07);
  display: grid;
  gap: 6px;
  font-size: 13px;
}

.card-meta li {
  display: flex;
  gap: 8px;
}

.card-meta span {
  color: #6b7280;
  min-width: 56px;
}

.card-result {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  background: rgba(31, 36, 23, 0.05);
  display: grid;
  gap: 4px;
  font-size: 13px;
}

.card-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
