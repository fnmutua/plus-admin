<script setup lang="ts">
import { Descriptions } from '@/components/Descriptions'
import { useI18n } from '@/hooks/web/useI18n'
import { onMounted, ref, reactive, unref } from 'vue'
import { Form } from '@/components/Form'
import { ElFormItem, ElInput, ElButton, ElContainer, ElAside, ElDescriptions, ElDescriptionsItem, ElAvatar } from 'element-plus'
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
  <ContentWrap :title="t('Profile')">

    <el-card shadow="always">
      <el-col :xl="6" :lg="6" :md="6" :sm="24" :xs="24">
        <div class="demo-fit">
          <div class="block">
            <el-avatar shape="square" :size="100" fit="contain" :src="avatar" />
          </div>
        </div>
      </el-col>
    </el-card>
    <el-card shadow="always">

      <el-col :xl="6" :lg="6" :md="6" :sm="24" :xs="24">
        <Descriptions :title="t('Profile')" :message="t('Profile')" :data="profile" :schema="schemaProfile" />
      </el-col>

    </el-card>

  </ContentWrap>
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
