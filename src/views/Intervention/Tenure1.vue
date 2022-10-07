<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { useForm } from '@/hooks/web/useForm'
import { ElButton, ElSelect, MessageParamsWithType } from 'element-plus'
import { Form } from '@/components/Form'
import { Position, TopRight, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import { ref, reactive } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider } from 'element-plus'
import { useRouter } from 'vue-router'

interface Params {
  pageIndex?: number
  pageSize?: number
}

const { push } = useRouter()

const { register } = useForm()
const xcountiesOptions = []
const value2 = ref([])
const countiesOptions = ref([])

const selCounties = []
//// ------------------parameters -----------------------////
const filters = ['intervention_type', 'intervention_phase']
const filterValues = [
  [1, 2, 3],
  [1, 2]
]

//// ------------------parameters -----------------------////

const { t } = useI18n()

const columns: TableColumn[] = [
  {
    field: 'index',
    label: t('userDemo.index'),
    type: 'index'
  },

  {
    field: 'settlement.name',
    label: t('Name')
  },
  {
    field: 'year',
    label: t('Year')
  },

  {
    field: 'settlement.area',
    label: t('Area(Ha.)')
  },
  {
    field: 'intervention_phase',
    label: t('Phase')
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
const handleSelectType = async (intervention_type: any) => {
  console.log('on change -----> ', intervention_type)
  selCounties.length = 0 // clear previously selected counties
  filterValues[0].length = 0 // clear previously selected types
  console.log('filterValues---->', filterValues)
  if (intervention_type.length > 0) {
    console.log('Filters', filters)
    console.log('Filter Values', filterValues)
    filterValues[0].push(...intervention_type)

    const formData = {}
    formData.limit = 5
    formData.page = 1
    formData.curUser = 1 // Id for logged in user
    formData.model = 'interventions'
    //-Search field--------------------------------------------
    formData.searchField = 'name'
    formData.searchKeyword = ''
    //--Single Filter -----------------------------------------
    formData.columnFilterValue = intervention_type
    formData.columnFilterField = 'intervention_type'
    formData.assocModel = 'settlement'
    // - multiple filters -------------------------------------
    formData.filters = filters
    formData.filterValues = filterValues
    //-------------------------
    console.log(formData)
    const res = await getSettlementListByCounty(formData)

    console.log('After Querry', res)
    tableDataList.value = res.data
    total.value = res.total
  }
}
const handleSelectPhase = async (phase: any) => {
  console.log('on change phase-----> ', phase)
  filterValues[1].length = 0 // clear previously selected phases

  if (phase.length > 0) {
    console.log('Filters', filters)
    console.log('Phase --- Filter Values', filterValues)
    filterValues[1].push(...phase)
    const formData = {}
    formData.limit = 5
    formData.page = 1
    formData.curUser = 1 // Id for logged in user
    formData.model = 'interventions'
    //-Search field--------------------------------------------
    formData.searchField = 'name'
    formData.searchKeyword = ''
    //--Single Filter -----------------------------------------
    formData.columnFilterValue = phase
    formData.columnFilterField = 'intervention_type'
    formData.assocModel = 'settlement'
    // - multiple filters -------------------------------------
    formData.filters = filters
    formData.filterValues = filterValues
    //-------------------------
    console.log(formData)
    const res = await getSettlementListByCounty(formData)

    console.log('After Querry', res)
    tableDataList.value = res.data
    total.value = res.total
  }
}
const onPageChange = async (page: any) => {
  console.log('on change change: selected counties ', selCounties)

  const formData = {}
  formData.limit = 5
  formData.page = page
  formData.curUser = 1 // Id for logged in user
  formData.model = 'interventions'
  formData.searchField = 'name'
  formData.searchKeyword = ''
  formData.columnFilterValue = selCounties
  formData.columnFilterField = 'intervention_type'
  // sedond column filter
  formData.columnFilterSecondValue = selCounties
  formData.columnFilterSecondField = 'intervention_type'

  formData.assocModel = 'settlement'
  console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('After Querry', res)
  tableDataList.value = res.data
  total.value = res.total
}

const onPageSizeChange = async (size: any) => {
  console.log('on change change: selected counties ', selCounties)

  const formData = {}
  formData.limit = size
  formData.page = 1
  formData.curUser = 1 // Id for logged in user
  formData.model = 'interventions'
  formData.searchField = 'name'
  formData.searchKeyword = ''
  formData.columnFilterValue = selCounties
  formData.columnFilterField = 'intervention_type'
  formData.assocModel = 'settlement'
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
  formData.model = 'interventions'
  formData.searchField = 'name'
  formData.searchKeyword = ''
  formData.columnFilterValue = arr
  formData.columnFilterField = 'intervention_type'
  formData.assocModel = 'settlement'
  console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('All interventions Querry', res)
  tableDataList.value = res.data
  total.value = res.total
}

const PhaseOptions = [
  {
    label: 'KISIP I',
    value: 1
  },
  {
    label: 'KISIP II',
    value: 2
  }
]

const options = [
  {
    value: 'Option1',
    label: 'Option1'
  },
  {
    value: 'Option2',
    label: 'Option2'
  },
  {
    value: 'Option3',
    label: 'Option3'
  },
  {
    value: 'Option4',
    label: 'Option4'
  },
  {
    value: 'Option5',
    label: 'Option5'
  }
]
const schema = reactive<FormSchema[]>([
  {
    field: 'field1',
    component: 'Divider',
    label: 'Filters'
  },
  {
    field: 'type',
    label: `${t('Type')}`,
    component: 'Select',
    colProps: {
      span: 12
    },
    componentProps: {
      options: countiesOptions,
      //onChange: handleSelect,
      onChange: handleSelectType,
      onClear: handleClear,
      filterable: 'true',
      multiple: 'true',
      collapsetags: 'true',
      style: {
        width: '50%'
      },
      slots: {
        suffix: true,
        prefix: true
      }
    }
  },
  {
    field: 'phase',
    label: `${t('Phase')}`,
    component: 'Select',
    colProps: {
      span: 12
    },
    componentProps: {
      options: [
        {
          label: 'KISIP I',
          value: 1
        },
        {
          label: 'KISIP II',
          value: 2
        }
      ],
      onChange: handleSelectPhase,
      onClear: handleClear,
      filterable: 'true',
      multiple: 'true',
      style: {
        width: '50%'
      },
      slots: {
        suffix: true,
        prefix: true
      }
    }
  },
  {
    field: 'field1',
    label: 'Data',
    component: 'Divider'
  }
])

const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)
let tableDataList = ref<UserType[]>([])

const getInterventionTypes = async (params?: Params) => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'intervention_types',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    loading.value = false

    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.type + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      countiesOptions.value.push(countyOpt)
    })
  })
}

