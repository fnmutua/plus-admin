<template>
  <div>
    <BaseLayout>
 
      <el-main>
        <el-tabs v-model="activeName" class="demo-tabs">
          <el-tab-pane label="File a Grievance" name="file">

            <el-form :inline="false" :model="grmForm" class="demo-form-inline" label-position="top"
              :rules="validationRules" ref="dynamicFormRef">
              <el-card shadow="hover">
                <el-row :gutter="10">
                  <el-col :xs="24" :sm="24" :md="12" :lg="6" :xl="6">

                    <el-form-item label="Name" prop="name">
                      <el-input v-model="grmForm.name" placeholder="Enter name" />
                    </el-form-item>

                    <el-form-item label="Gender" prop="gender">
                      <el-select v-model="grmForm.gender" placeholder="Select">
                        <el-option label="Female" value="female" />
                        <el-option label="Male" value="male" />
                        <el-option label="Unspecified" value="unspecified" />
                      </el-select>
                    </el-form-item>

                    <el-form-item label="Age" prop="age">
                      <el-select v-model="grmForm.age" placeholder="Select">
                        <el-option v-for="item in ageRanges" :key="item.value" :label="item.label"
                          :value="item.value" />
                      </el-select>
                    </el-form-item>

                    <el-form-item label="National ID" prop="national_id">
                      <el-input v-model="grmForm.national_id" placeholder="Enter ID number" />
                    </el-form-item>


                    <el-form-item label="Phone" prop="phone">
                      <el-input v-model="grmForm.phone" placeholder="Enter phone number" />
                    </el-form-item>


                    <el-form-item label="Email" prop="email">
                      <el-input v-model="grmForm.email" placeholder="Enter Email" />
                    </el-form-item> 
                  </el-col>
                  <el-col :xs="24" :sm="24" :md="12" :lg="6" :xl="6">
 
                    <el-form-item label="County" prop="county_id">
                      <el-select v-model="grmForm.county_id" placeholder="County" searchable filterable
                        :onChange="getSettlementByCounty">
                        <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label"
                          :value="item.value" />

                      </el-select>
                    </el-form-item> 

                    <el-form-item label="Settlement" prop="settlement_id">
                      <el-select v-model="grmForm.settlement_id" placeholder="Settlement" searchable filterable :onChange="handleSelectSettlement">
                        <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label"
                          :value="item.value" />

                      </el-select>
                    </el-form-item>


                    <el-form-item label="Address" prop="address">
                      <el-input v-model="grmForm.address" placeholder="Enter address" />
                    </el-form-item>


                  </el-col>

                  <el-col :xs="24" :sm="24" :md="12" :lg="6" :xl="6">
                    <el-form-item label="Nature of Complaint" prop="nature">
                      <el-select v-model="grmForm.nature" placeholder="Select category">
                        <el-option label="Land" value="land" />
                        <el-option label="Labour Related" value="labour" />
                        <el-option label="Infrastructure" value="infrastructure" />
                        <el-option label="Others" value="others" />
                      </el-select>
                    </el-form-item>
                    <el-checkbox v-model="grmForm.isgbv" label="Gender-Based Violence related" size="large"
                      style="margin-bottom:5px" />

                    <el-form-item label="Complaint Description" prop="description">
                      <el-input v-model="grmForm.description" type="textarea" rows="2"
                        placeholder="Describe your complaint" />
                    </el-form-item>
                    <el-form-item label="Plea/Request" prop="plea">
                      <el-input v-model="grmForm.plea" type="textarea" rows="2" placeholder="Enter your plea/request" />
                    </el-form-item>

                  </el-col>

                  <el-col :xs="24" :sm="24" :md="12" :lg="6" :xl="6">

                    <el-form-item label="Witness Name" style="margin-right: 25px;" prop="witness">
                      <el-input v-model="grmForm.witness" placeholder="Enter witness name" />
                    </el-form-item>

                    <el-form-item label="Witness Phone" style="margin-right: 5px;" prop="witness_phone">
                      <el-input v-model="grmForm.witness_phone" placeholder="Enter witness phone" />
                    </el-form-item>

                    <el-form-item label="Witness Statement" prop="witness_statement">
                      <el-input v-model="grmForm.witness_statement" type="textarea"
                        placeholder="Enter witness statement" />
                    </el-form-item>
                  </el-col>

                </el-row>


                <el-upload v-model:file-list="fileList" class="upload-demo"
                  action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple
                  :on-preview="handlePreview" :on-remove="handleRemove" :before-remove="beforeRemove" :limit="3"
                  :on-exceed="handleExceed">
                  <el-button type="primary">Upload Supporting Documentation</el-button>
                  <template #tip>
                    <div class="el-upload__tip">
                      jpg/png files with a size less than 500KB.
                    </div>
                  </template>
                </el-upload>



                <template #footer>
                  <el-button type="primary" @click="submitForm">Submit</el-button>
                  <el-button @click="resetForm">Reset</el-button>

                </template>
              </el-card>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="Check Status of a Grievance" name="status">
            <el-form :inline="false" :model="statusForm" class="status-form" label-position="top">
              <el-card shadow="hover">
                <el-row :gutter="10">
                  <el-col :xs="24" :sm="24" :md="12" :lg="6" :xl="6">
                    <el-form-item label="Grievance Code">
                      <el-input v-model="statusForm.grievanceCode" placeholder="GRM-0000-0000" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="24" :md="12" :lg="6" :xl="6">
                    <el-form-item label="Phone Number">
                      <el-input v-model="statusForm.phoneNumber" placeholder="0700 000 0000" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="24">
                    <el-button type="primary" @click="checkStatus">Check Status</el-button>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="24">
                    <div class="status-result" v-if="statusResult">
                      <el-card style="margin-top: 10px">
                        <p><strong>Status:</strong> {{ statusResult.status }}</p>
                        <p><strong>Details:</strong> {{ statusResult.details }}</p>
                      </el-card>
                    </div>
                  </el-col>
                </el-row>
              </el-card>
            </el-form>

          </el-tab-pane>

        </el-tabs>


      </el-main>


    </BaseLayout>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  ElMain, ElButton, ElCard, ElForm, ElFormItem, ElInput, ElUpload, ElCheckbox,
  ElTabPane, ElTabs, ElSelect, ElOption, ElRow, ElCol ,FormInstance,ElMessage
} from 'element-plus';
import { getCountyAuth, getSettlementByCountyAuth } from '@/api/register'
import { generateGRMCode,generateGrievance } from '@/api/grievance'

 


