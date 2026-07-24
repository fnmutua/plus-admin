<script setup lang="ts">
import { ElAvatar, ElTableColumn, ElTag } from 'element-plus'
import type { AdjustableColumnKey } from '@/composables/useAdjustableTableColumns'
import { isUserAccessFullyExpired } from '@/utils/userAccessExpiryDisplay'

const props = defineProps<{
  isColumnVisible: (key: AdjustableColumnKey) => boolean
  columnWidth: (key: AdjustableColumnKey) => number | undefined
  columnMinWidth: (key: AdjustableColumnKey) => number | undefined
  accessReasonLabels?: Record<string, string>
  formatDate?: (value: string | Date | null) => string | null
  avatarField?: 'photo' | 'avatar'
  idLabel?: string
  useIndexColumn?: boolean
  getSettlementLabel?: (row: any) => string
}>()

const avatarSrc = (row: any) => {
  const field = props.avatarField ?? 'photo'
  return row[field] || row.photo || row.avatar || ''
}
</script>

<template>
  <el-table-column v-if="useIndexColumn" type="index" label="#" width="50" fixed="left" />
  <el-table-column v-else prop="id" label="#" width="50" fixed="left" />

  <el-table-column
    v-if="isColumnVisible('avatar')"
    column-key="avatar"
    label="Avatar"
    :width="columnWidth('avatar')"
    :min-width="columnMinWidth('avatar')"
    resizable
  >
    <template #default="scope">
      <el-avatar :src="avatarSrc(scope.row)" :size="40" />
    </template>
  </el-table-column>

  <el-table-column
    v-if="isColumnVisible('name')"
    column-key="name"
    label="Name"
    prop="name"
    :width="columnWidth('name')"
    :min-width="columnMinWidth('name')"
    sortable
    resizable
    show-overflow-tooltip
  >
    <template #default="scope">
      <span class="name-with-access-tag">
        <span>{{ scope.row.name }}</span>
        <el-tag v-if="isUserAccessFullyExpired(scope.row)" type="danger" effect="plain" size="small">
          Access expired
        </el-tag>
      </span>
    </template>
  </el-table-column>

  <el-table-column
    v-if="isColumnVisible('username')"
    column-key="username"
    label="Username"
    prop="username"
    :width="columnWidth('username')"
    :min-width="columnMinWidth('username')"
    sortable
    resizable
    show-overflow-tooltip
  />

  <el-table-column
    v-if="isColumnVisible('country')"
    column-key="country"
    label="Country"
    prop="country_name"
    :width="columnWidth('country')"
    :min-width="columnMinWidth('country')"
    sortable
    resizable
    show-overflow-tooltip
  />

  <el-table-column
    v-if="isColumnVisible('organization')"
    column-key="organization"
    label="Organization"
    prop="organization_name"
    :width="columnWidth('organization')"
    :min-width="columnMinWidth('organization')"
    sortable
    resizable
    show-overflow-tooltip
  />

  <el-table-column
    v-if="isColumnVisible('access_reason')"
    column-key="access_reason"
    label="Reason for Access"
    prop="access_reason"
    :width="columnWidth('access_reason')"
    :min-width="columnMinWidth('access_reason')"
    sortable
    resizable
    show-overflow-tooltip
  >
    <template #default="scope">
      {{ accessReasonLabels?.[scope.row.access_reason] || scope.row.access_reason || '—' }}
    </template>
  </el-table-column>

  <el-table-column
    v-if="isColumnVisible('county')"
    column-key="county"
    label="County"
    prop="county.name"
    :width="columnWidth('county')"
    :min-width="columnMinWidth('county')"
    sortable
    resizable
    show-overflow-tooltip
  />

  <el-table-column
    v-if="isColumnVisible('settlement')"
    column-key="settlement"
    label="Settlement"
    prop="settlement"
    :width="columnWidth('settlement')"
    :min-width="columnMinWidth('settlement')"
    sortable
    resizable
    show-overflow-tooltip
  >
    <template #default="scope">
      {{ getSettlementLabel?.(scope.row) || scope.row.settlement || scope.row.settlement_name || '—' }}
    </template>
  </el-table-column>

  <el-table-column
    v-if="isColumnVisible('last_login')"
    column-key="last_login"
    label="Last Login"
    prop="last_login"
    :width="columnWidth('last_login')"
    :min-width="columnMinWidth('last_login')"
    sortable
    resizable
    show-overflow-tooltip
  >
    <template #default="scope">
      <span v-if="scope.row.last_login && formatDate">{{ formatDate(scope.row.last_login) }}</span>
      <span v-else-if="scope.row.last_login">{{ scope.row.last_login }}</span>
      <span v-else style="color: #999;">Never</span>
    </template>
  </el-table-column>
</template>

<style scoped>
.name-with-access-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
