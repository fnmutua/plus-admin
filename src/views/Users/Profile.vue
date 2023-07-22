<script setup lang="ts">
import { Descriptions } from '@/components/Descriptions'
import { useI18n } from '@/hooks/web/useI18n'
import { onMounted, ref, reactive, unref } from 'vue'
import { Form } from '@/components/Form'
import { ElFormItem, ElInput, ElButton, ElDialog, ElForm, ElMessage ,FormInstance, ElCard, ElDivider} from 'element-plus'
import { useValidator } from '@/hooks/web/useValidator'
import { useForm } from '@/hooks/web/useForm'
import { useRoute } from 'vue-router'
 
// Locally
import { VueCollapsiblePanelGroup, VueCollapsiblePanel } from '@dafcoe/vue-collapsible-panel'
import '@dafcoe/vue-collapsible-panel/dist/vue-collapsible-panel.css'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { activateUserApi, updateByUserApi, getUserListApi, setUserFeedback, getMyProfile } from '@/api/users'
import {
  ElAvatar
} from 'element-plus'

import {
  UserFilled,
  TopRight,
  Edit,
  User,
  Plus,
  Download,
  Filter,
  MessageBox
} from '@element-plus/icons-vue'

import { uuid } from 'vue-uuid'

import { Icon } from '@iconify/vue';


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
const profileRef = ref<FormInstance>()


const profile = reactive({
  id:'',
  name: '',
  avatar:'',
  county: '',
  email: '',
  status: '',
  username: '',
  phone: null,
  county_id:'',
  roles:[],
 
})




const userDetails = ref()
const userName = ref('')
const avatar = ref('')
const email = ref('')


function getInitials(name) {
  const words = name.split(' ');
  const initials = words.map(word => word.charAt(0).toUpperCase());
  return initials.join('');
}

const initials =ref()
const getFilteredData = async () => {
  const formData = {}

  formData.model = model
  formData.id =  userInfo.id


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
  profile.id = res.data[0].id
  profile.county_id = res.data[0].county_id
   profile.roles = res.data[0].roles
  profile.phone = res.data[0].phone

  initials.value = getInitials(res.data[0].name)
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


const feedback = reactive({
  name: '',
  email: '',
  message: '',
  phone: '',
  code:''
})

const dialogFeedback = ref(false)

const ruleFormRef = ref<FormInstance>()


const setFeedback = async () => { 
  feedback.name = profile.name 
  feedback.email = profile.email
  
  dialogFeedback.value=true 
}




const sendFeedback = async (formEl: FormInstance | undefined) => {

 
  feedback.code = uuid.v4()
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
        // The form is valid, you can perform further actions here
      const res = setUserFeedback(feedback)

      
      dialogFeedback.value=false
        
      } else {
        // The form is invalid, you can show an error message or perform other actions
      console.log('Form validation failed.');
        ElMessage.error('Validation Errors. Please address')
      }
    });

}

const feedbackRules =  {
      name: [
        { required: true, message: 'Please enter your name', trigger: 'blur' }
      ],
      email: [
        { required: true, message: 'Please enter your email', trigger: 'blur' },
        { type: 'email', message: 'Please enter a valid email address', trigger: ['blur', 'change'] }
      ],
      message: [
        { required: true, message: 'Please enter a message', trigger: 'blur' }
      ]
    }
 


    //// ------------------parameters -----------------------////
 const formData = ref(new FormData());

const ruleFormRefProfile = ref<FormInstance>()
const ruleForm = reactive({
  id:'',
  name: '',
  avatar:'',
  county: '',
  email: '',
  status: '',
  username: '',
  phone: null,
  county_id:'',
  roles:[],
})

const dialogFormVisible=ref(false)

const EditUser = () => {
  console.log(profile.id)
  // Append other form data properties to the formData
  ruleForm.id= profile.id
  ruleForm.name = profile.name
  ruleForm.email= profile.email
  ruleForm.username= profile.username
  ruleForm.phone= profile.phone
  ruleForm.county_id= profile.county_id
  
  dialogFormVisible.value = true
}

const uploadProfilePhoto = async (event) => {
  
  const file = event.target.files[0];
  formData.value.append('profilePhoto', file); // Append the profile photo file to the formData


  // Append other form data properties as needed

  console.log(formData);
    // Inspect the contents of formData
    for (const pair of formData.value.entries()) {
    console.log(pair[0], pair[1]);
  }

}