const countiesOptions = ref([])
const settlementOptions = ref([])

const getCounties = async () => {

  const formData = {}
  formData.model = 'county'
  await getCountyAuth({}).then((response) => {
    console.log('List of counties:', response)
    //tableDataList.value = response.data
    var cnty = response.data



    cnty.forEach(function (arrayItem) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name
      //  console.log(countyOpt)
      countiesOptions.value.push(countyOpt)
    })


    // sort by value
    countiesOptions.value.sort(function (a, b) {
      return a.value - b.value;
    });

  })
}

getCounties()



import BaseLayout from './BaseLayout.vue';
const activeName = ref('file')
const labelPosition = ref('left');





const getSettlementByCounty = async (selectCounty) => {
  // nullify selection after change 
  settlementOptions.value = []
  grmForm.value.settlement_id = null


  console.log("County:", selectCounty)

  const formData = {}
  formData.model = 'settlement'
  await getSettlementByCountyAuth({ county_id: selectCounty }).then((response) => {
    console.log('List of settlement:', response)
    //tableDataList.value = response.data
    var opt = response.data



    opt.forEach(function (arrayItem) {
      var item = {}
      item.value = arrayItem.id
      item.label = arrayItem.name
      item.county_id = arrayItem.county_id
      item.subcounty_id = arrayItem.subcounty_id
      item.ward_id = arrayItem.ward_id
      
      settlementOptions.value.push(item)
    })


    // sort by value
    settlementOptions.value.sort(function (a, b) {
      return a.value - b.value;
    });

  })
}

