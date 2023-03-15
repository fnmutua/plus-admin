<script setup lang="ts">
import { Descriptions } from '@/components/Descriptions'
import { useI18n } from '@/hooks/web/useI18n'
import { onMounted, ref, reactive, unref } from 'vue'
import { Form } from '@/components/Form'
import { ElFormItem, ElInput, ElButton } from 'element-plus'
import { useValidator } from '@/hooks/web/useValidator'
import { useForm } from '@/hooks/web/useForm'
import { useRoute } from 'vue-router'
import {
  getOneGeo,
  getOneSettlement,
  getSettlementListByCounty,
  getfilteredGeo
} from '@/api/settlements'

// Locally
import { VueCollapsiblePanelGroup, VueCollapsiblePanel } from '@dafcoe/vue-collapsible-panel'
import '@dafcoe/vue-collapsible-panel/dist/vue-collapsible-panel.css'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { activateUserApi, updateUserApi, getUserListApi, getMyProfile } from '@/api/users'



const { register, elFormRef } = useForm()

const route = useRoute()

const { t } = useI18n()



const schemaProfile = reactive<DescriptionsSchema[]>([
  {
    field: 'name',
    label: t('Name')
  },
  {
    field: 'email',
    label: t('Email')
  },
  {
    field: 'username',
    label: t('User Name')
  },
  {
    field: 'county',
    label: t('County')
  },

  {
    field: 'phone',
    label: t('Phone')
  },



])



const { wsCache } = useCache()
const appStore = useAppStoreWithOut()



const userInfo = wsCache.get(appStore.getUserInfo)





const page = ref(1)
const pSize = ref(5)
////Configurations //////////////

//// ------------------parameters -----------------------////
var filters = ['id']
const id = userInfo.id
const model = 'users'

//const associated_Model = ''
const associated_multiple_models = ['county']
var filterValues = [id]

//// ------------------parameters -----------------------////

let settlement = reactive({
  count: 0,
  name: 'unnwo',
  flag: false
})
////////////

const profile = reactive({
  name: '',
  county: '',
  email: '',
  status: '',
  username: '',
  phone: '',

})




const userDetails = ref()
const userName = ref('')
const avatar = ref('')
const email = ref('')

const getFilteredData = async () => {
  const formData = {}

  formData.model = model
  formData.id = 1


  //-------------------------
  //console.log(formData)
  const res = await getMyProfile(formData)

  console.log('getMyProfile', res)
  userDetails.value = res.data[0]
  profile.name = res.data[0].name
  profile.username = res.data[0].username
  profile.avatar = res.data[0].avatar
  profile.email = res.data[0].email
  profile.county = res.data[0].county_id
  profile.phone = res.data[0].phone
  avatar.value = res.data[0].avatar

  console.log(userDetails)

}


onMounted(() => {
  const id = route.params.id
  const settData = route.params.data
  // console.log('Settlement ID, Data:', id, settData)
  //getThisSettlement()

  getFilteredData(filters, filterValues)
  console.log(settlement)
})
</script>

<template>
  <div class="user-profile">
    <div class="profile-header">
      <img :src="profile.avatar" alt="User Profile Image" />
      <h1>{{ name }}</h1>
      <p>{{ tagline }}</p>
    </div>

    <div class="profile-details">
      <div class="profile-card">
        <div class="card-icon">
          <Icon icon="mdi:email-mark-as-unread" color="red" width="48" />
        </div>
        <div class="card-content">
          <h3>Email:</h3>
          <p>{{ profile.email }}</p>
        </div>
      </div>

      <div class="profile-card">
        <div class="card-icon">
          <Icon icon="ic:baseline-phone" color="green" width="48" />
        </div>
        <div class="card-content">
          <h3>Phone:</h3>
          <p>{{ profile.phone }}</p>
        </div>
      </div>

      <div class="profile-card">
        <div class="card-icon">
          <Icon icon="material-symbols:location-on-outline" color="blue" width="48" />
        </div>
        <div class="card-content">
          <h3>County:</h3>
          <p>{{ profile.county }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.is-required--item {
  position: relative;

  &::before {
    margin-right: 4px;
    color: var(--el-color-danger);
    content: '*';
  }
}
</style>
<style>
.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Roboto', sans-serif;
  margin: 20px;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.profile-header img {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.profile-header h1 {
  font-size: 24px;
  margin-top: 10px;
  margin-bottom: 5px;
}

.profile-header p {
  font-size: 18px;
  color: #888;
}

.profile-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  transition: all 0.2s ease-in-out;
}

.profile-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.card-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 70px;
  height: 70px;
  font-size: 24px;
  color: #888;
  background-color: #f8f8f8;
  border-radius: 50%;
  margin-bottom: 10px;
}

.card-content {
  text-align: center;
}

.card-content h3 {
  font-size: 18px;
  margin-bottom: 5px;
}

.card-content p {
  font-size: 16px;
  color: #888;
}
</style>