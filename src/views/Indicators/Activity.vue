<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect, MessageParamsWithType } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Position,
  TopRight,
  User,
  Plus,
  Edit,
  Back,
  InfoFilled,
  Delete,
} from '@element-plus/icons-vue'

import { ref, reactive, onMounted, computed } from 'vue'
import {
  ElPagination, ElTooltip, ElCol, ElOption, ElDivider, ElDrawer, ElForm, ElDropdown, ElDropdownItem, ElDropdownMenu,
  ElFormItem, ElRow, ElInput, FormRules, ElPopconfirm, ElTooltipContentProps, ElTable, ElTableColumn, ElCard,
} from 'element-plus'
import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import shortid from 'shortid';

import type { FormInstance } from 'element-plus'
import TableActions from '@/views/Components/TableActions.vue';
import PermissionWrapper from '@/components/PermissionWrapper.vue';
import AdjustableTableColumnPicker from '@/components/Users/AdjustableTableColumnPicker.vue'
import DownloadCustom from '@/views/Components/DownloadCustom.vue'
import { Icon } from '@/components/Icon'
import { useAdjustableTableColumns, type AdjustableColumnSetting } from '@/composables/useAdjustableTableColumns'


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)





const action_buttons = ref([])
if (showAdminButtons.value) {
  action_buttons.value = ['edit', 'delete']
} else if (showEditButtons.value) {

  action_buttons.value = ['edit']
}
else {
  action_buttons.value = []

}




console.log("userInfo--->", userInfo)


const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
} else {
  dialogWidth.value = "25%"
  actionColumnWidth.value = "160px"

}

// Code is system-generated (shortid), not something users need to see by default.
// shortTitle/title/code have no fixed `width` — el-table stretches columns with
// only a min-width to fill the table, instead of leaving blank space to the
// right of a few narrow fixed-width columns. `id` stays fixed since it never
// needs more than a few digits. Once a user drags a column, onHeaderDragend
// saves a real width and it stops flexing (this is the same width field the
// drag-resize persistence already uses — see useAdjustableTableColumns).
const activityColumnDefaults = (): AdjustableColumnSetting[] => [
  { key: 'id', label: 'Id', width: 80, minWidth: 80, visible: true, hideable: true },
  { key: 'shortTitle', label: 'Short Title', width: undefined as any, minWidth: 180, visible: true, hideable: true },
  { key: 'title', label: 'Title', width: undefined as any, minWidth: 180, visible: true, hideable: true },
  { key: 'code', label: 'Code', width: undefined as any, minWidth: 120, visible: false, hideable: true },
]

const {
  showColumnPicker,
  isColumnVisible,
  columnWidth,
  columnMinWidth,
  hideableColumns,
  visibleColumnKeys,
  onHeaderDragend,
  resetColumns,
} = useAdjustableTableColumns('activityTableColumnsV2', activityColumnDefaults)

/** Code stretches when visible; shortTitle + title share remaining space equally. */
const equalTitleColumnsVisible = computed(
  () => isColumnVisible('shortTitle') && isColumnVisible('title')
)

const idColumnWidth = (key: 'id') => {
  const w = columnWidth(key)
  return typeof w === 'number' && w > 40 ? w : 80
}

/** Flex columns use min-width only so the table always fills 100% width. */
const flexColumnMinWidth = (key: 'shortTitle' | 'title' | 'code') => {
  const min = columnMinWidth(key) ?? 120
  const w = columnWidth(key)
  if (typeof w === 'number' && w > 40) {
    if (equalTitleColumnsVisible.value && (key === 'shortTitle' || key === 'title')) {
      const otherKey = key === 'shortTitle' ? 'title' : 'shortTitle'
      const otherW = columnWidth(otherKey)
      const saved = [w, otherW].filter((n): n is number => typeof n === 'number' && n > 40)
      if (saved.length) return Math.max(min, ...saved)
    }
    return Math.max(min, w)
  }
  return min
}




const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const indicatorsOptions = ref([])
const ActivityOptions = ref([])
const categories = ref([])
const filteredIndicators = ref([])
const page = ref(1)

const selCounties = []
const loading = ref(true)
const currentPage = ref(1)
const total = ref(0)
const downloadLoading = ref(false)



const mobileBreakpoint = 768;
const defaultPageSize = 5;
const mobilePageSize = 5;
const pageSize = ref(defaultPageSize);

// Function to update pageSize based on window width
const updatePageSize = () => {
  if (window.innerWidth <= mobileBreakpoint) {
    pageSize.value = mobilePageSize;
  } else {
    pageSize.value = defaultPageSize;
  }
};

onMounted(async () => {


  window.addEventListener('resize', updatePageSize);
  updatePageSize(); // Initial check


})




let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []
const associated_Model = ''
const associated_multiple_models = []
const model = 'activity'
//// ------------------parameters -----------------------////

