<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { closeNotice, completeClaim, fetchNoticeDetail } from "../../api/lostfound";
import {
  CLOSE_REASON_LABEL,
  NOTICE_STATUS_LABEL,
  NOTICE_STATUS_TAG_TYPE,
  NOTICE_TYPE_LABEL,
  formatDateTime,
} from "../../constants/lostfound";
import type { ClaimRecord, NoticeDetail, NoticeItem } from "../../types";

const props = defineProps<{ modelValue: boolean; noticeId: string | null; reloadKey?: number }>();
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "changed"): void;
  (e: "claim", notice: NoticeItem): void;
}>();

const detail = ref<NoticeDetail | null>(null);
const loading = ref(false);
const resultNote = ref("");
const closingNote = ref("");
const saving = ref(false);

watch(
  () => [props.modelValue, props.noticeId, props.reloadKey],
  async ([open]) => {
    if (open && props.noticeId) {
      await loadDetail();
    }
  },
);

async function loadDetail() {
  if (!props.noticeId) return;
  loading.value = true;
  try {
    detail.value = await fetchNoticeDetail(props.noticeId);
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    loading.value = false;
  }
}

function tagType(claim: ClaimRecord): "success" | "danger" | "warning" {
  if (claim.status === "matched") return "success";
  if (claim.status === "rejected") return "danger";
  return "warning";
}

function claimStatusLabel(status: ClaimRecord["status"]): string {
  return status === "matched" ? "已完成交接" : status === "rejected" ? "未生效" : "待线下核对";
}

async function handleComplete(claim: ClaimRecord) {
  try {
    await ElMessageBox.confirm(
      "请确认双方已线下见面、核对物品特征无误并完成交接。确认后启事将关闭并记录结果。",
      "线下核对确认",
      { confirmButtonText: "确认交接完成", cancelButtonText: "再等等", type: "warning" },
    );
  } catch {
    return;
  }
  saving.value = true;
  try {
    await completeClaim(claim.id, resultNote.value || undefined);
    ElMessage.success("交接完成，启事已关闭并留存结果");
    resultNote.value = "";
    await loadDetail();
    emit("changed");
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    saving.value = false;
  }
}

async function handleClose() {
  try {
    const { value } = await ElMessageBox.prompt("关闭后其他用户将无法继续认领，请填写关闭说明（可选）。", "主动关闭启事", {
      confirmButtonText: "确认关闭",
      cancelButtonText: "取消",
      inputValue: closingNote.value,
    });
    closingNote.value = value ?? "";
  } catch {
    return;
  }
  saving.value = true;
  try {
    await closeNotice(detail.value!.id, closingNote.value || undefined);
    ElMessage.success("启事已关闭");
    await loadDetail();
    emit("changed");
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    title="启事详情与匹配记录"
    size="560px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-loading="loading">
      <template v-if="detail">
        <div class="detail-head">
          <el-tag :type="detail.type === 'lost' ? 'danger' : 'primary'" effect="dark">
            {{ NOTICE_TYPE_LABEL[detail.type] }}
          </el-tag>
          <el-tag :type="NOTICE_STATUS_TAG_TYPE[detail.status]">
            {{ NOTICE_STATUS_LABEL[detail.status] }}
          </el-tag>
          <el-tag v-if="detail.publicSince && detail.status !== 'closed'" type="warning">
            已转公开列表（{{ formatDateTime(detail.publicSince) }}）
          </el-tag>
        </div>

        <h2 class="detail-title">{{ detail.itemName }}</h2>

        <el-descriptions :column="1" border class="detail-desc">
          <el-descriptions-item label="校区">{{ detail.campus }}</el-descriptions-item>
          <el-descriptions-item label="地点">{{ detail.location }}</el-descriptions-item>
          <el-descriptions-item label="丢失/拾到时间">{{ detail.happenAt }}</el-descriptions-item>
          <el-descriptions-item label="登记特征">{{ detail.features }}</el-descriptions-item>
          <el-descriptions-item label="发布人">{{ detail.publisher }}</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ detail.contact }}</el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ formatDateTime(detail.createdAt) }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.status === 'closed'" label="关闭原因">
            {{ detail.closeReason ? CLOSE_REASON_LABEL[detail.closeReason] : "—" }}
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.resultNote" label="交接/关闭结果">
            {{ detail.resultNote }}
          </el-descriptions-item>
        </el-descriptions>

        <section v-if="detail.status === 'closed'" class="detail-actions">
          <el-button type="primary" disabled>启事已关闭</el-button>
        </section>
        <section v-else class="detail-actions">
          <el-button type="primary" @click="emit('claim', detail)">我要认领 / 匹配</el-button>
          <el-button :loading="saving" @click="handleClose">发布人关闭启事</el-button>
        </section>

        <h3 class="timeline-title">匹配认领记录（先提交者生效）</h3>
        <el-empty v-if="detail.claims.length === 0" description="暂无认领记录" :image-size="70" />
        <el-timeline v-else>
          <el-timeline-item
            v-for="claim in detail.claims"
            :key="claim.id"
            :type="tagType(claim)"
            :timestamp="formatDateTime(claim.status === 'pending' ? claim.createdAt : claim.decidedAt ?? claim.createdAt)"
          >
            <div class="claim-box">
              <div class="claim-box-head">
                <strong>{{ claim.claimant }}</strong>
                <el-tag :type="tagType(claim)" size="small">{{ claimStatusLabel(claim.status) }}</el-tag>
              </div>
              <p class="claim-answer">特征描述：{{ claim.featureAnswer }}</p>
              <p class="claim-contact">联系方式：{{ claim.contact }}</p>
              <el-alert
                v-if="claim.status === 'rejected' && claim.rejectReason"
                type="error"
                :closable="false"
                :title="claim.rejectReason"
                class="claim-reason"
              />
              <div v-if="claim.status === 'pending'" class="claim-pending">
              <el-input
                v-model="resultNote"
                type="textarea"
                :rows="2"
                placeholder="线下核对备注（可选），如：在宿舍楼下核对挂件一致"
              />
              <el-button
                type="success"
                size="small"
                :loading="saving"
                style="margin-top: 8px"
                @click="handleComplete(claim)"
              >
                线下核对无误，确认交接完成
              </el-button>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </template>
    </div>
  </el-drawer>
</template>

<style scoped>
.detail-head {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-title {
  margin: 14px 0;
  font-size: 22px;
}

.detail-actions {
  margin: 18px 0 8px;
  display: flex;
  gap: 10px;
}

.timeline-title {
  margin: 26px 0 18px;
  font-size: 16px;
  padding-top: 18px;
  border-top: 1px solid rgba(31, 36, 23, 0.12);
}

.claim-box {
  padding-bottom: 4px;
}

.claim-box-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.claim-answer,
.claim-contact {
  margin: 6px 0 0;
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
}

.claim-reason {
  margin-top: 8px;
}

.claim-pending {
  margin-top: 10px;
}
</style>
