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
  Filter,
} from '@element-plus/icons-vue'

import { ref, reactive, computed } from 'vue'
import { ElTooltip, ElOption, ElCard, ElDialog, ElForm, ElFormItem, ElInput, FormRules, ElTable, ElTableColumn } from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import TableActions from '@/views/Components/TableActions.vue';
import AdjustableTableColumnPicker from '@/components/Users/AdjustableTableColumnPicker.vue';
import { useAdjustableTableColumns } from '@/composables/useAdjustableTableColumns';
import { programmeTableColumnDefaults } from '@/config/settings/programmeTableColumns';
import PermissionWrapper from '@/components/PermissionWrapper.vue';
import ElementPlusIconPickerField from '@/components/ElementPlusIconPickerField.vue'
import { Icon } from '@/components/Icon'
import {
  buildProgrammeTree,
  flattenProgrammeTree,
  getProgrammeDescendantIds,
  validateProgramme,
  type ProgrammeRecord,
} from '@/utils/programmeValidation'
import { sortTreeRows, type TableSortOrder } from '@/utils/settingsTableSort'

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
} = useAdjustableTableColumns('settingsProgrammeTableColumns', programmeTableColumnDefaults)


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






const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const indicatorsOptions = ref([])
const categoryOptions = ref([])
const categories = ref([])
const loading = ref(true)
const downloadLoading = ref(false)









console.log("Show Buttons -->", showAdminButtons)



let tableDataList = ref<UserType[]>([]) // kept for legacy column config / exports
//// ------------------parameters -----------------------////
var filters = []
var filterValues = []
const associated_Model = ''
const associated_multiple_models = [ ]
const model = 'programme'
//// ------------------parameters -----------------------////

const { t } = useI18n()
const AddDialogVisible = ref(false)
const formHeader = ref('Add Programme')
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
  value1.value = ''
  value2.value = ''
  value3.value = ''
  getInterventionsAll()
}



const checkIfRouteExists = async (route: any) => { 
    // Find the route by name
    const routeName = route;
    const resolvedRoute = allRoutes.find(route => route.name === routeName);

  console.log('Resolved Route:', resolvedRoute);

  if (resolvedRoute) {
    let msg = "Error. A route with same name exists. Try different Name"
      return msg
  } else {
      return null
    }
}



const handleSelectIndicator = async (indicator: any) => {
  if (!indicator || indicator.length === 0) {
    filters = []
    filterValues = []
  } else {
    filters = ['id']
    filterValues = [indicator]
  }
}

const parentOptions = ref<{ label: string; value: number }[]>([])
const allProgrammes = ref<ProgrammeRecord[]>([])

const refreshParentOptions = () => {
  const editingId = ruleForm.id != null ? Number(ruleForm.id) : null
  const excluded = new Set<number>()

  if (editingId && !Number.isNaN(editingId)) {
    excluded.add(editingId)
    getProgrammeDescendantIds(editingId, allProgrammes.value).forEach((id) => excluded.add(id))
  }

  parentOptions.value = allProgrammes.value
    .filter((item) => !excluded.has(Number(item.id)))
    .map((item) => ({
      label: item.title || item.acronym || String(item.id),
      value: Number(item.id),
    }))
}

const loadProgrammes = async () => {
  loading.value = true
  try {
    const response = await getCountyListApi({
      params: {
        limit: 10000,
        curUser: 1,
        model: 'programme',
        searchField: 'title',
        searchKeyword: '',
        sort: 'ASC',
      },
    })

    const ret = (response as { data: any[] }).data || []
    allProgrammes.value = ret.map(({ children: _children, parent: _parent, ...rest }) => rest)
    categories.value = allProgrammes.value
    refreshParentOptions()
    makeOptions(categories)
  } finally {
    loading.value = false
  }
}

const getInterventionsAll = async () => {
  await loadProgrammes()
}

const filteredProgrammes = computed(() => {
  const selectedIds = Array.isArray(value3.value)
    ? value3.value.map((id) => Number(id)).filter((id) => !Number.isNaN(id))
    : []

  if (!selectedIds.length) return allProgrammes.value

  const idSet = new Set(selectedIds)
  return allProgrammes.value.filter((item) => idSet.has(Number(item.id)))
})

