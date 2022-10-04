<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { useForm } from '@/hooks/web/useForm'
import { Form } from '@/components/Form'
import {
  Check,
  Delete,
  TopRight,
  User,
  Position,
  Edit,
  Message,
  Search,
  Star
} from '@element-plus/icons-vue'
import { ref, h, reactive } from 'vue'
import { ElSwitch, ElButton, ElPagination } from 'element-plus'

import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'

interface Params {
  pageIndex?: number
  pageSize?: number
}
const { register, elFormRef, methods } = useForm()

const { push } = useRouter()

const route = useRoute()

////Configurations //////////////
const model = 'interventions'
const assoc_model = 'settlement'
const filterCol = 'cluster_id'
const searchField = 'intervention_type'
const parent_model = 'clusters'
const parent_field = 'cluster_id'

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
    label: t('No.'),
    type: 'index'
  },

  {
    field: 'settlement.name',
    label: t(toTitleCase(assoc_model.replace('_', ' ')))
  },
  {
    field: 'year',
    label: t('Year')
  },
  {
    field: 'settlement.population',
    label: t('population')
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
  loading.value = false
}

const schema = reactive<FormSchema[]>([
  {
    field: parent_field,
    label: toTitleCase(parent_model),
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
        width: '80%'
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
  console.log('parent_model', parent_model)
  console.log('parent_field', parent_field)
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 5,
      curUser: 1, // Id for logged in user
      model: parent_model,
      searchField: parent_field,
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
      countyOpt.label = arrayItem.contract
      //  console.log(countyOpt)
      parentOptions.push(countyOpt)
    })
  })
}

getAll()
getParents()

const viewHHs = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row.settlement.id)
  push({
    path: '/settlement/hh/:id',
    name: 'Households',
    params: { id: data.row.settlement.id }
  })
}

const viewOnMap = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row.settlement.name)
  push({
    path: '/settlement/map/:id',
    name: 'SettlementMap',
    query: { name: 'test' },
    params: { id: data.row.settlement.id, name: 'test' }
  })
}

const viewSettlementDetails = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row.settlement.id)

  push({
    path: '/settlement/:id',
    name: 'SettlementDetails',
    params: {
      data: data.row.settlement.id,
      id: data.row.settlement.id,
      name: data.row.settlement.name
    }
  })
}
</script>

<template>
  <ContentWrap
    :title="toTitleCase('Tenure Interventions')"
    :message="
      t('The list of ' + model + ' listed by ' + parent_model + '. Use the filter to subset')
    "
  >
    <Form
      :schema="schema"
      label-position="side"
      hide-required-asterisk
      size="large"
      class="dark:(border-1 border-[var(--el-border-color)] border-solid)"
      @register="register"
    />

    <Table
      :columns="columns"
      :data="tableDataList"
      :loading="loading"
      :selection="true"
      :pageSize="pageSize"
      :currentPage="currentPage"
    >
      <template #action="data">
        <el-tooltip content="View Profile" placement="top">
          <el-button
            type="primary"
            :icon="TopRight"
            @click="viewSettlementDetails(data as TableSlotDefault)"
            circle
          />
        </el-tooltip>

        <el-tooltip content="View Households" placement="top">
          <el-button
            type="success"
            :icon="User"
            @click="viewHHs(data as TableSlotDefault)"
            circle
          />
        </el-tooltip>
        <el-tooltip content="View on Map" placement="top">
          <el-button
            type="warning"
            :icon="Position"
            @click="viewOnMap(data as TableSlotDefault)"
            circle
          />
        </el-tooltip>
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
