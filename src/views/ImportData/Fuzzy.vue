<!-- eslint-disable prettier/prettier -->
<!-- eslint-disable vue/no-deprecated-slot-scope-attribute -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { getParentIds, BatchImportUpsert } from '@/api/settlements'
import { getCountyListApi,getListWithoutGeo } from '@/api/counties'
import { getModelSpecs, getModelRelatives } from '@/api/fields'

import { postBatchHouseholds } from '@/api/households'


import {
    ElButton,
    ElSelect,
    ElTable,
    ElIcon,
    ElTableColumn,
    ElInput,
    ElDialog,
    ElSwitch,
    ElOptionGroup,
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

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { useRouter } from 'vue-router'
import shortid from 'shortid';

const loadingPosting = ref(false)

const { push } = useRouter()

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)



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
const selectedparent = ref()

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
            return (obj.field !== 'id' &&  obj.field !== 'code');
        });

        var fields2 = fields.filter(function (obj) {
            return (obj.field !== 'geom');
        });

        if (selModel === 'project') {
            var additional = {}
            additional.field = 'activities'
            additional.match = ''
            fields2.push(additional)
        }

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
        let na_opt = {}
        na_opt.value = 'none'
        na_opt.label = 'N/A'
        parentOptions.value.push(na_opt)


        //parentKeys.value.push(response.keys)

        // console.log("keys---->", parentKeys.value)
    })

}