const programmeTableData = computed(() => {
  const tree = buildProgrammeTree(filteredProgrammes.value)
  if (!tableSortProp.value || !tableSortOrder.value) return tree
  return sortTreeRows(
    tree as (ProgrammeRecord & { children?: ProgrammeRecord[] })[],
    tableSortProp.value,
    tableSortOrder.value
  )
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
}

const programmeExportData = computed(() => flattenProgrammeTree(programmeTableData.value))

const programmeRootCount = computed(() => programmeTableData.value.length)


const makeOptions = (list) => {
  console.log('making the options..............', list)
  categoryOptions.value = []
  list.value.forEach(function (arrayItem: { id: string; type: string }) {
    var countyOpt = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.title 
    //  console.log(countyOpt)
    categoryOptions.value.push(countyOpt)
  })
}

const handleDownload = () => {
  downloadLoading.value = true
  const data = tblData
  const fileName = 'indicators.xlsx'
  const exportType = exportFromJSON.types.csv
  if (data) exportFromJSON({ data, fileName, exportType })
}


getInterventionsAll()

console.log('Options---->', indicatorsOptions)
const editIndicator = (row: ProgrammeRecord & { id: number }) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
  ruleForm.id = row.id
  ruleForm.title = row.title ?? ''
  ruleForm.description = row.description ?? ''
  ruleForm.icon = row.icon ?? ''
  ruleForm.acronym = row.acronym ?? null
  ruleForm.parentId = row.parentId ?? null

  refreshParentOptions()
  formHeader.value = 'Edit Programme'
  AddDialogVisible.value = true
}

const DeleteIndicator = async (row: ProgrammeRecord & { id: number }) => {
  try {
    await DeleteRecord({ id: row.id, model })
    ElMessage.success('Programme deleted')
    getInterventionsAll()
  } catch (error: any) {
    ElMessage.error(error?.message || error || 'Failed to delete programme')
  }
}


const handleClose = () => {

  console.log("Clsoing the dialoig")
  showSubmitBtn.value = true
  showEditSaveButton.value = false

  
  ruleForm.category = ''
  ruleForm.id = null
  ruleForm.title = ''
  ruleForm.description = ''
  ruleForm.acronym = null
  ruleForm.parentId = null
  ruleForm.icon = ''
  formHeader.value = 'Add Programme'
  refreshParentOptions()

}


const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  id: null as number | null,
  title: '',
  description: '',
   icon: null as string | null,
   acronym: null as string | null,
   parentId: null as number | null

})

const runProgrammeValidation = () => {
  return validateProgramme(ruleForm, allProgrammes.value, {
    excludeId: ruleForm.id,
  })
}

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
  refreshParentOptions()
  AddDialogVisible.value = true
}


const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (!valid) {
      console.log('error submit!', fields)
      return
    }

    const validationError = runProgrammeValidation()
    if (validationError) {
      ElMessage.error(validationError)
      return
    }

    var exists = await checkIfRouteExists(ruleForm.title)

    if (exists) {
      ElMessage.error('A route with same name exists. Try a different Name')
      return
    }

    try {
      ruleForm.model = model
      ruleForm.code = uuid.v4()
      await CreateRecord(ruleForm)
      ElMessage.success('Programme saved')
      AddDialogVisible.value = false
      getInterventionsAll()
    } catch (error: any) {
      ElMessage.error(error?.message || error || 'Failed to save programme')
    }
  })
}


const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (!valid) {
      console.log('error submit!', fields)
      return
    }

    const validationError = runProgrammeValidation()
    if (validationError) {
      ElMessage.error(validationError)
      return
    }

    try {
      ruleForm.model = model
      await updateOneRecord(ruleForm)
      ElMessage.success('Programme updated')
      AddDialogVisible.value = false
      getInterventionsAll()
    } catch (error: any) {
      ElMessage.error(error?.message || error || 'Failed to update programme')
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



const programmeRules = reactive<FormRules>({
  title: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],

  acronym: [
    { required: true, message: 'Required', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/,
      message: 'Use letters, numbers, or hyphens only (valid URL segment)',
      trigger: 'blur',
    },
  ],


  description: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],

  icon: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],

 


})

