<!-- eslint-disable prettier/prettier -->
<!-- eslint-disable vue/no-deprecated-slot-scope-attribute -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { getParentIds, BatchImportUpsert } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { getModelSpecs, getModelRelatives } from '@/api/fields'

import { postBatchHouseholds } from '@/api/households'


import {
    ElButton,
    ElSelect,
    ElTable,
    ElIcon,
    ElTableColumn,
    ElInput,
    ElSwitch,
    ElOption
} from 'element-plus'
import { ElUpload } from 'element-plus'
import {
    Upload,
    Refresh,
    CaretRight,
    RefreshLeft,
    Tools
} from '@element-plus/icons-vue'

import { ref, watch, computed, reactive } from 'vue'
import { ElDivider } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'

import type { UploadProps, UploadUserFile } from 'element-plus'
import readXlsxFile from 'read-excel-file'
import { useVueFuse } from 'vue-fuse'
import Fuse from 'fuse.js';



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



function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}
const getModeldefinition = async (selModel) => {

    console.log(selModel)
    var formData = {}
    formData.model = selModel
    console.log("gettign fields")


    await getModelSpecs(formData).then((response) => {

        var data = response.data

        var fields = data.filter(function (obj) {
            return (obj.field !== 'id');
        });

        var fields2 = fields.filter(function (obj) {
            return (obj.field !== 'geom');
        });

        console.log("fields:", fields2)
        //health_facility_fields.value = response.data
        fieldSet.value = fields2
    })

    await getModelRelatives(formData).then((response) => {
        console.log(response)
        response.models.forEach(function (relative) {
            var parentOpt = {}
            parentOpt.value = relative.model
            parentOpt.label = toTitleCase(relative.model)
            parentOpt.key = relative.key

            parentOptions.value.push(parentOpt)
        })

        //parentKeys.value.push(response.keys)

        // console.log("keys---->", parentKeys.value)
    })

}


const getParentOptions = async () => {

    console.log("parent --Model", theParentModel.value)

    await getCountyListApi({
        params: {
            pageIndex: 1,
            limit: 100,
            curUser: 1, // Id for logged in user
            model: theParentModel.value,
            searchField: 'name',
            assocModel: '',
            searchKeyword: '',
            sort: 'ASC'
        }
    }).then((response: { data: any }) => {

        //tableDataList.value = response.data
        const ret = response.data
        console.log('Received response:', ret)


        parentObj.value = ret.map(elem => {
            elem[parent_key.value] = elem.id    // add the parent_key as is representd on the child 
            elem['parent_code'] = elem.code     // add the parent  as is representd on the child 
            return elem;
        });



        console.log('Received 3:', parentObj.value)


        ret.forEach(function (arrayItem: { id: string; type: string }) {
            var settOpt = {}
            settOpt.value = arrayItem.id
            settOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
            //  console.log(countyOpt)
            settlementOptions.value.push(settOpt)
        })

        console.log('Options', settlementOptions)
    })
}





