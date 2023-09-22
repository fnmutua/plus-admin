<template>
    <ContentWrap title="Add Evaluation">
      <div>
        <el-card class="box-card">
            <el-steps
                :active="currentStep"
                finish-status="success"
                align-center
                class="small-steps"
            >
                <el-step
                v-for="(step, index) in steps"
                :key="index"
                :title="isMobile ?  '': step.title"
                @click="handleStepClick(index)"
 
                />
            </el-steps>
          <el-divider />
  
          <el-form
            :model="formData"
            :rules="currentStepRules"
            label-width="200px"
            :label-position="labelPosition"
            ref="dynamicFormRef"
          >
            <el-row :gutter="8">
              <el-col
                v-for="(field, index) in currentStepFields"
                :key="index"
                :span="24"
                :xs="24"
                :sm="24"
                :md="24"
                :lg="12"
                :xl="12"
              >
                <el-form-item :label="field.label" :prop="field.name" >
                  <el-input v-if="field.type === 'text'" v-model="formData[field.name]" />
                  <el-input-number
                    v-else-if="field.type === 'number'"
                    v-model="formData[field.name]"
                    max="formData[field.max]"
                    @change="getFieldChangeHandler(field.name)"
                  />

                  <el-input 
                    v-else-if="field.type === 'textarea'"
                    v-model="formData[field.name]"
                    type="textarea"
                    @change="getFieldChangeHandler(field.name)"
                  />

                  
                  <el-input 
                    v-else-if="field.type === 'list'"
                    v-model="formData[field.name]"
                    type="textarea"
                    placeholder="Type strings, separated by commas"
                    @change="getFieldChangeHandler(field.name)"
                  />



                  <el-rate 
                    v-else-if="field.type === 'rating'"
                    v-model="formData[field.name]"
                    :colors="colors"
                     @change="getFieldChangeHandler(field.name)"
                  />


                  <el-date-picker
                    v-else-if="field.type === 'date'"
                    type="date"
                    v-model="formData[field.name]"
                  />
                  <!-- Add more conditions for other field types as needed -->
                  <el-select
                    v-else-if="field.type === 'select' && field.multiselect === 'false'"
                    v-model="formData[field.name]"
                    :filterable="true"
                    collapse-tags
                    placeholder="Select"
                    @change="getFieldChangeHandler(field.name)"
                  >
                    <el-option
                      v-for="option in field.options"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
  
                  <el-select
                    v-else-if="field.type === 'select' && field.multiselect === 'true'"
                    v-model="formData[field.name]"
                    :filterable="true"
                    multiple
                    collapse-tags
                    placeholder="Select"
                    @change="getFieldChangeHandler(field.name)"
                  >
                    <el-option
                      v-for="option in field.options"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
  
                  <el-cascader
                    v-else-if="field.type === 'cascade' && !isMobile"
                    v-model="formData[field.name]"
                    :filterable="true"
                    clearable
                    :options="field.options" 
                    @change="getFieldChangeHandler(field.name)"
                   />








                  <el-button type="primary" @click="showOnMobile(field.options)" v-else-if="field.type === 'cascade' && isMobile">
              Select
            </el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
  
          <div class="button-container">
            <el-button type="primary" @click="prevStep" v-if="currentStep > 0">
              Previous
            </el-button>
            <el-button type="primary" @click="nextStep" v-if="currentStep < totalSteps - 1">
              Next
            </el-button>
            <el-button type="success" @click="submitForm" v-else>
              Submit
            </el-button>
          </div>
          <!-- <pre>{{ JSON.stringify(formData, null, 2) }}</pre> -->
        </el-card>
      </div>

      <el-dialog
    v-model="showDialog"
    title="Tips"
    width="100%"
   >
   <el-cascader-panel size="small" :options="cascadeOptions" popper-class="custom-cascader-popper" />

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showDialog = false">Cancel</el-button>
        <el-button type="primary" @click="showDialog = false">
          Confirm
        </el-button>
      </span>
    </template>
  </el-dialog>
    </ContentWrap>
  </template>


<script lang="ts" setup>
    import { ref, reactive,onMounted,   computed, Ref } from 'vue';
    import { ContentWrap } from '@/components/ContentWrap'
    import { useI18n } from '@/hooks/web/useI18n'
    import { ElCard, ElCascader, ElCascaderPanel,  ElDialog  } from 'element-plus'
    import { useRouter } from 'vue-router'

    import { steps, formFields, formData, formRules } from './common/fields.ts'
    import { createHousehold,getOneHousehold , updateHousehold} from '@/api/households'
    import shortid from 'shortid';
    import { useRoute } from 'vue-router'
    import { useAppStoreWithOut } from '@/store/modules/app'
    import { useCache } from '@/hooks/web/useCache'
    import { CreateRecord, DeleteRecord, updateOneRecord, getOneGeo, getOneSettlement, uploadDocuments, getfilteredGeo } from '@/api/settlements'

    import {
        ElButton,
        ElDivider,
        ElForm,
        ElFormItem,
        ElInput,ElRate,
        ElInputNumber,
        ElDatePicker,
        ElSteps,
        ElStep, ElRow, ElCol,
        ElSelect, ElOption,
        Form as ElFormInstance
    } from 'element-plus';




        const { wsCache } = useCache()
    const appStore = useAppStoreWithOut()
    const userInfo = wsCache.get(appStore.getUserInfo)
    const colors = ref(['#99A9BF', '#F7BA2A', '#FF9900']) // same as { 2: '#99A9BF', 4: { value: '#F7BA2A', excluded: true }, 5: '#FF9900' }


    const isMobile = computed(() => appStore.getMobile)


    const route = useRoute()
    const { push } = useRouter()
 
      const router = useRouter();

      const goBack = () => {
        router.back();
      };



