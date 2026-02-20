<template>
  <div class="page-visits-container">
    <ElCard>
      <template #header>
        <div class="card-header">
          <div class="card-title-row">
            <div>
              <h2>Page Visits</h2>
              <p class="subtitle">Number of visits per page</p>
            </div>
            <ElRadioGroup v-model="period" size="default" class="period-group" @change="loadStats">
              <ElRadioButton value="total">Total</ElRadioButton>
              <ElRadioButton value="annual">Annual</ElRadioButton>
              <ElRadioButton value="monthly">Monthly</ElRadioButton>
              <ElRadioButton value="weekly">Weekly</ElRadioButton>
              <ElRadioButton value="daily">Daily</ElRadioButton>
            </ElRadioGroup>
          </div>
        </div>
      </template>

      <div v-loading="loading" class="table-wrap">
        <ElTable :data="tableData" stripe style="width: 100%">
          <ElTableColumn prop="path" label="Path" min-width="200" />
          <ElTableColumn prop="page_name" label="Page" min-width="180" />
          <ElTableColumn prop="count" label="Visits" width="120" align="right">
            <template #default="{ row }">
              <ElTag type="info">{{ row.count?.toLocaleString?.() ?? row.count }}</ElTag>
            </template>
          </ElTableColumn>
        </ElTable>

        <div v-if="!loading && tableData.length === 0" class="empty-state">
          <ElEmpty description="No page visits recorded yet" />
        </div>

        <div v-if="!loading && tableData.length > 0" class="total-row">
          <span class="total-label">{{ periodLabel }} visits:</span>
          <ElTag type="success" size="large">{{ total.toLocaleString() }}</ElTag>
        </div>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElCard, ElTable, ElTableColumn, ElTag, ElEmpty, ElRadioGroup, ElRadioButton } from 'element-plus'
import { getPageVisitStatsApi } from '@/api/page-visits'
import type { PageVisitStat, PageVisitPeriod } from '@/api/page-visits'

const loading = ref(true)
const tableData = ref<PageVisitStat[]>([])
const total = ref(0)
const period = ref<PageVisitPeriod>('total')

const periodLabel = computed(() => {
  const labels: Record<PageVisitPeriod, string> = {
    total: 'Total',
    daily: 'Today',
    weekly: 'Last 7 days',
    monthly: 'Last 30 days',
    annual: 'Last 12 months'
  }
  return labels[period.value] || 'Total'
})

async function loadStats() {
  loading.value = true
  try {
    const res = await getPageVisitStatsApi(period.value)
    tableData.value = res?.data ?? []
    total.value = res?.total ?? 0
  } catch (e) {
    console.error('Load page visit stats:', e)
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.page-visits-container {
  padding: 0;
}
.card-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.card-header h2 {
  margin: 0 0 4px 0;
  font-size: 1.25rem;
}
.card-header .subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: var(--el-text-color-secondary);
}
.period-group {
  flex-shrink: 0;
}
@media (max-width: 640px) {
  .card-title-row {
    flex-direction: column;
    align-items: stretch;
  }
  .period-group {
    justify-content: flex-start;
  }
}
.table-wrap {
  min-height: 200px;
}
.empty-state {
  padding: 2rem 0;
}
.total-row {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.total-label {
  font-weight: 600;
  color: var(--el-text-color-regular);
}
</style>