const open = (msg: MessageParamsWithType) => {
  ElMessage.error(msg)
}

getInterventionTypes()
getAllSettleements()

console.log('Options---->', countiesOptions)
const acitonFn = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row.id)

  push({
    path: '/settlement/:id',
    name: 'SettlementDetails',
    params: { data: data.row.id, id: data.row.id }
  })
}

const viewHHs = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row.id)
  push({
    path: '/settlement/hh/:id',
    name: 'Households',
    params: { id: data.row.id }
  })
}

const viewOnMap = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row.geom)
  if (data.row.geom) {
    push({
      path: '/settlement/map/:id',
      name: 'SettlementMap',
      params: { id: data.row.id }
    })
  } else {
    var msg = 'This Settlement does not have the boundary defined in the database!'
    open(msg)
  }
}
</script>

<template>
  <ContentWrap
    :title="t('Settlements')"
    :message="t('The list of settlements listed by county. Use the county filter to subset')"
  >
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    <div style="display: inline-block; margin-left: 20px">
      <el-select
        v-model="value2"
        :onChange="handleSelectType"
        :onClear="handleClear"
        multiple
        filterable
        clearable
        collapse-tags
        placeholder="Filter by Type"
      >
        <el-option
          v-for="item in countiesOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-select
        v-model="value3"
        :onChange="handleSelectPhase"
        :onClear="handleClear"
        multiple
        clearable
        filterable
        collapse-tags
        placeholder="Filter by Phase"
      >
        <el-option
          v-for="item in PhaseOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
    <el-divider border-style="dashed" content-position="left">Results</el-divider>

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
            @click="acitonFn(data as TableSlotDefault)"
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
