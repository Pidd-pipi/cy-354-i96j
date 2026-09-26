<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance } from "element-plus";
import type { CreateClaimPayload, LostFoundPost } from "../../types/lost-found";

const props = defineProps<{
  visible: boolean;
  post: LostFoundPost | null;
  submitting: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [payload: CreateClaimPayload];
}>();

const emptyForm = (): CreateClaimPayload => ({
  claimerName: "",
  claimerContact: "",
  featureProof: "",
});

const form = reactive<CreateClaimPayload>(emptyForm());
const formRef = ref<FormInstance>();

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      Object.assign(form, emptyForm());
      formRef.value?.clearValidate();
    }
  },
);

function close() {
  emit("update:visible", false);
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  emit("submit", { ...form });
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="post ? `认领匹配：${post.title}` : '认领匹配'"
    width="520px"
    @update:model-value="emit('update:visible', $event)"
    @closed="close"
  >
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="每则启事只接受一条有效认领：先提交者生效，特征不符会被说明原因并驳回。"
      style="margin-bottom: 16px"
    />
    <el-form ref="formRef" :model="form" label-width="96px">
      <el-form-item label="姓名" prop="claimerName" :rules="[{ required: true, message: '请填写姓名', trigger: 'blur' }]">
        <el-input v-model="form.claimerName" maxlength="40" placeholder="认领人姓名或称呼" />
      </el-form-item>
      <el-form-item
        label="联系方式"
        prop="claimerContact"
        :rules="[{ required: true, message: '请填写联系方式', trigger: 'blur' }]"
      >
        <el-input v-model="form.claimerContact" maxlength="120" placeholder="手机号 / 微信号" />
      </el-form-item>
      <el-form-item
        label="特征说明"
        prop="featureProof"
        :rules="[
          { required: true, message: '请描述你掌握的物品特征', trigger: 'blur' },
          { min: 4, max: 500, message: '特征说明 4-500 个字', trigger: 'blur' },
        ]"
      >
        <el-input
          v-model="form.featureProof"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          placeholder="描述只有失主/拾取者才知道的细节，用于与启事特征核对"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">提交认领</el-button>
    </template>
  </el-dialog>
</template>
