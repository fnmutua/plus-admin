<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElCard, ElTable, ElTableColumn, ElPagination, ElButton, ElInput, ElDialog, ElForm, ElFormItem, ElDatePicker, ElSelect, ElOption } from 'element-plus'
import { getIncidents, createIncident, generateIncidentCode } from '@/api/incident'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')

const dialog = ref(false)
const form = ref<any>({})

const fetchList = async () => {
  loading.value = true
  try {
    const res: any = await getIncidents({ page: page.value, pageSize: pageSize.value, keyword: keyword.value })
    list.value = res.data || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

const openDialog = async () => {
  const codeRes: any = await generateIncidentCode()
  form.value = { code: codeRes.data, occurred_date: new Date(), reported_date: new Date() }
  dialog.value = true
}

const submit = async () => {
  const res: any = await createIncident(form.value)
  if (res && res.code === '0000') {
    dialog.value = false
    fetchList()
  }
}

onMounted(fetchList)
</script>

<template>
  <ElCard>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">
      <ElInput v-model="keyword" placeholder="Search by code, description, location" style="max-width:320px" @change="fetchList" />
      <ElButton type="primary" @click="fetchList">Search</ElButton>
      <ElButton type="success" @click="openDialog">Report Incident</ElButton>
    </div>
    <ElTable :data="list" v-loading="loading" size="small">
      <ElTableColumn prop="code" label="Code" width="140" />
      <ElTableColumn prop="occurred_date" label="Occurred" width="160" />
      <ElTableColumn prop="reported_date" label="Reported" width="160" />
      <ElTableColumn prop="worker_name" label="Worker" />
      <ElTableColumn prop="location_text" label="Location" />
      <ElTableColumn prop="severity" label="Severity" width="120" />
      <ElTableColumn prop="description" label="Brief" />
    </ElTable>
    <ElPagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="prev, pager, next, sizes" @current-change="fetchList" @size-change="fetchList" style="margin-top:10px;" />
  </ElCard>

  <ElDialog v-model="dialog" title="Report Incident" width="60%">
    <ElForm :model="form" label-position="top">
      <ElFormItem label="Code">
        <ElInput v-model="form.code" disabled />
      </ElFormItem>
      <ElFormItem label="Occurred Date">
        <ElDatePicker v-model="form.occurred_date" type="date" />
      </ElFormItem>
      <ElFormItem label="Occurred Time">
        <ElInput v-model="form.occurred_time" />
      </ElFormItem>
      <ElFormItem label="Location">
        <ElInput v-model="form.location_text" />
      </ElFormItem>
      <ElFormItem label="Worker Name">
        <ElInput v-model="form.worker_name" />
      </ElFormItem>
      <ElFormItem label="Severity">
        <ElSelect v-model="form.severity" placeholder="Select">
          <ElOption label="Minor" value="Minor" />
          <ElOption label="Major" value="Major" />
          <ElOption label="Lost time injury" value="LTI" />
          <ElOption label="Fatality" value="Fatality" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="Brief Description">
        <ElInput type="textarea" v-model="form.description" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="dialog=false">Cancel</ElButton>
      <ElButton type="primary" @click="submit">Submit</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
</style>


