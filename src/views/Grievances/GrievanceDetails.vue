<script setup lang="ts">
import { onMounted,computed } from 'vue'
import { ElButton,ElTimeline,ElTimelineItem,ElCol,ElRow ,  
  ElCard,ElTabs,ElTabPane,ElTable,ElTableColumn,ElRadioButton,ElRadioGroup,ElTooltip,
} from 'element-plus'
// Locally
import { getOneGrievance } from '@/api/grievance'
import { Icon } from '@iconify/vue';






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
      "nestedAssociations": ["users"]
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
                <el-button type="success"  @click="dialogFormVisible = false">  <Icon icon="typcn:tick" /> Mark As Resolved</el-button>
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
                <template #default>
                  <el-button 
                   
                        type="primary" 
                     
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
      
      <el-timeline style="max-width: 50%">
          <el-timeline-item 
            v-for="(log, index) in sortedGrievanceLogs" 
            :key="index" 
            :timestamp="log.date_actioned" 
            placement="top" 
           >
            <el-card>
              <el-row>
                <!-- Icon in the first 1/4 of the card -->
                <el-col :span="4">
                  <Icon v-if="log.action_type=='Resolved'" icon="flat-color-icons:ok" width="48" />
                  <Icon v-if="log.action_type=='Escalated'" icon="solar:square-forward-bold"  style="color: orange"   width="48"/>
                  <Icon v-if="log.action_type=='Created'" icon="zondicons:add-solid" width="48"  style="color: gray"  />
                </el-col>
                <!-- Content in the remaining 3/4 of the card -->
                <el-col :span="20">
                  <h4>{{ log.action_type }}</h4>
                  <p>By - {{ log.user ? log.user.name : Grievance.complainant }}</p>
                </el-col>
              </el-row>
            </el-card>
          </el-timeline-item>
        </el-timeline>


    </el-tab-pane>
   </el-tabs>
  </el-card>
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
