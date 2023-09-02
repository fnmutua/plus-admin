<!-- eslint-disable prettier/prettier -->
<!-- eslint-disable vue/no-deprecated-slot-scope-attribute -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { getParentIds,   BatchImportUpsert } from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo ,getEntitiesByCode} from '@/api/counties'
import { getModelSpecs, getModelRelatives } from '@/api/fields'

import { postBatchHouseholds } from '@/api/households'
 

import {
    ElButton,
    ElSelect,
    ElTable,
    ElIcon,
    ElTableColumn,
    ElScrollbar,
    ElInput,
    ElDialog,
    ElSwitch,
    ElSkeleton,
    ElOptionGroup,
    ElCol, ElRow,
    ElOption
} from 'element-plus'
import { ElUpload } from 'element-plus'
import {
    Upload,
    Refresh,
    CaretRight,
    RefreshLeft,
    UploadFilled,
    Tools
} from '@element-plus/icons-vue'

import { ref, watch, computed, reactive } from 'vue'
import { ElDivider } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'

import type { UploadProps, UploadUserFile } from 'element-plus'


import { useVueFuse } from 'vue-fuse'
import Fuse from 'fuse.js';

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { useRouter } from 'vue-router'
import shortid from 'shortid';


import { readSheetNames } from 'read-excel-file'

import readXlsxFile from 'read-excel-file'



const loadingPosting = ref(false)

const { push } = useRouter()

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)



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
const uploadObj = ref([])
const theParentModel = ref() // default is settlement for projects
const theParentModelField = ref()

const fieldSet = ref([])
const show = ref(false)
const showSwitch = ref(false)
const showSettleementSelect = ref(false)
const { t } = useI18n()
const parentOptions = ref([])
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

