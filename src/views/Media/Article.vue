<script setup lang="ts">


import {
  Plus, Filter,
  Edit, ArrowLeft, ArrowRight,
  InfoFilled,
  Delete
} from '@element-plus/icons-vue'

import { ref, reactive, computed, onMounted } from 'vue'
import {
  ElButton, ElCol, ElForm, ElFormItem, ElInput, ElLink, ElTooltip, ElDialog, ElMessage, ElUpload, ElPopover,
  ElRow, ElCard, ElImage, ElStep, ElSteps, ElOption, ElTour, ElTourStep, ElIcon,
} from 'element-plus'
import { useCache } from '@/hooks/web/useCache'
import type { FormInstance } from 'element-plus'

import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import { getFile } from '@/api/summary'


import { useAppStoreWithOut } from '@/store/modules/app'

import {
  searchByKeyWord
} from '@/api/settlements'


import { uploadFilesBatch, getSettlementListByCounty } from '@/api/settlements'

import { uuid } from 'vue-uuid'
import { CreateRecord, updateOneRecord, DeleteRecord } from '@/api/settlements'
import { ElSelect } from 'element-plus';


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()

const userInfo = wsCache.get(appStore.getUserInfo)

const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)




const model = 'article'
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  model: 'article',
  title: null,
  type: null,
  description: null,
  url: null,
  code: null,
  cover_photo: null,
  date: null,

})












const addMoreDocuments = ref(false)
const currentRow = ref()



/// Uplaod docuemnts from a central component 
const mfield = 'article_id'
const dynamicComponent = ref();
const componentProps = ref({
  message: 'Hello from parent',
  showDialog: addMoreDocuments,
  data: currentRow.value,
  umodel: model,
  field: mfield
});







// component for docuemnts 



const tableDataList = ref([])






const mobileBreakpoint = 768;
const defaultPageSize = 10;
const mobilePageSize = 5;
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







const selectedFiles = ref([])


const handleFiles = (file, fileList) => {
  // Ensure selectedFiles is initialized as an empty array if it is undefined
  if (!selectedFiles.value) {
    selectedFiles.value = [];
  }

  // Push the new file to the selectedFiles array
  selectedFiles.value.push(file);

  // Optionally, you can log or handle the fileList if needed
  console.log('fileList', fileList);
}



const page = ref(1)







// Computed Property for Paginated Data

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



  tableDataList.value.forEach(async (article) => {
    await fetchCoverPhoto(article); // Fetch the cover photo asynchronously for each article
  });





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




const AddDialogVisible = ref(false)

const AddArticle = () => {
  AddDialogVisible.value = true

}

const searchLoading = ref()
const associated_multiple_models = ['document']


const coverPhoto = ref(null); // Store selected cover photo
const coverPhotoList = ref([]); // File list for cover photo upload
const fileList = ref([]); // File list for cover photo upload

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

      // console.log('coverPhoto.value', coverPhoto.value)
      // const CoverformData = new FormData()
      // CoverformData.append('file', coverPhoto.value.raw);
      // CoverformData.append('id', article.data.id)
      // CoverformData.append('model', 'article')

      // const CoverformDataRes = await uploadCoverPhoto(CoverformData)




      // uploading Cover Photo 
      const CoverformData = new FormData()
      for (var i = 0; i < coverPhotoList.value.length; i++) {
        console.log('------>file', coverPhotoList.value[i])
        var column = 'article_id'
        CoverformData.append('files', coverPhotoList.value[i].raw)
        CoverformData.append('format', coverPhotoList.value[i].name.split('.').pop())
        CoverformData.append('field_id', 'article_id')
        CoverformData.append('category', 52)
        CoverformData.append(column, parseInt(article.data.id))
        CoverformData.append('size', (coverPhotoList.value[i].raw.size / 1024 / 1024).toFixed(2))
        CoverformData.append('createdBy', userInfo.id)
        CoverformData.append('protected', false)

      }

      CoverformData.append('code', uuid.v4())
      const coverPhotRes = await uploadFilesBatch(CoverformData)
      console.log(coverPhotRes, coverPhotRes)



      // uploading Other  the documents 
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

      }

      formData.append('code', uuid.v4())







      AddDialogVisible.value = false


    } else {
      console.log('error submit!', fields)
    }
  })
}


