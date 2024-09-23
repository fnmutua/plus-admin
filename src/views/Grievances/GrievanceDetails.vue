<script setup lang="ts">
import { onMounted,computed } from 'vue'
import { ElButton,ElTimeline,ElTimelineItem,ElCol,ElRow , ElForm,ElFormItem,ElInput,ElUpload,ElMessage,
  ElCard,ElTabs,ElTabPane,ElTable,ElTableColumn,ElTooltip,ElDialog
} from 'element-plus'
// Locally
import { getOneGrievance } from '@/api/grievance'
import { uploadGrievanceDocuments,logGrievanceAction,getActionFile } from '@/api/grievance'
import { uuid } from 'vue-uuid'


import { Icon } from '@iconify/vue';
import type { UploadUserFile } from 'element-plus'
import {
  UploadFilled,
} from '@element-plus/icons-vue'

import { getFile } from '@/api/summary'




import {   ref } from 'vue'

import '@dafcoe/vue-collapsible-panel/dist/vue-collapsible-panel.css'
import { useRoute } from 'vue-router'
import {  Back} from '@element-plus/icons-vue'
 
import { useRouter } from 'vue-router'



const activeName = ref('details')
const action = ref('')
// Resolve, Escalate, Documentation 
 
const route = useRoute()

const Grievance =ref(
{
  'code' :null,
  'complainant' :null,
  'telephone' :null,
  'county' :null,
  'settlement' :null,
  'nature' :null,
  'is_GBV' :null,
  'description' :null,
  'status' :null,
  'plea' :null,
  'date_reported' :null
}
)



const GrievanceDocuments =ref( [])
 
const GrievanceLogs =ref( [])
 
//// ------------------parameters -----------------------////
 
//const associated_Model = ''
const associated_multiple_models = [ 'county', 'settlement','grievance_resolution_level', 'grievance_document',  {
      "name": "grievance_log",
      "nestedAssociations": ["users","grievance_document"]
    }]
 
const formattedLabels = {}
const formatLabel = async (key) => {
  // Convert key to string and replace underscores with spaces
  let formattedKey = String(key).replace(/_/g, ' ');

  // Convert formattedKey to proper case
  formattedKey = formattedKey.replace(/\b\w/g, char => char.toUpperCase());

  console.log('formattedKey',formattedKey)
  return formattedKey;
};


function formatSentence(text) {
  

  // Replace underscores with spaces
  let formattedText = String(text).replace(/_/g, ' ');

  // Capitalize the first letter
  formattedText = formattedText.charAt(0).toUpperCase() + formattedText.slice(1);

  // Ensure proper punctuation and spacing
  // This is a basic example; you might need more complex rules based on requirements
  formattedText = formattedText.replace(/(\.\s*)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());

  return formattedText;
}


 
onMounted( async () => {
  const id = route.params.id 
  const formData = {} 
  formData.associated_multiple_models = associated_multiple_models
  formData.id = id

const res  =await getOneGrievance(formData)


 

 // Get the Details of the Grievance
 Grievance.value.id = id 
 Grievance.value.code = res.data.code
 Grievance.value.complainant = res.data.name
 Grievance.value.telephone = res.data.phone
 Grievance.value.county = res.data.county.name
 Grievance.value.settlement = res.data.settlement.name
 Grievance.value.nature = res.data.nature
 Grievance.value.is_GBV = res.data.isgbv
 Grievance.value.description = res.data.description
 Grievance.value.status = res.data.status
Grievance.value.date_reported = res.data.date_reported
 Grievance.value.plea = res.data.plea

 console.log("Grievance",Grievance.value)

  if(res.data.status=='Escalated'){
    action.value='Escalated'
  }
  else if (res.data.status=='Resolved')  {
    action.value=='Resolve'
  }



 for (const key in  Grievance.value) {
      formattedLabels[key] = await formatLabel(key);
    }

console.log('formattedLabels.value',formattedLabels)
 // Get the Greivance Documents 

 GrievanceDocuments.value=res.data.grievance_documents
 GrievanceLogs.value=res.data.grievance_logs


 console.log( 'Grievance.value', Grievance.value)
 console.log( 'GrievanceDocuments.value', GrievanceDocuments.value)
 console.log( 'GrievanceLogs.value', GrievanceLogs.value)

 
})


// Computed property to transform grievance object into an array for el-table
const grievanceData = computed(() => {
  return Object.keys(Grievance.value).map(key => ({
    label: formatSentence(key),
    value: formatSentence(Grievance.value[key])
  }));
});


const sortedGrievanceLogs = computed(() => {
      return GrievanceLogs.value.slice().sort((a, b) => new Date(b.date_actioned) - new Date(a.date_actioned));
    });



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
 

const form = ref({
  grievance_id:  null,
  action_type:  null,
  action_by:  null,
  date_actioned:  null,
  prev_status:  null,
  new_status:  null,
});

 


const dialogFormVisible =ref(false)
const handlePreview = (file) => {
  console.log('Preview:', file);
};

const handleRemove = (file, fileList) => {
  console.log('Remove:', file, fileList);
};