const props = {   
    expandTrigger: 'hover' as const,
   
    };

const labelPosition = ref('left')
if (isMobile.value) {
    labelPosition.value = 'top'
  
}  


const newRecord = ref(true)
  
// xonMounted( async () => {
 
//     //formData.value = JSON.parse(route.query.formData);
//    // console.log('data>>',data)
//     console.log('passed data', route.query.id)

//     const form = {}
//     form.model = 'evaluation'
//     form.id = route.query.id

//     if (route.query.id) {
//         await getOneHousehold(form)
//             .then((res) => {
//                 // Handle the successful response here
//                 console.log(res.data)
//                 var curData = res.data
//                 curData.location=[curData.county_id,curData.subcounty_id,curData.ward_id,curData.settlement_id]
//               //  formData = res.data
//                 Object.assign(formData, curData);
//                 console.log(formData)
//                 newRecord.value=false
//             })
//             .catch((error) => {
//                 // Handle the error here
//                 console.log('Error:', error);
//             });
//     } else {

//         Object.keys(formData).forEach((key) => {
//             formData[key] = undefined;
//         });
//     } 
//  })

 onMounted(async () => {

//formData.value = JSON.parse(route.query.formData);
// console.log('data>>',data)
console.log('passed data', route.query.id)
 

const form = {}
form.model = 'evaluation'
form.id = route.query.id



if (route.query.id) {
  await getOneSettlement(form)
    .then((res) => {
      // Handle the successful response here
      console.log(res.data)
      var curData = res.data
     
      //  formData = res.data
      Object.assign(formData, curData);
      console.log(formData)
      newRecord.value = false
 


    })
    .catch((error) => {
      // Handle the error here
      console.log('Error:', error);
    });
} else {

  Object.keys(formData).forEach((key) => {
    formData[key] = undefined;
  });
}
})


const showDialog = ref(false)
const cascadeOptions =ref([])
const showOnMobile = (options) => {
    console.log(options)
    cascadeOptions.value=options

     showDialog.value = true
    };
 

    const currentStep = ref(0);
    //const dynamicFormRef: Ref<string | null> = ref(null);
    const dynamicFormRef = ref<FormInstance>()

    const currentStepFields = computed(() => formFields[currentStep.value]);

    const currentStepRules = computed(() => {
        const stepRulesKey = `step${currentStep.value + 1}`;
        return formRules[stepRulesKey];
    });

    const totalSteps = computed(() => steps.length);

    const prevStep = () => {
        if (currentStep.value > 0) {
            currentStep.value--;
        }
    };

    const   handleStepClick = (index)=>  {
    // // Perform actions when a step is clicked
    // // You can update the current step or execute other logic
    //     hasValidationErrors(index)
    //     if (validationErrors[index] ==='Error' ) {
    //         console.log('errors')
    //     } else {
    //         currentStep.value = index;
    // }
    currentStep.value = index;
  }


    const nextStep = () => {
        console.log('xxxxx',steps[currentStep.value], totalSteps.value)
        if (currentStep.value < totalSteps.value - 1 && dynamicFormRef) {
            const formInstance = dynamicFormRef
            formInstance.value.validate((valid: boolean) => {
                if (valid) {
                    console.log(formInstance)


                    currentStep.value++;
                }
            });
        }
    };

  
const overallRating = async (obj) => { 

  const ratingFields = [
    'dev_objective_rating',
    'dev_design_rating',
    'do_rating',
    'timeliness_rating',
    'ip_rating',
    'fs_rating',
    'inst_sustainability_rating',
    'ownership_sustainability_rating',
    'environmental_rating',
    'progress_impact_rating'
  ];

  let totalRatings = 0;
  let numRatings = 0;

  ratingFields.forEach(field => {
    if (obj[field] !== null && !isNaN(obj[field])) {
      totalRatings += parseFloat(obj[field]);
      numRatings++;
    }
  });

  if (numRatings === 0) {
    return null; // No valid ratings to calculate average
  }

  return (totalRatings / numRatings).toFixed(1);

}
    
const submitForm = async () => {
  const formInstance = dynamicFormRef
  formInstance.value.validate(async (valid: boolean) => {
    if (valid) {
      // Perform form submission logic

      formData.model = 'evaluation'
      formData.createdBy = userInfo.id
      console.log('Overall Rating',  await overallRating(formData))
       formData.overall_rating = await overallRating(formData)

       //formData.geom =geomScope.value


      if (newRecord.value) {
        formData.isApproved = 'Pending'
        formData.code = shortid.generate()

        await CreateRecord(formData)

        console.log('New form', formData);

      } else {
        await updateOneRecord(formData)

        console.log('Edited form', formData);


      }


      goBack()

      // push({
      //    name: 'Health'
      // })

    } else {
      // Handle form validation errors
      console.log('fail validation')
    }
  });

};


