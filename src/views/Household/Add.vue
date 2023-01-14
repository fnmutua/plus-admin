<script setup lang="ts">
import { Form, FormExpose } from '@/components/Form'
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { reactive, unref, ref } from 'vue'
import {
    ElButton,
    ElSelect,
    ElForm,
    ElFormItem,
    ElInput,
    ElCascader,
    ElOption,
    ElCard,
    ElCol,
    ElIcon,
    ElRow,
    ElDivider,
    ElUpload,
    ElDatePicker,
    ElInputNumber,
    FormRules,
    ElSteps,
    ElStep,
    ElButtonGroup,
    ElSwitch
} from 'element-plus'


import { DocumentAdd, Edit, Plus, Picture, Location, Upload, ArrowRight, Promotion, RefreshLeft } from '@element-plus/icons-vue'


import { getCountyListApi } from '@/api/counties'

import { CreateRecord, deleteDocument, uploadDocuments } from '@/api/settlements'
import { createHousehold } from '@/api/households'

import type { FormInstance } from 'element-plus'
import { uuid } from 'vue-uuid'
import { Icon } from '@iconify/vue';
import documentAttach from '@iconify-icons/ion/document-attach';
import type { UploadProps, UploadUserFile } from 'element-plus'

import { readFile } from 'jsonfile';
import type { UploadInstance } from 'element-plus'
import { useRouter } from 'vue-router'
import * as enums from '@/utils/enums'


const { push } = useRouter()
const fileList = ref([])

const model = 'households'
const settlementOptions = ref([])
const loading = ref(true)



//id","name","county_id","settlement_type","geom","area","population","code","description"
const getSettlements = async () => {
    const res = await getCountyListApi({
        params: {
            pageIndex: 1,
            limit: 100,
            curUser: 1, // Id for logged in user
            model: 'settlement',
            searchField: 'name',
            searchKeyword: '',
            sort: 'ASC'
        }
    }).then((response: { data: any }) => {
        console.log('Received response:', response)
        //tableDataList.value = response.data
        var ret = response.data

        loading.value = false

        ret.forEach(function (arrayItem: { id: string; type: string }) {
            var parentOpt = {}
            parentOpt.value = arrayItem.id
            parentOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
            //  console.log(countyOpt)
            settlementOptions.value.push(parentOpt)
        })
    })
}
getSettlements()



///----------------------------------------------------------------------------------
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
    settlement_id: '',
    name: '',
    gender: '',
    national_id: '',
    kra_pin: '',
    marital_status: '',
    education_level: '',
    residence_type: '',
    length_stay: 0,
    ownership_status: '',
    age_plot_owner: '',
    photo: '',
    age_00_04m: 0,
    age_05_09m: 0,
    age_10_14m: 0,
    age_15_19m: 0,
    age_20_24m: 0,
    age_24_29m: 0,
    age_30_34m: 0,
    age_35_39m: 0,
    age_40_44m: 0,
    age_45_49m: 0,
    age_50_54m: 0,
    age_55_59m: 0,
    age_60_64m: 0,
    age_65_69m: 0,
    age_70_plusm: 0,
    age_00_04f: 0,
    age_05_09f: 0,
    age_10_14f: 0,
    age_15_19f: 0,
    age_20_24f: 0,
    age_24_29f: 0,
    age_30_34f: 0,
    age_35_39f: 0,
    age_40_44f: 0,
    age_45_49f: 0,
    age_50_54f: 0,
    age_55_59f: 0,
    age_60_64f: 0,
    age_65_69f: 0,
    age_70_plusf: 0,
    hh_size: 0,
    terminally_ill: 0,
    ph_disabled: 0,
    orphans: 0,
    ment_disabled: 0,
    hearing_disabled: 0,
    visual_disabled: 0,
    emp_status: '',
    income_level: '',
    type_structure: '',
    struct_owner: '',
    rent_payable: '',
    expense_food: '',
    expense_clothing: '',
    mode_acquisition: '',
    ownership_docs: '',
    shared_ownership: false,
    source_water: '',
    water_cost20l: 0,
    sanitation: '',
    toilet_cost: 0,
    address: '',
    mode_transport: '',
    access_health: '',
    handwashing: '',
    access_education: '',
    distance_to_sch: '',
    lighting_energy: '',
    lighting_energy_cost: 0,
    cooking_energy: '',
    cooking_energy_cost: 0,
    solid_waste: '',
    code: '',
})

