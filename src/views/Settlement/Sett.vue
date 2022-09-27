<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getUserListApi } from '@/api/users'
import { getSettlementListApi, getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { useForm } from '@/hooks/web/useForm'
import { ElButton, ElInput, FormRules } from 'element-plus'
import { Form } from '@/components/Form'
import {
  Check,
  Delete,
  Position,
  Edit,
  TopRight,
  Message,
  Search,
  Star
} from '@element-plus/icons-vue'

import { CountyType } from '@/api/counties/types'
import { ref, h, reactive } from 'vue'
import { ElSwitch, ElPagination } from 'element-plus'

interface Params {
  pageIndex?: number
  pageSize?: number
}
const { register, elFormRef, methods } = useForm()
const countiesOptions = []
const selCounties = []

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
    field: 'population',
    label: t('Population')
  },
  {
    field: 'county.name',
    label: t('County')
  },
  {
    field: 'area',
    label: t('Area(Ha.)')
  },

  {
    field: 'action',
    label: t('userDemo.action')
  }
]
const handleClear = async () => {
  console.log('cleared....')
  getAllSettleements()
}
const handleSelect = async (county_id) => {
  console.log('on change to county ', county_id)
  selCounties.length = 0 // clear previously selected counties

  let arr = []
  if (county_id.length > 0) {
    // arr.push(county_id)   // applies for sinle select only
    //console.log('Array', arr)
    //selCounties.push(county_id)
    selCounties.push(...county_id)
    console.log(selCounties)
    const formData = {}
    formData.limit = 5
    formData.page = 1
    formData.curUser = 1 // Id for logged in user
    formData.model = 'settlement'
    formData.searchField = 'name'
    formData.searchKeyword = ''
    formData.columnFilterValue = county_id
    formData.columnFilterField = 'county_id'
    formData.assocModel = 'county'
    console.log(formData)
    const res = await getSettlementListByCounty(formData)

    console.log('After Querry', res)
    tableDataList.value = res.data
    total.value = res.total
  }
}

const onPageChange = async (page) => {
  console.log('on change change: selected counties ', selCounties)

  const formData = {}
  formData.limit = 5
  formData.page = page
  formData.curUser = 1 // Id for logged in user
  formData.model = 'settlement'
  formData.searchField = 'name'
  formData.searchKeyword = ''
  formData.columnFilterValue = selCounties
  formData.columnFilterField = 'county_id'
  formData.assocModel = 'county'
  console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('After Querry', res)
  tableDataList.value = res.data
  total.value = res.total
}

const onPageSizeChange = async (size) => {
  console.log('on change change: selected counties ', selCounties)

  const formData = {}
  formData.limit = size
  formData.page = 1
  formData.curUser = 1 // Id for logged in user
  formData.model = 'settlement'
  formData.searchField = 'name'
  formData.searchKeyword = ''
  formData.columnFilterValue = selCounties
  formData.columnFilterField = 'county_id'
  formData.assocModel = 'county'
  console.log(formData)
  const res = await getSettlementListByCounty(formData)
  console.log('After Querry', res)
  tableDataList.value = res.data
  total.value = res.total
}

const getAllSettleements = async () => {
  console.log('Get all Settleemnts ')
  let arr = []

  const formData = {}
  formData.limit = 5
  formData.page = 1
  formData.curUser = 1 // Id for logged in user
  formData.model = 'settlement'
  formData.searchField = 'name'
  formData.searchKeyword = ''
  formData.columnFilterValue = arr
  formData.columnFilterField = 'county_id'
  formData.assocModel = 'county'
  console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('All settlements Querry', res)
  tableDataList.value = res.data
  total.value = res.total
}

const schema = reactive<FormSchema[]>([
  {
    field: 'county_id',
    label: t('County'),
    component: 'Select',
    colProps: {
      span: 24
    },
    componentProps: {
      options: countiesOptions,
      onChange: handleSelect,
      onClear: handleClear,
      filterable: 'true',
      multiple: 'true',

      style: {
        width: '25%'
      },
      slots: {
        suffix: true,
        prefix: true
      }
    }
  }
])

const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)
let tableDataList = ref<UserType[]>([])

const getCounties = async (params?: Params) => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 5,
      curUser: 1, // Id for logged in user
      model: 'county',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var cnty = response.data

    loading.value = false

    cnty.forEach(function (arrayItem) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      countiesOptions.push(countyOpt)
    })
  })
}
getCounties()
getAllSettleements()

console.log('pagination', countiesOptions)
const acitonFn = (data: TableSlotDefault) => {
  console.log('Activating user.....', data.row)
  // data.mode = 'users'
}
</script>

<template>
  <ContentWrap
    :title="t('Settlements')"
    :message="t('The list of settlements listed by county. Use the county filter to subset')"
  >
    <Form
      :schema="schema"
      label-position="side"
      hide-required-asterisk
      size="large"
      class="dark:(border-1 border-[var(--el-border-color)] border-solid)"
      @register="register"
    >
      <template #title>
        <h2 class="text-2xl font-bold text-center w-[100%]">{{ t('login.register') }}</h2>
      </template>

      <template #register> </template>
    </Form>

    <Table
      :columns="columns"
      :data="tableDataList"
      :loading="loading"
      :selection="true"
      :pageSize="pageSize"
      :currentPage="currentPage"
    >
      <template #action="data">
        <el-button
          type="primary"
          :icon="TopRight"
          @click="acitonFn(data as TableSlotDefault)"
          circle
        />
      </template>
    </Table>
    <ElPagination
      layout="sizes, prev, pager, next, total"
      v-model:currentPage="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50]"
      :total="total"
      :background="true"
      @size-change="onPageSizeChange"
      @current-change="onPageChange"
      class="mt-4"
    />
  </ContentWrap>
</template>
