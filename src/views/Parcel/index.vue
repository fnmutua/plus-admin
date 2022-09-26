<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { useForm } from '@/hooks/web/useForm'
import { Form } from '@/components/Form'

import { ref, h, reactive } from 'vue'
import { ElSwitch, ElPagination } from 'element-plus'

interface Params {
  pageIndex?: number
  pageSize?: number
}
const { register, elFormRef, methods } = useForm()

////Configurations //////////////
const model = 'parcel'
const assoc_model = 'settlement'
const filterCol = 'settlement_id'
const searchField = 'parcel_no'
////////////

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

const parentOptions = []
const selectedParents = []

const { t } = useI18n()

const columns: TableColumn[] = [
  {
    field: 'index',
    label: t('userDemo.index'),
    type: 'index'
  },

  {
    field: searchField,
    label: t(toTitleCase(searchField.replace('_', ' ')))
  },

  {
    field: 'settlement.name',
    label: t(toTitleCase(assoc_model.replace('_', ' ')))
  },
  {
    field: 'area_ha',
    label: t('Area(Ha.)')
  },

  {
    field: 'action',
    label: t('userDemo.action')
  }
]
const handleClear = async () => {
  console.log('cleared....')
  getAll()
}
const handleSelect = async (selectIDs) => {
  console.log('on change  ', selectIDs)
  selectedParents.length = 0 // clear previously selected counties

  let arr = []
  if (selectIDs.length > 0) {
    // arr.push(county_id)   // applies for sinle select only
    //console.log('Array', arr)
    //selectedParents.push(county_id)
    selectedParents.push(...selectIDs)
    console.log(selectedParents)
    const formData = {}
    formData.limit = 5
    formData.page = 1
    formData.curUser = 1 // Id for logged in user
    formData.model = model
    formData.searchField = searchField
    formData.searchKeyword = ''
    formData.columnFilterValue = selectIDs
    formData.columnFilterField = filterCol
    formData.assocModel = assoc_model
    console.log(formData)
    const res = await getSettlementListByCounty(formData)

    console.log('After Querry', res)
    tableDataList.value = res.data
    total.value = res.total
  }
}

const onPageChange = async (page) => {
  console.log('on change change: selected counties ', selectedParents)

  const formData = {}
  formData.limit = 5
  formData.page = page
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  formData.searchField = searchField
  formData.searchKeyword = ''
  formData.columnFilterValue = selectedParents
  formData.columnFilterField = filterCol
  formData.assocModel = assoc_model
  console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('After Querry', res)
  tableDataList.value = res.data
  total.value = res.total
}

const onPageSizeChange = async (size) => {
  console.log('on change change: selected counties ', selectedParents)

  const formData = {}
  formData.limit = size
  formData.page = 1
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  formData.searchField = searchField
  formData.searchKeyword = ''
  formData.columnFilterValue = selectedParents
  formData.columnFilterField = filterCol
  formData.assocModel = assoc_model
  console.log(formData)
  const res = await getSettlementListByCounty(formData)
  console.log('After Querry', res)
  tableDataList.value = res.data
  total.value = res.total
}

const getAll = async () => {
  console.log('Get all Settleemnts ')
  let arr = []

  const formData = {}
  formData.limit = 5
  formData.page = 1
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  formData.searchField = searchField
  formData.searchKeyword = ''
  formData.columnFilterValue = arr
  formData.columnFilterField = filterCol
  formData.assocModel = assoc_model
  console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('All settlements Querry', res)
  tableDataList.value = res.data
  total.value = res.total
}

const schema = reactive<FormSchema[]>([
  {
    field: filterCol,
    label: toTitleCase(assoc_model),
    component: 'Select',
    colProps: {
      span: 24
    },
    componentProps: {
      options: parentOptions,
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

const getParents = async (params?: Params) => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 5,
      curUser: 1, // Id for logged in user
      model: assoc_model,
      searchField: searchField,
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
      parentOptions.push(countyOpt)
    })
  })
}
getParents()
getAll()

console.log('pagination', parentOptions)
const acitonFn = (data: TableSlotDefault) => {
  console.log('Activating user.....', data.row)
  // data.mode = 'users'
}
</script>

<template>
  <ContentWrap
    :title="toTitleCase(model.replace('_', ' '))"
    :message="
      t('The list of ' + model + ' listed by ' + assoc_model + '. Use the filter to subset')
    "
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
        <!-- <ElSwitch v-model="data.isactive" @click="acitonFn(data as TableSlotDefault)"> -->

        <ElSwitch v-model="data.row.isactive" @click="acitonFn(data as TableSlotDefault)">
          {{ t('tableDemo.action') }}
        </ElSwitch>
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