const getParentOptions = async () => {

    console.log("parent --Model", theParentModel.value)

    await getListWithoutGeo({
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



    else if (type === 'activity') {
        // fieldSet.value = beneficiary_parcels
        model.value = 'activity'
        parentModel.value = ''
        parent_key.value = ''
        code.value = ''
        // getParentOptions()
    }


    else if (type === 'category') {
        model.value = 'category'
        code.value = 'code'
    }




    else if (type === 'indicator') {
        model.value = 'indicator'
        parentModel.value = 'activity'
        parent_key.value = 'activity_id'
        code.value = 'pcode'
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
        label: 'Monitoring/Evaluation',
        options: [
            {
                value: 'activity',
                label: 'Activities'
            },

            {
                value: 'indicator',
                label: 'Indicators'
            },
            {
                value: 'indicator_category',
                label: 'Indicator Configurations'
            },
            {
                value: 'category',
                label: 'Categories'
            },
        ]
    }
]



const handleSelectParentModel = async (parent: any) => {


    if (parent != 'none') {
        var filtered = parentOptions.value.filter(function (item) {
            return item.value === parent;
        }
        );
        theParentModel.value = parent
        theParentModelField.value = filtered[0].key
        getParentOptions()
    }



    showUploadButton.value = true
    showUploadSpace.value = true
}

// Handler for file upload


const tableData = ref()
const selectOptions = ref()


const selectedValues = ref()

const readXLSX = async (event) => {
 //   console.log('on file change.......', event)
    // console.log('loadingPosting.value.......', loadingPosting.value)


    
    //file.value = event.target.files ? event.target.files[0] : null;   // Direct upload 
    file.value = event   // called from the uplaod funtion 

  //  console.log('The file---->', file)

    readXlsxFile(file.value).then((rows) => {
        const fields = Object.values(rows[0]) //  get all proterit4s of the first feature
      //  console.log("fields-->", fields)

        if (!fields.includes('pcode')) {
            console.log('Has Pcode', fields.includes('pcode')); //true
            ElMessage.error('The uploaded file is missing "pcode" field. Present: [' +fields +']')
            handleReset()
            return 
            
       }

 

        for (let j = 1; j < rows.length; j++) {
            var record = {}
            for (let i = 0; i < fields.length; i++) {
                var f = fields[i]
                var v = rows[j][i]
                record[f] = v
                // console.log(f)
            }
            record['createdBy'] = userInfo.id   // Add a 


            uploadObj.value.push(record) // Push to the temporary holder
        }  // remove header row

     //   console.log('rows-uploadObj------>', uploadObj)
      //  console.log('rows-parentObj------>', parentObj)


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

        if (selectedparent.value != 'none') {
            matchedWithParent.value = uploadObj.value.map(obj => {
                let input = obj.pcode
                const fuse = new Fuse(parentObj.value, options);
               // console.log('Running fuse')

                        //      let results = fuse.search(input);
                         let results;
                        try {
                        results = fuse.search(input);
                  //      console.log(results);
                        } catch (error) {
                 //       console.error("An error occurred during Fuse search:", error);
                        // Handle the error case if needed
                        results = [];
                        }

                        if (results.length > 0) {
                       // console.log(pfield, results[0].item);
                        return {
                            ...obj, // spread existing properties of the object
                            [pfield]: results[0].item.id, // add new property to the object
                            ['county_id']: results[0].item.county_id, // add new property to the object
                            ['subcounty_id']: results[0].item.subcounty_id,  // add new property to the object
                           ['ward_id']: results[0].item.ward_id,  // add new property to the object
                            ['code']: shortid.generate(),
                            //['settlement_id']: results[0].item.settlement_id  // add new property to the object
                        };
                        } else {
                        ElMessage.error("No parent exists with the provided pcode: " + obj.pcode);
                        //handleReset()
                        return {
                            ...obj
                        };
                        }

             
            });
        } else {

            matchedWithParent.value = uploadObj.value
        }


     //   console.log('matched >>>', matchedWithParent.value)

        //--------------------------------------------------------------------------------

        // FUSE match 002 - Mathc the uplaoded  XLXS  fields with the Database Fields 
        //--------------------------------------------------------------------------------
        // Get the columns for the now matched array
        const uploadColumns = Object.keys(matchedWithParent.value[0]); // get the keys of the first object in the array

        // Get the columns from the DB

        const databaseColumns = fieldSet.value.map(obj => obj.field);


      //  console.log('From DB:', databaseColumns)
      //  console.log('From XLSX:', uploadColumns)

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
       //     console.log(field, results)
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


     //   console.log(selectOptions.value)

        show.value = true
        showTable.value = true
     loadingPosting.value = false


    })


}

const options = {
  includeScore: true,
  shouldSort: true,
  keys: ["parent_code"]
};

const pfield = theParentModelField.value;

const xreadXLSX = async (event) => {
  file.value = event;

  const rows = await readXlsxFile(file.value);
  const fields = Object.values(rows[0]);

  if (!fields.includes('pcode')) {
    ElMessage.error('The uploaded file is missing "pcode" field. Present: [' + fields + ']');
    handleReset();
    return;
  }

  uploadObj.value = rows.slice(1).map((row) => {
    const record = {};
    fields.forEach((f, i) => {
      const v = row[i];
      record[f] = v;
    });
    record['createdBy'] = userInfo.id;
    return record;
  });

  if (selectedparent.value != 'none') {
    const fuse = new Fuse(parentObj.value, options);
    matchedWithParent.value = uploadObj.value.map(obj => {
      const { pcode } = obj;
      const results = fuse.search(pcode);
      if (results.length > 0) {
        return {
          ...obj,
          [pfield]: results[0].item.id,
          ['county_id']: results[0].item.county_id,
          ['subcounty_id']: results[0].item.subcounty_id,
          ['ward_id']: results[0].item.ward_id,
          ['code']: shortid.generate(),
        };
      } else {
        ElMessage.error("No parent exists with the provided pcode: " + pcode);
        return { ...obj };
      }
    });
  } else {
    matchedWithParent.value = uploadObj.value;
  }

  const uploadColumns = Object.keys(matchedWithParent.value[0]);
  const databaseColumns = fieldSet.value.map(obj => obj.field);

  const FieldMatchOptions = {
    includeScore: true,
    shouldSort: true,
    threshold: 0.4,
    keys: ["parent_code"]
  };

  tableData.value = databaseColumns.map(field => {
    const fuse = new Fuse(uploadColumns, FieldMatchOptions);
    const results = fuse.search(field);
    return {
      key1: field,
      key2: results.length > 0 ? results[0].item : []
    };
  });

  selectOptions.value = uploadColumns.map(uploadedField => ({
    value: uploadedField,
    label: uploadedField,
    disabled: false
  }));

  selectedValues.value = uploadColumns;

  show.value = true;
  showTable.value = true;
  loadingPosting.value = false;
};



const handleFileUpload = async () => {
    console.log('uploading.....')
     loadingPosting.value = true

    if (fileList.value.length == 0) {
        ElMessage.error('Select a  File first!')
 
    } else {
     disableDoubeUpload.value = true   // Disable the button to prevent double upload
      const rfile = fileList.value[0].raw
    let reader = new FileReader()
        reader.onload = readXLSX(rfile)
    
    }



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
    selectedparent.value = null
    type.value=null
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
    disableDoubeUpload.value=false
}
 
const DisablePostSubmit = ref(false)


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


            });
            return obj;
        });
    }
 


const xhandleSubmitData = async () => {
    console.log(tableData.value)
   console.log(matchedWithParent.value)

    const updatedArr = replaceObjectKeys(matchedWithParent.value, tableData.value);
    console.log(updatedArr)

}




