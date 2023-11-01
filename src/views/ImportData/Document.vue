<!-- eslint-disable prettier/prettier -->
<!-- eslint-disable vue/no-deprecated-slot-scope-attribute -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { getParentIds, BatchImportUpsert, getRoutesList, uploadFilesBatch } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { getModelSpecs, getModelRelatives } from '@/api/fields'

import { postBatchHouseholds } from '@/api/households'
import { getListWithoutGeo } from '@/api/counties'
import { getFilteredHouseholdsByColumn } from '@/api/households'
import { uuid } from 'vue-uuid'


import {
    ElButton,
    ElSelect,
    ElTable,
    ElIcon,
    ElTableColumn,
     ElSwitch,
    ElOptionGroup,
    ElRow,
    ElCol,
    ElSkeleton,
    ElOption
} from 'element-plus'
import { ElUpload } from 'element-plus'
import {
    Upload,
    Refresh,
    CaretRight,
    RefreshLeft,
    Promotion,
    CircleCheckFilled,
    CircleCloseFilled,
    Tools
} from '@element-plus/icons-vue'

import { ref, watch, computed, reactive } from 'vue'
import { ElDivider } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'

import type { UploadProps, UploadUserFile } from 'element-plus'
import readXlsxFile from 'read-excel-file'
import { useVueFuse } from 'vue-fuse'
import Fuse from 'fuse.js';
import { useRouter } from 'vue-router'


const { push } = useRouter()



const settlement = ref()
const settlementOptions = ref([])
const parentObj = ref([])
const value_switch = ref(false)


//// ------------------parameters -----------------------////
const model = ref()          // the model 
const code = ref()  // the parent code as per the imported excel file 
const parent_key = ref()       // the parent foregin key in the model 
const parentModel = ref()      // the parent model
const type = ref()      // the parent model
const matchedWithParent = ref()      // the parent model


///---------------------xlsx-
const file = ref()


//// ------------------parameters -----------------------////
const matchOptions = ref([])
const assocModel = ref()
const uploadObj = ref([])
const matchedObj = ref([])
const theParentModel = ref() // default is settlement for projects
const theParentModelField = ref()

const matchedObjwithparent = ref([])
const fieldSet = ref([])
const show = ref(false)
const showSwitch = ref(false)
const showSettleementSelect = ref(false)
const { t } = useI18n()
const parentOptions = ref([])
const parentKeys = ref([])
const showTable = ref(false)

const showUploadSpace = ref(false)
const showUploadButton = ref(false)
const disableDoubeUpload = ref(false)

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)



function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}




//// ------------------------------------ -------------------------------------//

//id","name","county_id","settlement_type","geom","area","population","code","description"
const DocTypes = ref([])
const getDocumentTypes = async () => {
    const res = await getCountyListApi({
        params: {
            pageIndex: 1,
            limit: 100,
            curUser: 1, // Id for logged in user
            model: 'document_type',
            searchField: 'name',
            searchKeyword: '',
            sort: 'ASC'
        }
    }).then((response: { data: any }) => {
        console.log('Document Typest:', response)
        //tableDataList.value = response.data
        var ret = response.data


        const nestedData = ret.reduce((acc, cur) => {
            const group = cur.group;
            if (!acc[group]) {
                acc[group] = [];
            }
            acc[group].push(cur);
            return acc;
        }, {});

        console.log(nestedData.Map)
        for (let property in nestedData) {
            let opts = nestedData[property];
            var doc = {}
            doc.label = property
            doc.options = []

            opts.forEach(function (arrayItem) {
                let opt = {}
                opt.value = arrayItem.id
                opt.label = arrayItem.type
                doc.options.push(opt)

            })
            DocTypes.value.push(doc)

        }
        console.log(DocTypes)

    })
}
getDocumentTypes()


const getparentOptions = async () => {
    const res = await getListWithoutGeo({
        params: {
            pageIndex: 1,
            limit: 1000,
            curUser: 1, // Id for logged in user
            model: theParentModel.value, //model 
            searchField: 'name',
            searchKeyword: '',
            sort: 'ASC'
        }
    }).then((response: { data: any }) => {
        console.log('Received response:', response)
        //tableDataList.value = response.data
        var ret = response.data


        ret.forEach(function (arrayItem: { id: string; type: string }) {
            var countyOpt = {}
            countyOpt.value = arrayItem.id
            console.log(arrayItem)

            if (arrayItem.contract_number) {
                countyOpt.label = arrayItem.contract_number  
            }
            else if (arrayItem.name) {
                countyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
            }
 
            else {
                countyOpt.label = arrayItem.title + '(' + arrayItem.id + ')'

            }
            console.log(countyOpt)
            parentOptions.value.push(countyOpt)
        })
    })
}