const computeHHSize = () => {
    var hh_female =    (formData.age_00_04f ? formData.age_00_04f : 0) +
         (formData.age_05_09f ? formData.age_05_09f : 0) +
         (formData.age_10_14f ? formData.age_10_14f : 0) +
         (formData.age_15_19f ? formData.age_15_19f : 0) +
         (formData.age_20_24f ? formData.age_20_24f : 0) +
         (formData.age_25_29f ? formData.age_25_29f : 0) +
         (formData.age_30_34f ? formData.age_30_34f : 0) +
         (formData.age_35_39f ? formData.age_35_39f : 0) +
         (formData.age_40_44f ? formData.age_40_44f : 0) +
         (formData.age_45_49f ? formData.age_45_49f : 0) +
         (formData.age_50_54f ? formData.age_50_54f : 0) +
         (formData.age_55_59f ? formData.age_55_59f : 0) +
         (formData.age_60_64f ? formData.age_60_64f : 0) +
         (formData.age_65_69f ? formData.age_65_69f : 0) +
         (formData.age_gt_70f ? formData.age_gt_70f : 0)  

         var hh_male = (formData.age_00_04m ? formData.age_00_04m : 0) +
         (formData.age_05_09m ? formData.age_05_09m : 0) +
         (formData.age_10_14m ? formData.age_10_14m : 0) +
         (formData.age_15_19m ? formData.age_15_19m : 0) +
         (formData.age_20_24m ? formData.age_20_24m : 0) +
         (formData.age_25_29m ? formData.age_25_29m : 0) +
         (formData.age_30_34m ? formData.age_30_34m : 0) +
         (formData.age_35_39m ? formData.age_35_39m : 0) +
         (formData.age_40_44m ? formData.age_40_44m : 0) +
         (formData.age_45_49m ? formData.age_45_49m : 0) +
         (formData.age_50_54m ? formData.age_50_54m : 0) +
         (formData.age_55_59m ? formData.age_55_59m : 0) +
         (formData.age_60_64m ? formData.age_60_64m : 0) +
         (formData.age_65_69m ? formData.age_65_69m : 0) +
         (formData.age_gt_70m ? formData.age_gt_70m : 0);

        
        return [hh_male,hh_female]
    //formData.hh_size = formData.age_00_04f
}

    const handleChangeLocation = (value: any) => {
        console.log('Location field changed:', value);
        const location = formFields.flat().find((f) => f.name === 'location');

        formData.county_id=value[0]
        formData.subcounty_id=value[1]
        formData.ward_id=value[2]
        formData.settlement_id=value[3]

        console.log('location field changed:', formData);

    }; 


//     const findingsString = ref()
// ruleForm.findings = computed(() => {

//   if (findingsString.value !== '') {
//     var findg = findingsString.value.split(',').map(value => value.trim());

//   } else {
//     var findg = ruleForm.findings
//   }
//   return findg
// });

 
const handleListFields = (fieldName, fieldValue) => {
  console.log('fieldValue field changed:', fieldValue);

 // formData[fieldName]=value[0]

  formData[fieldName] = computed(() => {

      if (fieldValue.value !== '') {
        var splitStrings = fieldValue.split(',').map(value => value.trim());

      } else {
        var splitStrings = formData[fieldName]
      }
      return  splitStrings
      });


      console.log( 'Split Strings ', formData[fieldName])
       

    }; 


    // Function to get the field change handler based on field name
    const getFieldChangeHandler = (fieldName: string) => {
      const field = formFields.flat().find((f) => f.name === fieldName);
        console.log('fieldName', fieldName,field )
         if (fieldName == 'location') {
            handleChangeLocation(formData[fieldName])
        }

        if (field.type == 'list') {
            handleListFields(fieldName, formData[fieldName] )
        }
 

        return undefined;
    };


    </script>
    <style>
    .small-steps .el-step {
      width: 50px; /* Adjust the width as per your requirement */
      height: 35px; /* Adjust the height as per your requirement */
      line-height: 20px; /* Adjust the line-height as per your requirement */
      padding-bottom: 5px; /* Add 5 pixels bottom padding */

    }
    </style>


  
<style scoped>

.small-steps .el-step__title {
  display: none;
}


@media (max-width: 768px) {
  .box-card {
    padding: 10px;
  }
  .small-steps .el-step__title {
    display: none;
  }

  .cascader-popper-mobile {
    width: 100% !important;
    left: 0 !important;
    right: 0 !important;
    transform: none !important;
  }
 
  .button-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 10px;
  }
}
 
.custom-cascader-popper .el-cascader__dropdown {
  /* Position the popper below instead of on the right */
  top: auto;
  left: 0;
  right: auto;
  bottom: -10px;
}

</style>