const xgetModeldefinition = async (selModel) => {

    console.log(selModel)
    var formData = {}
    formData.model = selModel
    console.log("gettign fields")


    await getModelSpecs(formData).then((response) => {

        var data = response.data

        var fields = data.filter(function (obj) {
            return (obj.field !== 'id' && obj.field !== 'code');
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
 
        console.log('settlements------>', type)
    } else if (type === 'parcel') {

        model.value = 'parcel'
        parentModel.value = 'settlement'
        parent_key.value = 'settlement_id'
        code.value = 'pcode'
        // fieldSet.value = settlement_fields
 

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
     }



    else if (type === 'intervention') {
        //fieldSet.value = interventions_fields
        model.value = 'intervention'
        parentModel.value = 'settlement'
        parent_key.value = 'settlement_id'
        code.value = 'pcode'
     }


    else if (type === 'project') {
        //fieldSet.value = interventions_fields
        model.value = 'project'
        parentModel.value = theParentModel.value
        parent_key.value = theParentModelField.value
        code.value = 'pcode'
     }


    else if (type === 'beneficiary_parcel') {
        // fieldSet.value = beneficiary_parcels
        model.value = 'beneficiary_parcel'
        parentModel.value = 'beneficiary'
        parent_key.value = 'beneficiary_id'
        code.value = 'pcode'
     }



    else if (type === 'health_facility') {
        // fieldSet.value = beneficiary_parcels
        model.value = 'health_facility'
        parentModel.value = 'settlement'
        parent_key.value = 'settlement_id'
        code.value = 'pcode'
     }



    else if (type === 'activity') {
        // fieldSet.value = beneficiary_parcels
        model.value = 'activity'
        parentModel.value = ''
        parent_key.value = ''
        code.value = ''
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
     }

    console.log(theParentModel.value, theParentModelField.value)

    showUploadButton.value = true
    showUploadSpace.value = true
}

// Handler for file upload


const tableData = ref()


const selectedSheet = ref()
const sheets = ref([])


const getModeldefinition = async (selModel) => {

console.log(selModel)
var formData = {}
formData.model = selModel
console.log("gettign fields")


await getModelSpecs(formData).then((response) => {

    var data = response.data

    var fields = data.filter(function (obj) {
        return (obj.field !== 'id' && obj.field !== 'code');
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



const selectedValues = ref()
const selectOptions = ref([])

const getParentOptions = async (pcodes) => {
console.log("parent --Model", theParentModel.value)
await getEntitiesByCode({
    params: {
        pageIndex: 1,
        limit: 100,
        curUser: 1, // Id for logged in user
        model: theParentModel.value,
        code:pcodes,
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


    
        console.log('rows-uploadObj------>', uploadObj.value)
        console.log('rows-parentObj------>', parentObj.value)
        
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

        console.log('matched >>>', matchedWithParent.value)

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
              threshold: 0.3,   // anythong beyond 0.4 is ignored 
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
        const uniqueKey2Values = new Set(); // To keep track of unique key2 values
        tableData.value = databaseColumns.map(field => {
            let input = field;
            const fuse = new Fuse(uploadColumns, FieldMatchOptions);

            let results = fuse.search(input);

            let obj = {};
            obj.key1 = field;

            if (results.length > 0) {
                const key2 = results[0].item;

                if (!uniqueKey2Values.has(key2)) {
                    uniqueKey2Values.add(key2);
                    obj.key2 = key2;
                   // obj.disabled = true;
                } else {
                    obj.key2 = ''; // Duplicate, so set as empty array
                    obj.disabled = false;

                }

                let opt = {}
                opt.value = obj.key2 
                opt.label = obj.key2 
                //opt.disabled = obj.disabled;
                console.log('Add Options', opt)
        
                if ( obj.key2 !='') {
                    selectOptions.value.push(opt)   
                }
            }


            else {
                obj.key2 = [];
                obj.disabled = false;

                    }

                    return obj;
                });


            //selectOptions.value = [];
            for (let i = 0; i < uploadColumns.length; i++) {
                const uploadedField = uploadColumns[i];

                // Check if the uploadedField is already in selectOptions
                const exists = selectOptions.value.some(option => option.value === uploadedField);

                if (!exists) {
                    let obj = {};
                    obj.value = uploadedField;
                    obj.label = uploadedField;
                    obj.disabled = false;
                    selectOptions.value.push(obj);
                }
            }

            console.log(" selectOptions.value ", selectOptions.value )


                //    selectedValues.value = uploadColumns

                    // Initialize selectOptions with objects containing values, labels, and disabled status
                    selectedValues.value = selectOptions.value.map(opt => opt.value);

                    console.log("selectedValues.value -->1", selectedValues.value);


                //   console.log(selectOptions.value)

                     showTable.value = true
  

            console.log('matchedColumns  tableData>>>', tableData)


 
})
}


const getSheets = async (file) => {

    console.log("attmept, read", file)

    file.value = file // called from the uplaod funtion 


    readSheetNames(file).then((sheetNames) => {

        console.log('sheetNames : ' + JSON.stringify(sheetNames));
        sheets.value = sheetNames
    })



    // reset later 
    loadingPosting.value = false



    //     readXlsxFile(file.value).then((rows) => {
    //         const fields = Object.values(rows[0]) //  get all proterit4s of the first feature
    //       //  console.log("fields-->", fields)

    //         if (!fields.includes('pcode')) {
    //             console.log('Has Pcode', fields.includes('pcode')); //true
    //             ElMessage.error('The uploaded file is missing "pcode" field. Present: [' +fields +']')

    //             return 

    //        }



    //         for (let j = 1; j < rows.length; j++) {
    //             var record = {}
    //             for (let i = 0; i < fields.length; i++) {
    //                 var f = fields[i]
    //                 var v = rows[j][i]
    //                 record[f] = v
    //              }
    //             record['createdBy'] = userInfo.id   // Add a 


    //             uploadObj.value.push(record) // Push to the temporary holder
    //         }  // remove header row

    //      //   console.log('rows-uploadObj------>', uploadObj)
    //       //  console.log('rows-parentObj------>', parentObj)


    //         const options = {
    //             // isCaseSensitive: false,
    //             includeScore: true,
    //             shouldSort: true,
    //             // includeMatches: false,
    //             // findAllMatches: false,
    //             // minMatchCharLength: 1,
    //             // location: 0,
    //             //  threshold: 0.6,
    //             // distance: 100,
    //             // useExtendedSearch: false,
    //             // ignoreLocation: false,
    //             // ignoreFieldNorm: false,
    //             // fieldNormWeight: 1,
    //             keys: [
    //                 "parent_code"
    //             ]
    //         };

    //         var pfield = theParentModelField.value

    //         //--------------------------------------------------------------------------------

    //         // FUSE match 001 - Mathc the uplaoded  XLXS file with the paretn based on pcode
    //         //--------------------------------------------------------------------------------
    //         // Use the map() method to add a new property to each object

    //         if (selectedparent.value != 'none') {
    //             matchedWithParent.value = uploadObj.value.map(obj => {
    //                 let input = obj.pcode
    //                 const fuse = new Fuse(parentObj.value, options);
    //                // console.log('Running fuse')

    //                         //      let results = fuse.search(input);
    //                          let results;
    //                         try {
    //                         results = fuse.search(input);
    //                   //      console.log(results);
    //                         } catch (error) {
    //                  //       console.error("An error occurred during Fuse search:", error);
    //                         // Handle the error case if needed
    //                         results = [];
    //                         }

    //                         if (results.length > 0) {
    //                        // console.log(pfield, results[0].item);
    //                         return {
    //                             ...obj, // spread existing properties of the object
    //                             [pfield]: results[0].item.id, // add new property to the object
    //                             ['county_id']: results[0].item.county_id, // add new property to the object
    //                             ['subcounty_id']: results[0].item.subcounty_id,  // add new property to the object
    //                            ['ward_id']: results[0].item.ward_id,  // add new property to the object
    //                             ['code']: shortid.generate(),
    //                             //['settlement_id']: results[0].item.settlement_id  // add new property to the object
    //                         };
    //                         } else {
    //                         ElMessage.error("No parent exists with the provided pcode: " + obj.pcode);
    //                         //handleReset()
    //                         return {
    //                             ...obj
    //                         };
    //                         }


    //             });
    //         } else {

    //             matchedWithParent.value = uploadObj.value
    //         }


    //      //   console.log('matched >>>', matchedWithParent.value)

    //         //--------------------------------------------------------------------------------

    //         // FUSE match 002 - Mathc the uplaoded  XLXS  fields with the Database Fields 
    //         //--------------------------------------------------------------------------------
    //         // Get the columns for the now matched array
    //         const uploadColumns = Object.keys(matchedWithParent.value[0]); // get the keys of the first object in the array

    //         // Get the columns from the DB

    //         const databaseColumns = fieldSet.value.map(obj => obj.field);


    //       //  console.log('From DB:', databaseColumns)
    //       //  console.log('From XLSX:', uploadColumns)

    //         const FieldMatchOptions = {
    //             // isCaseSensitive: false,
    //             includeScore: true,
    //             shouldSort: true,
    //             // includeMatches: false,
    //             // findAllMatches: false,
    //             // minMatchCharLength: 1,
    //             // location: 0,
    //               threshold: 0.3,   // anythong beyond 0.4 is ignored 
    //             // distance: 100,
    //             // useExtendedSearch: false,
    //             // ignoreLocation: false,
    //             // ignoreFieldNorm: false,
    //             // fieldNormWeight: 1,
    //             keys: [
    //                 "parent_code"
    //             ]
    //         };


    //         // Match the Database fields with the Uplaoded fields 
    //         const uniqueKey2Values = new Set(); // To keep track of unique key2 values
    //         tableData.value = databaseColumns.map(field => {
    //             let input = field;
    //             const fuse = new Fuse(uploadColumns, FieldMatchOptions);

    //             let results = fuse.search(input);

    //             let obj = {};
    //             obj.key1 = field;

    //             if (results.length > 0) {
    //                 const key2 = results[0].item;

    //                 if (!uniqueKey2Values.has(key2)) {
    //                     uniqueKey2Values.add(key2);
    //                     obj.key2 = key2;
    //                    // obj.disabled = true;
    //                 } else {
    //                     obj.key2 = ''; // Duplicate, so set as empty array
    //                     obj.disabled = false;

    //                 }

    //                 let opt = {}
    //                 opt.value = obj.key2 
    //                 opt.label = obj.key2 
    //                 //opt.disabled = obj.disabled;
    //                 console.log('Add Options', opt)

    //                 if ( obj.key2 !='') {
    //                     selectOptions.value.push(opt)   
    //                 }
    //             }


    //             else {
    //                 obj.key2 = [];
    //                 obj.disabled = false;

    //                     }

    //                     return obj;
    //                 });


    //   //selectOptions.value = [];
    // for (let i = 0; i < uploadColumns.length; i++) {
    //     const uploadedField = uploadColumns[i];

    //     // Check if the uploadedField is already in selectOptions
    //     const exists = selectOptions.value.some(option => option.value === uploadedField);

    //     if (!exists) {
    //         let obj = {};
    //         obj.value = uploadedField;
    //         obj.label = uploadedField;
    //         obj.disabled = false;
    //         selectOptions.value.push(obj);
    //     }
    // }

    // console.log(" selectOptions.value ", selectOptions.value )


    //     //    selectedValues.value = uploadColumns

    //         // Initialize selectOptions with objects containing values, labels, and disabled status
    //         selectedValues.value = selectOptions.value.map(opt => opt.value);

    //         console.log("selectedValues.value -->1", selectedValues.value);


    //      //   console.log(selectOptions.value)

    //         show.value = true
    //         showTable.value = true
    //      loadingPosting.value = false


    //     })


}

const readXLSXSheet = async (selSheet) => {



    readXlsxFile(UploadedFile.value, { sheet: selSheet }).then((rows) => {
        console.log(rows)


        const fields = Object.values(rows[0]) //  get all proterit4s of the first feature
        console.log("fields-->", fields)

        if (!fields.includes('pcode')) {
            console.log('Has Pcode', fields.includes('pcode')); //true
            ElMessage.error('The uploaded file is missing "pcode" field. Present: [' + fields + ']')

            return

        }


        
            for (let j = 1; j < rows.length; j++) {
                var record = {}
                for (let i = 0; i < fields.length; i++) {
                    var f = fields[i]
                    var v = rows[j][i]
                    record[f] = v
                 }
                record['createdBy'] = userInfo.id   // Add a 
                uploadObj.value.push(record) // Push to the temporary holder
            }  // remove header row

            // Get the unique Pcodes so that you get the parents 
            const uniquePcodes = new Set();
            // Iterate over the array and add the unique names to the Set
            uploadObj.value.forEach(item => {
            uniquePcodes.add(item.pcode);
            });
            // Convert the Set to an array (if needed)
            const uniquePcodesArray = [...uniquePcodes];
            console.log(uniquePcodesArray);
            // Now get those unique parents only !
             getParentOptions(uniquePcodesArray)


        

    })


}

const UploadedFile = ref()
const handleFileUpload = async (response, file) => {

    console.log('File uploaded successfully.', response, file);

    showUploadButton.value = true

    let reader = new FileReader()
    reader.onload = getSheets(file[0].raw)

    UploadedFile.value = file[0].raw

}

const readSelectedSheet = async (sheet) => {

    showTable.value = false   // hide table whenever the user chanes sheet

    console.log('Sheet to read.', sheet);
    let reader = new FileReader()

    reader.onload = readXLSXSheet(sheet)



}




const handleRemove = async () => {
    showTable.value = false
    showUploadButton.value = true
    UploadedFile.value = null
    sheets.value=null
}



const prevValue = ref()

const updateSelect = async (row, index) => {
    console.log('row', row);

    // Remove the previously selected value for this row from the selectedValues array
    prevValue.value = selectedValues.value[index];
    if (prevValue.value) {
        const prevIndex = selectOptions.value.findIndex((option) => option.value === prevValue.value);
        if (prevIndex !== -1) {
            selectOptions.value[prevIndex].disabled = false;
        }
    }

    // If the value is cleared, enable the previously selected option
    if (!row.key2) {
        const prevIndex = selectOptions.value.findIndex((option) => option.value === prevValue.value);
        if (prevIndex !== -1) {
            selectOptions.value[prevIndex].disabled = false;
        }
    } else {
        // Disable the selected value in the selectOptions array
        const selectedIndex = selectOptions.value.findIndex((option) => option.value === row.key2);
        if (selectedIndex !== -1) {
            selectOptions.value[selectedIndex].disabled = true;
        }
    }

    // Update the selectedValues array
    selectedValues.value[index] = row.key2;

    console.log('selectedValues', selectedValues);
    console.log('selectOptions', selectOptions);
};



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

                DisablePostSubmit.value = false

            })
            .catch((error) => {
                console.log('Error------>', error.response.data.message)
                ElMessage({
                    message: error.response.data.message,
                    type: 'error',
                    duration: 3000 // the message will be displayed for 3 seconds before closing
                })
                formData.data = []



                DisablePostSubmit.value = false

            })



    } else {

        await BatchImportUpsert(formData)
            .catch((error) => {
                console.log('Error------>', error.response.data.message)
                //  ElMessage.error(error.response.data.message)
                ElMessage({
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

                DisablePostSubmit.value = false

            })
    }

    //  loadingPosting.value=false



}


</script>

<template>
    <ContentWrap
v-loading="loadingPosting" element-loading-text="Loading the data.. Please wait......."
        :title="t('Upload Excel Data')" :message="t('Ensure you have column codes ')">



        <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12"> 

        <div style="display: inline-block;">
                <el-select
v-model="type" :onChange="handleSelectType" filterable clearable
                    placeholder="Select data to import" style=" margin-right: 20px">
                    <el-option-group v-for=" group in uploadOptions" :key="group.label" :label="group.label">
                        <el-option
v-for="item in group.options" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-option-group>
                </el-select>

                <el-select v-model="selectedparent" :onChange="handleSelectParentModel" placeholder="Select Parent Model">
                    <el-option v-for="item in parentOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>

                <div style="display: inline-block; margin-left: 20px">
                    <el-button :onClick="handleReset" type="primary" :icon="RefreshLeft" />
                </div>

                <el-divider border-style="dashed" content-position="left">Upload</el-divider>
 

 <!-- <el-upload  v-if="showUploadButton" ref="uploadRef" class="upload-demo" :limit="1"  :on-change="handleFileUpload" :auto-upload="false">
     <template #trigger>
         <el-button type="primary">select file</el-button>
     </template>
     <el-select
class="ml-3" v-if="showUploadButton" v-model="selectedSheet" placeholder="Select Sheet"
         @change="readSelectedSheet">
         <el-option v-for="sheet in sheets" :key="sheet" :label="sheet" :value="sheet" />
     </el-select>

     <template #tip>
         <div class="el-upload__tip">
             jpg/png files with a size less than 500kb
         </div>
     </template>
 </el-upload> -->


                <el-upload
                    v-if="showUploadButton" 
                    class="upload-demo"
                    drag
                    :limit="1"  
                    :on-change="handleFileUpload" 
                    :auto-upload="false"
                    :on-remove="handleRemove"
                    :accept="'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'" 


                >
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text">
                    Drop XLSX file here or <em>click to upload</em>
                    </div>
                </el-upload>

                <el-select
                    class="mb-3" v-if="showUploadButton" v-model="selectedSheet" placeholder="Select Sheet"
                            @change="readSelectedSheet">
                            <el-option v-for="sheet in sheets" :key="sheet" :label="sheet" :value="sheet" />
                        </el-select>


 
            </div>


      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12"> 
        <el-skeleton  v-if="!showTable" :rows="10" />

 
                    <el-table v-if="showTable" :data="tableData" :size="small" border  height="60vh" style="width: 100%" >
                    <el-table-column prop="key1" label="Database Field"    />
                    <el-table-column label="From XLSX"   >
                        <template #default="scope">
                            <el-select
                v-model="scope.row.key2" 
                            @change="updateSelect(scope.row,scope.$index)" 
                                filterable 
                            clearable>
                                
                            <el-option
                                v-for="(option, index) in selectOptions" :key="index" :label="option.label"
                                    :value="option.value" :disabled="option.disabled" />
                            </el-select>
                        </template>
                    </el-table-column>
                </el-table>
                <div class="button-container"> <!-- Wrap the buttons in a div -->
                        <span class="dialog-footer">
                            <el-button v-if="showTable" @click="showTable = false">Cancel</el-button>
                            <el-button v-if="showTable" type="primary" @click="handleSubmitData">Submit Data</el-button>
                        </span>
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
</style>



<style>
.fixed-header {
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 1;
}
</style>



<style>
.button-container {
  display: flex;
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
  padding-top: 20px; /* Add padding to the top */

}
</style>