const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = model
      ruleForm.model = 'article'
      updateOneRecord(ruleForm)

      // dialogFormVisible.value = false


      // Uploading Cover Photo
      const CoverformData = new FormData();

      // Check if `coverPhotoList.value` contains files
      if (coverPhotoList.value && coverPhotoList.value.length > 0) {
        for (let i = 0; i < coverPhotoList.value.length; i++) {
          const file = coverPhotoList.value[i];

          // Ensure the file is valid before appending to FormData
          if (file && file.raw) {
            console.log('------> coverPhotoList', file);

            const column = 'article_id';
            CoverformData.append('files', file.raw);
            CoverformData.append('format', file.name.split('.').pop());
            CoverformData.append('field_id', 'article_id');
            CoverformData.append('category', 52);
            CoverformData.append(column, parseInt(ruleForm.id));
            CoverformData.append('size', (file.raw.size / 1024 / 1024).toFixed(2)); // Size in MB
            CoverformData.append('createdBy', userInfo.id);
            CoverformData.append('protected', false);
          }
        }
      } else {
        console.log('No cover photo to upload.');
      }


      CoverformData.append('code', uuid.v4())
      const coverPhotRes = uploadFilesBatch(CoverformData)
      console.log(coverPhotRes, coverPhotRes)



      // Attach cover photo


      // uploading the documents 
      console.log('------> other file', selectedFiles.value);

      const formData = new FormData();

      // Check if `selectedFiles.value` contains files
      if (selectedFiles.value && selectedFiles.value.length > 0) {
        for (let i = 0; i < selectedFiles.value.length; i++) {
          const file = selectedFiles.value[i];

          // Ensure the file has the `raw` property
          if (file && file.raw) {
            console.log('------> processing file', file);

            const column = 'article_id';
            formData.append('files', file.raw);
            formData.append('format', file.name.split('.').pop());
            formData.append('field_id', 'article_id');
            formData.append('category', 1);
            formData.append(column, parseInt(ruleForm.id)); // Assuming `ruleForm.id` exists
            formData.append('size', (file.raw.size / 1024 / 1024).toFixed(2)); // Size in MB
            formData.append('createdBy', userInfo.id);
            formData.append('protected', false);
          }
        }
      } else {
        console.log('No files selected.');
      }

      // Append a unique identifier for the batch
      formData.append('code', uuid.v4());

      // Call the file upload function and handle the response
      try {
        const otherPhotRes = uploadFilesBatch(formData); // Ensure `uploadFilesBatch` is async if needed
        console.log('otherPhotRes', otherPhotRes);
      } catch (error) {
        console.error('Upload failed', error);
      }




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



const formHeader = ref("Add Article")
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)

const editStory = (data: TableSlotDefault) => {

  showSubmitBtn.value = false
  showEditSaveButton.value = true


  console.log(data)
  ruleForm.id = data.id
  ruleForm.title = data.title
  ruleForm.type = data.type
  ruleForm.description = data.description
  ruleForm.url = data.url
  ruleForm.code = data.code
  ruleForm.cover_photo = !!data.documents.find(doc => doc.category === 52 && (doc.cover_photo = true));


  coverPhotoList.value = data.documents.filter(doc => doc.category === 52);
  fileList.value = data.documents.filter(doc => doc.category !== 52);


  formHeader.value = 'Edit Story'


  AddDialogVisible.value = true
}


const onclose = () => {

  console.log('On close.......')
  showSubmitBtn.value = true
  showEditSaveButton.value = false
  AddDialogVisible.value = false


}