const hasActiveFilters = computed(
  () =>
    (Array.isArray(value3.value) && value3.value.length > 0) ||
    (Array.isArray(value1.value) && value1.value.length > 0) ||
    (Array.isArray(value2.value) && value2.value.length > 0)
)

const { t } = useI18n()
const AddDialogVisible = ref(false)
const formHeader = ref('Add Activity')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)







const handleClear = async () => {
  console.log('cleared....')

  // clear all the fileters -------
  filterValues = []
  filters = []
  value1.value = ''
  value2.value = ''
  value3.value = ''
  pageSize.value = 5
  currentPage.value = 1
  tblData = []
  //----run the get data--------
  getInterventionsAll()
}


const handleSelectActivity = async (indicator: any) => {
  var selectOption = 'id'
  if (!filters.includes(selectOption)) {
    filters.push(selectOption)
  }
  var index = filters.indexOf(selectOption) // 1
  console.log('category : index--->', index)

  // clear previously selected
  if (filterValues[index]) {
    // filterValues[index].length = 0
    filterValues.splice(index, 1)
  }

  if (!filterValues.includes(indicator) && indicator.length > 0) {
    filterValues.splice(index, 0, indicator) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (indicator.length === 0) {
    filters.splice(index, 1)
  }

  console.log('FilterValues:', filterValues)

  getFilteredData(filters, filterValues)
}

const onPageChange = async (selPage: any) => {
  console.log('on change change: selected counties ', selCounties)
  page.value = selPage
  getFilteredData(filters, filterValues)
}

const onPageSizeChange = async (size: any) => {
  pageSize.value = size
  getFilteredData(filters, filterValues)
}

const getInterventionsAll = async () => {
  getFilteredData(filters, filterValues)
}

const flattenJSON = (obj = {}, res = {}, extraKey = '') => {
  for (let key in obj) {
    if (key != 'geom') {

      if (typeof obj[key] !== 'object') {
        res[extraKey + key] = obj[key];
      } else {
        flattenJSON(obj[key], res, `${extraKey}${key}.`);
      };
    };
  }
  return res;
};


const getFilteredData = async (selFilters, selfilterValues) => {
  const formData = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = associated_multiple_models

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('After Querry', res)
  tableDataList.value = res.data
  total.value = res.total

  tblData = [] // reset the table data
  console.log('TBL-b4', tblData)
  res.data.forEach(function (arrayItem) {
    //  console.log(countyOpt)
    // delete arrayItem[associated_Model]['geom'] //  remove the geometry column

    var dd = flattenJSON(arrayItem)

    tblData.push(dd)
  })

  console.log('TBL-4f', tblData)
}



const getIndicatorOptions = async () => {
  const res = await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //   limit: 100,
      curUser: 1, // Id for logged in user
      model: 'activity',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    loading.value = false
    // pass result to the makeoptions

    categories.value = ret
    makeOptions(categories)
  })
}



const makeOptions = (list) => {
  console.log('making the options..............', list)
  ActivityOptions.value = []
  list.value.forEach(function (arrayItem: { id: string; type: string }) {
    var countyOpt = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.title  
    //  console.log(countyOpt)
    ActivityOptions.value.push(countyOpt)
  })
}

console.log('Options---->', indicatorsOptions)
const editIndicator = (data: TableSlotDefault) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
  console.log(data)
  ruleForm.id = data.id
  ruleForm.title = data.title
  ruleForm.shortTitle = data.shortTitle



  formHeader.value = 'Edit Component'


  AddDialogVisible.value = true
}


const DeleteIndicator = async (data: TableSlotDefault) => {
  console.log('----->', data.id)
  let formData = {}
  formData.id = data.id
  formData.model = model
  await DeleteRecord(formData)

  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data);
  if (index !== -1) {
    console.log('Remove index', index)

    tableDataList.value.splice(index, 1);
    console.log(tableDataList.value)

  }




  getFilteredData(filters, filterValues)
}

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  title: '',
  shortTitle: ''
})
const handleClose = () => {

  console.log("Clsoing the dialoig")
  showSubmitBtn.value = true
  showEditSaveButton.value = false

  ruleForm.id = ''
  ruleForm.title = ''
  ruleForm.shortTitle = ''
  formHeader.value = 'Add Activity'

}




const rules = reactive<FormRules>({
  title: [
    { required: true, message: 'Please provide A title', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  // shortTitle is allowNull: false on the activity table — the form let it
  // through blank before, which would only fail at the DB with no useful message.
  shortTitle: [
    { required: true, message: 'Please provide a short title', trigger: 'blur' },
  ],

})

const AddComponent = () => {
  AddDialogVisible.value = true
}


const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = model
      ruleForm.code =  shortid.generate()
      const res = await CreateRecord(ruleForm)
      console.log('inserted object', res.data)
      tableDataList.value.push(res.data)  // Add the added object on the list 


    } else {
      console.log('error submit!', fields)
    }
  })
}





