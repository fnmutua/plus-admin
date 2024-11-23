<script setup lang="ts">


import {
  Plus, Filter, Download,
  Edit, UploadFilled,
  Position, Search,
  Delete
} from '@element-plus/icons-vue'

import { ref, reactive, computed, onMounted } from 'vue'
import {
  ElButton, ElCol, ElForm, ElFormItem, ElInput, ElLink, ElTooltip, ElDialog, ElMessage, ElUpload, ElPopover, ElSelect,
  ElRow, ElTable, ElTableColumn, ElCard, ElImage,
} from 'element-plus'
import { useRouter } from 'vue-router'
import { useCache } from '@/hooks/web/useCache'
import type { FormInstance, FormRules } from 'element-plus'

import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import { getFile } from '@/api/summary'


import { defineAsyncComponent, } from 'vue';
import { useAppStore } from '@/store/modules/app'

import {
  searchByKeyWord
} from '@/api/settlements'


import { uploadFilesBatch, uploadCoverPhoto, getSettlementListByCounty } from '@/api/settlements'

import { uuid } from 'vue-uuid'
import { CreateRecord, } from '@/api/settlements'


const { wsCache } = useCache()
const appStore = useAppStore()




const model = 'article'
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  model: 'article',
  title: null,
  description: null,
  url: null,
  code: null,
  cover_photo: null,
  date: null,

})





const rules = reactive<FormRules>({
  title: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],

  description: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],

  url: [
    { required: true, message: 'Required', trigger: 'blur' },
  ],
  cover_photo: [
    { required: true, message: 'Please upload a cover photo', trigger: 'blur' },
  ],
})




const userInfo = wsCache.get(appStore.getUserInfo)
const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)





const addMoreDocuments = ref(false)
const currentRow = ref()



/// Uplaod docuemnts from a central component 
const mfield = 'article_id'
const ChildComponent = defineAsyncComponent(() => import('@/views/Components/UploadComponent.vue'));
const dynamicComponent = ref();
const componentProps = ref({
  message: 'Hello from parent',
  showDialog: addMoreDocuments,
  data: currentRow.value,
  umodel: model,
  field: mfield
});







// component for docuemnts 
const rowData = ref()



const selOptions = ref([])
const tableDataList = ref([])






const mobileBreakpoint = 768;
const defaultPageSize = 10;
const mobilePageSize = 5;
const currentPage = ref(1);
const width = ref(1080);
const totalItems = ref(0)
const total = ref(0)


const pageSize = ref(defaultPageSize);

// Function to update pageSize based on window width
const updatePageSize = () => {
  if (window.innerWidth <= mobileBreakpoint) {
    pageSize.value = mobilePageSize;
  } else {
    pageSize.value = defaultPageSize;
  }
};

const loading = ref(false)
onMounted(() => {




  window.addEventListener('resize', updatePageSize);
  updatePageSize(); // Initial check




  loading.value = true


})

const handleRowDblClick = (row) => {

  console.log('Double clicked row:', row);


}






const selectedFiles = ref([false])



const handleFiles = (file, fileList) => {

  selectedFiles.value = fileList;

}


const page = ref(1)


const handlePageChange = (page) => {
  currentPage.value = page;
};


const handlePageSizeChange = (newSize) => {
  pageSize.value = newSize;
  currentPage.value = 1; // Reset to first page when changing page size
};



// Computed Property for Paginated Data
const paginatedData = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return tableDataList.value.slice(startIndex, endIndex);
});

const search_string = ref()



const filters = ref()
const filterValues = ref() // make sure the inner array is array





const handleClear = async () => {
  console.log('cleared....')

  search_string.value = ''
  getFilteredData(filters.value, filterValues.value)


}


const getFilteredData = async (selFilters, selfilterValues) => {

  loading.value = true
  const formData = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = ''

  // - multiple filters -------------------------------------
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = ''

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

  console.log('Reports collected........', res)

  // tableDataList.value = res.data.filter(item => item.indicator_category.indicator_level === 'activity');

  tableDataList.value = res.data
  loading.value = false

  //tableDataList.value = res.data
  totalItems.value = res.total


}


const getFilteredBySearchData = async (searchKey) => {


  console.log('search_string.value', search_string.value)
  const formData = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model

  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = searchKey
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = filters.value
  formData.filterValues = filterValues.value
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = []
  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------
  console.log(formData)
  const res = await searchByKeyWord(formData)
  searchLoading.value = false

  tableDataList.value = res.data




  total.value = res.total


  console.log('tableDataList.value', tableDataList.value)
  loading.value = false


}

const searchByNewName = async (filterString: any) => {

  getFilteredBySearchData(filterString)
}