const rules = reactive<FormRules>({
    settlement_id: [{ required: true, message: 'Please select a Settlement', trigger: 'blur' }],
    name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
    gender: [{ required: true, message: 'gender is required', trigger: 'blur' }],
    national_id: [{ required: true, message: 'National ID is required', trigger: 'blur' }],
})


function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    })
}



const submitForm = async (formEl: FormInstance | undefined) => {

    console.log("submit................", formEl)
    if (!formEl) return
    await formEl.validate(async (valid, fields) => {
        if (valid) {
            ruleForm.model = model
            ruleForm.code = uuid.v4()
            await createHousehold(ruleForm)

        } else {
            console.log('error submit!', fields)
        }
    })
}


const title = 'Add Household'

const active = ref(0)


const Profile = ref(true)
const Composition = ref(false)
const Employment = ref(false)
const Ownership = ref(false)
const Structures = ref(false)
const Services = ref(false)
const Sanitation = ref(false)
const Waste = ref(false)
const Energy = ref(false)
const Disaster = ref(false)
const SpecialNeeds = ref(false)

const next = () => {
    console.log('Step:', active)

    if (active.value++ > 5) active.value = 0
    if (active.value == 0) {
        Profile.value = true
        Composition.value = false
        Ownership.value = false
        Structures.value = false
        Services.value = false
        Sanitation.value = false
        Waste.value = false
        Energy.value = false
        Energy.value = false
        Employment.value = false
        Disaster.value = false
        SpecialNeeds.value = false

        console.log('Profile', Profile)

    }
    else if (active.value == 1) {
        Profile.value = false
        Composition.value = true
        Ownership.value = false
        Structures.value = false
        Services.value = false
        Sanitation.value = false
        Waste.value = false
        Energy.value = false
        Energy.value = false
        Employment.value = false
        Disaster.value = false
        console.log('Profile', Profile)
        SpecialNeeds.value = false

    }
    else if (active.value == 2) {
        Profile.value = false
        Composition.value = false
        Ownership.value = false
        Structures.value = false
        Services.value = false
        Sanitation.value = false
        Waste.value = false
        Energy.value = false
        Energy.value = false
        Employment.value = false
        Disaster.value = false
        console.log('Profile', Profile)
        SpecialNeeds.value = true

    }
    else if (active.value == 3) {
        Profile.value = false
        Composition.value = false
        Ownership.value = false
        Structures.value = false
        Services.value = false
        Sanitation.value = false
        Waste.value = false
        Energy.value = false
        Energy.value = false
        Employment.value = true
        Disaster.value = false
        console.log('Profile', Profile)
        SpecialNeeds.value = false

    } else if (active.value == 4) {
        Profile.value = false
        Composition.value = false
        Ownership.value = false
        Structures.value = true
        Services.value = false
        Sanitation.value = false
        Waste.value = false
        Energy.value = false
        Energy.value = false
        Employment.value = false
        Disaster.value = false
        SpecialNeeds.value = false

    }
    else if (active.value == 5) {
        Profile.value = false
        Composition.value = false
        Ownership.value = false
        Structures.value = false
        Services.value = true
        Sanitation.value = false
        Waste.value = false
        Energy.value = false
        Energy.value = false
        Employment.value = false
        Disaster.value = false
        SpecialNeeds.value = false

    }
}
const back = () => {
    console.log('Step:', active)

    if (active.value-- > 10) active.value = 0
    if (active.value == 0) {
        Profile.value = true
        Composition.value = false
        Ownership.value = false
        Structures.value = false
        Services.value = false
        Sanitation.value = false
        Waste.value = false
        Energy.value = false
        Energy.value = false
        Employment.value = false
        Disaster.value = false

        console.log('Profile', Profile)

    }
    else if (active.value == 1) {
        Profile.value = false
        Composition.value = true
        Ownership.value = false
        Structures.value = false
        Services.value = false
        Sanitation.value = false
        Waste.value = false
        Energy.value = false
        Energy.value = false
        Employment.value = false
        Disaster.value = false
        console.log('Profile', Profile)

    }
    else if (active.value == 2) {
        Profile.value = false
        Composition.value = false
        Ownership.value = false
        Structures.value = false
        Services.value = false
        Sanitation.value = false
        Waste.value = false
        Energy.value = false
        Energy.value = false
        Employment.value = true
        Disaster.value = false
        console.log('Profile', Profile)


    } else if (active.value == 3) {
        Profile.value = false
        Composition.value = false
        Ownership.value = true
        Structures.value = false
        Services.value = false
        Sanitation.value = false
        Waste.value = false
        Energy.value = false
        Energy.value = false
        Employment.value = false
        Disaster.value = false


    } else if (active.value == 4) {
        Profile.value = false
        Composition.value = false
        Ownership.value = false
        Structures.value = true
        Services.value = false
        Sanitation.value = false
        Waste.value = false
        Energy.value = false
        Energy.value = false
        Employment.value = false
        Disaster.value = false

    }
    else if (active.value == 5) {
        Profile.value = false
        Composition.value = false
        Ownership.value = false
        Structures.value = false
        Services.value = true
        Sanitation.value = false
        Waste.value = false
        Energy.value = false
        Energy.value = false
        Employment.value = false
        Disaster.value = false

    } else if (active.value == 6) {
        Profile.value = false
        Composition.value = false
        Ownership.value = false
        Structures.value = false
        Services.value = false
        Sanitation.value = true
        Waste.value = false
        Energy.value = false
        Energy.value = false
        Employment.value = false
        Disaster.value = false

    } else if (active.value == 7) {
        Profile.value = false
        Composition.value = false
        Ownership.value = false
        Structures.value = false
        Services.value = false
        Sanitation.value = false
        Waste.value = true
        Energy.value = false
        Energy.value = false
        Employment.value = false
        Disaster.value = false

    } else if (active.value == 8) {
        Profile.value = false
        Composition.value = false
        Ownership.value = false
        Structures.value = false
        Services.value = false
        Sanitation.value = false
        Waste.value = false
        Energy.value = true
        Energy.value = false
        Employment.value = false
        Disaster.value = false

    } else if (active.value == 10) {
        Profile.value = false
        Composition.value = false
        Ownership.value = true
        Structures.value = false
        Services.value = false
        Sanitation.value = false
        Waste.value = false
        Energy.value = false
        Energy.value = false
        Employment.value = false
        Disaster.value = true
    }
}