const handleSubmitData = async () => {
    console.log(tableData.value)
    // loadingPosting.value=true
    console.log(matchedWithParent.value)
    DisablePostSubmit.value = true  // Disable the submti button to avoid double sumbissions 
 

    const updatedArr = replaceObjectKeys(matchedWithParent.value, tableData.value);
    console.log(updatedArr)

    var formData = {}
    formData.model = type.value
    formData.data = updatedArr

    // ************** Send data to server ***************** //
    if (type.value == 'households') {
        await postBatchHouseholds(formData)
            .then((response: { data: any }) => {
              
                     push({
                    path: '/settlement/hh/all',
                    name: 'AllHouseholds'
                    })   
             
                    DisablePostSubmit.value=false

            })
            .catch((error) => {
                console.log('Error------>', error.response.data.message)
                ElMessage( {
                    message: error.response.data.message,
                    type: 'error',
                    duration: 3000 // the message will be displayed for 3 seconds before closing
                })
 
                DisablePostSubmit.value=false

            })



    } else {

        await BatchImportUpsert(formData)
            .catch((error) => {
                console.log('Error------>', error.response.data.message)
              //  ElMessage.error(error.response.data.message)
                ElMessage( {
                    message: 'error.response.data.message',
                    type: 'error',
                    duration: 3000 // the message will be displayed for 3 seconds before closing
                })
 
                                 DisablePostSubmit.value = false
            })
            .then((response: { data: any }) => {

                
                push({
                    path: '/data/fuzzy',
                    name: 'Fuzzy'
                }) 
                    
                DisablePostSubmit.value=false
 
            })
    }

  //  loadingPosting.value=false



}


</script>

<template>
    <ContentWrap
v-loading="loadingPosting" element-loading-text="Loading the data.. Please wait......."
:title="t('Upload Excel Data')" :message="t('Ensure you have column codes ')" >

        <div  >
            <div style="display: inline-block;">
            <el-select
v-model="type" :onChange="handleSelectType" filterable clearable placeholder="Select data to import"
                style=" margin-right: 20px">
                <el-option-group v-for=" group in uploadOptions" :key="group.label" :label="group.label">
                    <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
                </el-option-group>
            </el-select>

            <el-select v-model="selectedparent" :onChange="handleSelectParentModel" placeholder="Select Parent Model">
                <el-option v-for="item in parentOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>

            <div style="display: inline-block; margin-left: 20px">
                <el-button :onClick="handleReset" type="primary" :icon="RefreshLeft" />
            </div>

        </div>

        <el-divider border-style="dashed" content-position="left">Upload</el-divider>
        <!-- <el-upload
v-if="showUploadSpace" class="upload-demo"  
            action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"   v-model:file-list="fileList"
            :auto-upload="false"/> -->


         
            <el-upload
                        v-if="showUploadButton"
                        ref="upload"
                        v-model:file-list="fileList"
                        class="upload-demo"
                        action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
                        :limit="1"
                        :on-exceed="handleExceed"
                        :auto-upload="false"
                             >
                        <template #trigger>
                        <el-button type="primary">select file</el-button>
                        </template>
                        <el-button class="ml-3" type="success" @click="handleFileUpload"  :disabled="disableDoubeUpload">
                        upload
                        </el-button>
                        <template #tip>
                        <div class="el-upload__tip text-red">
                            limit 1 file, new file will cover the old file
                        </div>
                        </template>
                    </el-upload>
<!-- 
        <el-button
v-if="showUploadButton" class="mt-4" style="width: 100%" @click="handleFileUpload" type="primary"
            :disabled="disableDoubeUpload">
            Upload<el-icon class="el-icon--right">
                <Upload />
            </el-icon>
        </el-button> -->

        <el-button
v-if="showTable" class="mb-4" style="width: 100%" @click="handleSubmitData" type="success"
            :disabled="DisablePostSubmit">
            Submit<el-icon class="el-icon--right">
                <CaretRight />
            </el-icon>
        </el-button>
        </div>
        


        <el-dialog title="Match Fields" v-model="showTable"   width="60%">
       
            <el-table v-if="showTable" :data="tableData" :size="small">
            <el-table-column prop="key1" label="Database Field" />
            <el-table-column label="From XLSX">
                <template #default="scope">
                    <el-select v-model="scope.row.key2" @change="updateSelect(scope.row, scope.$index)" filterable clearable>
                        <el-option
v-for="(option, index) in selectOptions" :key="index" :label="option.label"
                            :value="option.value" :disabled="option.disabled" />
                    </el-select>
                </template>
            </el-table-column>
        </el-table>
        <template #footer>
      <span class="dialog-footer">
        <el-button @click="showTable = false">Cancel</el-button>
        <el-button type="primary" @click="handleSubmitData ">
          Confirm
        </el-button>
      </span>
    </template>
         </el-dialog>


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