const getparentHouseholdOptions = async (selFilters, selfilterValues) => {
    const formData = {}

    formData.curUser = 1 // Id for logged in user
    formData.model = 'household'
    //-Search field--------------------------------------------
    formData.searchField = ''
    formData.searchKeyword = ''
    //--Single Filter -----------------------------------------

    //formData.assocModel = associated_Model


    formData.associated_multiple_models = []

    //-------------------------
    //console.log(formData)

    // const res = await getHHsByCounty(formData)

    console.log("gettign HHS.........")
    await getFilteredHouseholdsByColumn(formData)
        .then((response) => {
            console.log('Received HHS:', response)
            response.data.forEach(function (arrayItem) {
                console.log('arrayItem ----->', arrayItem)

                //  generate the filter options
                var opt = {}
                opt.value = arrayItem.id
                opt.label = arrayItem.name + '(' + arrayItem.id + ')'
                //  console.log(countyOpt)
                parentOptions.value.push(opt)
            });
        })
        .catch(function (error) {
            console.log('error', error.response.data.message);

        })





}

const uploadOptions = [
    {
        label: 'Settlement',
        options: [
            {
                value: 'settlement',
                label: 'Settlements'
            },

            {
                value: 'project',
                label: 'Projects'
            }
        ]
    },
    {
        label: 'Households',
        options: [
            {
                value: 'households',
                label: 'Households'
            },
            {
                value: 'beneficiary',
                label: 'Beneficiaries'
            },
            {
                value: 'parcel',
                label: 'Parcels'
            },
        ]
    },

    {
        label: 'Facilities',
        options: [
            {
                value: 'health',
                label: 'Health'
            },
            {
                value: 'education',
                label: 'Education'
            },
            {
                value: 'roads',
                label: 'Roads'
            },
            {
                value: 'road_assets',
                label: 'Structures(roads)'
            },
            {
                value: 'water_point',
                label: 'Water'
            },
            {
                value: 'sewer',
                label: 'Sewer'
            },

            {
                value: 'other',
                label: 'Other'
            },

        ]
    },

    {
        label: 'Indicators',
        options: [

            {
                value: 'indicator_category_report',
                label: 'M&E Reports'
            },
        ]
    },
    {
        label: 'Contracts',
        options: [

            {
                value: 'contractor',
                label: 'Contract Documents'
            },
        ]
    },
    {
        label: 'Others',
        options: [

            {
                value: 'other_documents',
                label: 'Other Documents'
            },
        ]
    }
]

 
const document_field = ref()
const hide_parent = ref(false)
 
const handleSelectType = async (type: string) => {
    theParentModel.value = type
    console.log('Selected.....>', type)
    parentOptions.value = []
    showUploadSpace.value = true


    if (type === 'settlement') {
        document_field.value = 'settlement_id'
        getparentOptions()
    }
    else if (type === 'households') {
        document_field.value = 'hh_id'
        getparentHouseholdOptions()
    }

    else if (type === 'beneficiary') {
        document_field.value = 'beneficiary_id'
        getparentOptions()
    }

    else if (type === 'project') {
        document_field.value = 'project_id'
        getparentOptions()

    }

    else if (type === 'contractor') {
        document_field.value = 'contractor_id'
        getparentOptions()

    }

    else if (type === 'health_facility') {
        document_field.value = 'health_facility_id'
        getparentOptions()

    }

    else if (type === 'education_facility') {
        document_field.value = 'education_facility_id'
        getparentOptions()

    }



    else if (type === 'road') {
        document_field.value = 'road_id'
        getparentOptions()

    }

    else if (type === 'road_asset') {
        document_field.value = 'road_asset_id'
        getparentOptions()

    }

    else if (type === 'water_point') {
        document_field.value = 'water_point_id'
        getparentOptions()

    }

    else if (type === 'sewer') {
        document_field.value = 'sewer_id'
        getparentOptions()

    }

    else if (type === 'other_facility') {
        document_field.value = 'other_facility_id'
        getparentOptions()

    }

    else if (type === 'indicator_category_report') {
        document_field.value = 'indicator_category_report'
        getparentOptions()

    }
    else if (type === 'other_documents') {
        //document_field.value = 'indicator_category_report'
        //getparentOptions()
        hide_parent.value=true


    }


    console.log(theParentModel.value)










}


const fileList = ref<UploadUserFile[]>([])





// Handler for file upload


const tableData = ref()
const selectOptions = ref()


const selectedValues = ref()







const prevValue = ref()

