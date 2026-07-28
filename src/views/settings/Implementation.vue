<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect, MessageParamsWithType } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Back,
  Plus,
} from '@element-plus/icons-vue'

import { ref, reactive, computed, onMounted } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElCard, ElDialog, ElForm, ElFormItem, ElInput, FormRules, ElTable, ElTableColumn } from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import PermissionWrapper from '@/components/PermissionWrapper.vue';
import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import TableActions from '@/views/Components/TableActions.vue';
import AdjustableTableColumnPicker from '@/components/Users/AdjustableTableColumnPicker.vue';
import { useAdjustableTableColumns } from '@/composables/useAdjustableTableColumns';
import { implementationTableColumnDefaults } from '@/config/settings/programmeTableColumns';
import { sortFlatRows, type TableSortOrder } from '@/utils/settingsTableSort'

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)

// We  ndeed to get all routes so that 
// we check againt new routes i.e new dashbaords 
const router = useRouter();
const allRoutes = router.getRoutes();
console.log('All Routes:', allRoutes);
 

const showAdminButtons =  ref(appStore.getAdminButtons)
const showEditButtons =  ref(appStore.getEditButtons)

const isMobile = computed(() => appStore.getMobile)
const rowActionButtons = ['edit', 'delete']

const {
  showColumnPicker,
  isColumnVisible,
  columnWidth,
  columnMinWidth,
  hideableColumns,
  visibleColumnKeys,
  onHeaderDragend,
  resetColumns,
} = useAdjustableTableColumns('settingsImplementationTableColumns', implementationTableColumnDefaults)





const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const indicatorsOptions = ref([])
const categoryOptions = ref([])
const categories = ref([])
const filteredIndicators = ref([])
const selCounties = []
const loading = ref(true)
const currentPage = ref(1)
const downloadLoading = ref(false)
 



const mobileBreakpoint = 768;
const defaultPageSize = 10;
const mobilePageSize = 5;
const pageSize = ref(defaultPageSize);

// Function to update pageSize based on window width
const updatePageSize = () => {
  if (window.innerWidth <= mobileBreakpoint) {
    pageSize.value = mobilePageSize
  } else {
    pageSize.value = defaultPageSize
  }
}

onMounted(async () => {
  window.addEventListener('resize', updatePageSize)
  updatePageSize()
  await loadImplementations()
})

console.log("Show Buttons -->", showAdminButtons)



let allImplementations = ref<any[]>([])

function normalizeApiRows(response: unknown): any[] {
  if (!response) return []
  if (Array.isArray(response)) return response
  const payload = response as Record<string, unknown>
  if (Array.isArray(payload.data)) return payload.data as any[]
  if (payload.data && typeof payload.data === 'object') {
    const nested = payload.data as Record<string, unknown>
    if (Array.isArray(nested.data)) return nested.data as any[]
    if (Array.isArray(nested.rows)) return nested.rows as any[]
  }
  if (Array.isArray(payload.rows)) return payload.rows as any[]
  return []
}
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []
const associated_Model = ''
const associated_multiple_models = []
const model = 'programme_implementation'
//// ------------------parameters -----------------------////

const { t } = useI18n()
const AddDialogVisible = ref(false)
const formHeader = ref('Add Programme Implementation')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)



const columns: TableColumn[] = [
  {
    field: 'index',
    label: t('userDemo.index'),
    type: 'index'
  },

  {
    field: 'title',
    label: t('Title')
  },
  {
    field: 'acronym',
    label: t('Acronym')
  },

  {
    field: 'description',
    label: t('Description')
  },
  {
    field: 'action',
    label: t('Actions')
  }

]
const handleClear = async () => {
  filterValues = []
  filters = []
  value3.value = []
  currentPage.value = 1
}



const checkIfRouteExists = async (route: any) => { 
    // Find the route by name
    const routeName = route;
    const resolvedRoute = allRoutes.find(route => route.name === routeName);

    console.log('Resolved Route:', resolvedRoute);
    console.log('routeName:', routeName);

  if (resolvedRoute) {
   // let msg = "Error. A route with same name exists. Try different Name"
      return true
  } else {
      return false
  }
    
  
    
}



const handleSelectIndicator = async (selectedIds: number[]) => {
  if (!selectedIds?.length) {
    filters = []
    filterValues = []
  } else {
    filters = ['id']
    filterValues = [selectedIds]
  }
  currentPage.value = 1
}

const onPageChange = async (selPage: number) => {
  currentPage.value = selPage
}

