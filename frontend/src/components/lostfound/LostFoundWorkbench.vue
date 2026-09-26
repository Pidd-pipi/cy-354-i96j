<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { fetchCampuses, fetchNotices, fetchStats } from "../../api/lostfound";
import { TABS } from "../../constants/lostfound";
import type { ClaimResult, LostFoundStats, NoticeItem, NoticeTab } from "../../types";
import NoticeCard from "./NoticeCard.vue";
import NoticeFormDialog from "./NoticeFormDialog.vue";
import ClaimDialog from "./ClaimDialog.vue";
import NoticeDetailDrawer from "./NoticeDetailDrawer.vue";

const activeTab = ref<NoticeTab>("lost");
const campus = ref("");
const campuses = ref<string[]>([]);
const loading = ref(false);
const notices = ref<NoticeItem[]>([]);
const stats = ref<LostFoundStats | null>(null);

const publishVisible = ref(false);
const claimVisible = ref(false);
const detailVisible = ref(false);
const activeNotice = ref<NoticeItem | null>(null);
const detailNoticeId = ref<string | null>(null);
const reloadKey = ref(0);

async function loadAll() {
  await Promise.all([loadStats(), loadCampuses()]);
  await loadNotices();
}

async function loadStats() {
  try {
    stats.value = await fetchStats();
  } catch {
    // 统计加载失败不阻塞列表
  }
}

async function loadCampuses() {
  try {
    campuses.value = (await fetchCampuses()).campuses;
  } catch {
    // 忽略：筛选项不可用时仍可浏览全部
  }
}

async function loadNotices() {
  loading.value = true;
  try {
    notices.value = (await fetchNotices(activeTab.value, campus.value)).items;
  } catch (err) {
    ElMessage.error((err as Error).message);
  } finally {
    loading.value = false;
  }
}

function openPublish() {
  publishVisible.value = true;
}

function openClaim(notice: NoticeItem) {
  activeNotice.value = notice;
  claimVisible.value = true;
}

function openDetail(notice: NoticeItem) {
  detailNoticeId.value = notice.id;
  detailVisible.value = true;
}

async function onCreated(notice: NoticeItem) {
  activeTab.value = notice.type;
  await loadAll();
}

async function onMatched(_result: ClaimResult) {
  reloadKey.value += 1;
  await loadAll();
}

async function onChanged() {
  await loadAll();
}

const statCards = ref<{ label: string; key: keyof LostFoundStats; tone: string }[]>([
  { label: "寻物启事（进行中）", key: "lostOpen", tone: "warm" },
  { label: "招领启事（进行中）", key: "foundOpen", tone: "primary" },
  { label: "已认领·待线下核对", key: "waitingHandover", tone: "warn" },
  { label: "公开列表（7 天无人认领）", key: "publicList", tone: "cool" },
  { label: "已完成 / 已关闭", key: "completed", tone: "neutral" },
]);

onMounted(loadAll);
</script>

<template>
  <section class="workspace lf-workspace">
    <article class="hero-panel lf-hero">
      <span class="pill">失物招领</span>
      <h2>寻物 / 招领统一登记，先匹配先得，线下核对交接</h2>
      <p>
        失主发布寻物启事、拾取者登记招领物品，均填写校区、地点、时间与物品特征。每则启事只接受一条生效认领：
        重复或同时认领时<strong>先提交的生效</strong>，后来者直接看到「已被认领」；特征不符或启事关闭会明确说明原因。
        双方线下核对无误后确认交接、关闭启事并留存结果；发布满 <strong>7 天无人认领</strong>自动转入公开列表。
      </p>
      <div class="hero-actions">
        <el-button type="primary" size="large" @click="openPublish">发布启事（寻物 / 招领）</el-button>
        <el-button size="large" @click="loadNotices">刷新列表</el-button>
      </div>
    </article>

    <div class="lf-stats" v-if="stats">
      <div v-for="card in statCards" :key="card.key" class="lf-stat" :class="`tone-${card.tone}`">
        <span class="lf-stat-value">{{ stats[card.key] }}</span>
        <span class="lf-stat-label">{{ card.label }}</span>
      </div>
    </div>

    <section class="work-panel lf-panel">
      <div class="lf-toolbar">
        <el-radio-group v-model="activeTab" @change="loadNotices">
          <el-radio-button v-for="t in TABS" :key="t.key" :value="t.key">{{ t.label }}</el-radio-button>
        </el-radio-group>
        <el-select v-model="campus" placeholder="全部校区" clearable style="width: 160px" @change="loadNotices">
          <el-option v-for="c in campuses" :key="c" :label="c" :value="c" />
        </el-select>
      </div>
      <p class="lf-tab-hint">{{ TABS.find((t) => t.key === activeTab)?.hint }}</p>

      <div v-loading="loading" class="lf-grid-wrap">
        <div v-if="notices.length" class="lf-grid">
          <NoticeCard
            v-for="notice in notices"
            :key="notice.id"
            :notice="notice"
            @view="openDetail"
            @claim="openClaim"
          />
        </div>
        <el-empty v-else-if="!loading" description="当前分类下暂无启事" />
      </div>
    </section>

    <NoticeFormDialog v-model="publishVisible" @created="onCreated" />
    <ClaimDialog v-model="claimVisible" :notice="activeNotice" @matched="onMatched" />
    <NoticeDetailDrawer
      v-model="detailVisible"
      :notice-id="detailNoticeId"
      :reload-key="reloadKey"
      @changed="onChanged"
      @claim="openClaim"
    />
  </section>
</template>

<style scoped>
.lf-hero {
  margin-bottom: 22px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 18px;
  flex-wrap: wrap;
}

.lf-stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 26px;
}

.lf-stat {
  border-radius: 8px;
  padding: 18px;
  display: grid;
  gap: 8px;
  border: 1px solid rgba(31, 36, 23, 0.12);
  background: rgba(246, 245, 238, 0.9);
  box-shadow: 0 12px 32px rgba(31, 36, 23, 0.07);
}

.lf-stat-value {
  font-size: 32px;
  font-weight: 800;
}

.lf-stat-label {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
}

.tone-warm .lf-stat-value {
  color: #b55239;
}

.tone-primary .lf-stat-value {
  color: #7d8f2d;
}

.tone-warn .lf-stat-value {
  color: #b8860b;
}

.tone-cool .lf-stat-value {
  color: #3b6b7a;
}

.lf-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.lf-tab-hint {
  margin: 12px 0 18px;
  font-size: 13px;
  color: #6b7280;
}

.lf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 16px;
}

@media (max-width: 980px) {
  .lf-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
