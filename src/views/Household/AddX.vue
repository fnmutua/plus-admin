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
                        <el-input-number v-else-if="field.type === 'number'" v-model="formData[field.name]" />
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
    import { ref, reactive, computed, Ref } from 'vue';
    import { ContentWrap } from '@/components/ContentWrap'
    import { useI18n } from '@/hooks/web/useI18n'
    import { ElCard, ElCascader  } from 'element-plus'

    import { steps, formFields, formData, formRules } from './common/fields.ts'


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



    const props = {
  expandTrigger: 'hover' as const,
}
 

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

    const submitForm = () => {
        const formInstance = dynamicFormRef
        formInstance.value.validate((valid: boolean) => {
            if (valid) {
                // Perform form submission logic
                console.log(formData);
            } else {
                // Handle form validation errors
            }
        });

    };


    const handleChangeLocation = (value: any) => {
        console.log('Location field changed:', value);
        const location = formFields.flat().find((f) => f.name === 'location');

        formData.county=value[0]
        formData.subcounty=value[1]
        formData.ward=value[2]
        formData.settlement=value[3]

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