const handleReset = async () => {
    selectedValues.value = []
    fileList.value = []
    selectOptions.value = []
    tableData.value = []
    uploadObj.value = []
    theParentModel.value = null
    theParentModelField.value = null
    showUploadButton.value = false
    showUploadSpace.value = false
    showTable.value = false
    console.log('resetting.....')
}
const loadingPosting = ref(false)

const DisablePostSubmit = ref(false)
const handleSubmitData = async () => {
    console.log(fileList)
    loadingPosting.value = true
 
    // const formData = new FormData()
    // for (var i = 0; i < fileList.value.length; i++) {
    //     console.log('------>file', fileList.value[i])
    //     var column = fileList.value[i].field_id
        

    //     console.log('------>Field_ID', fileList.value[i].field_id)

    //     formData.append('files', fileList.value[i].raw)
    //     formData.append('format', fileList.value[i].name.split('.').pop())
    //     formData.append('category', fileList.value[i].type)
    //     // do not append if file not tagged with sett/proj id
    //     if(!hide_parent.value) {
    //         formData.append('field_id', fileList.value[i].field_id)
    //         formData.append(column, fileList.value[i][column])
    //     }
     
    //     formData.append('size', (fileList.value[i].raw.size / 1024 / 1024).toFixed(2))
    //     formData.append('createdBy', userInfo.id)
    //     formData.append('protected', fileList.value[i].protected?fileList.value[i].protected:false)
 
    // }

    // formData.append('code', uuid.v4())



    // console.log('Befoer submit', formData)
    // await uploadFilesBatch(formData)
    //     .then((response: { data: any }) => {
    //         loadingPosting.value = false
    //         if (response.code === "0000") {
    //     // code 0000 is successfule
    //                 push({
    //             path: '/repository/docs',
    //             name: 'RepositoryTagged'
    //             })
    //             }

    //     })

 const formData = new FormData()
  let files = []

  for (var i = 0; i < fileList.value.length; i++) {
    console.log('------>file', fileList.value[i])
    //var format = fileList.value[i].name.split('.').pop() // get file extension
    //  formData.append("file",this.multipleFiles[i],this.fileNames[i]+"_"+dateVar+"."+this.fileTypes[i]);
   // fileTypes.push(format)
    // formData.append('files', fileList.value[i])
    // formData.file = fileList.value[i]

    formData.append('model', theParentModel.value)
    formData.append('createdBy', userInfo.id)

    formData.append('files', fileList.value[i].raw)
    formData.append('format', fileList.value[i].name.split('.').pop())
    formData.append('category', fileList.value[i].type)
   // formData.append('field_id', props.field)
    if(!hide_parent.value) {
            formData.append('field_id', fileList.value[i].field_id)
            formData.append(column, fileList.value[i][column])
        }

    formData.append('protected',  fileList.value[i].protected?fileList.value[i].protected:false)

    formData.append('size', (fileList.value[i].raw.size / 1024 / 1024).toFixed(2))
    formData.append('code', uuid.v4())
    //formData.append(props.field, props.data.id)

   // console.log('formData',props.field)

  }

 // addMoreDocuments.value = false
 console.log('formData',formData)
 const res = await uploadFilesBatch(formData)

 


}

//const beforeUpload = async (file) => {
const beforeUpload: UploadProps['beforeUpload'] = (files) => {


    for (var i = 0; i < files.length; i++) {

        console.log("before uplaod.............", files[i])
        console.log("before uplaod.............", files[i].raw.type)

        const isXls = files[i].raw.type === 'application/vnd.ms-excel'
        const isXlsx = files[i].raw.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        const isPdf = files[i].raw.type === 'application/pdf'
        const isZip = files[i].raw.type === 'application/zip'
        const isDoc = files[i].raw.type === 'application/msword'
        const isDocx = files[i].raw.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        const isPng = files[i].raw.type === 'image/png'
        const isJPG = files[i].raw.type === 'image/jpeg'
        // additionall 
        const isCSV = files[i].raw.type === 'text/csv'
        const isJSON = files[i].raw.type === 'application/json'
        const isPPT = files[i].raw.type === ' application/vnd.ms-powerpoint'
        const isPPTX = files[i].raw.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        const isRAR = files[i].raw.type === 'application/vnd.rar'
        const isTIF = files[i].raw.type === 'image/tiff'
        const isTEXT = files[i].raw.type === 'text/plain'



        const isLt5M = files[i].raw.size / 1024 / 1024 < 50

        if (!isXls && !isXlsx && !isPdf && !isZip && !isDoc && !isDocx && !isPng && !isJPG
            && !isCSV && !isJSON && !isPPT && !isPPTX && !isRAR && !isTIF && !isTEXT
        ) {
            //this.$message.error('Upload only Excel files')
            ElMessage.error(files[i].raw.type + ' is not allowed')

        }
        if (!isLt5M) {
            // this.$message.error('File size should not exceed 5MB')
            ElMessage.error('File size should not exceed 50MB')
        }
        return (isXls || isXlsx || isPdf || isZip || isDoc || isDocx || isPng || isJPG || isCSV || isJSON || isPPT ||
            isPPTX || isRAR || isTIF || isTEXT)
    }
}