const handleSelectType = async (type: any) => {
    type = type
    console.log('Selected.....>', type)
    parentOptions.value = []
    getModeldefinition(type)

    if (type != 'settlement' && !value_switch.value) {
        showSettleementSelect.value = true
        showSwitch.value = true
    } else {
        showSettleementSelect.value = false
        showSwitch.value = false

    }


    if (type === 'settlement') {
        model.value = 'settlement'
        parentModel.value = 'county'
        parent_key.value = 'county_id'
        code.value = 'county_code'
        // fieldSet.value = settlement_fields
        // getParentOptions()

        console.log('settlements------>', type)
    } else if (type === 'parcel') {

        model.value = 'parcel'
        parentModel.value = 'settlement'
        parent_key.value = 'settlement_id'
        code.value = 'pcode'
        // fieldSet.value = settlement_fields
        //  getParentOptions()


    }
    else if (type === 'households') {
        model.value = 'households'
        parentModel.value = 'settlement'
        parent_key.value = 'settlement_id'
        code.value = 'pcode'

    }

    else if (type === 'beneficiary') {
        // fieldSet.value = beneficiary_fields
        model.value = 'beneficiary'
        parentModel.value = 'households'
        parent_key.value = 'hh_id'

        code.value = 'pcode'
        //assocModel.value = 'settlement'
        //   getParentOptions()
    }



    else if (type === 'intervention') {
        //fieldSet.value = interventions_fields
        model.value = 'intervention'
        parentModel.value = 'settlement'
        parent_key.value = 'settlement_id'
        code.value = 'pcode'
        //   getParentOptions()
    }


    else if (type === 'project') {
        //fieldSet.value = interventions_fields
        model.value = 'project'
        parentModel.value = theParentModel.value
        parent_key.value = theParentModelField.value
        code.value = 'pcode'
        //  getParentOptions()
    }


    else if (type === 'beneficiary_parcel') {
        // fieldSet.value = beneficiary_parcels
        model.value = 'beneficiary_parcel'
        parentModel.value = 'beneficiary'
        parent_key.value = 'beneficiary_id'
        code.value = 'pcode'
        //   getParentOptions()
    }



    else if (type === 'health_facility') {
        // fieldSet.value = beneficiary_parcels
        model.value = 'health_facility'
        parentModel.value = 'settlement'
        parent_key.value = 'settlement_id'
        code.value = 'pcode'
        // getParentOptions()
    }

    else if (type === 'category') {
        model.value = 'category'
        code.value = 'code'
    }


    else if (type === 'indicator') {
        model.value = 'indicator'
        code.value = 'code'
    }






}


const fileList = ref<UploadUserFile[]>([])



const uploadOptions = [
    {
        label: 'Settlement',
        options: [
            {
                value: 'settlement',
                label: 'Settlements'
            },
            {
                value: 'parcel',
                label: 'Parcels'
            },
            {
                value: 'project',
                label: 'Projects'
            },
            {
                value: 'intervention',
                label: 'Interventions'
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
                value: 'beneficiary_parcel',
                label: 'Parcel Owners'
            }
        ]
    },
    {
        label: 'Facilities',
        options: [
            {
                value: 'health_facility',
                label: 'Health Facilities'
            },
            {
                value: 'road',
                label: 'Roads'
            },
            {
                value: 'path',
                label: 'Paths'
            }
        ]
    },
    {
        label: 'Indicators',
        options: [
            {
                value: 'category',
                label: 'Categories'
            },
            {
                value: 'indicator',
                label: 'Indicators'
            },
            {
                value: 'indicator_category',
                label: 'Indicator Configurations'
            },
        ]
    }
]



const handleSelectParentModel = async (parent: any) => {

    var filtered = parentOptions.value.filter(function (item) {
        return item.value === parent;
    }
    );

    console.log('newArray', filtered[0].key)

    theParentModel.value = parent
    theParentModelField.value = filtered[0].key
    // if (parent === 'county') {
    //   theParentModelField.value = "county_id"

    // }
    // else if (parent === 'settlement') {
    //   theParentModelField.value = "settlement_id"
    // }

    // console.log(theParentModel.value)
    // console.log(theParentModelField.value)

    getParentOptions()

    showUploadButton.value = true
    showUploadSpace.value = true
}

// Handler for file upload


const tableData = ref()
const selectOptions = ref()


const selectedValues = ref()