</script>

<template>
 <el-card >


<el-row type="flex" justify="start" gutter="10" style="display: flex; flex-wrap: nowrap; align-items: center;">

  <div class="max-w-200px">
    <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
      Back
    </el-button>
  </div>

  <!-- Title Search -->
  <el-select
v-model="value3" :onChange="handleSelectIndicator" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Search Programme">
        <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
 

  <!-- Action Buttons -->
  <div style="display: flex; align-items: center; gap: 10px; margin-left: 10px;">
    <PermissionWrapper :permissions="['programme:create']">
      <el-tooltip content="Add Programme" placement="top">
        <el-button :onClick="AddIndicator" type="primary" :icon="Plus" />
      </el-tooltip>
    </PermissionWrapper>
    <PermissionWrapper :permissions="['programme:read']">
       <DownloadCustom
            :data="programmeExportData" :model="model"
            :associated_models="associated_multiple_models"
                      :total="programmeExportData.length"
                      :filters="filters"
                      :filter-values="filterValues"
/>
                  <el-button :onClick="handleClear" type="primary" :icon="Filter" />
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
ref="tableRef"
v-loading="loading"
:data="programmeTableData"
:tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
row-key="id"
default-expand-all
class="programmes-tree-table settings-table"
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
        :min-width="columnMinWidth('title')"
        sortable="custom"
        show-overflow-tooltip
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
        v-if="isColumnVisible('icon')"
        column-key="icon"
        label="Icon"
        prop="icon"
        :width="columnWidth('icon')"
        :min-width="columnMinWidth('icon')"
        sortable="custom"
      >
        <template #default="{ row }">
          <div class="programmes-table-icon">
            <span v-if="row.icon" class="programmes-table-icon-preview">
              <Icon :icon="row.icon" :size="18" color="#475569" />
            </span>
            <span class="programmes-table-icon-name">{{ row.icon || '—' }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column
        fixed="right"
        label=""
        width="68"
        align="center"
        class-name="programmes-ops-column"
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

    <div class="programmes-table-summary">
      {{ programmeExportData.length }} programme(s) · {{ programmeRootCount }} top-level
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
    class="programme-form-dialog"
  >
    <el-form ref="ruleFormRef"  :model="ruleForm" :rules="programmeRules" label-width="120px">
      <el-form-item label="Title" prop="title">
        <el-input v-model="ruleForm.title" />
      </el-form-item>

      <el-form-item label="Parent" prop="parentId">
 
        <el-select
            v-model="ruleForm.parentId"
            placeholder="Select Parent Programme"
            filterable
            clearable
          >
            <el-option
              v-for="option in parentOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <p class="field-hint">Optional. Parent and child cannot share the same title or acronym — that breaks route paths.</p>
      </el-form-item>
      <el-form-item label="Acronym" prop="acronym">
        <el-input v-model="ruleForm.acronym" placeholder="e.g. kisip" />
        <p class="field-hint">Lowercased for URL paths under /subprogrammes. Must be unique among siblings.</p>
      </el-form-item>

      <el-form-item label="Description"  prop="description">
        <el-input v-model="ruleForm.description" />
      </el-form-item>
    
      <el-form-item label="Icon" prop="icon" class="icon-picker-form-field">
        <ElementPlusIconPickerField v-model="ruleForm.icon" />
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
.programmes-table-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.programmes-table-icon-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

.programmes-table-icon-name {
  min-width: 0;
  word-break: break-word;
}

.icon-picker-form-field :deep(.icon-picker-panel) {
  width: 100%;
}

.field-hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.programmes-tree-table :deep(.el-table__row--level-1 .el-table__cell:first-child) {
  font-weight: 500;
}

.programmes-table-summary {
  margin-top: 10px;
  font-size: 13px;
  color: #606266;
}

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

.programmes-tree-table :deep(.programmes-ops-column .cell) {
  padding-left: 4px;
  padding-right: 4px;
}
</style>
