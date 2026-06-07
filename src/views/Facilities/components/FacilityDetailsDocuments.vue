<script setup lang="ts">
// @ts-nocheck
import { computed } from 'vue'
import { ElAlert, ElButton, ElCard, ElPopconfirm, ElSpace, ElTable, ElTableColumn, ElText } from 'element-plus'
import { Icon } from '@iconify/vue'
import { useAppStore } from '@/store/modules/app'

defineProps<{
  documents: any[]
  loading?: boolean
  downloadingId?: number | null
  canUnlink?: boolean
  canRemove?: boolean
}>()

const emit = defineEmits<{
  download: [row: any]
  unlink: [row: any]
  remove: [row: any]
}>()

const appStore = useAppStore()
const mobile = computed(() => appStore.getMobile)
</script>

<template>
  <div v-loading="loading" style="min-height: 120px;">
    <el-alert
      v-if="!loading && !documents.length"
      title="No documents linked to this facility."
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 12px;"
    />

    <el-table v-if="documents.length && !mobile" :data="documents" style="width: 100%;">
      <el-table-column type="index" width="50" />
      <el-table-column label="Name" prop="name" min-width="160" show-overflow-tooltip />
      <el-table-column label="Type" prop="document_type.type" width="160" show-overflow-tooltip />
      <el-table-column label="Format" prop="format" width="90" />
      <el-table-column label="Uploaded" prop="createdAt" width="180" />
      <el-table-column fixed="right" label="" min-width="200">
        <template #default="scope">
          <div style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end;">
            <el-button plain :loading="downloadingId === scope.row.id" @click="emit('download', scope.row)">
              <Icon icon="fa-solid:download" style="margin-right: 5px;" /> Download
            </el-button>
            <el-popconfirm
              v-if="canUnlink"
              title="Unlink this document from this facility? The document will not be deleted."
              confirm-button-text="Unlink"
              cancel-button-text="Cancel"
              @confirm="emit('unlink', scope.row)"
            >
              <template #reference>
                <el-button plain type="warning">
                  <Icon icon="mdi:link-off" style="margin-right: 5px;" /> Unlink
                </el-button>
              </template>
            </el-popconfirm>
            <el-popconfirm
              v-if="canRemove"
              title="Delete this document permanently? This cannot be undone."
              confirm-button-text="Delete"
              cancel-button-text="Cancel"
              confirm-button-type="danger"
              @confirm="emit('remove', scope.row)"
            >
              <template #reference>
                <el-button plain type="danger">
                  <Icon icon="material-symbols-light:delete-outline" style="margin-right: 5px;" /> Remove
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-space v-if="documents.length && mobile" direction="vertical" :size="10" fill style="width: 100%;">
      <el-card v-for="row in documents" :key="row.id" shadow="never" body-style="padding: 12px;">
        <el-text tag="div" style="font-weight: 600; display: block; word-break: break-word;">{{ row.name }}</el-text>
        <el-text v-if="row.document_type?.type" type="info" size="small" tag="div" style="margin-top: 4px;">
          {{ row.document_type.type }}
        </el-text>
        <el-text type="info" size="small" tag="div" style="margin-top: 4px;">
          <span v-if="row.format">{{ row.format }}</span>
          <span v-if="row.format && row.createdAt"> · </span>
          <span v-if="row.createdAt">{{ row.createdAt }}</span>
        </el-text>
        <el-space direction="vertical" :size="8" fill style="width: 100%; margin-top: 12px;">
          <el-button plain size="small" :loading="downloadingId === row.id" style="width: 100%;" @click="emit('download', row)">
            <Icon icon="fa-solid:download" style="margin-right: 5px;" /> Download
          </el-button>
          <el-popconfirm
            v-if="canUnlink"
            title="Unlink this document from this facility?"
            confirm-button-text="Unlink"
            cancel-button-text="Cancel"
            @confirm="emit('unlink', row)"
          >
            <template #reference>
              <el-button plain type="warning" size="small" style="width: 100%;">
                <Icon icon="mdi:link-off" style="margin-right: 5px;" /> Unlink
              </el-button>
            </template>
          </el-popconfirm>
          <el-popconfirm
            v-if="canRemove"
            title="Delete this document permanently?"
            confirm-button-text="Delete"
            cancel-button-text="Cancel"
            confirm-button-type="danger"
            @confirm="emit('remove', row)"
          >
            <template #reference>
              <el-button plain type="danger" size="small" style="width: 100%;">
                <Icon icon="material-symbols-light:delete-outline" style="margin-right: 5px;" /> Remove
              </el-button>
            </template>
          </el-popconfirm>
        </el-space>
      </el-card>
    </el-space>
  </div>
</template>