const handleFileUpload = async () => {
    // disableDoubeUpload.value = true   // Disable the button to prevent double upload
    const proceed = beforeUpload(fileList.value)

    console.log(proceed)
    if (fileList.value.length == 0) {
        ElMessage.error('Select atleast one!')
    }


    if (proceed   ) {


        if (!hide_parent.value){
            showTable.value = true
        fileList.value.map(file => {
            file['model'] = theParentModel.value // add the model column
            file[document_field.value] = null // add the column to hold selected parent ID
            file['field_id'] = document_field.value // add the column to hold selected parent ID

            return file;
        });
        }
        else {
            showTable.value = true
            fileList.value.map(file => {
            file['model'] = theParentModel.value // add the model column
           // file[document_field.value] = null // add the column to hold selected parent ID
           // file['field_id'] = document_field.value // add the column to hold selected parent ID

            return file;
        });
        }
       
        

    }
     




}





</script>

<template>
    <ContentWrap
:title="t('Upload Documents')" v-loading.fullscreen.lock="loadingPosting"
        element-loading-text="Saving the data.. Please wait.......">


        <el-row :gutter="10">
            <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
          
                <div style="display: inline-block;">
            <el-select
v-model="type" :onChange="handleSelectType" placeholder="Select Model" style=" margin-right: 20px;"
                filterable clearable>
                <el-option-group v-for=" group in uploadOptions" :key="group.label" :label="group.label">
                    <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
                </el-option-group>
            </el-select>

            <div style="display: inline-block; margin-left: 20px">
                <el-button :onClick="handleReset" type="primary" :icon="RefreshLeft" />
            </div>

        </div>
        <el-divider border-style="dashed" content-position="left">Upload</el-divider>
        <el-upload
v-if="showUploadSpace" class="upload-demo" drag :auto-upload="false"
            action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple v-model:file-list="fileList">
            <div class="el-upload__text"> Drop files here or <em>click to upload</em> </div>
        </el-upload>

        <el-button
v-if="showUploadSpace" class="mt-4" style="width: 100%" @click="handleFileUpload" type="primary"
            :disabled="disableDoubeUpload">
            Upload<el-icon class="el-icon--right">
                <Upload />
            </el-icon>
        </el-button>
          </el-col>
        <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16" >
     
            <el-skeleton v-if="!showTable"  :rows="10" animated />

            <el-table v-if="showTable" :data="fileList"  class="tblMatch"  border >
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="type" label="Type">
                <template #default="{ row }">
                    <el-select v-model="row.type" placeholder="Select Type" clearable filterable>
                        <el-option-group v-for="group in DocTypes" :key="group.label" :label="group.label">
                            <el-option
v-for="item in group.options" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-option-group>
                    </el-select>
                </template>
            </el-table-column>

            <el-table-column v-if="!hide_parent" prop="type" :label="toTitleCase(theParentModel)">
                <template #default="{ row }">
                    <el-select v-model="row[document_field]" placeholder="Select" clearable filterable>
                        <el-option
v-for="item in parentOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </template>
            </el-table-column>
            <el-table-column label="Protected">
            <template #default="{ row }">
                <el-switch v-model="row.protected"  />
            </template>
            </el-table-column>

        </el-table>
        <!-- <el-button v-if="showTable" class="mb-4 mt-4" style="width: 20%" @click="handleSubmitData" type="success" :disabled="DisablePostSubmit">
        Submit
        <el-icon class="el-icon--right">
            <CaretRight />
        </el-icon>
    </el-button> -->
    <div v-if="showTable" class="flex mt-4" style="justify-content: flex-end;">
    <el-button type="primary" :icon="Promotion" @click="handleSubmitData" :disabled="DisablePostSubmit">Submit</el-button>
    <el-button type="danger" :onClick="handleReset" >
        Cancel<el-icon class="el-icon--right"><CircleCloseFilled /></el-icon>
    </el-button>
    </div>


    
        </el-col>
    
      </el-row>


  










 
    </ContentWrap>
</template>

<style scoped>
.my-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.custom-icon {
    font-size: 2rem;
}

.table-container {
    height: 400px; /* Adjust the height as needed */
    overflow-y: auto;
  }
</style>


<style scoped>
.tblMatch {
  width: 100%;
  height: 45vh;
}
</style>


  