const AddSettlement = () => {
    console.log('Adding settlement')
    push({
        path: '/settlement/add',
        name: 'AddSettlement'
    })
}

</script>

<template>
    <ContentWrap :title="toTitleCase(title)">
        <el-steps :active="active" finish-status="success" align-center style="margin-top: 20px">
            <el-step title="Profile" />
            <el-step title="Composition" />
            <el-step title="Special Needs" />
            <el-step title="Income/Expense" />
            <el-step title="Structures" />
            <el-step title="Services" />

        </el-steps>

        <el-divider />

        <el-form label-position="left" :inline="false" ref="ruleFormRef" :model="ruleForm" :rules="rules"
            label-width="170px" status-icon>

            <el-row :gutter="20" v-if="Profile">
                <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                    <el-form-item label="Settlement" prop="settlement_id">
                        <el-select v-model="ruleForm.settlement_id" filterable placeholder="Select Settlement">
                            <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                        <el-button @click="AddSettlement()" :icon="Plus" />
                    </el-form-item>

                    <el-form-item label="Name" prop="name">
                        <el-input v-model="ruleForm.name" />
                    </el-form-item>

                    <el-form-item label="Gender" prop="gender">
                        <el-select v-model="ruleForm.gender" filterable placeholder="Select">
                            <el-option v-for="item in enums.genderOptions" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                    </el-form-item>

                    <el-form-item label="National ID" prop="national_id">
                        <el-input v-model="ruleForm.national_id" />
                    </el-form-item>
                    <el-form-item label="KRA PIN" prop="kra_pin">
                        <el-input v-model="ruleForm.kra_pin" />
                    </el-form-item>

                </el-col>

                <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                    <el-form-item label="Marital Status" prop="marital_status">
                        <el-select v-model="ruleForm.marital_status" filterable placeholder="Select">
                            <el-option v-for="item in enums.maritalStatusOptions" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                    </el-form-item>

                    <el-form-item label="Education" prop="marital_status">
                        <el-select v-model="ruleForm.education_level" filterable placeholder="Select">
                            <el-option v-for="item in enums.educationLevelOptions" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                    </el-form-item>


                    <el-form-item label="Length of Stay" prop="length_stay">
                        <el-input-number v-model="ruleForm.length_stay" />
                    </el-form-item>

                </el-col>
            </el-row>

            <el-row :gutter="10" v-if="Composition">
                <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
                    <el-form-item label="Girls(0-4)" prop="age_00_04f">
                        <el-input-number v-model="ruleForm.age_00_04f" />
                    </el-form-item>
                    <el-form-item label="Boys(0-4)" prop="age_00_04m">
                        <el-input-number v-model="ruleForm.age_00_04m" />
                    </el-form-item>
                    <el-form-item label="Girls(5-9)" prop="age_05_09f">
                        <el-input-number v-model="ruleForm.age_05_09f" />
                    </el-form-item>

                    <el-form-item label="Boys(5-9)" prop="age_05_09m">
                        <el-input-number v-model="ruleForm.age_05_09m" />
                    </el-form-item>
                    <el-form-item label="Girls(10-14)" prop="age_10_14f">
                        <el-input-number v-model="ruleForm.age_10_14f" />
                    </el-form-item>
                    <el-form-item label="Boys(10-14)" prop="age_10_14m">
                        <el-input-number v-model="ruleForm.age_10_14m" />
                    </el-form-item>

                    <el-form-item label="Girls(15-19)" prop="age_15_19f">
                        <el-input-number v-model="ruleForm.age_15_19f" />
                    </el-form-item>

                    <el-form-item label="Boys(15-19)" prop="age_15_19m">
                        <el-input-number v-model="ruleForm.age_15_19m" />
                    </el-form-item>
                    <el-form-item label="Female(20-24)" prop="age_20_24f">
                        <el-input-number v-model="ruleForm.age_20_24f" />
                    </el-form-item>

                    <el-form-item label="Male(20-24)" prop="age_20_24m">
                        <el-input-number v-model="ruleForm.age_20_24m" />
                    </el-form-item>
                </el-col>

                <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">


                    <el-form-item label="Female(24-29)" prop="age_24_29f">
                        <el-input-number v-model="ruleForm.age_24_29f" />
                    </el-form-item>

                    <el-form-item label="Male(24-29)" prop="age_24_29m">
                        <el-input-number v-model="ruleForm.age_24_29m" />
                    </el-form-item>

                    <el-form-item label="Female(30-34)" prop="age_30_34f">
                        <el-input-number v-model="ruleForm.age_30_34f" />
                    </el-form-item>

                    <el-form-item label="Male(30-34)" prop="age_30_34m">
                        <el-input-number v-model="ruleForm.age_30_34m" />
                    </el-form-item>


                    <el-form-item label="Female(35-39)" prop="age_35_39f">
                        <el-input-number v-model="ruleForm.age_35_39f" />
                    </el-form-item>

                    <el-form-item label="Male(35-39)" prop="age_35_39m">
                        <el-input-number v-model="ruleForm.age_35_39m" />
                    </el-form-item>
                    <el-form-item label="Female(40-44)" prop="age_40_44f">
                        <el-input-number v-model="ruleForm.age_40_44f" />
                    </el-form-item>

                    <el-form-item label="Male(40-44)" prop="age_40_44m">
                        <el-input-number v-model="ruleForm.age_40_44m" />
                    </el-form-item>

                    <el-form-item label="Female(45-49)" prop="age_45_49f">
                        <el-input-number v-model="ruleForm.age_45_49f" />
                    </el-form-item>
                    <el-form-item label="Male(45-49)" prop="age_45_49m">
                        <el-input-number v-model="ruleForm.age_45_49m" />
                    </el-form-item>

                </el-col>

                <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">


                    <el-form-item label="Female(50-54)" prop="age_50_54f">
                        <el-input-number v-model="ruleForm.age_50_54f" />
                    </el-form-item>

                    <el-form-item label="Male(50-54)" prop="age_50_54m">
                        <el-input-number v-model="ruleForm.age_50_54m" />
                    </el-form-item>
                    <el-form-item label="Female(55-59)" prop="age_55_59f">
                        <el-input-number v-model="ruleForm.age_55_59f" />
                    </el-form-item>

                    <el-form-item label="Male(55-59)" prop="age_55_59m">
                        <el-input-number v-model="ruleForm.age_55_59m" />
                    </el-form-item>


                    <el-form-item label="Female(60-64)" prop="age_60_64f">
                        <el-input-number v-model="ruleForm.age_60_64f" />
                    </el-form-item>


                    <el-form-item label="Male(60-64)" prop="age_60_64m">
                        <el-input-number v-model="ruleForm.age_60_64m" />
                    </el-form-item>

                    <el-form-item label="Female(65-69)" prop="age_65_69f">
                        <el-input-number v-model="ruleForm.age_65_69f" />
                    </el-form-item>


                    <el-form-item label="Male(65-69)" prop="age_65_69m">
                        <el-input-number v-model="ruleForm.age_65_69m" />
                    </el-form-item>

                    <el-form-item label="Female(70+)" prop="age_70_plusf">
                        <el-input-number v-model="ruleForm.age_70_plusf" />
                    </el-form-item>


                    <el-form-item label="Male(70+)" prop="age_70_plusm">
                        <el-input-number v-model="ruleForm.age_70_plusm" />
                    </el-form-item>

                </el-col>
            </el-row>

            <el-row :gutter="20" v-if="SpecialNeeds">
                <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">

                    <el-form-item label="Orphans" prop="orphans">
                        <el-input-number v-model="ruleForm.orphans" />
                    </el-form-item>

                    <el-form-item label="Physically Disabled" prop="ph_disabled">
                        <el-input-number v-model="ruleForm.terminally_ill" />
                    </el-form-item>

                    <el-form-item label="Visual Disability" prop="visual_disabled">
                        <el-input-number v-model="ruleForm.visual_disabled" />
                    </el-form-item>


                </el-col>

                <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">

                    <el-form-item label="Mental Disability" prop="ment_disabled">
                        <el-input-number v-model="ruleForm.ment_disabled" />
                    </el-form-item>

                    <el-form-item label="Hearing Disability" prop="hearing_disabled">
                        <el-input-number v-model="ruleForm.hearing_disabled" />
                    </el-form-item>


                    <el-form-item label="Terminally ill" prop="terminally_ill">
                        <el-input-number v-model="ruleForm.terminally_ill" />
                    </el-form-item>

                </el-col>
            </el-row>



            <el-row :gutter="20" v-if="Employment">
                <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                    <el-form-item label="Employment" prop="emp_status">
                        <el-select v-model="ruleForm.emp_status" filterable placeholder="Select">
                            <el-option v-for="item in enums.emp_status" :key="item" :label="item" :value="item" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="Income" prop="income_level">
                        <el-select v-model="ruleForm.income_level" filterable placeholder="Select">
                            <el-option v-for="item in enums.income_level" :key="item" :label="item" :value="item" />
                        </el-select>
                    </el-form-item>

                    <el-divider content-position="left">Expenditure</el-divider>

                    <el-form-item label="Rent" prop="rent_payable">
                        <el-select v-model="ruleForm.rent_payable" filterable placeholder="Select">
                            <el-option v-for="item in enums.money_level" :key="item" :label="item" :value="item" />
                        </el-select>
                    </el-form-item>

                    <el-form-item label="Food" prop="expense_food">
                        <el-select v-model="ruleForm.expense_food" filterable placeholder="Select">
                            <el-option v-for="item in enums.money_level" :key="item" :label="item" :value="item" />
                        </el-select>
                    </el-form-item>

                    <el-form-item label="Clothing" prop="expense_clothing">
                        <el-select v-model="ruleForm.expense_clothing" filterable placeholder="Select">
                            <el-option v-for="item in enums.money_level" :key="item" :label="item" :value="item" />
                        </el-select>
                    </el-form-item>


                </el-col>
            </el-row>
            <el-row :gutter="20" v-if="Structures">
                <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                    <el-form-item label="Tenure" prop="residence_type">
                        <el-select v-model="ruleForm.residence_type" filterable placeholder="Select">
                            <el-option v-for="item in enums.residenceOptions" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                    </el-form-item>

                    <el-form-item label="Mode of Acquisition" prop="mode_acquisition">
                        <el-select v-model="ruleForm.mode_acquisition" filterable placeholder="Select">
                            <el-option v-for="item in enums.acqusitionMode" :key="item" :label="item" :value="item" />
                        </el-select>
                    </el-form-item>

                    <el-form-item label="Documents" prop="ownership_docs">
                        <el-select v-model="ruleForm.ownership_docs" filterable placeholder="Select">
                            <el-option v-for="item in enums.typeofDocumentation" :key="item" :label="item"
                                :value="item" />
                        </el-select>
                    </el-form-item>


                    <el-form-item label="Ownership" prop="ownership_docs">
                        <el-switch v-model="ruleForm.shared_ownership" class="mb-2"
                            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" active-text="Shared"
                            inactive-text="Not Shared" />
                    </el-form-item>

                </el-col>
            </el-row>

            <el-row :gutter="20" v-if="Services">
                <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
                    <el-form-item label="Source of Water" prop="source_water">
                        <el-select v-model="ruleForm.source_water" filterable placeholder="Select">
                            <el-option v-for="item in enums.sources_waterOptions" :key="item" :label="item"
                                :value="item" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="Cost for 20L(Ksh)" prop="water_cost20l">
                        <el-input-number v-model="ruleForm.water_cost20l" />
                    </el-form-item>
                    <el-form-item label="Sanitation Services" prop="sanitation">
                        <el-select v-model="ruleForm.sanitation" filterable placeholder="Select">
                            <el-option v-for="item in enums.sanitationOptions" :key="item" :label="item"
                                :value="item" />
                        </el-select>
                    </el-form-item>

                    <el-form-item label="Cost for single use (toilet)" prop="toilet_cost">
                        <el-input-number v-model="ruleForm.toilet_cost" />
                    </el-form-item>
                    <el-form-item label="Handwashing Equipment" prop="handwashing">
                        <el-select v-model="ruleForm.handwashing" filterable placeholder="Select">
                            <el-option v-for="item in enums.handwashingOptions" :key="item" :label="item"
                                :value="item" />
                        </el-select>
                    </el-form-item>

                </el-col>
                <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
                    <el-form-item label="Solid Waste" prop="solid_waste">
                        <el-select v-model="ruleForm.solid_waste" filterable placeholder="Select">
                            <el-option v-for="item in enums.solid_wasteOptions" :key="item" :label="item"
                                :value="item" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="Access to health Facility" prop="access_health">
                        <el-select v-model="ruleForm.access_health" filterable placeholder="Select">
                            <el-option v-for="item in enums.access_healthOptions" :key="item" :label="item"
                                :value="item" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="Mode of Transport" prop="mode_transport">
                        <el-select v-model="ruleForm.mode_transport" filterable placeholder="Select">
                            <el-option v-for="item in enums.mode_transportOptions" :key="item" :label="item"
                                :value="item" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="Schools Attended" prop="access_education">
                        <el-select v-model="ruleForm.access_education" filterable placeholder="Select">
                            <el-option v-for="item in enums.educationOptions" :key="item" :label="item" :value="item" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="Distance to School" prop="distance_to_sch">
                        <el-select v-model="ruleForm.distance_to_sch" filterable placeholder="Select">
                            <el-option v-for="item in enums.educationDistanceOptions" :key="item" :label="item"
                                :value="item" />
                        </el-select>
                    </el-form-item>

                </el-col>
                <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">

                    <el-form-item label="Lighting Energy" prop="lighting_energy">
                        <el-select v-model="ruleForm.lighting_energy" filterable placeholder="Select">
                            <el-option v-for="item in enums.lightingOptions" :key="item" :label="item" :value="item" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="Lighting Energy Costs" prop="lighting_energy_cost">
                        <el-input-number v-model="ruleForm.lighting_energy_cost" />
                    </el-form-item>

                    <el-form-item label="Cooking Energy" prop="cooking_energy">
                        <el-select v-model="ruleForm.cooking_energy" filterable placeholder="Select">
                            <el-option v-for="item in enums.cookingOptions" :key="item" :label="item" :value="item" />
                        </el-select>
                    </el-form-item>

                    <el-form-item label="Cooking Energy Costs" prop="cooking_energy_cost">
                        <el-input-number v-model="ruleForm.cooking_energy_cost" />
                    </el-form-item>
                </el-col>
            </el-row>





        </el-form>
        <el-button style="margin-top: 12px" @click="back">Back</el-button>
        <el-button style="margin-top: 12px" @click="next">Next</el-button>
        <el-button style="margin-top: 12px" @click="submitForm(ruleFormRef)">Submit</el-button>


    </ContentWrap>
</template>