const onPageSizeChange = async (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const filteredImplementations = computed(() => {
  const rows = allImplementations.value
  if (!filters.length || !filterValues.length) return rows

  const idFilterIndex = filters.indexOf('id')
  if (idFilterIndex === -1) return rows

  const selected = filterValues[idFilterIndex]
  const idSet = new Set(
    (Array.isArray(selected) ? selected : [selected])
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id))
  )
  if (!idSet.size) return rows

  return rows.filter((row) => idSet.has(Number(row.id)))
})

const sortedImplementations = computed(() => {
  let rows = filteredImplementations.value
  if (tableSortProp.value && tableSortOrder.value) {
    rows = sortFlatRows(rows, tableSortProp.value, tableSortOrder.value)
  }
  return rows
})

const total = computed(() => sortedImplementations.value.length)

const paginatedImplementationData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedImplementations.value.slice(start, start + pageSize.value)
})

const tableSortProp = ref<string | null>(null)
const tableSortOrder = ref<TableSortOrder>(null)

const handleTableSort = ({
  prop,
  order,
}: {
  prop: string
  order: TableSortOrder
}) => {
  tableSortProp.value = order ? prop : null
  tableSortOrder.value = order
  currentPage.value = 1
}

const loadImplementations = async () => {
  loading.value = true
  try {
    const response = await getCountyListApi({
      params: {
        limit: 10000,
        curUser: 1,
        model,
        searchField: 'title',
        searchKeyword: '',
        sort: 'ASC',
      },
    })

    const ret = normalizeApiRows(response)
    allImplementations.value = ret
    categoryOptions.value = ret.map((item: { id: number; title?: string; acronym?: string }) => ({
      value: item.id,
      label: item.title || item.acronym || String(item.id),
    }))
    tblData = ret.map((arrayItem) => flattenJSON(arrayItem))
  } catch (error: any) {
    allImplementations.value = []
    tblData = []
    ElMessage.error(error?.message || 'Failed to load implementations')
  } finally {
    loading.value = false
  }
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


const handleDownload = () => {
  downloadLoading.value = true
  const data = tblData
  const fileName = 'implementations.csv'
  const exportType = exportFromJSON.types.csv
  if (data) exportFromJSON({ data, fileName, exportType })
  downloadLoading.value = false
}


const DEFAULT_IMPLEMENTATION_ICON = 'material-symbols:account-balance-wallet-outline-sharp'

const ensureImplementationIcon = () => {
  if (!ruleForm.icon) {
    ruleForm.icon = DEFAULT_IMPLEMENTATION_ICON
  }
}

console.log('Options---->', indicatorsOptions)
const editIndicator = (row: { id: number; title?: string; description?: string; icon?: string; acronym?: string }) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
  ruleForm.id = row.id
  ruleForm.title = row.title ?? ''
  ruleForm.description = row.description ?? ''
  ruleForm.icon = row.icon ?? null
  ruleForm.acronym = row.acronym ?? null
  formHeader.value = 'Edit Programme Implementation'
  AddDialogVisible.value = true
}

const DeleteIndicator = async (row: { id: number }) => {
  try {
    await DeleteRecord({ id: row.id, model })
    ElMessage.success('Record deleted')
    await loadImplementations()
  } catch (error: any) {
    ElMessage.error(error?.message || error || 'Failed to delete record')
  }
}


const handleClose = () => {

  console.log("Clsoing the dialoig")
  showSubmitBtn.value = true
  showEditSaveButton.value = false

  
  ruleForm.category = ''
  formHeader.value = 'Add Category'

}


const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  id: null as number | null,
  title: '',
  description: '',
  icon: null as string | null,
  acronym: null as string | null,
})

const rules = reactive<FormRules>({
  title: [
    { required: true, message: 'Please provide a title', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  description: [
    { required: true, message: 'Please provide a description', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
})

const AddIndicator = () => {
  AddDialogVisible.value = true
}


const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {

    var exists = await checkIfRouteExists(ruleForm.title)
    console.log('exists',exists)

    if ( exists ) {
      ElMessage.error('An implementation route with same name exists. Try a different Name')
    } else {


      if (valid) {
        ensureImplementationIcon()
        ruleForm.model = model
        ruleForm.code = uuid.v4()
        await CreateRecord(ruleForm)
        ElMessage.success('Implementation created')
        AddDialogVisible.value = false
        await loadImplementations()
      } else {
        console.log('error submit!', fields)
      }
    }
  })
}


const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ensureImplementationIcon()
      ruleForm.model = model
      await updateOneRecord(ruleForm)
      ElMessage.success('Implementation updated')
      AddDialogVisible.value = false
      await loadImplementations()
    } else {
      console.log('error submit!', fields)
    }
  })
}


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
  <el-card  >
 



    <el-row type="flex" justify="start" gutter="10" style="display: flex; flex-wrap: nowrap; align-items: center;">

