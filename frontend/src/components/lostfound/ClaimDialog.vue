<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { submitClaim } from "../../api/lostfound";
import { NOTICE_TYPE_LABEL } from "../../constants/lostfound";
import type { ClaimResult, CreateClaimPayload, NoticeItem } from "../../types";

const props = defineProps<{ modelValue: boolean; notice: NoticeItem | null }>();
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "matched", result: ClaimResult): void;
}>();

const formRef = ref<FormInstance>();
const submitting = ref(false);
const rejectedReason = ref<string | null>(null);

const form = reactive<CreateClaimPayload>({
  claimant: "",
  contact: "",
  featureAnswer: "",
});

const rules: FormRules = {
  claimant: [{ required: true, message: "请填写你的昵称", trigger: "blur" }],
  contact: [{ required: true, message: "请填写联系方式", trigger: "blur" }],
  featureAnswer: [
    { required: true, message: "请描述你所知道的物品特征", trigger: "blur" },
    { min: 2, message: "特征描述过短，请补充细节", trigger: "blur" },
  ],
};

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      rejectedReason.value = null;
      formRef.value?.resetFields();
      Object.assign(form, { claimant: "", contact: "", featureAnswer: "" });
    }
  },
);

async function handleSubmit() {
  if (!formRef.value || !props.notice) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    rejectedReason.value = null;
    try {
      const result = await submitClaim(props.notice!.id, { ...form });
      if (result.accepted) {
        ElMessage.success("特征核对相符，你的认领已生效，请尽快与发布人线下核对交接");
        emit("matched", result);
        emit("update:modelValue", false);
      } else {
        // 特征不符 / 已被先提交者认领 / 启事已关闭：展示明确原因
        rejectedReason.value = result.reason;
      }
    } catch (err) {
      ElMessage.error((err as Error).message);
    } finally {
      submitting.value = false;
    }
  });
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="notice ? `${NOTICE_TYPE_LABEL[notice.type]} · 认领匹配` : '认领匹配'"
    width="540px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="notice">
      <el-alert
        type="info"
        :closable="false"
        class="claim-target"
        :title="`目标启事：${notice.itemName}（${notice.campus} · ${notice.location}）`"
        description="请填写你掌握的物品特征。特征核对相符即生效；若该启事已被他人先提交认领、或启事已关闭，会在此直接告知原因。"
      />

      <el-form ref="formRef" :model="form" :rules="rules" label-width="92px" class="claim-form">
        <el-form-item label="认领人" prop="claimant">
          <el-input v-model="form.claimant" placeholder="你的昵称" />
        </el-form-item>
        <el-form-item label="联系方式" prop="contact">
          <el-input v-model="form.contact" placeholder="手机号 / 微信号 / QQ" />
        </el-form-item>
        <el-form-item label="物品特征" prop="featureAnswer">
          <el-input
            v-model="form.featureAnswer"
            type="textarea"
            :rows="3"
            placeholder="只有与启事登记特征相符的认领才会生效，请凭记忆描述，不要照抄启事"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <el-alert
        v-if="rejectedReason"
        type="error"
        :closable="false"
        show-icon
        title="认领未生效"
        :description="rejectedReason"
        class="claim-reject"
      />
    </template>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">关闭</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">提交认领</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.claim-target {
  margin-bottom: 18px;
}

.claim-reject {
  margin-top: 4px;
}
</style>