const deleteAttachment = async (data: TableSlotDefault) => {
  console.log('----->', data.id);

  // Prepare form data for deletion
  let formData = {
    id: data.id,
    model: 'document'
  };

  try {
    // Call the DeleteRecord function to delete the record
    await DeleteRecord(formData);

    // Filter out the deleted document from coverPhotoList
    coverPhotoList.value = coverPhotoList.value.filter(doc => doc.id !== data.id);
    fileList.value = fileList.value.filter(doc => doc.id !== data.id);

    // Optionally, re-filter or fetch data
    getFilteredData(filters, filterValues);
  } catch (error) {
    console.error('Error deleting attachment:', error);
  }
};




const handleCloseDialog = () => {
  AddDialogVisible.value = false
}



const active = ref(0);



const validationRules = ({
  // Validation rules for each step
  step1: {
    title: [{ required: true, message: 'Name is required', trigger: 'blur' }],
    type: [{ required: true, message: 'Type is required', trigger: 'change' }],


  },

  step2: {
    description: [{ required: true, message: 'Description is required', trigger: 'blur' }],
    cover_photo: [{ required: true, message: 'Cover Photo is required', trigger: 'change' }],

  },



});



const currentStepRules = computed(() => {
  const stepRulesKey = `step${active.value + 1}`;
  console.log('stepRulesKey', stepRulesKey)
  return validationRules[stepRulesKey];
});


const next = async () => {


  const formInstance = ruleFormRef
  formInstance.value.validate((valid: boolean) => {
    if (valid) {
      console.log(formInstance)
      active.value++;
    }
  });


};


const prev = () => {
  active.value--;
};

const fetchCoverPhoto = async (article) => {
  const coverSrc = await getCover(article); // Assuming getCover returns the Base64 image
  article.coverSrc = coverSrc; // Assign the fetched cover photo to the article object
};



async function getCover(article) {
  const cover_photo = article.documents.find((doc) => doc.category === 52);

  if (!cover_photo) {
    console.error("Cover photo not found in category 52");
    return null;
  }

  const formData = {
    filename: cover_photo.name,
    doc_id: cover_photo.id,
    responseType: "blob",
  };

  try {
    const response = await getFile(formData); // Replace with your API call logic

    // Convert Blob to Base64
    const base64 = await blobToBase64(response.data);
    return base64; // Return the Base64 string to use as src
  } catch (error) {
    console.error("Failed to fetch the file:", error);
    ElMessage.error("Failed to fetch the cover photo.");
    return null;
  }
}

// Convert Blob to Base64 string
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob); // Read the blob as a Data URL (Base64)
  });
}


const isTourVisible = ref(false)



const tourSteps = ref([
  {
    step: 0,
    target: '#btn1',
    title: 'Article Title',
    content: 'Provide the title of the article. This is a required field.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn2',
    title: 'Type',
    content: 'Select the type of media from the dropdown options: TV, Article, Blog, or Newspaper.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn3',
    title: 'Link',
    content: 'Enter the URL link to the media article or publication.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn4',
    title: 'Description',
    content: 'Provide a detailed description of the grievance or media content.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn5',
    title: 'Upload Cover Photo',
    content: 'Upload a cover photo for the media. Accepted formats include image files.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn6',
    title: 'Other Documents',
    content: 'Upload any additional files, such as newspaper cuttings or related documents. Accepted formats include PDFs and images.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn9',
    title: 'Previous',
    content: 'Click to navigate back to the previous step.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn7',
    title: 'Next',
    content: 'Click to proceed to the next step.',
    visible: true,
  },

  {
    step: 1,
    target: '#btn10',
    title: 'Submit',
    content: 'Submit the form to finalize the  submission.',
    visible: true,
  },

  {
    step: 1,
    target: '#btn10',
    title: 'Save',
    content: 'Submit the form to save the  submission.',
    visible: true,
  },
]);



