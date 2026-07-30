<script setup lang="ts">
import { ElTableColumn, ElTag, ElTooltip } from 'element-plus'
import { Icon } from '@/components/Icon'
import type { AdjustableColumnKey } from '@/composables/useAdjustableTableColumns'
import { isUserAccessFullyExpired } from '@/utils/userAccessExpiryDisplay'
import { getAssignedRoleNames } from '@/utils/userRoleAssignment'

const props = defineProps<{
  isColumnVisible: (key: AdjustableColumnKey) => boolean
  columnWidth: (key: AdjustableColumnKey) => number | undefined
  columnMinWidth: (key: AdjustableColumnKey) => number | undefined
  accessReasonLabels?: Record<string, string>
  formatDate?: (value: string | Date | null) => string | null
  idLabel?: string
  useIndexColumn?: boolean
  getSettlementLabel?: (row: any) => string
  // id -> role name. Powers the role icon beside the name. Omit it and the icon
  // simply doesn't render — existing callers that haven't wired role names yet
  // are unaffected.
  roleNameById?: Record<number, string>
}>()

const rowRoleNames = (row: any) => getAssignedRoleNames(row, props.roleNameById || {})

// One icon per user, picked by the most senior role they hold — every row gets
// one, not just admin/support, so 'other' still needs a fallback (mdi:user).
// super_admin is grouped with admin (both read as "elevated admin" at a glance);
// there's no separate icon requested for it.
const roleIconFor = (row: any) => {
  const names = rowRoleNames(row).map((n) => n.toLowerCase())
  if (names.includes('root_admin')) return { icon: 'eos-icons:admin', color: 'danger' as const }
  if (names.includes('admin') || names.includes('super_admin'))
    return { icon: 'ri:admin-line', color: 'warning' as const }
  if (names.includes('support')) return { icon: 'ix:support', color: 'success' as const }
  return { icon: 'mdi:user', color: 'info' as const }
}

const roleIconTooltip = (row: any) => rowRoleNames(row).join(', ') || 'No role assigned'
</script>

<template>
  <el-table-column v-if="useIndexColumn" type="index" :label="idLabel || '#'" width="70" fixed="left" />
  <el-table-column v-else prop="id" :label="idLabel || '#'" width="70" fixed="left" />

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
        <el-tooltip v-if="roleNameById" :content="roleIconTooltip(scope.row)" placement="top">
          <Icon
            :icon="roleIconFor(scope.row).icon"
            :size="16"
            :class="['name-role-icon', `name-role-icon--${roleIconFor(scope.row).color}`]"
          />
        </el-tooltip>
        <span>{{ scope.row.name }}</span>
        <el-tag v-if="isUserAccessFullyExpired(scope.row)" type="danger" effect="plain" size="small">
          Access expired
        </el-tag>
      </span>
    </template>
  </el-table-column>

  <el-table-column
    v-if="isColumnVisible('email')"
    column-key="email"
    label="Email"
    prop="email"
    :width="columnWidth('email')"
    :min-width="columnMinWidth('email')"
    sortable
    resizable
    show-overflow-tooltip
  >
    <template #default="scope">
      {{ scope.row.email || '—' }}
    </template>
  </el-table-column>

  <el-table-column
    v-if="isColumnVisible('phone')"
    column-key="phone"
    label="Phone"
    prop="phone"
    :width="columnWidth('phone')"
    :min-width="columnMinWidth('phone')"
    sortable
    resizable
    show-overflow-tooltip
  >
    <template #default="scope">
      {{ scope.row.phone || '—' }}
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
  gap: 6px;
  flex-wrap: wrap;
}

.name-role-icon {
  flex-shrink: 0;
}

.name-role-icon--warning {
  color: var(--el-color-warning);
}

.name-role-icon--danger {
  color: var(--el-color-danger);
}

.name-role-icon--success {
  color: var(--el-color-success);
}

.name-role-icon--info {
  color: var(--el-color-info);
}
</style>