<div class="max-w-200px">
  <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
    Back
  </el-button>
</div>

<!-- Title Search -->
<el-select
v-model="value3" :onChange="handleSelectIndicator" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Search Implementation">
        <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>




<!-- Action Buttons -->
<div style="display: flex; align-items: center; gap: 10px; margin-left: 10px;">
  <PermissionWrapper :permissions="['programme_implementation:create']">
    <el-tooltip content="Add Programme" placement="top">
      <el-button :onClick="AddIndicator" type="primary" :icon="Plus" />
    </el-tooltip>
  </PermissionWrapper>
  <PermissionWrapper :permissions="['programme_implementation:read']">
    <DownloadCustom
      :data="filteredImplementations"
      :model="model"
      :associated_models="associated_multiple_models"
                      :total="total"
                      :filters="filters"
                      :filter-values="filterValues"
/>
   </PermissionWrapper>
    <AdjustableTableColumnPicker
      v-model:show-column-picker="showColumnPicker"
      v-model:visible-column-keys="visibleColumnKeys"
      :hideable-columns="hideableColumns"
      @reset="resetColumns"
    />
</div>

</el-row>

  
   

 
    <div class="settings-table-wrap">
    <el-table
      v-loading="loading"
      :data="paginatedImplementationData"
      row-key="id"
      class="settings-table"
      table-layout="auto"
      style="width: 100%; margin-top: 10px;"
      border
      show-overflow-tooltip
      @header-dragend="onHeaderDragend"
      @sort-change="handleTableSort"
    >
      <el-table-column
        v-if="isColumnVisible('title')"
        column-key="title"
        label="Title"
        prop="title"
        :width="columnWidth('title')"
        :min-width="columnMinWidth('title')"
        sortable="custom"
      />
      <el-table-column
        v-if="isColumnVisible('acronym')"
        column-key="acronym"
        label="Acronym"
        prop="acronym"
        :width="columnWidth('acronym')"
        :min-width="columnMinWidth('acronym')"
        sortable="custom"
      />
      <el-table-column
        v-if="isColumnVisible('description')"
        column-key="description"
        label="Description"
        prop="description"
        :min-width="columnMinWidth('description')"
        sortable="custom"
      />

      <el-table-column
        fixed="right"
        label=""
        width="68"
        align="center"
        class-name="implementation-ops-column"
      >
        <template #default="{ row }">
          <div class="settings-table-row-actions" @click.stop>
            <TableActions
              :item="row"
              :buttons="rowActionButtons"
              @edit="editIndicator"
              @delete="DeleteIndicator"
            />
          </div>
        </template>
      </el-table-column>
    </el-table>
    </div>
    <ElPagination
      layout="sizes,prev,pager,next, total"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50, 200, 10000]"
      :total="total"
      :background="true"
      @size-change="onPageSizeChange"
      @current-change="onPageChange"
      class="mt-4"
    />

    <div class="implementation-table-summary">
      {{ total }} implementation(s)
    </div>
  </el-card>

  <el-dialog
    v-model="AddDialogVisible"
    @close="handleClose"
    :title="formHeader"
    :width="isMobile ? '100%' : '520px'"
    :fullscreen="isMobile"
    :draggable="!isMobile"
    overflow
    class="implementation-form-dialog"
  >
    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px">
      <el-form-item label="Acronym">
        <el-input v-model="ruleForm.acronym" />
      </el-form-item>
      <el-form-item label="Title">
        <el-input v-model="ruleForm.title" />
      </el-form-item>

      <el-form-item label="Description">
        <el-input v-model="ruleForm.description" />
      </el-form-item>

    </el-form>
    <template #footer>

      <span class="dialog-footer">
        <el-button @click="AddDialogVisible = false">Cancel</el-button>
        <el-button v-if="showSubmitBtn" type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>
        <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.settings-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.settings-table-row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-table-wrap :deep(.implementation-ops-column .cell) {
  padding-left: 4px;
  padding-right: 4px;
}

.implementation-table-summary {
  margin-top: 10px;
  font-size: 13px;
  color: #606266;
}
</style>
