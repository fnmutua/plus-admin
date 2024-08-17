<script setup lang="ts">
import { ElRow, ElCol, ElSkeleton, ElCard, ElDivider, ElMessage, ElLink,ElTable,ElTableColumn, ElTabs, ElTabPane, ElTimeline,ElTimelineItem } from 'element-plus'
import { useI18n } from '@/hooks/web/useI18n'
import { ref, reactive } from 'vue'
import { CountTo } from '@/components/CountTo'
import { EChartsOption } from 'echarts'
import { radarOption } from './echarts-data'
import {
  getCountApi,
  getProjectApi,
  getDynamicApi,
  getTeamApi,
  getRadarApi
} from '@/api/dashboard/workplace'
import type { WorkplaceTotal, Project, Dynamic, Team } from '@/api/dashboard/workplace/types'
import { set } from 'lodash-es'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { activateUserApi, updateByUserApi, getUserListApi, setUserFeedback, getMyProfile } from '@/api/users'
import { getSummarybyField, getSummarybyFieldNested, getSummarybyFieldFromInclude, getSummarybyFieldSimple } from '@/api/summary'
import { getSettlementListByCounty, getHHsByCounty, uploadFilesBatch } from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { useRouter } from 'vue-router'
import { MoreFilled,More, Plus, Edit, Delete, Lock } from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue';

const loading = ref(true)


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()



const userInfo = wsCache.get(appStore.getUserInfo)
const userDetails = ref()



// 获取统计数
let totalSate = reactive<WorkplaceTotal>({
  project: 0,
  access: 0,
  todo: 0
})

const getCount = async () => {
  const res = await getCountApi().catch(() => { })
  if (res) {
    totalSate = Object.assign(totalSate, res.data)
  }
}


const profile = reactive({
  id: '',
  name: '',
  avatar: '',
  county: '',
  email: '',
  status: '',
  username: '',
  phone: null,
  county_id: '',
  photo: null,
  roles: [],
  date: null

})


const projects = ref(0)
const settlements = ref(0)
const settlements_list = ref(0)
const documents = ref(0)


const getProject = async () => {
  const formData = {}
  formData.model = 'project'
  formData.summaryFunction = 'count'
  formData.summaryField = 'createdBy'
  formData.summaryFieldValue = userInfo.id

  // Directbeneficisaries 
  await getSummarybyFieldSimple(formData)
    .then(response => {
      var results = response.Total
      console.log('Count New newAccounts..........', results[0].count)
      projects.value = results[0].count
    });

}


const getSettlementsCount = async () => {
  const formData = {}
  formData.model = 'settlement'
  formData.summaryFunction = 'count'
  formData.summaryField = 'createdBy'
  formData.summaryFieldValue = userInfo.id

  // Directbeneficisaries 
  await getSummarybyFieldSimple(formData)
    .then(response => {
      var results = response.Total
      console.log('Count New newAccounts..........', results[0].count)
      settlements.value = results[0].count
    });

}


const getDocumentsCount = async () => {
  const formData = {}
  formData.model = 'document'
  formData.summaryFunction = 'count'
  formData.summaryField = 'createdBy'
  formData.summaryFieldValue = userInfo.id

  // Directbeneficisaries 
  await getSummarybyFieldSimple(formData)
    .then(response => {
      var results = response.Total
      console.log('Count New newAccounts..........', results[0].count)
      documents.value = results[0].count
    });

}