const beforeRemove = (file) => {
  return true;
};

const handleExceed = (files, fileList) => {
  ElMessage.warning('You can only upload up to 3 files.');
};


const fileList = ref<UploadUserFile[]>([
 
])


const rules = ({
  
  action: [{ required: true, message: 'Action is required', trigger: 'blur' }],
 
 
  })

const dynamicFormRef = ref<FormInstance>()

const submitResolutionForm = async () => { 
 const formInstance = dynamicFormRef

 formInstance.value.validate( async (valid: boolean) => {
   if (valid) {  
     form.value.grievance_id=Grievance.value.id
     form.value.action_type='Resolved'
     form.value.action_by=1  // remember t change 
     form.value.date_actioned=new Date();
     form.value.prev_status=Grievance.value.status
     form.value.new_status= 'Resolved'
   
  const res =  await logGrievanceAction(form.value)

  console.log('res-->',res.data)

  await uploadFiles(res.data.id,Grievance.value.id)

console.log("Log Successful", res)

     ElMessage({
       message: res.message,
       type: 'success'
     })    

    
   } else {
     console.log('is Not Valid')
     ElMessage({
       message: 'Invalid Form',
       type: 'error'
     })    // felix - show message on success request 

   }
 });


};


const uploadFiles = async (action_id, grievance_id) => { 
  const formData = new FormData();

// Assuming `fileList` is an array of file objects and `grievance_id` is defined
for (var i = 0; i < fileList.value.length; i++) {
  console.log('------>file', fileList.value[i]); 
  formData.append('files', fileList.value[i].raw);
  formData.append('format', fileList.value[i].name.split('.').pop());
  formData.append('grievance_id', grievance_id);
  formData.append('action_id', action_id);
  formData.append('protected_file', true);
  formData.append('size', (fileList.value[i].raw.size / 1024 / 1024).toFixed(2));
  formData.append('code', uuid.v4());
}

// Printing out the contents of formData
for (let [key, value] of formData.entries()) {
  console.log(`${key}: ${value}`);
}

const res =  await uploadGrievanceDocuments(formData)

console.log("Docuemnts Uploaded", res)
 



}

