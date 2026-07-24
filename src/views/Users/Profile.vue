<script setup lang="ts">
 
import { onMounted, ref, reactive } from 'vue'
 
import { 
  ElFormItem, 
  ElInput, 
  ElButton, 
  ElForm, 
  ElMessage,
  FormInstance, 
  ElCard, 
  ElAvatar} from 'element-plus'
 
import '@dafcoe/vue-collapsible-panel/dist/vue-collapsible-panel.css'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { updateByUserApi, getMyProfile } from '@/api/users'

 
const { wsCache } = useCache()
const appStore = useAppStoreWithOut()



const userInfo = wsCache.get(appStore.getUserInfo)

 

//// ------------------parameters -----------------------////
const model = 'users'
//// ------------------parameters -----------------------////
 

const profile = reactive({
  id: '',
  name: '',
  avatar: '',
  county: '',
  email: '',
  status: '',
  username: '',
  phone: null as string | null,
  county_id: '',
  photo: null as string | null, 
  roles: [] as any[],
})




const userDetails = ref()
 

function getInitials(name) {
  const words = name.split(' ');
  const initials = words.map(word => word.charAt(0).toUpperCase());
  return initials.join('');
}

const initials =ref()
const getFilteredData = async () => {
  try {
    const formData: any = {}
    formData.model = model
    formData.id = userInfo.id

    const res: any = await getMyProfile(formData)

    console.log('getMyProfile', res.data)
    userDetails.value = res.data
    
    if (res.data) {
      const data = res.data as any
      profile.name = data.name || ''
      profile.username = data.username || ''
      profile.avatar = data.avatar || ''
      profile.email = data.email || ''
      profile.county = String(data.county_id || '')
      profile.id = String(data.id || '')
      profile.county_id = String(data.county_id || '')
      profile.roles = data.roles || []
      profile.phone = (data.phone || null) as string | null
      profile.photo = data.photo || null

      if (data.name) {
        initials.value = getInitials(data.name)
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error)
    ElMessage.error('Failed to load profile data')
  }
}


onMounted(() => {
  getFilteredData()
})

  
 


    //// ------------------parameters -----------------------////
 const formData = ref(new FormData());

const ruleFormRefProfile = ref<FormInstance>()
const ruleForm = reactive({
  id: '',
  name: '',
  avatar: '',
  county: '',
  email: '',
  status: '',
  username: '',
  phone: null as string | null,
  county_id: '',
  roles: [] as any[],
})


const EditUser = () => {
  ruleForm.id = profile.id
  ruleForm.name = profile.name
  ruleForm.email = profile.email
  ruleForm.username = profile.username
  ruleForm.phone = profile.phone
  ruleForm.county_id = profile.county_id
}

const photofile = ref()
const photoPreview = ref('')
const uploading = ref(false)
const fileInput = ref<HTMLInputElement>()

const uploadProfilePhoto = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Check file size (5MB = 5 * 1024 * 1024 bytes)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    ElMessage.error('File size exceeds 5MB. Please choose a smaller image.')
    return
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    ElMessage.error('Please select an image file.')
    return
  }

  photofile.value = file
  formData.value.append('profilePhoto', file)

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    photoPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}



const updateUser = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  
  uploading.value = true
  const updateFormData = new FormData()
  updateFormData.append('id', String(profile.id))
  updateFormData.append('name', profile.name)
  updateFormData.append('email', profile.email)
  updateFormData.append('username', profile.username)
  updateFormData.append('phone', profile.phone || '')
  updateFormData.append('county_id', ruleForm.county_id || '')
  
  if (photofile.value) {
    updateFormData.append('profilePhoto', photofile.value)
  }

  try {
    await updateByUserApi(updateFormData as any)
    ElMessage.success('Profile updated successfully!')
    
    // Refresh profile data
    await getFilteredData()
    
    // Reset photo preview and file
    photofile.value = null
    photoPreview.value = ''
    formData.value = new FormData()
  } catch (error) {
    console.error('Error updating user:', error)
    ElMessage.error('Failed to update profile. Please try again.')
  } finally {
    uploading.value = false
  }
}


 

</script>

<template>
  <div class="profile-container">
    <el-card class="profile-card" shadow="hover">
      <!-- Profile Header Section -->
      <div class="profile-header">
        <div class="profile-avatar-section">
          <div class="avatar-wrapper" @click="EditUser">
            <el-avatar :size="72" class="profile-avatar">
              <img v-if="profile.photo" :src="profile.photo" alt="Profile" />
              <span v-else class="avatar-initials">{{ initials }}</span>
            </el-avatar>
          </div>
          <div class="profile-info">
            <h1 class="profile-name">{{ profile.name || 'User Name' }}</h1>
            <p class="profile-username">@{{ profile.username }}</p>
          </div>
        </div>
        <el-button type="primary" @click="EditUser" class="edit-button">
          Edit Profile
        </el-button>
      </div>

      <!-- Profile Details Section -->
      <div class="profile-details">
        <el-form ref="ruleFormRefProfile" :model="profile">
          <el-form-item label="Full Name">
            <el-input v-model="profile.name" placeholder="Enter your full name" clearable />
          </el-form-item>
          <el-form-item label="Username">
            <el-input v-model="profile.username" disabled placeholder="Username" />
          </el-form-item>
          <el-form-item label="Email">
            <el-input v-model="profile.email" type="email" placeholder="Enter your email" clearable />
          </el-form-item>
          <el-form-item label="Phone">
            <el-input v-model="profile.phone" placeholder="Enter your phone number" clearable />
          </el-form-item>
          <el-form-item label="Profile Photo">
            <input 
              type="file" 
              ref="fileInput"
              @change="uploadProfilePhoto" 
              accept="image/*"
              style="display: none"
            />
            <el-button type="primary" @click="fileInput?.click()" plain>
              Change Photo
            </el-button>
            <p class="upload-hint">JPG, PNG or GIF. Max size 5MB</p>
            <div v-if="photoPreview" class="photo-preview">
              <img :src="photoPreview" alt="Preview" style="max-width: 100px; max-height: 100px; border-radius: 8px; margin-top: 8px;" />
            </div>
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              @click="updateUser(ruleFormRefProfile)"
              :loading="uploading"
            >
              {{ uploading ? 'Saving...' : 'Update Profile' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<style lang="less" scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.profile-card {
  border-radius: 12px;
  overflow: hidden;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  gap: 24px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}

.profile-avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
  }
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.profile-avatar {
  border: 4px solid var(--el-border-color-lighter);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.avatar-initials {
  font-size: 28px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

.profile-username {
  font-size: 16px;
  color: var(--el-text-color-regular);
  margin: 0 0 12px 0;
}

.edit-button {
  @media (max-width: 768px) {
    width: 100%;
  }
}

.profile-details {
  padding: 24px;
}

.upload-hint {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.photo-preview {
  margin-top: 8px;
}

// Responsive adjustments
@media (max-width: 768px) {
  .profile-container {
    padding: 16px;
  }

  .profile-name {
    font-size: 24px;
  }
}
</style>
