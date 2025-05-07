 
<script setup lang="ts">
import { onMounted, ref, computed ,onUnmounted} from 'vue'
 
import { ElButton, ElDescriptions, ElDescriptionsItem, ElCard, ElMessage, ElEmpty } from 'element-plus'
import { getOneGrievance,getOnePublicGrievance, getTimelineReport } from '@/api/grievance'
import { useRoute, useRouter } from 'vue-router'
import { Download, ArrowRight, Back } from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'
import { useAppStore } from '@/store/modules/app'

const appStore = useAppStore()
const route = useRoute()
const router = useRouter()
const { push } = useRouter()
const isMobile = computed(() => appStore.getMobile)

const grievance = ref({
  id: null,
  code: null,
  complainant: null,
  telephone: null,
  county: null,
  settlement: null,
  nature: null,
  is_GBV: null,
  description: null,
  status: null,
  plea: null,
  date_reported: null,
  last_action: null as string | null,
})

const fullGrievanceData = ref()
const grievanceLogs = ref([])
const grievanceFound = ref(true)

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

const formatSentence = (text: string | null) => {
  if (!text) return 'N/A'
  let formattedText = String(text).replace(/_/g, ' ')
  formattedText = formattedText.charAt(0).toUpperCase() + formattedText.slice(1)
  return formattedText
}

const fetchGrievance = async () => {
  try {
    const id = route.params.id
    const formData = {
      id,
      associated_multiple_models: ['county', 'settlement', 'grievance_document', 'grievance_notification', {
        name: 'grievance_log',
        nestedAssociations: ['users', 'grievance_document'],
      }],
    }
    const res = await getOnePublicGrievance(formData)

    console.log(res.data)
    if (!res.data || !res.data.code) {
      grievanceFound.value = false
      return
    }
    fullGrievanceData.value = res.data
    grievance.value = {
      id,
      code: res.data.code,
      complainant: res.data.name,
      telephone: res.data.phone?.substring(0, 6) + '******' || 'N/A',
      county: res.data.county?.name || 'N/A',
      settlement: res.data.settlement?.name || 'N/A',
      nature: res.data.nature,
      is_GBV: res.data.isgbv ? 'Yes' : 'No',
      description: res.data.description,
      status: res.data.status,
      plea: res.data.plea,
      date_reported: formatDate(res.data.date_reported),
      last_action: null,
    }
    grievanceLogs.value = res.data.grievance_logs || []

    // Compute last action
    if (grievanceLogs.value.length > 0) {
      const lastLog = grievanceLogs.value.sort((a, b) => new Date(b.date_actioned) - new Date(a.date_actioned))[0]
      const actionType = formatSentence(lastLog.action_type)
      const actionDate = formatDate(lastLog.date_actioned)
      const officerName = lastLog.user?.name || 'Unknown Officer'
      grievance.value.last_action = `${actionType} on ${actionDate} by ${officerName}`
    } else {
      grievance.value.last_action = 'N/A'
    }
  } catch (error) {
    grievanceFound.value = false
    ElMessage.error('Failed to fetch grievance details')
    console.error(error)
  }
}

const sortedGrievanceLogs = computed(() => {
  return grievanceLogs.value
    .map(log => ({
      ...log,
      action_type: log.action_type === 'Escalated'
        ? log.current_level === 'county'
          ? 'Escalated to county team for resolution'
          : log.current_level === 'national'
            ? 'Escalated to National team for resolution'
            : log.action_type
        : log.action_type === 'Returned'
          ? log.current_level === 'county'
            ? 'Returned to county team for review'
            : log.current_level === 'settlement'
              ? 'Returned to settlement GRC team for review'
              : log.action_type
          : log.action_type,
    }))
    .sort((a, b) => new Date(b.date_actioned) - new Date(a.date_actioned))
})

const handleDownload = async () => {
  try {
    const logEvents = sortedGrievanceLogs.value.map(log => ({
      date: log.date_actioned,
      settlement: log.action_type,
      event: log.action_type,
      description: (log.action || 'N/A') + (log.user?.name ? ' By: ' + log.user.name : ''),
    }))
    const formData = {
      grievance_id: fullGrievanceData.value.id,
      grievance_code: fullGrievanceData.value.code,
      type: 'timeline',
      status: fullGrievanceData.value.status,
      details: fullGrievanceData.value.description,
      events: logEvents,
      responseType: 'blob',
    }
    const response = await getTimelineReport(formData)
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${fullGrievanceData.value.code}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    ElMessage.error('Failed to download PDF')
    console.error('Failed to download PDF', error)
  }
}

 

const handleForward = () => {
  const targetPath = `/grm/${grievance.value.id}`

  push(targetPath).catch(() => {
    push({
      path: '/login',
      query: { redirect: targetPath }
    })
  })
}





const goBack = () => {
  router.back()
}

//onMounted(fetchGrievance)

const columns = ref(1)
const descriptionDirection = ref('horizontal')

const updateColumns = () => {
  columns.value =  window.innerWidth >= 640 ? 2 : 1
  descriptionDirection.value = window.innerWidth >= 640 ? 'horizontal'  :  'vertical'
}

