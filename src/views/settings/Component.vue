<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ElButton, ElSelect } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Back,
  Filter,
} from '@element-plus/icons-vue'

import { ref, reactive, computed } from 'vue'
import { ElTooltip, ElOption, ElCard, ElDialog, ElForm, ElFormItem, ElInput, FormRules, ElTable, ElTableColumn } from 'element-plus'
import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import TableActions from '@/views/Components/TableActions.vue';
import AdjustableTableColumnPicker from '@/components/Users/AdjustableTableColumnPicker.vue';
import { useAdjustableTableColumns } from '@/composables/useAdjustableTableColumns';
import { componentTableColumnDefaults } from '@/config/settings/programmeTableColumns';
import ElementPlusIconPickerField from '@/components/ElementPlusIconPickerField.vue'
import PermissionWrapper from '@/components/PermissionWrapper.vue'
import {
  buildProgrammeSelectOptions,
  buildComponentTableRows,
  filterComponentTableRows,
  type ComponentRecord,
  type ComponentTableRow,
} from '@/utils/programmeComponentTree'
import {
  type ProgrammeRecord,
} from '@/utils/programmeValidation'

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
} = useAdjustableTableColumns('settingsComponentTableColumns', componentTableColumnDefaults)


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)

// We  ndeed to get all routes so that 
// we check againt new routes i.e new dashbaords 
const router = useRouter();
const allRoutes = router.getRoutes();
console.log('All Routes:', allRoutes);
 

 




const { push } = useRouter()
const searchQuery = ref('')
const loading = ref(true)

const showAdminButtons =  ref(appStore.getAdminButtons)

let tableDataList = ref<ComponentRecord[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
const associated_multiple_models = ['programme']
const model = 'component'

const AddDialogVisible = ref(false)
const formHeader = ref('Add Component')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)

const handleClearSearch = () => {
  searchQuery.value = ''
}

const allProgrammes = ref<ProgrammeRecord[]>([])
const allComponents = ref<ComponentRecord[]>([])
const programmeFilterOptions = ref<{ value: number; label: string }[]>([])

const loadComponentsData = async () => {
  loading.value = true
  try {
    const [programmeRes, componentRes] = await Promise.all([
      getCountyListApi({
        params: {
          limit: 10000,
          curUser: 1,
          model: 'programme',
          searchField: 'title',
          searchKeyword: '',
          sort: 'ASC',
        },
      }),
      getListWithoutGeo({
        params: {
          limit: 10000,
          curUser: 1,
          model: 'component',
          searchField: 'title',
          searchKeyword: '',
          sort: 'ASC',
          associated_multiple_models: 'programme',
        },
      }),
    ])

    const programmes = ((programmeRes as { data: any[] }).data || []).map(
      ({ children: _c, parent: _p, ...rest }) => rest
    )
    const components = ((componentRes as { data: any[] }).data || []).map(
      ({ children: _c, parent: _p, ...rest }) => rest
    ) as ComponentRecord[]

    allProgrammes.value = programmes
    allComponents.value = components
    programmeFilterOptions.value = buildProgrammeSelectOptions(programmes)
    programmeOptions.value = programmeFilterOptions.value
    tableDataList.value = components
  } finally {
    loading.value = false
  }
}

const getInterventionsAll = async () => {
  await loadComponentsData()
}

const componentTableData = computed(() => {
  const rows = buildComponentTableRows(allProgrammes.value, allComponents.value)
  return filterComponentTableRows(rows, searchQuery.value)
})

const componentExportData = computed(() => componentTableData.value)



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



/** Legacy intervention modules filter projects by domain_id; default for new components. */
const DEFAULT_COMPONENT_DOMAIN_ID = 2

const programmeOptions = ref<{ value: number; label: string }[]>([])

const ensureDomainId = () => {
  if (ruleForm.domain_id != null && ruleForm.domain_id !== '') {
    return
  }
  ruleForm.domain_id = DEFAULT_COMPONENT_DOMAIN_ID
}

const editIndicator = (row: ComponentTableRow) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
  ruleForm.id = row.id
  ruleForm.title = row.title
  ruleForm.domain_id = row.domain_id ?? ''
  ruleForm.programme_id = row.programme_id ?? ''
  ruleForm.acronym = row.acronym ?? ''
  ruleForm.icon = row.icon ?? ''
  formHeader.value = 'Edit Component'
  AddDialogVisible.value = true
}

const DeleteIndicator = async (row: ComponentTableRow) => {
  try {
    await DeleteRecord({ id: row.id, model })
    ElMessage.success('Component deleted')
    getInterventionsAll()
  } catch (error: any) {
    ElMessage.error(error?.message || error || 'Failed to delete component')
  }
}

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  id: null as number | null,
  title: '',
  programme_id: '',
  domain_id: '',
  acronym: '',
  icon: '',
})

const handleClose = () => {
  showSubmitBtn.value = true
  showEditSaveButton.value = false
  ruleForm.id = null
  ruleForm.title = ''
  ruleForm.programme_id = ''
  ruleForm.domain_id = ''
  ruleForm.acronym = ''
  ruleForm.icon = ''
  formHeader.value = 'Add Component'
}




