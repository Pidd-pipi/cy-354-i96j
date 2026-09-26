<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import type {
  CreateClaimPayload,
  CreatePostPayload,
  LostFoundMeta,
  LostFoundOverview,
  LostFoundPost,
  PostView,
} from "../types/lost-found";
import {
  closePost,
  confirmHandover,
  createClaim,
  createPost,
  fetchMeta,
  fetchPosts,
  fetchStats,
  rejectClaim,
} from "../api/lost-found";
import PostCard from "../components/lost-found/PostCard.vue";
import PublishDialog from "../components/lost-found/PublishDialog.vue";
import ClaimDialog from "../components/lost-found/ClaimDialog.vue";
import ReasonDialog from "../components/lost-found/ReasonDialog.vue";

const tabs: { view: PostView; label: string }[] = [
  { view: "lost", label: "寻物启事" },
  { view: "found", label: "招领物品" },
  { view: "public", label: "公开列表（7天未认领）" },
  { view: "done", label: "已完成" },
];

const activeView = ref<PostView>("lost");
const campusFilter = ref("");
const loading = ref(false);
const posts = ref<LostFoundPost[]>([]);
const stats = ref<LostFoundOverview>({ lost: 0, found: 0, public: 0, done: 0, matching: 0, sevenDays: 7 });
const meta = ref<LostFoundMeta>({ campuses: [], categories: [] });

const publishVisible = ref(false);
const submitting = ref(false);
const claimVisible = ref(false);
const claimTarget = ref<LostFoundPost | null>(null);

type ReasonMode = { kind: "confirm" } | { kind: "reject" } | { kind: "close" } | null;
const reasonVisible = ref(false);
const reasonMode = ref<ReasonMode>(null);
const reasonTarget = ref<LostFoundPost | null>(null);

async function loadMeta() {
  try {
    meta.value = await fetchMeta();
  } catch {
    // 字典接口失败时用内置空数组，下拉框会提示稍后重试
  }
}

async function loadStats() {
  try {
    stats.value = await fetchStats();
  } catch {
    // 统计失败不阻塞列表浏览
  }
}

async function loadPosts() {
  loading.value = true;
  try {
    posts.value = await fetchPosts(activeView.value, campusFilter.value || undefined);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "加载启事失败");
    posts.value = [];
  } finally {
    loading.value = false;
  }
}

function switchView(view: PostView) {
  activeView.value = view;
  void loadPosts();
}

function onCampusChange() {
  void loadPosts();
}

async function runMutation(action: () => Promise<unknown>, successMessage?: string) {
  submitting.value = true;
  try {
    await action();
    ElMessage.success(successMessage ?? "操作成功");
    publishVisible.value = false;
    claimVisible.value = false;
    reasonVisible.value = false;
    await Promise.all([loadPosts(), loadStats()]);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "操作失败，请稍后再试");
  } finally {
    submitting.value = false;
  }
}

function handlePublish(payload: CreatePostPayload) {
  void runMutation(() => createPost(payload), "启事发布成功");
}

function openClaim(post: LostFoundPost) {
  claimTarget.value = post;
  claimVisible.value = true;
}

function handleClaim(payload: CreateClaimPayload) {
  if (!claimTarget.value) {
    return;
  }
  const postId = claimTarget.value.id;
  void runMutation(() => createClaim(postId, payload));
}

function openReason(post: LostFoundPost, mode: Exclude<ReasonMode, null>) {
  reasonTarget.value = post;
  reasonMode.value = mode;
  reasonVisible.value = true;
}

function handleReasonSubmit(text: string) {
  if (!reasonTarget.value || !reasonMode.value) {
    return;
  }
  const post = reasonTarget.value;
  const pendingClaim = post.claims?.find((c) => c.status === "pending");

  if (reasonMode.value.kind === "confirm") {
    if (!pendingClaim) {
      ElMessage.error("该启事没有待核对的认领");
      return;
    }
    void runMutation(() => confirmHandover(pendingClaim.id, text));
  } else if (reasonMode.value.kind === "reject") {
    if (!pendingClaim) {
      ElMessage.error("该启事没有待核对的认领");
      return;
    }
    void runMutation(() => rejectClaim(pendingClaim.id, text));
  } else {
    void runMutation(() => closePost(post.id, text));
  }
}

