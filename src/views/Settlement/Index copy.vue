<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListApi } from '@/api/settlements'
import { SettlementType } from '@/api/settlements/types'
import { ref } from 'vue'
import { ElSwitch, ElPagination } from 'element-plus'

interface Params {
  pageIndex?: number
  pageSize?: number
}

const { t } = useI18n()

const columns: TableColumn[] = [
  {
    field: 'index',
    label: t('userDemo.index'),
    type: 'index'
  },
  {
    field: 'area',
    label: t('area')
  },
  {
    field: 'name',
    label: t('Name')
  },
  {
    field: 'county_id',
    label: t('Status')
  },
  {
    field: 'county',
    label: t('county')
  },
  {
    field: 'action',
    label: t('action')
  }
]

const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)
let tableDataList = ref<SettlementType[]>([])

const getTableList = async (params?: Params) => {
  const res = await getSettlementListApi({
    params: params || {
      limit: 5,
      page: 1,
      model: 'settlement',
      searchField: 'name',
      searchKeyword: '',
      columnFilterValue: [],
      columnFilterField: 'county_id',
      assocModel: 'county',
      sort: 'ASC'
    }
  })

  if (res) {
    console.log('userlits', res)
    tableDataList.value = res.data
    loading.value = false
    total.value = res.total
  }
}

getTableList()

const acitonFn = (data: TableSlotDefault) => {
  console.log('Activating user.....', data.row)
  // data.mode = 'users'

  // activateUserApi(data.row, { model: 'users' }).then(() => {})
}

const handleCurrentChange = (val: number) => {
  console.log(`current page: ${val}`)
  const res = getSettlementListApi({
    params: {
      pageIndex: 1,
      limit: 5,
      page: val, // her we pass the page ID
      model: 'settlement',
      searchField: 'name',
      searchKeyword: '',
      columnFilterValue: [],
      columnFilterField: 'county_id',
      assocModel: 'county',
      sort: 'ASC'
    }
  })

  res.then((response) => {
    console.log('handleSizeChange response:', response)
    tableDataList.value = response.data
    loading.value = false
  })
}

const handleSizeChange = (size: number) => {
  console.log(`Size page: ${size}`)
  pageSize.value = size
  const res = getSettlementListApi({
    params: {
      pageIndex: 1,
      limit: size, // her we pass the page ID
      page: 1,
      model: 'settlement',
      searchField: 'name',
      searchKeyword: '',
      columnFilterValue: [],
      columnFilterField: 'county_id',
      assocModel: 'county',
      sort: 'ASC'
    }
  })

  res.then((response) => {
    console.log('Size response:', response)
    tableDataList.value = response.data
    loading.value = false
  })
}
</script>

<template>
  <ContentWrap :title="t('Settlement')" :message="t('Settlements')">
    <Table
      :columns="columns"
      :data="tableDataList"
      :loading="loading"
      :selection="true"
      :pageSize="pageSize"
      :currentPage="currentPage"
    >
      <template #action="data">
        <!-- <ElSwitch v-model="data.isactive" @click="acitonFn(data as TableSlotDefault)"> -->

        <ElSwitch v-model="data.row.isactive" @click="acitonFn(data as TableSlotDefault)">
          {{ t('tableDemo.action') }}
        </ElSwitch>
      </template>
    </Table>
    <ElPagination
      layout=" sizes, prev, pager, next, total"
      :total="total"
      :page-sizes="[3, 5, 10, 20, 50]"
      :background="true"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      class="mt-4"
    />
  </ContentWrap>
</template>