function getInitials(name) {
  const words = name.split(' ');
  const initials = words.map(word => word.charAt(0).toUpperCase());
  return initials.join('');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const greeting =ref('Good Morning')
function getTimeOfDayGreeting() {
    const now = new Date();
    const hours = now.getHours();

    if (hours >= 5 && hours < 12) {
      greeting.value= 'Good Morning';
    } else if (hours >= 12 && hours < 17) {
      greeting.value = 'Good Afternoon';
    } else if (hours >= 17 && hours < 21) {
      greeting.value= 'Good Evening';
    } else {
      greeting.value= 'Good Night';
    }
}


const initials = ref()
const getFilteredData = async () => {
  const formData = {}

  formData.model = 'users'
  formData.id = userInfo.id


  //-------------------------
  //console.log(formData)
  const res = await getMyProfile(formData)

  console.log('getMyProfile', res.data)
  userDetails.value = res.data
  profile.name = res.data.name
  profile.username = res.data.username
  profile.avatar = res.data.avatar
  profile.email = res.data.email
  profile.county = res.data.county_id
  profile.id = res.data.id
  profile.county_id = res.data.county_id
  profile.roles = res.data.roles
  profile.phone = res.data.phone
  profile.photo = res.data.photo
  profile.date = formatDate(res.data.createdAt)

  initials.value = getInitials(res.data.name)
  console.log(userDetails)

  getLogs()

}


const getMySettlements= async () => {
  const formData = {}

  formData.limit =  5
  formData.page = 1
  formData.curUser =  userInfo.id // Id for logged in user
  formData.model = 'settlement'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = '' 
  // - multiple filters -------------------------------------
  formData.filters =  ['createdBy']
  formData.filterValues =  [[userInfo.id]]
  formData.associated_multiple_models = ['county']
 
  //-------------------------
  console.log(formData)
  const res = await getSettlementListByCounty(formData)
  //const res = await getListWithoutGeo(formData)

  console.log(res.data)
  settlements_list.value = res.data
}

 
function timeSince(date) {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now - past) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `${interval} year${interval !== 1 ? 's' : ''} ago`;

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `${interval} month${interval !== 1 ? 's' : ''} ago`;

  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval} day${interval !== 1 ? 's' : ''} ago`;

  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval} hour${interval !== 1 ? 's' : ''} ago`;

  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval} minute${interval !== 1 ? 's' : ''} ago`;

  return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
}



const myProjects =ref()
const getMyProjects= async () => {
  const formData = {}

  formData.limit =  5
  formData.page = 1
  formData.curUser =  userInfo.id // Id for logged in user
  formData.model = 'project'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = '' 
  // - multiple filters -------------------------------------
  formData.filters =  ['createdBy']
  formData.filterValues =  [[userInfo.id]]
  formData.associated_multiple_models = []
 
  //-------------------------
  console.log(formData)
  const res = await getSettlementListByCounty(formData)
  //const res = await getListWithoutGeo(formData)

  console.log('project', res.data)
  myProjects.value = res.data
}



const { push } = useRouter()
const viewOnMap = (data: TableSlotDefault) => {
  console.log('On map.....', data.row)
  if (data.row.geom) {
    push({
      path: '/settlement/map/:id',
      name: 'SettlementMap',
      params: { id: data.row.id }
    })
  } else {
    // var msg = 'This Settlement does not have the boundary defined in the database!'
    // open(msg)
    ElMessage({
      message: 'This Settlement does not have the boundary defined in the database!',
      type: 'warning',
    })
    //    ElMessage("No Shapes")
  }
}

const handleImageClick = (profile) => {
  console.log('On map.....', )
 
    push({
       name: 'userProfile',
    })
 
}





const recentActivities = [];
const getLogs = async () => {

  console.log('proifle: ', profile.username)
  let username = profile.username
 

  const formData = {}
  formData.limit = 4
  formData.page = 1
  formData.curUser = 1 // Id for logged in user
  formData.model = 'logs'
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------


  // - multiple filters -------------------------------------
  formData.filters = ['userName']
  formData.filterValues = [[ username]]
  formData.associated_multiple_models = []

  //-------------------------
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)
   var result = res.data 
    

   // Apply the timeSince function to each settlement
 

    
 result.forEach(item => {
  // Create a new object based on the existing one
  console.log('item',item)
  const newItem = {
    content: item.action + ' ' +  item.status,
    timestamp:  timeSince(item.date) , 
    size: 'large',
    type: 'primary',
    // icon: item.action.includes('Delete')
    //       ? Delete
    //     : item.action.includes('Edit')
    //       ? Edit
    //     : item.action.includes('Create')
    //       ? Plus
    //     : item.action.includes('Login')
    //       ? Lock
    //     : More ,

    color: item.status.toLowerCase() == 'successful' ? '#0bbd87' : 'red'
  };

  // Push the new object to the newArray
  recentActivities.push(newItem);
});

      console.log('After Querry', result)
     
}



const getAllApi = async () => {
  await Promise.all([ getCount(), getProject(), getFilteredData(), getDocumentsCount(), getSettlementsCount(),getMySettlements(),getTimeOfDayGreeting(),getMyProjects() ])
  loading.value = false

}


// Example usage:
 
  // Output will vary depending on the current date and time


getAllApi()
 

const activeTab=ref('Settlements')

</script>

<template>
  <div>
    <ElCard shadow="always">
      <ElSkeleton :loading="loading" animated>
        <ElRow :gutter="20" justify="space-between">
          <ElCol :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
            <div class="flex items-center">
             
                <el-button
                  v-if="profile.photo"
                  type="text"
                  class="w-70px h-70px rounded-[50%] mr-20px"
                  @click="handleImageClick (profile)"
                >
                  <img
                    :src="profile.photo"
                    alt="User Profile Image"
                    class="w-70px h-70px rounded-[50%] cursor-pointer"
                  />
                </el-button>

              <div>
                <div class="text-20px text-700">
                  {{ greeting }}, <em>{{ profile.name }}</em>. Welcome back to KeSMIS.
                </div>
                <div class="mt-10px text-14px text-gray-500">
                  Member since : {{ profile.date }} | Email: {{ profile.email }} | Username: {{ profile.username }}
                </div>
              </div>
            </div>
          </ElCol>
          <ElCol :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
            <div class="flex h-70px items-center justify-end <sm:mt-20px">
              <div class="px-8px text-right">
                <div class="text-14px text-gray-400 mb-20px">Settlements created by me</div>
                 <CountTo class="text-20px font-bold" :start-val="0" :end-val="settlements" :duration="2600" />

              </div>
              <ElDivider direction="vertical" />
              <div class="px-8px text-right">
                <div class="text-14px text-gray-400 mb-20px"> Projects created by me</div>
                 <CountTo class="text-20px font-bold" :start-val="0" :end-val="projects" :duration="2600" />

              </div>
              <ElDivider direction="vertical" border-style="dashed" />
              <div class="px-8px text-right">
                <div class="text-14px text-gray-400 mb-20px">Documents uploaded by me</div>
                <CountTo class="text-20px font-bold" :start-val="0" :end-val="documents" :duration="2600" />
              </div>
            </div>
          </ElCol>
        </ElRow>
      </ElSkeleton>
    </ElCard>
    <el-divider content-position="left">My Recent Activity </el-divider>

    <ElRow class="mt-10px" :gutter="10" justify="space-between">

      <ElSkeleton :loading="loading" animated>

      <ElCol :xl="16" :lg="16" :md="24" :sm="24" :xs="24" class="mb-20px">

        <el-card>
          
              <div class="card-header">
                <el-tabs v-model="activeTab">
                  <el-tab-pane label="Settlements" name="Settlements"/>
                  <el-tab-pane label="Projects" name="Projects"/>
                 </el-tabs>
              </div>
        
            <div v-if="activeTab === 'Settlements'">
              
              <el-table :data="settlements_list" style="width: 100%">
                <el-table-column type="index" label="#" width="50" />
                <el-table-column prop="name" label="Name" width="180" />
                <el-table-column prop="county.name" label="County" />

                  <el-table-column label="">
                    <template #default="scope">

                      <el-button
                        v-if="scope.row.geom"
                        type="primary"
                        class="text-blue-500 hover:underline rounded-md flex items-center"
                        @click="viewOnMap(scope)"
                      >
                      <Icon icon="akar-icons:location" width="24" />
                        View on Map
                      </el-button>
                     


                  </template>

                  </el-table-column>
                </el-table>


            </div>
            <div v-if="activeTab === 'Projects'">
              <el-table :data="myProjects" style="width: 100%">
                <el-table-column  fixed type="index" label="#" width="50" />
                <el-table-column  prop="project_code" label="code"  width="200"  />
                <el-table-column   prop="title" label="Title" width="400"     />
                <el-table-column prop="status" label="Status"   />
                 
                 

                </el-table>           
               </div>
           
          </el-card>
      </ElCol>

      <ElCol :xl="8" :lg="8" :md="24" :sm="24" :xs="24" class="mb-20px">

        <el-card>
          
          <div class="card-header">
            <el-tabs >
              <el-tab-pane label="My Recent updates..." name="Activity"/>
      
            </el-tabs>
          </div>
    
        <div >
          <el-timeline style="max-width: 600px">
            <el-timeline-item
              v-for="(activity, index) in recentActivities"
              :key="index"
              :icon="activity.icon"
              :type="activity.type"
              :color="activity.color"
               size="large"
              :hollow="activity.hollow"
              :timestamp="activity.timestamp"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </div>
        
      </el-card>
      </ElCol>
      </ElSkeleton>
    </ElRow>

  </div>


</template>