const reasonProps = () => {
  if (reasonMode.value?.kind === "confirm") {
    return {
      title: "确认线下交接",
      label: "交接结果",
      placeholder: "如：9月26日下午在保卫处核对校园卡后当面归还，失主已确认。",
      confirmText: "确认交接并关闭启事",
      confirmType: "success" as const,
    };
  }
  if (reasonMode.value?.kind === "reject") {
    return {
      title: "驳回认领",
      label: "驳回原因",
      placeholder: "如：描述的颜色、标记与实物不符，特征不符。",
      confirmText: "驳回并重新开放启事",
      confirmType: "warning" as const,
    };
  }
  return {
    title: "关闭启事",
    label: "处理结果",
    placeholder: "如：物品已自行找回，无需继续认领。",
    confirmText: "关闭启事",
    confirmType: "danger" as const,
  };
};

onMounted(() => {
  void loadMeta();
  void loadStats();
  void loadPosts();
});
</script>

<template>
  <section class="lf-workspace">
    <div class="lf-toolbar">
      <div>
        <h2 class="lf-heading">失物招领</h2>
        <p class="lf-subtitle">
          失主发布寻物启事、拾取者登记招领物品，统一填写校区、地点、时间与物品特征。
          每则启事仅接受一条有效认领，先提交者生效；线下核对后确认交接即关闭并留结果，
          招领满 {{ stats.sevenDays }} 天无人认领自动转入公开列表。
        </p>
      </div>
      <el-button type="primary" size="large" @click="publishVisible = true">＋ 发布启事</el-button>
    </div>

    <div class="stat-grid">
      <div class="stat-card"><strong>{{ stats.lost }}</strong><span>寻物进行中</span></div>
      <div class="stat-card"><strong>{{ stats.found }}</strong><span>招领待认领</span></div>
      <div class="stat-card"><strong>{{ stats.matching }}</strong><span>认领核对中</span></div>
      <div class="stat-card"><strong>{{ stats.public }}</strong><span>公开列表</span></div>
      <div class="stat-card stat-done"><strong>{{ stats.done }}</strong><span>已完成</span></div>
    </div>

    <div class="filter-bar">
      <el-radio-group :model-value="activeView" @change="switchView($event as PostView)">
        <el-radio-button v-for="tab in tabs" :key="tab.view" :value="tab.view">
          {{ tab.label }}
        </el-radio-button>
      </el-radio-group>
      <el-select
        v-model="campusFilter"
        placeholder="全部校区"
        clearable
        style="width: 180px"
        @change="onCampusChange"
      >
        <el-option v-for="c in meta.campuses" :key="c" :label="c" :value="c" />
      </el-select>
    </div>

    <div v-loading="loading" class="post-grid">
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @claim="openClaim"
        @confirm="openReason($event, { kind: 'confirm' })"
        @reject="openReason($event, { kind: 'reject' })"
        @close="openReason($event, { kind: 'close' })"
      />
      <el-empty v-if="!loading && posts.length === 0" description="该视图下暂时没有启事" />
    </div>

    <PublishDialog
      v-model:visible="publishVisible"
      :meta="meta"
      :submitting="submitting"
      @submit="handlePublish"
    />
    <ClaimDialog
      v-model:visible="claimVisible"
      :post="claimTarget"
      :submitting="submitting"
      @submit="handleClaim"
    />
    <ReasonDialog
      v-model:visible="reasonVisible"
      v-bind="reasonProps()"
      :submitting="submitting"
      @submit="handleReasonSubmit"
    />
  </section>
</template>

<style scoped>
.lf-workspace {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.lf-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.lf-heading {
  margin: 0;
  font-size: clamp(22px, 2.4vw, 30px);
}

.lf-subtitle {
  margin: 8px 0 0;
  max-width: 780px;
  line-height: 1.7;
  color: color-mix(in srgb, #1f2417 70%, #7d8f2d 30%);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(120px, 1fr));
  gap: 12px;
}

.stat-card {
  border: 1px solid color-mix(in srgb, #1f2417 13%, transparent);
  border-radius: 8px;
  padding: 14px 16px;
  background: color-mix(in srgb, #f6f5ee 88%, white 12%);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-card strong {
  font-size: 26px;
}

.stat-card span {
  font-size: 13px;
  color: color-mix(in srgb, #1f2417 60%, transparent);
}

.stat-done {
  background: color-mix(in srgb, #7d8f2d 10%, #f6f5ee 90%);
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  min-height: 200px;
}

@media (max-width: 860px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .lf-toolbar {
    flex-direction: column;
  }
}
</style>