const readXLSX = async (event) => {
    console.log('on file change.......', event)
    //file.value = event.target.files ? event.target.files[0] : null;   // Direct upload 
    file.value = event   // called from the uplaod funtion 

    console.log('The file---->', file)

    readXlsxFile(file.value).then((rows) => {
        const fields = Object.values(rows[0]) //  get all proterit4s of the first feature
        console.log("fields-->", fields)


        for (let j = 1; j < rows.length; j++) {
            var record = {}
            for (let i = 0; i < fields.length; i++) {
                var f = fields[i]
                var v = rows[j][i]
                record[f] = v
                // console.log(f)
            }

            uploadObj.value.push(record) // Push to the temporary holder
        }  // remove header row

        console.log('rows-uploadObj------>', uploadObj)
        console.log('rows-parentObj------>', parentObj)


        const options = {
            // isCaseSensitive: false,
            includeScore: true,
            shouldSort: true,
            // includeMatches: false,
            // findAllMatches: false,
            // minMatchCharLength: 1,
            // location: 0,
            //  threshold: 0.6,
            // distance: 100,
            // useExtendedSearch: false,
            // ignoreLocation: false,
            // ignoreFieldNorm: false,
            // fieldNormWeight: 1,
            keys: [
                "parent_code"
            ]
        };

        var pfield = theParentModelField.value

        //--------------------------------------------------------------------------------

        // FUSE match 001 - Mathc the uplaoded  XLXS file with the paretn based on pcode
        //--------------------------------------------------------------------------------
        // Use the map() method to add a new property to each object
        matchedWithParent.value = uploadObj.value.map(obj => {
            let input = obj.pcode
            const fuse = new Fuse(parentObj.value, options);

            let results = fuse.search(input);
            console.log(results[0].item)

            return {
                ...obj, // spread existing properties of the object
                [pfield]: results[0].item.id, // add new property to the object
                ['county_id']: results[0].item.county_id, // add new property to the object
                ['subcounty_id']: results[0].item.subcounty_id,  // add new property to the object
                ['settlement_id']: results[0].item.settlement_id  // add new property to the object

            };
        });

        console.log(matchedWithParent.value)

        //--------------------------------------------------------------------------------

        // FUSE match 002 - Mathc the uplaoded  XLXS  fields with the Database Fields 
        //--------------------------------------------------------------------------------
        // Get the columns for the now matched array
        const uploadColumns = Object.keys(matchedWithParent.value[0]); // get the keys of the first object in the array

        // Get the columns from the DB

        const databaseColumns = fieldSet.value.map(obj => obj.field);


        console.log('From DB:', databaseColumns)
        console.log('From XLSX:', uploadColumns)

        const FieldMatchOptions = {
            // isCaseSensitive: false,
            includeScore: true,
            shouldSort: true,
            // includeMatches: false,
            // findAllMatches: false,
            // minMatchCharLength: 1,
            // location: 0,
            threshold: 0.4,   // anythong beyond 0.4 is ignored 
            // distance: 100,
            // useExtendedSearch: false,
            // ignoreLocation: false,
            // ignoreFieldNorm: false,
            // fieldNormWeight: 1,
            keys: [
                "parent_code"
            ]
        };


        // Match the Database fields with the Uplaoded fields 
        tableData.value = databaseColumns.map(field => {
            let input = field
            const fuse = new Fuse(uploadColumns, FieldMatchOptions);

            let results = fuse.search(input);
            console.log(field, results)
            let obj = {}
            obj.key1 = field
            if (results.length > 0) {
                obj.key2 = results[0].item
            } else {
                obj.key2 = []
            }
            return obj
        });


        selectOptions.value = uploadColumns.map(uploadedField => {
            let obj = {}
            obj.value = uploadedField
            obj.label = uploadedField
            obj.disabled = false
            return obj

        });

        selectedValues.value = uploadColumns


        console.log(selectOptions.value)

        show.value = true
        showTable.value = true


    })


}



const handleFileUpload = async () => {
    disableDoubeUpload.value = true   // Disable the button to prevent double upload
    if (fileList.value.length == 0) {
        ElMessage.error('Select a  File first!')
    }

    const rfile = fileList.value[0].raw
    let reader = new FileReader()
    reader.onload = readXLSX(rfile)


}



const prevValue = ref()

const updateSelect = async (row, index) => {

    // Remove the previously selected value for this row from the selectedValues array
    prevValue.value = selectedValues.value[index];


    if (prevValue.value) {
        const prevIndex = selectOptions.value.findIndex((option) => option.value === prevValue.value);
        if (prevIndex !== -1) {
            selectOptions.value[prevIndex].disabled = false;
        }
    }

    // Disable the selected value in the selectOptions array
    const selectedIndex = selectOptions.value.findIndex((option) => option.value === row.key2);
    if (selectedIndex !== -1) {
        selectOptions.value[selectedIndex].disabled = true;
    }

    // Update the selectedValues array
    selectedValues.value[index] = row.key2;

    console.log('selectedValues', selectedValues)
}
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
}
const loadingPosting = ref(false)