const showTour = () => {
  isTourVisible.value = true
}
const filteredTourSteps = computed(() => {

  const fil = tourSteps.value.filter(step => step.step == active.value && step.visible == true);
  console.log('filteredTourSteps', fil)
  return fil
});



</script>

<template>
  <el-card>
    <div>
      <upload-component :is="dynamicComponent" v-bind="componentProps" />
    </div>

    <el-row :gutter="10" style="margin-bottom:10px;">
      <el-col :xs="24" :sm="24" :md="20" :lg="20">
        <el-select
v-model="search_string" multiple clearable filterable remote :remote-method="searchByNewName"
          reserve-keyword no-match-text='' placeholder="Search an article by its title or part of it ..."
          style=" margin-right: 5px;" />


      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="4">
        <div style="display: flex; align-items: center; gap: 10px; margin-right: 10px;">
          <el-tooltip content="Add Article" placement="top">
            <el-button v-if="showAdminButtons" :onClick="AddArticle" type="primary" :icon="Plus" />
          </el-tooltip>

          <el-tooltip content="Clear" placement="top">
            <el-button :onClick="handleClear" type="primary" :icon="Filter" />
          </el-tooltip>

          <DownloadCustom
v-if="showEditButtons" :data="tableDataList" :model="model"
            :associated_models="associated_multiple_models"
                      :total="total"
                      :filters="filters"
                      :filter-values="filterValues"
/>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" justify="left">
      <el-col :span="8" xs="24" sm="12" md="8" v-for="article in tableDataList" :key="article.id">
        <el-card class="article-card" shadow="hover" style="height: 95%;">
          <template #header>
            <el-popover placement="bottom" width="30%" trigger="hover" :content="article.title">
              <template #reference>
                <h2 class="article-title">{{ article.title }}</h2>
              </template>
            </el-popover>
          </template>

          <div class="article-content" style="height: 100%;">
            <!-- Cover Photo -->
            <el-image v-if="article.coverSrc" :src="article.coverSrc" fit="cover" style="width: 100%; height: 150px;">
              <template #placeholder>
                <div class="image-placeholder">Loading...</div>
              </template>
              <template #error>
                <div class="image-error">Failed to load</div>
              </template>
            </el-image>

            <el-image v-else :src="'/placeholder.jpg'" fit="cover" style="width: 100%; height: 150px;" />

            <!-- Summary (Truncate if too long) -->
            <p
class="article-summary"
              style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
              {{ article.description }}
            </p>

            <!-- Actions -->
            <div
class="article-actions-row"
              style="display: flex; align-items: center; justify-content: space-between; margin-bottom:5px">
              <el-link :href="article.url" target="_blank">Read Full Story</el-link>
              <div>
                <el-tooltip content="Edit" placement="top">
                  <el-button
v-if="showAdminButtons" type="primary" size="small" @click="editStory(article)"
                    :icon="Edit" circle />
                </el-tooltip>
                <el-tooltip content="Delete" placement="top">
                  <el-button
v-if="showAdminButtons" type="danger" size="small" @click="deleteStory(article)"
                    :icon="Delete" circle />
                </el-tooltip>
              </div>
            </div>

            <!-- Attachments Section -->
            <div v-if="article.documents.length" class="attachments">
              <h4>Attachments:</h4>
              <ul>
                <li
v-for="(attachment, index) in article.documents.filter(doc => doc.category !== 52)" :key="index"
                  style="display: flex; align-items: center; justify-content: space-between;">
                  <el-button type="text" @click="downloadFile(attachment)">
                    {{ attachment.name }}
                  </el-button>

                  <el-tooltip content="Delete" placement="top">
                    <el-button v-if="showAdminButtons" type="text" :icon="Delete" @click="deleteAttachment(attachment)" />
                  </el-tooltip>
                </li>
              </ul>
            </div>

          </div>
        </el-card>
      </el-col>
    </el-row>

  </el-card>



  <el-dialog v-model="AddDialogVisible" @close="handleCloseDialog" title="Add Article" width="55%" draggable>

    <el-steps :active="active" finish-status="success">
      <el-step title="Details" />
      <el-step title="Media" />
    </el-steps>

    <el-form
