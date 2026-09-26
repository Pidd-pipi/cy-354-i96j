<script setup lang="ts">
import { APP_CODE, APP_NAME } from "./constants/app";
import LostFoundWorkbench from "./components/lostfound/LostFoundWorkbench.vue";
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <span class="brand-code">{{ APP_CODE }} · lost &amp; found</span>
        <h1 class="brand-title">{{ APP_NAME }} · 失物招领</h1>
      </div>
      <span class="pill">统一登记 · 先提交先生效 · 线下核对交接</span>
    </header>
    <LostFoundWorkbench />
  </main>
</template>