const xsearchByNewName = async () => {

  console.log('searcjhinmg.....')
  if (search_string.value) {

    searchLoading.value = true
    getFilteredBySearchData(search_string.value)

  } else if (search_string.value == '' || !search_string.value) {
    searchLoading.value = false
    getFilteredData(filters.value, filterValues.value)

  }

}

const AddDialogVisible = ref(false)

const AddArticle = () => {
  AddDialogVisible.value = true

}

const searchLoading = ref()
const associated_multiple_models = ['document']


const coverPhoto = ref(null); // Store selected cover photo
const coverPhotoList = ref([]); // File list for cover photo upload

const handleCoverPhoto = (file) => {
  coverPhoto.value = file;
  coverPhotoList.value = [file]; // Limit to one cover photo

  console.log('coverPhotoList.value', coverPhoto.value)
  ruleForm.cover_photo = true
  return false; // Prevent auto-upload
};




const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = 'article'
      ruleForm.code = uuid.v4()
      ruleForm.userId = userInfo.id




      //Progress towards target (%realized) [(B-A)/(C- A)]

      const article = await CreateRecord(ruleForm)   // first save the form on DB
      console.log("Report", article.data.id)

      // Attach cover photo

      console.log('coverPhoto.value', coverPhoto.value)
      const CoverformData = new FormData()
      CoverformData.append('file', coverPhoto.value.raw);
      CoverformData.append('id', article.data.id)
      CoverformData.append('model', 'article')

      const CoverformDataRes = await uploadCoverPhoto(CoverformData)




      // uploading the documents 

      const formData = new FormData()
      for (var i = 0; i < selectedFiles.value.length; i++) {
        console.log('------>file', selectedFiles.value[i])
        var column = 'article_id'
        formData.append('files', selectedFiles.value[i].raw)
        formData.append('format', selectedFiles.value[i].name.split('.').pop())
        formData.append('field_id', 'article_id')
        formData.append('category', 1)
        formData.append(column, parseInt(article.data.id))
        formData.append('size', (selectedFiles.value[i].raw.size / 1024 / 1024).toFixed(2))
        formData.append('createdBy', userInfo.id)
        formData.append('protected', false)

        //   {"message":"Upload failed. The field report_id is required errors","code":"0000"}
      }


      formData.append('code', uuid.v4())
      const docs = await uploadFilesBatch(formData)






      AddDialogVisible.value = false


    } else {
      console.log('error submit!', fields)
    }
  })
}

getFilteredData(filters.value, filterValues.value)

const viewLoading = ref(false)
const downloadFile = async (data) => {
  console.log(data);
  viewLoading.value = true;
  const formData = {};
  formData.filename = data.name;
  formData.doc_id = data.id;
  formData.responseType = 'blob';

  // Add a flag to track if the download has started


  // Attach a 'beforeunload' event listener to the window
  window.addEventListener('beforeunload', () => {
    if (viewLoading.value) {
      console.log('Download has started.');
      viewLoading.value = false;
    }
  });

  try {
    const response = await getFile(formData);
    console.log(response);

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', data.name);
    document.body.appendChild(link);
    link.click();
    viewLoading.value = false;
  } catch (error) {
    ElMessage.error('Failed');
    viewLoading.value = false;
  }
};



</script>

<template>
  <el-card>
    <div>
      <upload-component :is="dynamicComponent" v-bind="componentProps" />
    </div>

    <el-row :gutter="10" style="margin-bottom:10px;">
      <el-col :xs="24" :sm="24" :md="20" :lg="20">
        <!-- <el-input v-model="search_string" clearable :onClear="handleClear"
          placeholder="Search an article by its title or part of it .." @change="searchByNewName" class="input-with-select"
          style="margin-right: 5px;">
          <template #append>
            <el-button v-loading="searchLoading" :icon="Search" :onClick="searchByNewName" />
          </template>