const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = model;

      updateOneRecord(ruleForm)
        .then((updatedRecord) => {
          // Assuming you get the updated record back from the API
          if (updatedRecord) {
            console.log('updatedRecord', updatedRecord)
            // Find the index of the original record in the table data list
            const index = tableDataList.value.findIndex((item) => item.id === updatedRecord.data.id);

            if (index !== -1) {
              // Replace the original record with the updated one
              tableDataList.value[index] = updatedRecord.data;
            }

            AddDialogVisible.value = false
            handleClose()
          }
        })
        .catch((error) => {
          console.error('Error updating record:', error);
        });
    } else {
      console.log('error submit!', fields);
    }
  });
};

getIndicatorOptions()
getInterventionsAll()


const tableRowClassName = (data) => {
  // console.log('Row Styling --------->', data.row)
  if (data.row.documents.length > 0) {
    return 'warning-row'
  }
  return ''
}


const router = useRouter()


const goBack = () => {
  // Add your logic to handle the back action
  // For example, you can use Vue Router to navigate back
  if (router) {
    // Use router.back() to navigate back
    router.back()
  } else {
    console.warn('Router instance not available.')
  }

}





</script>

<template>
  <el-card class="activity-page-card">



    <div
      class="sett-toolbar-row"
      :class="isMobile ? 'sett-toolbar-row--compact' : 'sett-toolbar-row--wide'"
    >
      <div class="sett-toolbar-col sett-toolbar-col--back">
        <el-button type="primary" plain :icon="Back" @click="goBack" size="small">
          Back
        </el-button>
      </div>

      <div class="sett-toolbar-col sett-toolbar-col--search">
        <el-select
          v-model="value3"
          :onChange="handleSelectActivity"
          :onClear="handleClear"
          multiple
          clearable
          filterable
          collapse-tags
          placeholder="Search Activity"
          style="width: 100%;"
        >
          <el-option v-for="item in ActivityOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

      <div class="sett-toolbar-col sett-toolbar-col--actions">
        <div class="sett-toolbar-actions" :class="{ 'sett-toolbar-actions--desktop': !isMobile }">
          <PermissionWrapper :permissions="['activity:create']">
            <el-tooltip content="Add Activity" placement="top">
              <el-button :onClick="AddComponent" type="primary" :icon="Plus" />
            </el-tooltip>
          </PermissionWrapper>

          <el-tooltip v-if="hasActiveFilters" content="Clear all filters" placement="top">
            <el-button type="primary" @click="handleClear">
              <Icon icon="mdi:filter-remove" width="22" height="22" />
            </el-button>
          </el-tooltip>

          <AdjustableTableColumnPicker
            v-model:show-column-picker="showColumnPicker"
            v-model:visible-column-keys="visibleColumnKeys"
            :hideable-columns="hideableColumns"
            @reset="resetColumns"
          />

          <PermissionWrapper :permissions="['activity:read']">
            <DownloadCustom
              :data="tableDataList"
              :model="model"
              :associated_models="associated_multiple_models"
              :loading="downloadLoading"
              :filters="filters"
              :filter-values="filterValues"
              :total="total"
              @download-start="downloadLoading = true"
              @download-end="downloadLoading = false"
            />
          </PermissionWrapper>
        </div>
      </div>
    </div>














    <div class="activity-table-wrap">
    <el-table
      fit
      table-layout="fixed"
      :data="tableDataList"
      :loading="loading"
      :show-overflow-tooltip="true"
      class="activity-table"
      style="width: 100%; margin-top: 10px;"
      border
      row-key="id"
      @header-dragend="onHeaderDragend"
    >
      <el-table-column
        v-if="isColumnVisible('id')"
        column-key="id"
        label="Id"
        prop="id"
        :width="idColumnWidth('id')"
        :min-width="columnMinWidth('id')"
        sortable
        resizable
      >
        <template #default="{ row }">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column
        v-if="isColumnVisible('shortTitle')"
        column-key="shortTitle"
        label="Short Title"
        prop="shortTitle"
        class-name="activity-col-equal"
        :min-width="flexColumnMinWidth('shortTitle')"
        sortable
        resizable
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span>{{ row.shortTitle }}</span>
        </template>
      </el-table-column>
      <el-table-column
        v-if="isColumnVisible('title')"
        column-key="title"
        label="Title"
        prop="title"
        class-name="activity-col-equal"
        :min-width="flexColumnMinWidth('title')"
        sortable
        resizable
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span>{{ row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column
        v-if="isColumnVisible('code')"
        column-key="code"
        label="Code"
        prop="code"
        :min-width="flexColumnMinWidth('code')"
        sortable
        resizable
      >
        <template #default="{ row }">
          <span>{{ row.code }}</span>
        </template>
      </el-table-column>
      <!-- <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
        <template #default="scope">
          <el-dropdown v-if="isMobile">
            <span class="el-dropdown-link">
              <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
v-if="showEditButtons" @click="editIndicator(scope as TableSlotDefault)" :icon="Edit"
                  color="green">Edit</el-dropdown-item>
                <el-dropdown-item
v-if="showAdminButtons" @click="DeleteIndicator(scope.row as TableSlotDefault)"
                  :icon="Delete" color="red">Delete</el-dropdown-item>
              </el-dropdown-menu>
            </template>
</el-dropdown>


<div v-else>

  <el-tooltip v-if="showEditButtons" content="Edit" placement="top">
    <el-button type="success" size="small" :icon="Edit" @click="editIndicator(scope as TableSlotDefault)" circle />
  </el-tooltip>

  <el-tooltip v-if="showAdminButtons" content="Delete" placement="top">
    <el-popconfirm confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
      title="Are you sure to delete this record?" width="300" @confirm="DeleteIndicator(scope.row as TableSlotDefault)">
      <template #reference>
                  <el-button type="danger" size="small" :icon=Delete circle />
                </template>
    </el-popconfirm>
  </el-tooltip>

</div>
</template>

</el-table-column> -->


      <el-table-column label="Actions" :width="actionColumnWidth">
        <template #default="{ row }">
          <PermissionWrapper :permissions="['activity:update', 'activity:delete']">
            <TableActions :item="row" :buttons="action_buttons" @edit="editIndicator" @delete="DeleteIndicator" />
          </PermissionWrapper>
        </template>
      </el-table-column>


    </el-table>
    </div>

    <ElPagination
:layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7" />
  </el-card>

  <el-drawer
    v-model="AddDialogVisible"
    direction="rtl"
    :size="dialogWidth"
    :title="formHeader"
    @close="handleClose"
  >
    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="top">
      <el-form-item label="Title" prop="title">
        <el-input
          v-model="ruleForm.title"
          placeholder="e.g. Community Training Sessions"
          :style="{ width: '100%' }"
        />
        <p class="field-hint">Full descriptive name of the activity. Used in admin lists, reports, and M&amp;E configuration.</p>
      </el-form-item>

      <el-form-item label="Short Title" prop="shortTitle">
        <el-input
          v-model="ruleForm.shortTitle"
          placeholder="e.g. Training"
          :style="{ width: '100%' }"
        />
        <p class="field-hint">Abbreviated label for <strong>SlumMapper mobile</strong> — keep it short so field teams can pick the activity quickly on a small screen.</p>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="drawer-footer-bar">
        <el-button @click="AddDialogVisible = false">Cancel</el-button>
        <el-button v-if="showSubmitBtn" type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>
        <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped>
.sett-toolbar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  min-width: 0;
}

.sett-toolbar-row--compact {
  flex-wrap: nowrap;
}

.sett-toolbar-row--wide {
  flex-wrap: nowrap;
}

.sett-toolbar-col {
  min-width: 0;
}

.sett-toolbar-col--back {
  flex: 0 0 auto;
}

.sett-toolbar-row--wide .sett-toolbar-col--search {
  flex: 1 1 0;
  min-width: 160px;
  max-width: 320px;
}

.sett-toolbar-row--wide .sett-toolbar-col--actions {
  flex: 1 1 auto;
  min-width: 0;
  margin-left: auto;
}

.sett-toolbar-row--compact .sett-toolbar-col--search {
  flex: 1 1 120px;
}

.sett-toolbar-row--compact .sett-toolbar-col--actions {
  flex: 0 0 auto;
}

.sett-toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  flex-wrap: nowrap;
  width: 100%;
}

.sett-toolbar-actions--desktop {
  flex-wrap: wrap;
}

.activity-page-card {
  width: 100%;
}

.activity-page-card :deep(.el-card__body) {
  width: 100%;
}

.activity-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.activity-table-wrap :deep(.activity-table),
.activity-table-wrap :deep(.el-table__inner-wrapper),
.activity-table-wrap :deep(.el-table__header-wrapper),
.activity-table-wrap :deep(.el-table__body-wrapper) {
  width: 100% !important;
}

.activity-table-wrap :deep(.el-table__header colgroup col),
.activity-table-wrap :deep(.el-table__body colgroup col) {
  min-width: 0;
}

.activity-table-wrap :deep(.el-table__header table),
.activity-table-wrap :deep(.el-table__body table) {
  width: 100% !important;
  table-layout: fixed;
}

.activity-table-wrap :deep(.el-table__empty-block) {
  width: 100% !important;
}

.drawer-footer-bar {
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color);
  text-align: right;
}

.field-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.45;
}

.field-hint strong {
  font-weight: 600;
}
</style>