onMounted(() => {
  fetchGrievance()
  updateColumns()
  window.addEventListener('resize', updateColumns)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateColumns)
})


</script>

 <template>
<div class="  bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 px-4 sm:px-6 overflow-y-auto">
    <Transition name="fade">
      <el-card class="container mx-auto my-6 sm:my-8 p-4 sm:p-6 max-w-full sm:max-w-4xl">
        <template #header>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div class="flex items-center space-x-4">
              <img src="/gok.png" alt="Plus Admin Logo" class="w-10 h-10 sm:w-12 sm:h-12" />
              <h2 v-if="grievanceFound" class="text-xl sm:text-2xl font-bold">
                {{ grievance.code }}: {{ grievance.complainant }}
              </h2>
              <h2 v-else class="text-xl sm:text-2xl font-bold">
                Grievance Not Found
              </h2>
            </div>
            <el-button type="primary" plain :icon="Back" @click="goBack" class="w-full sm:w-auto">
              Back
            </el-button>
          </div>
        </template>

        <div v-if="grievanceFound">
          <el-descriptions
            title="Grievance Details"
            :column="2"
             border
             :direction="descriptionDirection"

            class="mt-6"
          >
            <el-descriptions-item label="Code">
              {{ grievance.code || 'N/A' }}
            </el-descriptions-item>
            <el-descriptions-item label="Complainant">
              {{ formatSentence(grievance.complainant) }}
            </el-descriptions-item>
            <el-descriptions-item label="Telephone">
              {{ grievance.telephone || 'N/A' }}
            </el-descriptions-item>
            <el-descriptions-item label="County">
              {{ formatSentence(grievance.county) }}
            </el-descriptions-item>
            <el-descriptions-item label="Settlement">
              {{ formatSentence(grievance.settlement) }}
            </el-descriptions-item>
            <el-descriptions-item label="Nature">
              {{ formatSentence(grievance.nature) }}
            </el-descriptions-item>
            <el-descriptions-item label="Gender-Based Violence">
              {{ grievance.is_GBV }}
            </el-descriptions-item>
            <el-descriptions-item label="Status">
              {{ formatSentence(grievance.status) }}
            </el-descriptions-item>
            <el-descriptions-item label="Description" :span="2">
              {{ grievance.description || 'N/A' }}
            </el-descriptions-item>
            <el-descriptions-item label="Plea" :span="2">
              {{ grievance.plea || 'N/A' }}
            </el-descriptions-item>
            <el-descriptions-item label="Date Reported">
              {{ grievance.date_reported }}
            </el-descriptions-item>
            <el-descriptions-item label="Last Action" :span="2">
              {{ grievance.last_action || 'N/A' }}
            </el-descriptions-item>

            <el-descriptions-item label="Action" :span="2">
              <div v-if="isMobile" class="flex space-x-2">
                <el-button  type="primary"
                  plain
                  :icon="Download"
                  @click="handleDownload"
                  class="w-full sm:w-auto" > 
                  Download
                </el-button>
                <el-button type="success"
                  plain
                  :icon="ArrowRight"
                  @click="handleForward"
                  class="w-full sm:w-auto"> 
                  
                  Review  
                </el-button>
                
              </div>
              <div v-else class="flex space-x-2">
                <el-button
                  type="primary"
                  plain
                  :icon="Download"
                  @click="handleDownload"
                  class="w-full sm:w-auto"
                >
                  Download Timeline
                </el-button>
                <el-button
                  type="success"
                  plain
                  :icon="ArrowRight"
                  @click="handleForward"
                  class="w-full sm:w-auto"
                >
                  Review Grievance
                </el-button>
              </div>
            </el-descriptions-item>



          </el-descriptions>

  

        </div>

        <el-empty
          v-else
          description="The grievance you're looking for doesn't exist or is unavailable."
          class="mt-6"
        >
          <el-button type="primary" plain :icon="Back" @click="goBack">
            Go Back
          </el-button>
        </el-empty>
      </el-card>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.el-descriptions :deep(.el-descriptions__header) {
  @apply text-2xl font-semibold mb-4 text-gray-900 dark:text-white;
}

.el-descriptions :deep(.el-descriptions__body) {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md;
}

.el-descriptions :deep(.el-descriptions__label) {
  @apply font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700;
}

.el-descriptions :deep(.el-descriptions__content) {
  @apply text-gray-900 dark:text-white;
}

.el-empty {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-gray-900 dark:text-white;
}

@media (max-width: 640px) {
  .el-descriptions {
    @apply block;
  }
  .el-descriptions :deep(.el-descriptions__body) {
    @apply flex flex-col;
  }
  .el-descriptions :deep(.el-descriptions__label),
  .el-descriptions :deep(.el-descriptions__content) {
    @apply w-full;
  }
}


.el-descriptions :deep(.el-descriptions__body) {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md;
}

@media (max-width: 640px) {
  .el-descriptions :deep(.el-descriptions__body) {
    max-height: 60vh; /* or whatever fits your layout */
    overflow-y: auto;
    padding: 1rem;
  }
}



</style>
 