    <template>
        <ContentWrap title="Add Household">
            <div>


    <el-card class="box-card">
        <el-steps :active="currentStep" finish-status="success"  align-center class="small-steps" >
            <el-step v-for="(step, index) in steps" :key="index" :title="step.title" />
        </el-steps>
        <el-divider />

        <el-form :model="formData" :rules="currentStepRules" label-width="200px" ref="dynamicFormRef">
            <el-row>
                <el-col v-for="(field, index) in currentStepFields" :key="index" :xs="24" :sm="24" :md="8" :lg="8" :xl="8" >
                    <el-form-item   :label="field.label" :prop="field.name">
                        <el-input v-if="field.type === 'text'" v-model="formData[field.name]" />
                        <el-input-number
v-else-if="field.type === 'number'" 
                        v-model="formData[field.name]"  
                        @change="getFieldChangeHandler(field.name)"
                        />
                        <el-date-picker
v-else-if="field.type === 'date'" type="date"
                            v-model="formData[field.name]" />
                        <!-- Add more conditions for other field types as needed -->
                        <el-select
v-else-if="field.type === 'select'  && field.multiselect ==='false' " v-model="formData[field.name]"
                            :filterable="true"  
                             collapse-tags
                            placeholder="Select"
                            @change="getFieldChangeHandler(field.name)">
                            <el-option
v-for="option in field.options" :key="option.value" :label="option.label"
                                :value="option.value" />
                        </el-select>
                         

                        <el-select
v-else-if="field.type === 'select'  && field.multiselect ==='true' " v-model="formData[field.name]"
                            :filterable="true"  
                             multiple  
                            collapse-tags
                            placeholder="Select"
                            @change="getFieldChangeHandler(field.name)">
                            <el-option
v-for="option in field.options" :key="option.value" :label="option.label"
                                :value="option.value" />
                        </el-select>
                         

                        <el-cascader
                            v-else-if="field.type === 'cascade'"
                                v-model="formData[field.name]"
                                :filterable="true"
                                clearable
                                :options="field.options"
                                :props="props"
                                @change="getFieldChangeHandler(field.name)"
                                 />
                    </el-form-item>
                </el-col>
            </el-row>
        </el-form>
                    <div>
                        <el-button type="primary" @click="prevStep" v-if="currentStep > 0">Previous</el-button>
                        <el-button type="primary" @click="nextStep" v-if="currentStep < totalSteps - 1">Next</el-button>
                        <el-button type="success" @click="submitForm" v-else>Submit</el-button>
                    </div>
                    <pre>{{ JSON.stringify(formData, null, 2) }}</pre>

                </el-card>
            </div>
        </ContentWrap>
    </template>

<script lang="ts" setup>
    import { ref, reactive,onMounted,   computed, Ref } from 'vue';
    import { ContentWrap } from '@/components/ContentWrap'
    import { useI18n } from '@/hooks/web/useI18n'
    import { ElCard, ElCascader  } from 'element-plus'
    import { useRouter } from 'vue-router'

    import { steps, formFields, formData, formRules } from './common/fields.ts'
    import { createHousehold,getOneHousehold , updateHousehold} from '@/api/households'
    import shortid from 'shortid';
    import { useRoute } from 'vue-router'

  

    import {
        ElButton,
        ElDivider,
        ElForm,
        ElFormItem,
        ElInput,
        ElInputNumber,
        ElDatePicker,
        ElSteps,
        ElStep, ElRow, ElCol,
        ElSelect, ElOption,
        Form as ElFormInstance
    } from 'element-plus';


    const route = useRoute()
    const { push } = useRouter()


const props = {
    expandTrigger: 'hover' as const,
   
};


const newRecord = ref(true)

onMounted( async () => {
 
    //formData.value = JSON.parse(route.query.formData);
   // console.log('data>>',data)
    console.log('passed data', route.query.id)

    const form = {}
    form.model = 'households'
    form.id = route.query.id

    if (route.query.id) {
        await getOneHousehold(form)
            .then((res) => {
                // Handle the successful response here
                console.log(res.data)
                var curData = res.data
                curData.location=[curData.county_id,curData.subcounty_id,curData.ward_id,curData.settlement_id]
              //  formData = res.data
                Object.assign(formData, curData);
                console.log(formData)
                newRecord.value=false
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

    const submitForm = async () => {
        const formInstance = dynamicFormRef
        formInstance.value.validate( async(valid: boolean) => {
            if (valid) {
                // Perform form submission logic
                const sizes = await computeHHSize();
                console.log("Sizes",sizes[0], sizes[1])
                formData.hh_size =sizes[0] + sizes[1]
                formData.hh_size_male = sizes[0]
                formData.hh_size_female =  sizes[1]
                 
                formData.model = 'households'
                formData.code = shortid.generate()

                if (newRecord.value) {
                    await createHousehold(formData)
                     console.log('New form', formData);

                } else {
                    await updateHousehold(formData)

                    console.log('Edited form', formData);

                    
                }
           
                 push({
                path: '/settlement/hh/add',
                name: 'AllHouseholds'
            })

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


 

    // Function to get the field change handler based on field name
    const getFieldChangeHandler = (fieldName: string) => {
        const field = formFields.flat().find((f) => f.name === fieldName);
         if (fieldName == 'location') {
            handleChangeLocation(formData[fieldName])
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