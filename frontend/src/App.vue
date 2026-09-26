<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { fetchOverview } from "./api/client";
import { APP_CODE, APP_NAME } from "./constants/app";
import { REQUEST_MESSAGES } from "./constants/messages";
import { createFallbackOverview } from "./state/dashboard";
import type { OverviewResponse } from "./types";
import FeatureStrip from "./components/FeatureStrip.vue";
import MetricGrid from "./components/MetricGrid.vue";
import OperationsTable from "./components/OperationsTable.vue";
import LostFoundPage from "./pages/LostFoundPage.vue";

const overview = ref<OverviewResponse>(createFallbackOverview());
const notice = ref(REQUEST_MESSAGES.overviewFallback);
const page = ref<"lost-found" | "overview">(
  window.location.hash === "#/overview" ? "overview" : "lost-found",
);

function goHealth() {
  window.location.href = REQUEST_MESSAGES.healthPath;
}

function switchPage(target: "lost-found" | "overview") {
  page.value = target;
  window.location.hash = target === "overview" ? "#/overview" : "#/";
}

function onHashChange() {
  page.value = window.location.hash === "#/overview" ? "overview" : "lost-found";
}

onMounted(async () => {
  window.addEventListener("hashchange", onHashChange);
  try {
    overview.value = await fetchOverview();
    notice.value = "后端服务已联通，当前展示实时接口数据。";
  } catch {
    notice.value = REQUEST_MESSAGES.overviewFallback;
  }
});

onUnmounted(() => {
  window.removeEventListener("hashchange", onHashChange);
});
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <span class="brand-code">{{ APP_CODE }}</span>
        <h1 class="brand-title">{{ APP_NAME }}</h1>
      </div>
      <nav class="topnav">
        <el-button
          :type="page === 'lost-found' ? 'primary' : 'default'"
          @click="switchPage('lost-found')"
        >
          失物招领
        </el-button>
        <el-button
          :type="page === 'overview' ? 'primary' : 'default'"
          @click="switchPage('overview')"
        >
          平台总览
        </el-button>
        <el-button @click="goHealth">API Health</el-button>
      </nav>
    </header>

    <section class="workspace">
      <LostFoundPage v-if="page === 'lost-found'" />
      <template v-else>
        <div class="lead-grid">
          <article class="hero-panel">
            <span class="pill">{{ notice }}</span>
            <h2>{{ overview.appName }}</h2>
            <p>{{ overview.description }}</p>
          </article>
          <MetricGrid :items="overview.kpis" />
        </div>
        <FeatureStrip :items="overview.features" />
        <section class="work-panel">
          <h2>运营任务流</h2>
          <OperationsTable :records="overview.records" />
        </section>
      </template>
    </section>
  </main>
</template>

<style scoped>
.topnav {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
