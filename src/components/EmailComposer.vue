<template>
  <ElDialog v-model="visible" :title="title || 'Send Email'" width="600px" @close="onClose">
    <ElForm :model="form" :rules="rules" ref="formRef" label-width="80px">
      <ElFormItem label="To" prop="to">
        <ElSelect v-model="form.to" multiple filterable allow-create default-first-option placeholder="Type emails or select users" style="width:100%">
          <ElOption v-for="u in userOptions" :key="u.value" :label="u.label" :value="u.value" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="Subject" prop="subject">
        <ElInput v-model="form.subject" placeholder="Subject" />
      </ElFormItem>
      <ElFormItem label="Body" prop="body">
        <ElInput v-model="form.body" type="textarea" :rows="10" placeholder="Write your email..." />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="onClose">Cancel</ElButton>
      <ElButton type="primary" :loading="sending" @click="onSend">Send</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElSelect, ElOption, ElMessage } from 'element-plus'
import { sendIncidentEmail } from '@/api/incident'
import { getUserListApi } from '@/api/users'

interface Props {
  modelValue: boolean
  defaultRecipients?: string[]
  defaultSubject?: string
  defaultBody?: string
  title?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'sent'])

const visible = ref(false)
watch(
  () => props.modelValue,
  (v) => {
    visible.value = v
    if (v) initDefaults()
  },
  { immediate: true }
)

const title = computed(() => props.title)

const formRef = ref<any>(null)
const sending = ref(false)
const form = ref<{ to: string[]; subject: string; body: string }>({ to: [], subject: '', body: '' })

const rules = {
  to: [{ required: true, message: 'At least one recipient is required', trigger: 'change' }],
  subject: [{ required: true, message: 'Subject is required', trigger: 'blur' }],
  body: [{ required: true, message: 'Body is required', trigger: 'blur' }]
}

const userOptions = ref<{ label: string; value: string }[]>([])

async function loadUsers() {
  try {
    const res: any = await getUserListApi({ page: 1, limit: 100 }) as any
    const list = res?.data?.list || res?.data || []
    userOptions.value = list
      .filter((u: any) => u?.email)
      .map((u: any) => ({ label: `${u.name || u.username} <${u.email}>`, value: u.email }))
  } catch (e) {
    userOptions.value = []
  }
}

function initDefaults() {
  form.value = {
    to: props.defaultRecipients?.slice?.() || [],
    subject: props.defaultSubject || '',
    body: props.defaultBody || ''
  }
  loadUsers()
}

function onClose() {
  emit('update:modelValue', false)
}

async function onSend() {
  try {
    await formRef.value?.validate()
  } catch (e) {
    return
  }
  sending.value = true
  try {
    await sendIncidentEmail({ to: form.value.to, subject: form.value.subject, text: form.value.body })
    ElMessage.success('Email sent')
    emit('sent')
    onClose()
  } catch (e) {
    ElMessage.error('Failed to send email')
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
</style>