ref="ruleFormRef" :model="ruleForm" :rules="currentStepRules" class="demo-form-inline"
      label-position="top">
      <el-card shadow="hover">
        <el-row v-if="active === 0" :gutter="10">
          <!-- Step 1: Personal Details -->
          <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">

            <el-form-item id="btn1" label="Article Title" prop="title">
              <el-input type="textarea" v-model="ruleForm.title" />
            </el-form-item>


            <el-form-item id="btn2" label="Type" prop="type">
              <el-select v-model="ruleForm.type" placeholder="Select" style="width:90%">
                <el-option label="TV" value="TV" />
                <el-option label="Article" value="Article" />
                <el-option label="Blog" value="Blog" />
                <el-option label="Newspaper" value="Newspaper" />
              </el-select>
            </el-form-item>

            <el-form-item id="btn3" label="Link" prop="url">
              <el-input v-model="ruleForm.url" />
            </el-form-item>



          </el-col>




        </el-row>



        <el-row v-if="active === 1" :gutter="10">
          <!-- Step 2: Grievance Details -->
          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item id="btn4" label="Description" prop="description">
              <el-input type="textarea" v-model="ruleForm.description" rows='5' />
            </el-form-item>




          </el-col>
          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">



            <el-form-item id="btn5" label="Upload Cover Photo" prop="cover_photo">
              <el-upload
v-model:file-list="coverPhotoList" class="upload-demo" action="" :auto-upload="false"
                :limit="1" accept="image/*" :on-change="handleCoverPhoto" :on-remove="deleteAttachment">
                <el-button type="primary">Upload Cover Photo</el-button>
              </el-upload>
            </el-form-item>





            <el-form-item
id="btn6" label="Select/Drop newspaper cuttings and other files here or click to upload"
              style="width: 100%;">
              <el-upload
v-model:file-list="fileList" class="upload-demo" action="" :auto-upload="false"
                :on-change="handleFiles" :on-remove="deleteAttachment">
                <el-button type="primary">Other Documents</el-button>

              </el-upload>


            </el-form-item>
          </el-col>


        </el-row>


      </el-card>
    </el-form>

    <template #footer>
      <div
class="steps-navigation"
        style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
        <div>
          <el-tooltip content="Help" placement="top">
            <el-button color="#626aef" type="info" @click="showTour" :icon="InfoFilled" plain />
          </el-tooltip>

          <el-button id="btn9" v-if="active > 0" @click="prev" type="primary" :icon="ArrowLeft">Previous </el-button>
        </div>
        <div>

          <el-button @click="onclose()">Cancel</el-button>


          <el-button id="btn7" v-if="active < 1" type="primary" @click="next">
            Next <el-icon class="el-icon--right">
              <ArrowRight />
            </el-icon>
          </el-button>



          <el-button
id="btn10" v-if="!showEditSaveButton" type="primary"
            @click="submitForm(ruleFormRef)">Submit</el-button>
          <el-button id="btn11" v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>


        </div>
      </div>
    </template>
  </el-dialog>


  <el-tour v-model="isTourVisible" :z-index="100000" :on-close="endTour">
    <el-tour-step
v-for="(step, index) in filteredTourSteps" :key="index" :target="step.target" :title="step.title"
      :description="step.content" />
  </el-tour>


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



.el-popper.is-customized {
  /* Set padding to ensure the height is 32px */
  padding: 6px 12px;
  background: linear-gradient(90deg, rgb(233, 12, 12), rgb(229, 174, 129));
}
</style>