const updateUser = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  console.log(ruleForm)

     
  formData.value.append('id', ruleForm.id);
  formData.value.append('name', ruleForm.name);
   formData.value.append('email', ruleForm.email);
   formData.value.append('username', ruleForm.username);
  formData.value.append('phone', ruleForm.phone);
  formData.value.append('county_id',ruleForm.county_id);
 

  
  updateByUserApi(formData.value)
    .then(response => {
      // Handle the API response and show the message to the user
      const message = response.data; // Assuming the message is in the 'message' field of the API response
      console.log('API Response:', response.data);
      console.log('Message:', message);
      // You can display the message to the user using a notification or any other method
    })
    .catch(error => {
      // Handle any errors that occur during the API call
      console.error('Error updating user:', error);
      // You can display an error message to the user using a notification or any other method
    })
    .finally(() => {
      // Close the form dialog regardless of the API call result
      dialogFormVisible.value = false;
    });
    formData.value = new FormData(); // Create a new empty FormData object

}



 const xupdateUser = () => {
 
  
  updateByUserApi(formData.value)
    .then(response => {
      // Handle the API response and show the message to the user
      const message = response.data.message; // Assuming the message is in the 'message' field of the API response
      console.log('API Response:', response.data);
      console.log('Message:', message);
      // You can display the message to the user using a notification or any other method
    })
    .catch(error => {
      // Handle any errors that occur during the API call
      console.error('Error updating user:', error);
      // You can display an error message to the user using a notification or any other method
    })
    .finally(() => {
      // Close the form dialog regardless of the API call result
      dialogFormVisible.value = false;
    });
    formData.value = new FormData(); // Create a new empty FormData object


}

</script>

<template>
  <div class="user-profile">
 

    
    <div class="profile-header">
      <div class="profile-header">
      <img :src="profile.avatar" alt="User Profile Image" v-if="profile.avatar" /> <!-- Use the avatarPath to display the user's avatar -->
      <el-avatar size="large" v-else> {{ initials }} </el-avatar> <!-- Display initials if avatarPath is not available -->
     </div>
    <h1>{{ profile.name }}</h1>
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

      <div class="profile-card">
 
        <div class="card-content">
          <ElButton  type="primary" class="w-[100%]" @click="setFeedback()" > Feedback/Querries?       
        </ElButton>
         </div>

         
      </div>

      <div class="profile-card">
  

  
 <div class="card-content">
   <ElButton  type="primary" class="w-[100%]" @click="EditUser()" > Edit Profile       
 </ElButton>
  </div>
</div>

    </div>
  </div>

  
<el-dialog
  title="Send us a message"
  v-model="dialogFeedback"
  width="25%"
  :center="true"
>
  <el-form :model="feedback" :rules="feedbackRules" ref="ruleFormRef"> 
    <el-row>
      <el-col :xs="24" :sm="12">
        <el-form-item label="Name" prop="name">
          <el-input v-model="feedback.name" disabled/>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :xs="24" :sm="12">
        <el-form-item label="Email" prop="email">
          <el-input v-model="feedback.email" disabled/>
        </el-form-item>
      </el-col>
    </el-row>
    
    <el-row>
      <el-col :xs="24" :sm="12">
        <el-form-item label="Message" prop="message">
          <el-input v-model="feedback.message" type="textarea"/>
        </el-form-item>
      </el-col>
    </el-row>

  </el-form>
  <div style="text-align: center">
    <el-button @click="dialogFeedback = false">Cancel</el-button>
    <el-button type="primary" @click="sendFeedback(ruleFormRef)">Submit</el-button>
  </div>

  </el-dialog>


  
  <el-dialog v-model="dialogFormVisible" title="My Details">
      <el-form ref="ruleFormRefProfile" :model="ruleForm" >
        <el-form-item label="Name" >
          <el-input v-model="ruleForm.name" autocomplete="off" />
        </el-form-item>
        <el-form-item label="Username" >
          <el-input v-model="ruleForm.username" autocomplete="off" disabled />
        </el-form-item>
        <el-form-item label="Email" >
          <el-input v-model="ruleForm.email" autocomplete="off" />
        </el-form-item>
        <el-form-item label="Phone" >
          <el-input v-model="ruleForm.phone" autocomplete="off" />
        </el-form-item>

        <el-form-item label="Profile" >
          <input type="file" @change="uploadProfilePhoto" accept="image/*"/> <!-- Profile photo input -->
        </el-form-item>

      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogFormVisible = false">Cancel</el-button>
          <el-button type="primary" @click="updateUser(ruleFormRefProfile)">
            Confirm
          </el-button>
        </span>
      </template>
    </el-dialog>

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


.card-xcontent {
  display: flex;
  align-items: center;
}


.icon-container {
  display: inline-block;
  position: relative;
  box-shadow: 0 2px 4px rgba(34, 35, 35, 0.2);
  padding: 5px;
  /* optional padding around the icon */
  border-radius: 10%;
  /* optional border radius for circular icon */
}



.card-content p {
  font-size: 16px;
  color: #888;
}
</style>