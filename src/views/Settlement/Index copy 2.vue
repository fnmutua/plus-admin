<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getUserListApi } from '@/api/users'
import { UserType } from '@/api/users/types'
import { ref, h } from 'vue'
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
    field: 'name',
    label: t('Name')
  },
  {
    field: 'isactive',
    label: t('Status')
  },
  {
    field: 'remark',
    label: t('userDemo.remark'),
    formatter: (row: UserType) => {
      return h(
        'span',
        row.username === 'admin' ? t('userDemo.remarkMessage1') : t('userDemo.remarkMessage2')
      )
    }
  },
  {
    field: 'action',
    label: t('userDemo.action')
  }
]

const loading = ref(true)
const paginationObj = ref<Pagination>()
const pageSize = ref(4)
const currentPage = ref(2)
const total = ref(0)
let tableDataList = ref<UserType[]>([])

const getTableList = async (params?: Params) => {
  const res = await getUserListApi({
    params: params || {
      pageIndex: 1,
      limit: 5,
      page: 1,
      curUser: 1, // Id for logged in user
      model: 'settlement',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  })
  // .catch(() => {})
  // .finally(() => {
  //   loading.value = false
  // })
  if (res) {
    console.log('userlits', res)
    tableDataList.value = res.data
    loading.value = false
    total.value = res.total
  }
}

getTableList()

console.log('pagination', paginationObj)
const acitonFn = (data: TableSlotDefault) => {
  console.log('Activating user.....', data.row)
  // data.mode = 'users'
}

const handleCurrentChange = (val: number) => {
  console.log(`current page: ${val}`)
  const res = getUserListApi({
    params: {
      pageIndex: 1,
      limit: 5,
      page: val, // her we pass the page ID
      curUser: 1, // Id for logged in user
      model: 'settlement',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  })

  res.then((response) => {
    console.log('Received response:', response)
    console.log('userlits', response)
    tableDataList.value = response.data
    loading.value = false
    paginationObj.value = {
      total: response.total
    }
  })
}

const handleSizeChange = (val: number) => {
  console.log(`current page: ${val}`)
  const res = getUserListApi({
    params: {
      pageIndex: 1,
      limit: val,
      page: 1, // her we pass the page ID
      curUser: 1, // Id for logged in user
      model: 'settlement',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  })

  res.then((response) => {
    console.log('Received response:', response)
    console.log('userlits', response)
    tableDataList.value = response.data
    loading.value = false
  })
}
</script>

<template>
  <ContentWrap :title="t('userDemo.title')" :message="t('userDemo.message')">
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
      :page-sizes="[5, 10, 20, 50]"
      :background="true"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      class="mt-4"
    />
  </ContentWrap>
</template>