</el-input> -->

        <el-select v-model="search_string" multiple clearable filterable remote :remote-method="searchByNewName"  
          reserve-keyword  no-match-text='' placeholder="Search an article by its title or part of it ..." style=" margin-right: 5px;" />


      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="4">
        <div style="display: flex; align-items: center; gap: 10px; margin-right: 10px;">
          <el-tooltip content="Add Article" placement="top">
            <el-button v-if="showAdminButtons" :onClick="AddArticle" type="primary" :icon="Plus" />
          </el-tooltip>

          <el-tooltip content="Clear" placement="top">
            <el-button :onClick="handleClear" type="primary" :icon="Filter" />
          </el-tooltip>

          <DownloadCustom v-if="showEditButtons" :data="tableDataList" :model="model"
            :associated_models="associated_multiple_models" />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" justify="left">
      <el-col :span="8" xs="24" sm="12" md="8" v-for="article in tableDataList" :key="article.id">
        <el-card class="article-card" shadow="hover" style="height: 95%;">

          <template #header>
            <el-popover placement="top-start" width="30%" trigger="hover" :content="article.title">
              <template #reference>
                <h2 class="article-title">{{ article.title }}</h2>
              </template>
            </el-popover>



          </template>



          <div class="article-content" style="height: 100%;">
            <!-- Title -->


            <!-- Cover Photo -->
            <el-image v-if="article.cover_photo" :src="article.cover_photo" fit="cover"
              style="width: 100%; height: 150px;">
              <template #placeholder>
                <div class="image-placeholder">Loading...</div>
              </template>
              <template #error>
                <div class="image-error">Failed to load</div>
              </template>
            </el-image>

            <el-image v-else :src="'/placeholder.jpg'" fit="cover" style="width: 100%; height: 150px;" />


            <!-- Summary (Truncate if too long) -->
            <p class="article-summary"
              style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
              {{ article.description }}
            </p>

            <el-link :href="article.url" target="_blank">Read Full Story</el-link>

            <!-- Attachments Section -->
            <div v-if="article.documents.length" class="attachments">
              <h4>Attachments:</h4>
              <ul>
                <li v-for="(attachment, index) in article.documents" :key="index">
                  <el-button type="text" @click="downloadFile(attachment)">
                    {{ attachment.name }}
                  </el-button>
                </li>
              </ul>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </el-card>

  <el-dialog v-model="AddDialogVisible" title="Add Article" width="500">
    <el-form ref="ruleFormRef" :rules="rules" :model="ruleForm" label-position="top">
      <el-form-item label="Article Title" prop="title">
        <el-input v-model="ruleForm.title" />
      </el-form-item>



      <el-form-item label="Description" prop="description">
        <el-input type="textarea" v-model="ruleForm.description" />
      </el-form-item>


      <el-form-item label="Link" prop="url">
        <el-input v-model="ruleForm.url" />
      </el-form-item>

      <el-form-item label="Upload Cover Photo" prop="cover_photo">



        <el-upload v-model:file-list="coverPhotoList" class="upload-demo" action="" :auto-upload="false"
          :on-change="handleCoverPhoto">
          <el-button type="primary">Cover Photo</el-button>

        </el-upload>


      </el-form-item>


      <el-form-item label="Select/Drop newspaper cuttings and other files here or click to upload" style="width: 100%;">
        <el-upload v-model:file-list="fileList" class="upload-demo" action="" :auto-upload="false"
          :on-change="handleFiles">
          <el-button type="primary">Other Documents</el-button>

        </el-upload>


      </el-form-item>




    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="AddDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>

      </div>
    </template>
  </el-dialog>



</template>



<style scoped>
.upload-demo {
  width: 300px;
}

.template-link {
  text-decoration: underline;
  color: #409EFF;
  /* Optional: change link color */
}




.mt-4 {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .el-pagination {
    font-size: 12px;
    /* Adjust font size for small screens */
  }

  .el-pagination .el-pagination__sizes {
    display: none;
    /* Hide size selector on small screens */
  }

  .el-pagination .el-pagination__total {
    display: none;
    /* Hide total count on small screens */
  }



}
</style>



<style>
.el-table .danger-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
  --el-table-tr-text-color: var(--el-color-danger);
  color: var(--el-table-tr-text-color);
}

.el-table .success-row {
  --el-table-tr-text-color: var(--el-color-success);
  color: var(--el-table-tr-text-color);
}

.el-table .warning-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

.el-table .rejected-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
  --el-table-tr-text-color: var(--el-color-danger);
  color: var(--el-table-tr-text-color);
}

.el-table .referred-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
  --el-table-tr-text-color: var(--el-color-warning);
  color: var(--el-table-tr-text-color);
}

.el-table .escalated-row {
  --el-table-tr-bg-color: var(--el-color-secondary);
  --el-table-tr-text-color: var(--el-color-secondary);
  color: var(--el-table-tr-text-color);
}

.el-table .resolved-row {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
  --el-table-tr-text-color: var(--el-color-success);
  color: var(--el-table-tr-text-color);
}

.el-table .closed-row {
  --el-table-tr-bg-color: var(--el-color-info-light-9);
  --el-table-tr-text-color: var(--el-color-info);
  color: var(--el-table-tr-text-color);
}

.item {
  margin-top: 10px;
  margin-right: 40px;
}


.basemap {
  width: 100%;
  height: 65vh;
}
</style>

<style scoped>
.article-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
}

.article-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.article-title {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 1em;
}

.article-summary {
  margin-bottom: 1em;
}

.attachments {
  margin-top: 1em;
}

.image-placeholder,
.image-error {
  text-align: center;
  padding: 50px;
  font-size: 1.2em;
}

.el-card {
  height: 100%;
}



.article-title {
  font-size: 1em;
  font-weight: bold;
  margin-bottom: 1em;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  /* Truncate after 1 line */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>