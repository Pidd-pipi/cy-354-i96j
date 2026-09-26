<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { createNotice } from "../../api/lostfound";
import { CAMPUS_OPTIONS, NOTICE_TYPE_LABEL } from "../../constants/lostfound";
import type { CreateNoticePayload, NoticeItem, NoticeType } from "../../types";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "created", notice: NoticeItem): void;
}>();

const formRef = ref<FormInstance>();
const submitting = ref(false);

const form = reactive<CreateNoticePayload>({
  type: "lost",
  campus: "",
  location: "",
  happenAt: "",
  itemName: "",
  features: "",
  contact: "",
  publisher: "",
});

const rules: FormRules = {
  type: [{ required: true, message: "请选择启事类型", trigger: "change" }],
  campus: [{ required: true, message: "请选择校区", trigger: "change" }],
  location: [{ required: true, message: "请填写丢失/拾到地点", trigger: "blur" }],
  happenAt: [{ required: true, message: "请选择时间", trigger: "change" }],
  itemName: [{ required: true, message: "请填写物品名称", trigger: "blur" }],
  features: [
    { required: true, message: "请描述物品特征，供认领时核对", trigger: "blur" },
    { min: 4, message: "特征描述至少 4 个字", trigger: "blur" },
  ],
  contact: [{ required: true, message: "请填写联系方式", trigger: "blur" }],
  publisher: [{ required: true, message: "请填写发布人昵称", trigger: "blur" }],
};

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      formRef.value?.resetFields();
      Object.assign(form, {
        type: "lost",
        campus: "",
        location: "",
        happenAt: "",
        itemName: "",
        features: "",
        contact: "",
        publisher: "",
      });
    }
  },
);

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      const created = await createNotice({ ...form });
      ElMessage.success("启事已发布，等待匹配认领");
      emit("created", created);
      emit("update:modelValue", false);
    } catch (err) {
      ElMessage.error((err as Error).message);
    } finally {
      submitting.value = false;
    }
  });
}

function close() {
  emit("update:modelValue", false);
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="发布失物招领启事"
    width="560px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="92px">
      <el-form-item label="启事类型" prop="type">
        <el-radio-group v-model="form.type">
          <el-radio-button value="lost">{{ NOTICE_TYPE_LABEL.lost }}（我丢了东西）</el-radio-button>
          <el-radio-button value="found">{{ NOTICE_TYPE_LABEL.found }}（我捡到物品）</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="校区" prop="campus">
        <el-select v-model="form.campus" placeholder="请选择校区" style="width: 100%">
          <el-option v-for="c in CAMPUS_OPTIONS" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="地点" prop="location">
        <el-input v-model="form.location" placeholder="如：第三教学楼 302 教室 / 一食堂二楼" />
      </el-form-item>
      <el-form-item label="时间" prop="happenAt">
        <el-date-picker
          v-model="form.happenAt"
          type="datetime"
          placeholder="选择丢失/拾到时间"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="物品名称" prop="itemName">
        <el-input v-model="form.itemName" placeholder="如：黑色双肩包" maxlength="80" show-word-limit />
      </el-form-item>
      <el-form-item label="物品特征" prop="features">
        <el-input
          v-model="form.features"
          type="textarea"
          :rows="3"
          placeholder="尽量写清颜色、品牌、独有记号、内含物品等，系统将据此核对认领是否相符"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="联系方式" prop="contact">
        <el-input v-model="form.contact" placeholder="手机号 / 微信号 / QQ" />
      </el-form-item>
      <el-form-item label="发布人" prop="publisher">
        <el-input v-model="form.publisher" placeholder="你的昵称" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">发布启事</el-button>
    </template>
  </el-dialog>
</template>