const DisablePostSubmit = ref(false)
const handleSubmitData = async () => {
    console.log(tableData.value)
    console.log(matchedWithParent.value)
    DisablePostSubmit.value = true  // Disable the submti button to avoid double sumbissions 
    loadingPosting.value = true  // Display saving message.....


    function replaceObjectKeys(arr, dict) {
        return arr.map(obj => {
            const updatedObj = {};
            Object.keys(obj).forEach(key => {

                const filteredDict = dict.filter(itm => itm.key2 == key);
                //let correct_key = filteredDict[0].key1
                console.log(key, '|', filteredDict[0])

                if (filteredDict[0] !== undefined) {
                    updatedObj[dict[key]] = filteredDict[0].key1;
                    let newKey = filteredDict[0].key1;
                    // Rename 'oldKey' to 'newKey'
                    obj[newKey] = obj[key];
                    // Remove old key if different form the new Key 
                    if (newKey !== key) {
                        delete obj[key];
                    }


                }

                //   updatedObj[dict[key]] = filteredDict[0].key1;
                //   console.log(updatedObj)

                // if (dict[key]) {
                //     updatedObj[dict[key]] = obj[key];
                // } else {
                //     updatedObj[key] = obj[key];
                // }
            });
            return obj;
        });
    }

    const updatedArr = replaceObjectKeys(matchedWithParent.value, tableData.value);
    console.log(updatedArr)

    var formData = {}
    formData.model = type.value
    formData.data = updatedArr

    // ************** Send data to server ***************** //
    if (type.value == 'households') {
        await postBatchHouseholds(formData)
            .then((response: { data: any }) => {
                loadingPosting.value = false
            })
            .catch((error) => {
                console.log('Error------>', error.response.data.message)
                ElMessage.error(error.response.data.message)
            })



    } else {

        await BatchImportUpsert(formData)
            .catch((error) => {
                console.log('Error------>', error.response.data.message)
                ElMessage.error(error.response.data.message)
            })
            .then((response: { data: any }) => {
                loadingPosting.value = false
            })
    }





}


</script>

<template>
    <ContentWrap :title="t('Upload Excel Data')" :message="t('Ensure you have column codes ')" v-loading="loadingPosting"
        element-loading-text="Saving the data.. Please wait.......">

        <div style="display: inline-block;">
            <el-select v-model="type" :onChange="handleSelectType" placeholder="Select data to import"
                style=" margin-right: 20px">
                <el-option-group v-for=" group in uploadOptions" :key="group.label" :label="group.label">
                    <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
                </el-option-group>
            </el-select>

            <el-select v-model="parent" :onChange="handleSelectParentModel" placeholder="Select Parent Model">
                <el-option v-for="item in parentOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>

            <div style="display: inline-block; margin-left: 20px">
                <el-button :onClick="handleReset" type="primary" :icon="RefreshLeft" />
            </div>

        </div>

        <el-divider border-style="dashed" content-position="left">Upload</el-divider>
        <el-upload v-if="showUploadSpace" class="upload-demo" drag
            action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple v-model:file-list="fileList"
            :auto-upload="false">
            <div class="el-upload__text"> Drop xlsx file here or <em>click to upload</em> </div>
        </el-upload>
        <el-button v-if="showUploadButton" class="mt-4" style="width: 100%" @click="handleFileUpload" type="primary"
            :disabled="disableDoubeUpload">
            Upload<el-icon class="el-icon--right">
                <Upload />
            </el-icon>
        </el-button>

        <el-table v-if="showTable" :data="tableData" :size="small">
            <el-table-column prop="key1" label="Database Field" />
            <el-table-column label="From XLSX">
                <template #default="scope">
                    <el-select v-model="scope.row.key2" @change="updateSelect(scope.row, scope.$index)" clearable>
                        <el-option v-for="(option, index) in selectOptions" :key="index" :label="option.label"
                            :value="option.value" :disabled="option.disabled" />
                    </el-select>
                </template>
            </el-table-column>
        </el-table>
        <el-button v-if="showTable" class="mb-4" style="width: 100%" @click="handleSubmitData" type="success"
            :disabled="DisablePostSubmit">
            Submit<el-icon class="el-icon--right">
                <CaretRight />
            </el-icon>
        </el-button>
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
</style>

