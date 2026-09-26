<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type { FormInstance } from "element-plus";
import type { CreatePostPayload, LostFoundMeta, PostType } from "../../types/lost-found";

const props = defineProps<{
  visible: boolean;
  meta: LostFoundMeta;
  submitting: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [payload: CreatePostPayload];
}>();

const emptyForm = (): CreatePostPayload => ({
  type: "lost",
  title: "",
  category: "",
  campus: "",
  location: "",
  happenedAt: "",
  features: "",
  contactName: "",
  contactInfo: "",
});

const form = reactive<CreatePostPayload>(emptyForm());
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

const typeOptions: { value: PostType; label: string; hint: string }[] = [
  { value: "lost", label: "寻物启事", hint: "我丢了东西，请大家帮忙留意" },
  { value: "found", label: "招领登记", hint: "我捡到了东西，等失主来认领" },
];
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="发布启事"
    width="560px"
    @update:model-value="emit('update:visible', $event)"
    @closed="close"
  >
    <el-form ref="formRef" :model="form" label-width="96px">
      <el-form-item label="启事类型" required>
        <el-radio-group v-model="form.type">
          <el-radio-button v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </el-radio-button>
        </el-radio-group>
        <div class="form-hint">{{ typeOptions.find((o) => o.value === form.type)?.hint }}</div>
      </el-form-item>
      <el-form-item
        label="标题"
        prop="title"
        :rules="[
          { required: true, message: '请填写标题', trigger: 'blur' },
          { min: 2, max: 60, message: '标题 2-60 个字', trigger: 'blur' },
        ]"
      >
        <el-input v-model="form.title" maxlength="60" placeholder="如：丢失黑色双肩包" />
      </el-form-item>
      <el-form-item label="物品类别" prop="category" :rules="[{ required: true, message: '请选择类别', trigger: 'change' }]">
        <el-select v-model="form.category" placeholder="选择类别" style="width: 100%">
          <el-option v-for="c in meta.categories" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="校区" prop="campus" :rules="[{ required: true, message: '请选择校区', trigger: 'change' }]">
        <el-select v-model="form.campus" placeholder="选择校区" style="width: 100%">
          <el-option v-for="c in meta.campuses" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="地点" prop="location" :rules="[{ required: true, message: '请填写地点', trigger: 'blur' }]">
        <el-input v-model="form.location" maxlength="120" placeholder="如：第三食堂二楼靠窗座位" />
      </el-form-item>
      <el-form-item
        :label="form.type === 'lost' ? '丢失时间' : '拾取时间'"
        prop="happenedAt"
        :rules="[{ required: true, message: '请选择时间', trigger: 'change' }]"
      >
        <el-date-picker
          v-model="form.happenedAt"
          type="datetime"
          value-format="YYYY-MM-DDTHH:mm:ss"
          placeholder="选择时间"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item
        label="物品特征"
        prop="features"
        :rules="[
          { required: true, message: '请描述物品特征', trigger: 'blur' },
          { min: 4, max: 500, message: '特征 4-500 个字', trigger: 'blur' },
        ]"
      >
        <el-input
          v-model="form.features"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          placeholder="颜色、品牌、明显标记等，认领时会用于核对"
        />
      </el-form-item>
      <el-form-item label="联系人" prop="contactName" :rules="[{ required: true, message: '请填写联系人', trigger: 'blur' }]">
        <el-input v-model="form.contactName" maxlength="40" placeholder="姓名或称呼" />
      </el-form-item>
      <el-form-item label="联系方式" prop="contactInfo" :rules="[{ required: true, message: '请填写联系方式', trigger: 'blur' }]">
        <el-input v-model="form.contactInfo" maxlength="120" placeholder="手机号 / 微信号 / 宿舍地址" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">发布</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.form-hint {
  font-size: 12px;
  color: color-mix(in srgb, #1f2417 55%, transparent);
  line-height: 1.4;
  margin-top: 4px;
}
</style>
