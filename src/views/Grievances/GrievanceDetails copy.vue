<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { onMounted,computed } from 'vue'
import { ElButton,ElTimeline,ElTimelineItem,ElCol,ElRow ,ElCard,ElTabs,ElTabpane} from 'element-plus'
// Locally
import { getOneGrievance } from '@/api/grievance'






import {   ref } from 'vue'
import {
  Iphone,
  Location,
  OfficeBuilding,
  Tickets,
  User,
} from '@element-plus/icons-vue'
import type { ComponentSize } from 'element-plus'

import '@dafcoe/vue-collapsible-panel/dist/vue-collapsible-panel.css'
import { useRoute } from 'vue-router'
import {  Back} from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue';

import { useRouter } from 'vue-router'


const size = ref<ComponentSize>('default')



 
const route = useRoute()

const thisGrievance =ref({})
const Grievance =ref(
{
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
      </div>
    </template>

    <!-- Tabs Layout -->
    <el-tabs >
      <!-- Details Tab -->
      <el-tab-pane label="Details">
        <el-card>
          <div class="card-header">
            Grievance Details
          </div>
          <div class="details-container">
            <!-- Loop through the properties of the Grievance object -->
            <div v-for="(value, key) in Grievance" :key="key" class="detail-item">
              <div class="label-text">
                {{ formatSentence(key) }}
              </div>
              <div class="value">
                <!-- Wrap the value in a div or other HTML element -->
                {{ formatSentence(value) }}
              </div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Documents Tab -->
      <el-tab-pane label="Documents">
        <el-card>
          <div class="card-header">
            Grievance Documents
          </div>
          <div class="documents-container">
            <ul>
              <li v-for="(doc, index) in GrievanceDocuments" :key="index">
                {{ doc.name }} - <a :href="doc.url" target="_blank">View Document</a>
              </li>
            </ul>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- Timeline Tab -->
      <el-tab-pane label="Timeline">
        <el-card>
          <h3>Timeline</h3>
          <el-timeline style="max-width: 100%">
            <el-timeline-item timestamp="2018/4/12" placement="top">
              <el-card>
                <el-row>
                  <!-- Icon in the first 1/4 of the card -->
                  <el-col :span="2">
                    <Icon icon="mdi:latest" width="48" />
                  </el-col>
                  <!-- Content in the remaining 3/4 of the card -->
                  <el-col :span="18">
                    <h4>Update Github template</h4>
                    <p>Tom committed 2018/4/12 20:46</p>
                  </el-col>
                </el-row>
              </el-card>
            </el-timeline-item>
            <el-timeline-item timestamp="2018/4/3" placement="top" :icon="Back">
              <el-card>
                <h4>Update Github template</h4>
                <p>Tom committed 2018/4/3 20:46</p>
              </el-card>
            </el-timeline-item>
            <el-timeline-item timestamp="2018/4/2" placement="top">
              <el-card>
                <h4>Update Github template</h4>
                <p>Tom committed 2018/4/2 20:46</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
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
  padding: 10px;
  border-bottom: 1px solid #eee;
}

/* Label styling */
.label-text {
  font-weight: bold;
  color: #333;
  width: 30%; /* Adjust as needed */
}

/* Value styling */
.value {
  width: 65%; /* Adjust as needed */
}

/* Ensure spacing between rows */
.el-row {
  margin-top: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