const handleSelectSettlement = async (settlementId) => { 
  console.log(settlementId)
  const filteredOptions = settlementOptions.value.filter(option => option.value === settlementId);
    console.log(filteredOptions[0].subcounty_id)
    grmForm.value.subcounty_id=filteredOptions[0].subcounty_id
    grmForm.value.ward_id=filteredOptions[0].ward_id

}

// Initial state for the form
const initialFormState = {
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  settlement_id: '',
  name: '',
  age: '',
  gender: '',
  national_id: '',
  phone: '',
  address: '',
  email: '',
  nature: '',
  isgbv: false,
  status: '',
  description: '',
  plea: '',
  witness: '',
  witness_phone: '',
  witness_statement: '',
  date_reported: '',
  code: ''
};


// Define the age ranges
const ageRanges = [
  { value: '0-4', label: '0-4 years' },
  { value: '5-9', label: '5-9 years' },
  { value: '10-14', label: '10-14 years' },
  { value: '15-19', label: '15-19 years' },
  { value: '20-24', label: '20-24 years' },
  { value: '25-29', label: '25-29 years' },
  { value: '30-34', label: '30-34 years' },
  { value: '35-39', label: '35-39 years' },
  { value: '40-44', label: '40-44 years' },
  { value: '45-49', label: '45-49 years' },
  { value: '50-54', label: '50-54 years' },
  { value: '55-59', label: '55-59 years' },
  { value: '60+', label: '60 years and above' }
]


// Reactive form object
const grmForm = ref({ ...initialFormState });
// Validation rules
const validationRules = {
  county_id: { required: true },
  subcounty_id: {},
  ward_id: {},
  settlement_id: { required: true },
  name: { required: true },
  age: { required: true },
  gender: { required: true },
  national_id: { required: true },
  phone: { required: true },
  address: { required: false },
  email: { required: false, type: 'email' },
  nature: { required: true },
  isgbv: { required: true },
  status: { required: true, values: ['Open', 'Investigation', 'Review', 'Resolved', 'Escalated', 'Closed'] },
  description: { required: true },
  plea: { required: true },
  witness: {},
  witness_statement: {},

};

const dynamicFormRef = ref<FormInstance>()


const submitForm = async () => {
 

  // const code = await generateGRMCode()

   //console.log('code',code)

   // grmForm.value.code = code.data
    grmForm.value.date_reported = new Date();
    grmForm.value.status ='Open'
    grmForm.value.model = 'grievance';


    const formInstance = dynamicFormRef

    formInstance.value.validate( async (valid: boolean) => {
      if (valid) {
        console.log('Is Valid',grmForm)
        
        const res =  await generateGrievance(grmForm.value)
        console.log('res',res)

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
 




const resetForm = () => {
  grmForm.value = { ...initialFormState };

};

const updateLabelPosition = () => {
  labelPosition.value = window.innerWidth < 768 ? 'top' : 'left';
};

onMounted(() => {
  window.addEventListener('resize', updateLabelPosition);
  updateLabelPosition(); // Initial check
});




const statusForm = ref({
  grievanceCode: '',
  phoneNumber: '',
});

const statusResult = ref<{ status: string; details: string } | null>(null);

const checkStatus = () => {
  // Mock data for example purposes
  statusResult.value = {
    status: 'Under Review',
    details: 'Your grievance is currently being reviewed by our team.',
  };
};

</script>



<style>
.form-container {
  max-height: 80vh;
  /* Set a maximum height for the scrollable area */
  overflow-y: auto;
  /* Enable vertical scrolling */
}

.three-column-form .el-form-item {
  margin-bottom: 20px;
  /* Adjust spacing between form items if needed */
}

.grm-header {
  padding: 100px 20px;
  text-align: center;
  color: #030303;
}
</style>

<style>
.demo-form-inline .el-input {
  --el-input-width: 220px;
}

.demo-form-inline .el-select {
  --el-select-width: 220px;
}
</style>