<script setup lang="ts">
import { ref, computed,onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElCard, ElButton, ElMessage,ElDialog } from 'element-plus'
import { Back, Plus } from '@element-plus/icons-vue'
import SettlementMap from '@/views/Components/SettlementMap.vue'
import { useCache } from '@/hooks/web/useCache'
import { useAppStore } from '@/store/modules/app'
import PermissionWrapper from '@/components/PermissionWrapper.vue'
import { getOneSettlement } from '@/api/settlements'
import { buildSettlementEditQuery } from '@/utils/settlementEditNavigation'

const appStore = useAppStore()
const { wsCache } = useCache()
const userInfo = wsCache.get(appStore.getUserInfo)
const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)

const route = useRoute()
const router = useRouter()
const title = ref('')
const countyId = ref<number | null>(null)
const subcountyId = ref<number | null>(null)
const wardId = ref<number | null>(null)

// Get settlement ID from route params
const settlementId = computed(() => route.params.id as string)

onMounted(async () => {
  console.log('settlementId >>', settlementId.value)

  const model = 'settlement'
  const form = {}
  form.model = model
  form.id = settlementId.value
  const res = await getOneSettlement(form)
  console.log('res >>', res)
  title.value = res.data.name
  countyId.value = res.data.county_id || res.data.county?.id || null
  subcountyId.value = res.data.subcounty_id || res.data.subcounty?.id || null
  wardId.value = res.data.ward_id || res.data.ward?.id || null

})


const goBack = () => {
  router.go(-1)
}

const editSettlement = () => {
  router.push({
    name: 'AddSettlementNew',
    query: buildSettlementEditQuery({
      id: settlementId.value,
      county_id: countyId.value,
      subcounty_id: subcountyId.value,
      ward_id: wardId.value,
    }),
  })
}

const addFacility = () => {
  router.push({
    name: 'AddFacility',
    query: {
      county_id: countyId.value || '',
      settlement_id: settlementId.value || ''
    }
  })
}



 
</script>

<template>
  <ElCard class="box-card">
    <template #header>
      <div class="card-header">
        <ElButton type="primary" plain :icon="Back" @click="goBack">Back</ElButton>
        <h1 style="font-weight: 700;">{{ title  + ' Settlement' }} Map</h1>
        <div>
          <ElButton 
            v-if="showAdminButtons || showEditButtons" 
            type="primary" 
            :icon="Plus" 
            @click="addFacility"
            style="margin-right: 8px;"
          >
            Add Facility
          </ElButton>
          <PermissionWrapper :permissions="['settlement:edit', 'settlement:update']">
            <ElButton v-if="showAdminButtons || showEditButtons" type="success" @click="editSettlement">
              <Icon :size="20" icon="uil:edit" />
          </ElButton>
          </PermissionWrapper>
        </div>
      </div>
    </template>

    <div class="map-wrapper">
      <SettlementMap :settlement-id="settlementId" />
        </div>
  </ElCard>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #333;
}

.card-header h1 {
  font-weight: 700;
  margin: 0;
}

.map-wrapper {
  height: 75vh;
  width: 100%;
  min-height: 400px;
}

/* Dark mode styles */
.dark .card-header {
  color: #e0e0e0;
}
</style>