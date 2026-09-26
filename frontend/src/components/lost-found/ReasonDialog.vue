<script setup lang="ts">
import { ref, watch } from "vue";

// 通用单输入对话框：确认交接（填结果）、驳回认领（填原因）、关闭启事（填结果）共用
const props = defineProps<{
  visible: boolean;
  title: string;
  label: string;
  placeholder: string;
  confirmText: string;
  confirmType?: "primary" | "success" | "warning" | "danger";
  submitting: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [text: string];
}>();

const text = ref("");

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      text.value = "";
    }
  },
);

function close() {
  emit("update:visible", false);
}

function submit() {
  const value = text.value.trim();
  if (!value) {
    return;
  }
  emit("submit", value);
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    width="480px"
    @update:model-value="emit('update:visible', $event)"
    @closed="close"
  >
    <el-form label-position="top">
      <el-form-item :label="label" required>
        <el-input
          v-model="text"
          type="textarea"
          :rows="3"
          maxlength="255"
          show-word-limit
          :placeholder="placeholder"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button
        :type="confirmType ?? 'primary'"
        :loading="submitting"
        :disabled="!text.trim()"
        @click="submit"
      >
        {{ confirmText }}
      </el-button>
    </template>
  </el-dialog>
</template>