const rules = reactive<FormRules>({
  title: [
    { required: true, message: 'Please provide A title', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  programme_id: [
    { required: true, message: 'Please select a programme', trigger: 'blur' },
  ],
  icon: [
    { required: true, message: 'Please select an icon', trigger: 'change' },
  ],
})

const AddComponent = () => {
  AddDialogVisible.value = true
}


const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (!valid) {
      console.log('error submit!', fields)
      return
    }

    var exists = await checkIfRouteExists(ruleForm.title)
    if (exists) {
      ElMessage.error('A route with same name exists. Try a different Name')
      return
    }

    try {
      ensureDomainId()
      ruleForm.model = model
      ruleForm.code = uuid.v4()
      await CreateRecord(ruleForm)
      ElMessage.success('Component saved')
      AddDialogVisible.value = false
      getInterventionsAll()
    } catch (error: any) {
      ElMessage.error(error?.message || error || 'Failed to save component')
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

    try {
      ensureDomainId()
      ruleForm.model = model
      await updateOneRecord(ruleForm)
      ElMessage.success('Component updated')
      AddDialogVisible.value = false
      getInterventionsAll()
    } catch (error: any) {
      ElMessage.error(error?.message || error || 'Failed to update component')
    }
  })
}

getInterventionsAll()


 
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

<!-- Search -->
<el-input
  v-model="searchQuery"
  clearable
  placeholder="Search Component"
  class="components-search-input"
  @clear="handleClearSearch"
/>

<!-- Action Buttons -->
<div style="display: flex; align-items: center; gap: 10px; margin-left: 10px;">
    <PermissionWrapper :permissions="['component:create']">
      <el-tooltip content="Add Component" placement="top">
        <el-button :onClick="AddComponent" type="primary" :icon="Plus" />
      </el-tooltip>
    </PermissionWrapper>
    <PermissionWrapper :permissions="['component:read']">
       <DownloadCustom
            :data="componentExportData" :model="model"
            :associated_models="associated_multiple_models"
                      :total="componentTableData.length"
                      :filters="filters"
                      :filter-values="filterValues"
/>
                  <el-button :onClick="handleClearSearch" type="primary" :icon="Filter" />
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
      :data="componentTableData"
      row-key="id"
      class="components-flat-table settings-table"
      table-layout="auto"
      style="width: 100%; margin-top: 10px;"
      border
      show-overflow-tooltip
      @header-dragend="onHeaderDragend"
    >
      <el-table-column
        v-if="isColumnVisible('path')"
        column-key="path"
        label="Path"
        prop="pathLabel"
        :min-width="columnMinWidth('path')"
        sortable
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span class="components-path">{{ row.pathLabel }}</span>
        </template>
      </el-table-column>

      <el-table-column
        v-if="isColumnVisible('title')"
        column-key="title"
        label="Component"
        prop="title"
        :width="columnWidth('title')"
        :min-width="columnMinWidth('title')"
        sortable
        show-overflow-tooltip
      />

      <el-table-column
        v-if="isColumnVisible('acronym')"
        column-key="acronym"
        label="Acronym"
        prop="acronym"
        :width="columnWidth('acronym')"
        :min-width="columnMinWidth('acronym')"
        sortable
        show-overflow-tooltip
      />

      <el-table-column
        fixed="right"
        label=""
        width="68"
        align="center"
        class-name="components-ops-column"
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

    <div class="components-table-summary">
      {{ componentTableData.length }} component(s)<span v-if="searchQuery.trim()"> matching "{{ searchQuery.trim() }}"</span>
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
    class="component-form-dialog"
  >
    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px">
      <el-form-item label="Title">

        <el-tooltip content="The title that will appear on your side navigation"  class="gray-tooltip" placement="top">
          <el-input v-model="ruleForm.title" />
          </el-tooltip>


      </el-form-item>

      <el-form-item label="Acronym">
        <el-tooltip content="short text that will be appended on the url for navigating to this component" class="gray-tooltip"  placement="top">
          <el-input v-model="ruleForm.acronym" />
          </el-tooltip>

      </el-form-item>

      <el-form-item label="Programme" prop="programme_id">
        <el-select v-model="ruleForm.programme_id" filterable placeholder="Select">
          <el-option v-for="item in programmeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
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
.components-path {
  color: #475569;
  font-size: 13px;
}

.components-search-input {
  flex: 1;
  min-width: 0;
}

.components-table-summary {
  margin-top: 10px;
  font-size: 13px;
  color: #606266;
}

.icon-picker-form-field :deep(.icon-picker-panel) {
  width: 100%;
}

.settings-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.components-flat-table {
  width: 100%;
}

.settings-table-row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

.components-flat-table :deep(.components-ops-column .cell) {
  padding-left: 4px;
  padding-right: 4px;
}

.components-flat-table :deep(.el-table__cell) {
  padding-top: 8px;
  padding-bottom: 8px;
}
</style>

<style>
.gray-tooltip .el-tooltip__popper {
  background-color: gray;
}
</style>