const viewLoading =ref(false)

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
    const response = await getActionFile(formData);
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
    <!-- Header Section -->
    <template #header>
      <div class="card-header">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>

        {{Grievance.code}} : {{Grievance.complainant}}
      </div>
    </template>

    <el-tabs
    v-model="activeName"
    type="border-card"
    class="demo-tabs"
    
  >
    <el-tab-pane label="Grievance Details" name="details">
      
      <el-card> 
          <el-table :data="grievanceData" style="width: 100%" size="small">
            <el-table-column
              prop="label"
              label=""
              width="150"
            >
              <template #default="{ row }">
                <span style="font-weight: bold">{{ row.label }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="value"
              label=""
            />
          </el-table>

          <template #footer>
            <div class="dialog-footer">
              <el-tooltip content="Close the grievance if all issues have been resolved and complainant satisfied" placement="top">
                <el-button type="success"  @click="dialogFormVisible = true">  <Icon icon="typcn:tick" /> Mark As Resolved</el-button>
              </el-tooltip>

              <el-tooltip content="Escalate to the next level" placement="top">
                <el-button type="primary"  @click="dialogFormVisible = false">   <Icon icon="system-uicons:forward" />Escalate</el-button>
 

              </el-tooltip>


              <el-tooltip content="Send the grievance to the county for resolution" placement="top">
                <el-button type="warning"  @click="dialogFormVisible = false">  <Icon icon="system-uicons:backward" /> Refer to County</el-button>
              </el-tooltip>

              <el-tooltip content="Dismiss as a frivilous grievance" placement="top">
                <el-button type="danger"  @click="dialogFormVisible = false">   <Icon icon="ic:outline-cancel" /> Dismiss</el-button>
              </el-tooltip>

             
            </div>
          </template>
        </el-card>


    </el-tab-pane>
    <el-tab-pane label="Supporting Documentation" name="documents">
        <el-card>
          

            <el-table :data="GrievanceDocuments" style="width: 100%">

              <el-table-column type="index" width="50" />
               <el-table-column prop="name" label="Name"  />
              <el-table-column prop="createdAt" label="Uploaded"   />
         
              <el-table-column fixed="right" label="" >
                <template  #default="scope">
                  <el-button 
                        type="primary" 
                        @click="downloadFile(scope.row)" 
                      >
                        <Icon icon="fa-solid:download" style="  margin-right: 5px;" />
                        Download
                      </el-button>

 
                 </template>
              </el-table-column>
            </el-table>



          </el-card>

    </el-tab-pane>
    <el-tab-pane label="Action Logs" name="timeline">
      
     <el-timeline style="max-width: 100%;">
      <el-timeline-item 
        v-for="(log, index) in sortedGrievanceLogs" 
        :key="index" 
        placement="top"
        :timestamp="log.date_actioned" 
        timestamp-class="timestamp-class" 
      >
        <el-card  class="custom-card"   shadow="hover" :class="log.action_type  == 'Resolved' ? 'success-background' : log.action_type  == 'Escalated' ? 'warning-background' : 'info-background'">

          
          <el-row align="middle" :gutter="20">
            <!-- Icon in the first 1/4 of the card -->
            <el-col  :xs="24" :sm="24" :md="24" :lg="2"  >
              <Icon v-if="log.action_type  == 'Resolved'" icon="fluent-mdl2:completed-solid" width="60" />
              <Icon  v-if="log.action_type  == 'Escalated'"  icon="streamline:dangerous-zone-sign-solid" width="60" />
              <Icon  v-if="log.action_type  == 'Created'" icon="fluent-mdl2:report-warning" width="60" />
            </el-col>
            
            <el-col  :xs="24" :sm="24" :md="14" :lg="14" :xl="14" :gutter="10">
              <p class="action-header">{{log.action_type}} </p>
              <p class="action-body">{{ log.action ? log.action : 'None' }}</p>
              <p class="action-footer">By: {{ log.user ? log.user.name : 'System' }}</p>
            </el-col>

            <el-col  :xs="24" :sm="24" :md="6" :lg="6" :xl="6">
              <p class="action-header">Documentation </p>

              <p v-for="(doc, docIndex) in log.grievance_documents" :key="docIndex">
               
                <el-button  @click="downloadFile(doc)"   link type="primary" size="small" :icon="Download">{{ doc.name }}</el-button>

            </p>
            </el-col>
            
          </el-row>
        </el-card>
      </el-timeline-item>

      
  </el-timeline>

    </el-tab-pane>

 
   </el-tabs>
  </el-card>

 
  <el-dialog
    title="Grievance Resolution"
    v-model="dialogFormVisible"
    width="60%" 
  >
  <el-form :model="form" label-width="auto"  ref="dynamicFormRef" :rules="rules">
    <el-form-item label="Action Taken" label-position="top">
      <el-input type="textarea"  :rows="4"  placeholder="Provide details of the resolution  here" v-model="form.action" />
    </el-form-item>

    <el-upload
      id="btn20" 
      class="upload-demo"
      action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
      multiple
      :on-preview="handlePreview"
      :on-remove="handleRemove"
      :before-remove="beforeRemove"
      :limit="3"
      v-model:file-list="fileList"
      :auto-upload="false"
      :on-exceed="handleExceed"
     >
       <el-button type="primary" :icon="UploadFilled">Upload Documentation e.g minutes</el-button>

      <template #tip>
        <div class="el-upload__tip">pdf/jpg/png files with a size less than 500KB.</div>
      </template>
    </el-upload>


    </el-form>

   
      <div  style="display: flex; justify-content: end; align-items: center; margin-top: 20px;"> 
          <el-button @click="dialogFormVisible = false">Cancel</el-button>
          <el-button type="primary" @click="submitResolutionForm"  >Submit</el-button>
     </div>
  </el-dialog>




  

</template>
<style scoped>
/* Custom styling for details container */
.details-container {
  margin-top: 20px;
}

/* Custom styling for each detail item */
.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  padding: 5px;
  border-bottom: 1px solid #eee;
}

/* Label styling */
.label-text {
  font-weight: bold;
  color: #333;
  
  width: 10%; /* Adjust as needed */
}

/* Value styling */
.value {
  width: 90%; /* Adjust as needed */
 
}

/* Ensure spacing between rows */
.el-row {
  margin-top: 20px;
}

.card-header {
  display: flex;
 
 
  font-weight: bold;
  font-size: 1.2rem;
  color: #333;
}

/* Custom styling for documents container */
.documents-container {
  margin-top: 20px;
}

.documents-container ul {
  list-style-type: none;
  padding: 0;
}

.documents-container li {
  margin-bottom: 10px;
}
</style>
<style scoped>
.action-col {
  padding: 10px;
}

.action-header {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1px;
  color: #333;
}

.action-body {
  font-size: 1rem;
  font-weight: 200;
  color: #666;
}

.action-footer {
  font-size: 1rem;
  font-weight: 300;
  color: #2e0dc2;
}

.success-background {
  background-color: rgba(226, 248, 231, 0.4); /* Light green with 80% opacity */
  color: #1bd847; /* Dark green text */
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #c3e6cb; /* Border color */

}

.warning-background {
  background-color: rgba(255, 243, 205, 0.4); /* Light yellow with 80% opacity */
  color: #856404; /* Dark yellow text */
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ffeeba; /* Border color */
}

.info-background {
  background-color: rgba(204, 229, 255, 0.4); /* Light blue with 80% opacity */
  color: #004085; /* Dark blue text */
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #b8daff; /* Border color */
}
.custom-card {
    padding: 5px;  /* Reduce padding */
    margin: 5px 0; /* Adjust margin as needed */
    min-height: 10px; /* Set a minimum height if needed */
}

.timestamp-class {
    font-weight: bold; /* Example: Make it bold */
    color: #6c757d; /* Example: Set color */
    font-size: 14px; /* Example: Adjust font size */
    /* Add any additional styles as needed */
}


</style>


 