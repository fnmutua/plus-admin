eslint-disable prettier/prettier
<!-- eslint-disable vue/no-deprecated-slot-scope-attribute -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { getParentIds, BatchImportUpsert } from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo, getEntitiesByCode } from '@/api/counties'
import { getModelSpecs, getModelRelatives } from '@/api/fields'

import { postBatchHouseholds } from '@/api/households'
import {
    getCollectorData, loginCollector,
    getCollectorDataCSV, getWithMedia,
    getCollectorDataFlattened, getGeoJSON, getRawCSV, getSubmitters
} from '@/api/collector'
import { Icon } from '@iconify/vue';

import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

import xlsx from "json-as-xlsx"


import {
    ElButton,
    ElSelect,
    ElTable,
    ElIcon,
    ElTableColumn,
    ElProgress,
    ElScrollbar, ElCheckbox,
    ElSkeleton,
    ElOptionGroup,
    ElCol, ElRow, ElCard, ElDropdown, ElDropdownItem, ElDropdownMenu,
    ElOption
} from 'element-plus'
import { ElUpload } from 'element-plus'
import {
    Upload,
    Refresh,
    CaretRight,
    RefreshLeft,
    RefreshRight,
    LocationFilled, Files, List, Document, CameraFilled,Histogram,
    Download, ArrowDown,
    UploadFilled, CircleCheck, CirclePlus, Position,
    Tools
} from '@element-plus/icons-vue'

import { ref, watch, computed, reactive } from 'vue'
import { ElDivider } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'

import type { UploadProps, UploadUserFile } from 'element-plus'


import { useVueFuse } from 'vue-fuse'
import Fuse from 'fuse.js';
import * as echarts from 'echarts';

import VChart from 'vue-echarts';
import { CanvasRenderer } from 'echarts/renderers';



import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { useRouter } from 'vue-router'
import shortid from 'shortid';

import { PieChart, GaugeChart, BarChart, LineChart, } from 'echarts/charts';
import {
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    ToolboxComponent,
    GridComponent,

} from 'echarts/components';


import { use } from "echarts/core";


type EChartsOption = echarts.EChartsOption;
var option: EChartsOption;
var PieChartOption: EChartsOption;


use([
    GaugeChart,
    CanvasRenderer,
    PieChart,
    LineChart,
    BarChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    ToolboxComponent,
    GridComponent
]);




PieChartOption = {
    legend: {
        top: 'bottom'
    },
    title: {
        text: '',
        subtext: 'National Slum Database, 2023',
        left: 'center',
        textStyle: {
            fontSize: 14
        },
        subtextStyle: {
            fontSize: 12
        }
    },
    toolbox: {
        show: true,
        feature: {


            mark: { show: true },
            dataView: { show: true, readOnly: false },
            restore: { show: true },
            saveAsImage: { show: true, pixelRatio: 4 }
        }
    },

    series: [
        {
            name: 'Nightingale Chart',
            type: 'pie',
            radius: [20, 100],
            center: ['50%', '50%'],
            roseType: 'area',
            itemStyle: {
                borderRadius: 8
            },
            data: [
                // { value: 40, name: 'rose 1' },
                // { value: 38, name: 'rose 2' },
            ]
        }
    ]
};



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





const showSelect = ref(false)

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
const showForms = ref(false)
const filteredForms = ref([])
const handleSelectProject = async (project: any) => {
    console.log(project)
      //  empty the filtered data once form is changed 
      downloadData.value = []
    downloadDataFiltered.value = []

    filteredForms.value = formListOptions.value.filter((obj) => obj.projectId == project);
    showForms.value = true

      
    
}
const disableDownloadOption = ref(false)

const handleSelectForm = async (form: any) => {
    console.log(form)
    submitter_filter.value = 0   // initialize fileter to all 
    showReport.value = false
    showCharts.value = false
    await submitterList()
    disableGet.value = false

    //  empty the filtered data once form is changed 
    downloadData.value = []
    downloadDataFiltered.value=[]
    //if (form=='infrastructure_prioritization' || form == 'County Project Coordinating Teams (CPCT) Data'  ) {
    if (form == 'infrastructure_prioritization') {
        disableDownloadOption.value = true
        console.log("add disabled")

    } else {
        disableDownloadOption.value = false
        console.log("remove disabled")
    }

}

const handleSelectSubmitter = async (form: any) => {
    showReport.value = false
    showCharts.value = false


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


const processingLoading = ref(false)

const handleSelectParentModel = async (parent: any) => {
    processingLoading.value = true
    showMatching.value = true

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
    matchCollectedData(collectorData.value)
}

// Handler for file upload


const tableData = ref()



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
    console.log("parent --Model-codes", theParentModel.value, pcodes)



    await getEntitiesByCode({
        params: {
            pageIndex: 1,
            limit: 1000,
            curUser: 1, // Id for logged in user
            model: theParentModel.value,
            code: pcodes,
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
                // console.log('Add Options', opt)

                if (obj.key2 != '') {
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

        console.log(" selectOptions.value ", selectOptions.value)


        //    selectedValues.value = uploadColumns

        // Initialize selectOptions with objects containing values, labels, and disabled status
        selectedValues.value = selectOptions.value.map(opt => opt.value);

        console.log("selectedValues.value -->1", selectedValues.value);


        //   console.log(selectOptions.value)

        showTable.value = true
        processingLoading.value = false
        showMatching.value = false
        console.log('matchedColumns  tableData>>>', tableData)



    })
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

const projectListOptions = ref([])
const formListOptions = ref([])

const project = ref()
const form = ref()

const loginUserToCollector = async () => {
    projectListOptions.value = []
    formListOptions.value = []

    loading.value = true
    var formData = {}
    formData.email = "felix.mutua@gmail.com"
    formData.password = "Admin@2011"

    console.log("gettign fields")


    await loginCollector(formData).then((response) => {
        // Assuming the token is in the response data
        const token = response.token;
        // Save the token to localStorage
        localStorage.setItem('collectorToken', token);
        console.log('collectorToken:', token);
        showSelect.value = true

        const projects = JSON.parse(response.data);
        console.log('projects:', projects);

        // loop through each project 
        projects.forEach(function (project) {
            var projectOpt = {}
            projectOpt.value = project.id
            projectOpt.label = toTitleCase(project.name)
            projectListOptions.value.push(projectOpt)

            project.formList.forEach(function (form) {
                var formOpt = {}
                formOpt.value = form.xmlFormId
                formOpt.projectId = form.projectId
                formOpt.label = toTitleCase(form.name)

                     formListOptions.value.push(formOpt)

            
            })

        })

        console.log(projectListOptions.value)
        console.log(formListOptions.value)
        loading.value = false

    })



}

const geoserverLoading = ref(false)
const geoserverLayers = ref([])
const getGeoserverLayers = async () => {
    geoserverLoading.value = true
    console.log("Geoserver.....")


    // get the drone
    await axios.get('https://kesmis.go.ke/geoserver/kisip/ows/?SERVICE=WMS&REQUEST=GetCapabilities')
        .then((response) => {
            const xml = response.data;
            // console.log(xml)
            const parser = new XMLParser();
            const json = parser.parse(xml);
            const glayers = json.WMS_Capabilities.Capability.Layer.Layer.map(layer => ({
                name: layer.Name,
                title: layer.Title,
                label: layer.Name,
                value: layer.Name,
                bbox: layer.EX_GeographicBoundingBox

            }));

            console.log('Drone Layers >>', glayers)

            geoserverLayers.value = glayers


        });

}



function extractInnermostValues(obj) {
    function isObject(item) {
        return (typeof item === "object" && !Array.isArray(item) && item !== null);
    }

    function extractInner(obj) {
        let result = {};
        for (const key in obj) {
            if (isObject(obj[key])) {
                const innerResult = extractInner(obj[key]);
                result = { ...result, ...innerResult };
            } else {
                // Check if the key is "settlement" and replace it with "pcode"
                //const newKey = key === "settlement" ? "pcode" : key;
                const newKey = key;
                result[newKey] = obj[key];
            }
        }
        return result;
    }

    const innermostData = extractInner(obj);
    return innermostData;
}


function extractKeysFromArray(arrayOfObjects) {
    let keys = new Set();
    arrayOfObjects.forEach((obj) => {
        for (const key in obj) {
            keys.add(key);
        }
    });
    return Array.from(keys);
}

const matchCollectedData = async (rows) => {

    console.log("rows, ", rows)
    const fields = extractKeysFromArray(rows);


    //const fields = Object.values(rows[0]) //  get all proterit4s of the first feature
    console.log("fields-->", fields)

    if (!fields.includes('pcode')) {
        console.log('Has Pcode', fields.includes('pcode')); //true
        ElMessage.error('The uploaded file is missing "pcode" field. Present: [' + fields + ']')

        return

    }


    for (let j = 0; j < rows.length; j++) {

        if (rows[j].reviewState != "rejected") {
            var record = rows[j]

            record['createdBy'] = userInfo.id   // Add a 
            record.migration_reason = [record['migration_reason']]
            uploadObj.value.push(record) // Push to the temporary holder

        }





    }  // remove header row

    // Get the unique Pcodes so that you get the parents 
    const uniquePcodes = new Set();

    // Iterate over the array and add the unique names to the Set
    uploadObj.value.forEach(item => {
        if (item.pcode !== null) { // Only add non-null values to the Set
            uniquePcodes.add(item.pcode);
        }
    });

    // Convert the Set to an array of strings
    const filteredUniquePcodesArray = Array.from(uniquePcodes);

    // Now get those unique parents only!
    console.log("uniquePcodesArray", filteredUniquePcodesArray);
    getParentOptions(filteredUniquePcodesArray);

}







const collectorData = ref([])
const showChildParent = ref(false)
const syncData = async () => {
    projectListOptions.value = []
    formListOptions.value = []

    var formData = {}
    formData.project = project.value
    formData.form = form.value

    var userToken = localStorage.getItem('collectorToken');

    formData.token = userToken

    console.log("Getting fields")


    await getCollectorData(formData).then((response) => {

        console.log('response', JSON.parse(response.data))

        let data = JSON.parse(response.data)
        //   collectorData.value = flattenJSON( JSON.parse(response.data));
        console.log("data, ", data)
        for (let i = 0; i < data.value.length; i++) {
            let parsd = extractInnermostValues(data.value[i])
            console.log("Parsed : i) >>>>>", i, parsd)


            collectorData.value.push(parsd)
        }
        // collectoreData.value=JSON.parse(response.data)
        console.log("collectorData-", collectorData.value)
        showChildParent.value = true
        //  matchCollectedData( collectorData.value)


    })



}





const downloadingCsv = ref(false)
const downloadCsv = async () => {
    projectListOptions.value = []
    formListOptions.value = []
    downloadingCsv.value = true

    var formData = {}
    formData.project = project.value
    formData.form = form.value
    formData.submitter_filter = submitter_filter.value

    var userToken = localStorage.getItem('collectorToken');

    formData.token = userToken

    console.log("Getting fields")

    try {
        const response = await getCollectorDataCSV(formData);
        const dataURI = `data:application/zip;base64,${response.data}`;

        // Create a temporary anchor element
        const anchor = document.createElement('a');
        anchor.href = dataURI;
        anchor.download = 'submissions.zip'; // Set the filename for the download

        // Trigger a click event to initiate the download
        anchor.click();

        // Clean up the anchor element
        document.body.removeChild(anchor);
    } catch (error) {
        // Handle any errors here
        console.error(error);
    } finally {
        // Set downloadingCsv to false in the finally block
        downloadingCsv.value = false;
    }
}






const getMedia = async () => {
    projectListOptions.value = []
    formListOptions.value = []
    downloadingCsv.value = true

    var formData = {}
    formData.project = project.value
    formData.form = form.value

    var userToken = localStorage.getItem('collectorToken');

    formData.token = userToken

    console.log("Getting fields")

    try {
        const response = await getWithMedia(formData);
        const dataURI = `data:application/zip;base64,${response.data}`;

        // Create a temporary anchor element
        const anchor = document.createElement('a');
        anchor.href = dataURI;
        anchor.download = 'submissions.zip'; // Set the filename for the download

        // Trigger a click event to initiate the download
        anchor.click();

        // Clean up the anchor element
        document.body.removeChild(anchor);
    } catch (error) {
        // Handle any errors here
        console.error(error);
    } finally {
        // Set downloadingCsv to false in the finally block
        downloadingCsv.value = false;
    }
}

const generatePropertyFrequencies = async (arr, properties) => {
    // Create an empty object to store the frequencies.
    const frequencies = {};

    // Iterate through the properties array and initialize a frequency object for each property.
    properties.forEach((property) => {
        frequencies[property] = {};
    });

    // Iterate through the array of objects.
    arr.forEach((item) => {
        properties.forEach((property) => {
            // Get the value of the current property.
            const propertyValue = item[property];

            // Exclude null or empty values.
            if (propertyValue !== null && propertyValue !== undefined && propertyValue !== "") {
                // Initialize the property value count to 0 if it doesn't exist.
                if (!frequencies[property].hasOwnProperty(propertyValue)) {
                    frequencies[property][propertyValue] = 0;
                }

                // Increment the count for the current property value.
                frequencies[property][propertyValue]++;
            }
        });
    });

    return frequencies;
};



const generatePropertyProportions = async (arr, properties) => {
    // Create an empty object to store the proportions.
    const proportions = {};

    // Calculate the total count of items in the array.
    const totalCount = arr.length;

    // Iterate through the properties array and initialize a proportion object for each property.
    properties.forEach((property) => {
        proportions[property] = {};
    });

    // Iterate through the array of objects.
    arr.forEach((item) => {
        properties.forEach((property) => {
            // Get the value of the current property.
            const propertyValue = item[property];

            // Initialize the property value count to 0 if it doesn't exist.
            if (!proportions[property].hasOwnProperty(propertyValue)) {
                proportions[property][propertyValue] = 0;
            }

            // Increment the count for the current property value.
            proportions[property][propertyValue]++;
        });
    });

    // Calculate proportions as percentages with two decimal places.
    properties.forEach((property) => {
        for (const value in proportions[property]) {
            proportions[property][value] = ((proportions[property][value] / totalCount) * 100).toFixed(2);
        }
    });

    return proportions;
};

function getUniquePropertyValues(arr, property) {
  const uniqueValues = new Set();

  for (const obj of arr) {
    uniqueValues.add(obj[property]);
  }

  return Array.from(uniqueValues);
}

function extractAllProperties(array) {
    const properties = [];
    for (const item of array) {
        for (const key in item) {
            if (item.hasOwnProperty(key) && !properties.includes(key)) {
                properties.push(key);
            }
        }
    }
    return properties;
}

const filterField = ref( )
const filterValue = ref( )
const filterFieldOptions = ref([])
const filterValueOptions = ref([])
const showReport = ref(false)
const fields = ref([])
const selectedFields = ref([])


const makeReport = async () => {

    await getThedata()

    console.log("te data......", downloadDataFiltered.value)

    fields.value = extractAllProperties(downloadDataFiltered.value);
    console.log(fields.value);
    showReport.value = true
 

    for (let i = 0; i < fields.value.length; i++) {
            const currentString = fields.value[i];
            let opt = {}
            opt.value = currentString
            opt.label = currentString 
            filterFieldOptions.value.push(opt)
            }


    console.log(filterFieldOptions.value)

}

const getUniqueValues = async (e) => { 
    filterValueOptions.value=[]
    console.log('Uniuks, ', e)
    const uniqueValues = getUniquePropertyValues(downloadDataFiltered.value, e)
    
    for (let i = 0; i < uniqueValues.length; i++) {
            const currentString = uniqueValues[i];
            let opt = {}
            opt.value = currentString
            opt.label = currentString 
            filterValueOptions.value.push(opt)
     }

}



const filterCustom = async (e) => { 
    // filterValueOptions.value = []
    generateReport() // reset charts
    console.log("Filter Fied:",filterField.value )
    console.log("Filter Value:",e )

    downloadDataFiltered.value = downloadData.value.filter(obj => obj[filterField.value] == e);

    console.log(downloadDataFiltered.value)

}

const clearfilterCustom = async () => { 
    generateReport() // reset charts
    downloadDataFiltered.value = downloadData.value 

    console.log("Cleared, ", downloadDataFiltered.value)
  

}

const downloadData = ref()
const downloadDataFiltered = ref()
const form_name = ref()

const downloadFlattenedXLSX = async () => {
    projectListOptions.value = []
    formListOptions.value = []
    downloadingCsv.value = true

    var formData = {}
    formData.project = project.value
    formData.form = form.value
    formData.submitter_filter = submitter_filter.value
    form_name.value = form.value

    var userToken = localStorage.getItem('collectorToken');

    formData.token = userToken

    console.log("Getting fields")

    try {
        // get fresh data only 
        if ( downloadDataFiltered.value.length==0) {
        const response = await getCollectorDataFlattened(formData);
        console.log("flatData", response.data)
        downloadData.value = response.data
        downloadDataFiltered.value=response.data 
        }
     
        DownloadXlsx()
    } catch (error) {
        // Handle any errors here
        console.error(error);
    } finally {
        // Set downloadingCsv to false in the finally block
        downloadingCsv.value = false;
    }
}

const getThedata = async () => {
    projectListOptions.value = []
    formListOptions.value = []
    downloadingCsv.value = true

    var formData = {}
    formData.project = project.value
    formData.form = form.value
    formData.submitter_filter = submitter_filter.value
    form_name.value = form.value

    var userToken = localStorage.getItem('collectorToken');

    formData.token = userToken

    console.log("Getting fields")

    try {
        const response = await getCollectorDataFlattened(formData);
        console.log("flatData", response.data)
        downloadData.value = response.data
        downloadDataFiltered.value=response.data

    } catch (error) {
        // Handle any errors here
        console.error(error);
    } finally {
        // Set downloadingCsv to false in the finally block
        downloadingCsv.value = false;
    }
}

const downloadGeoJSON = async () => {
    projectListOptions.value = [];
    formListOptions.value = [];
    downloadingCsv.value = true;

    var formData = {};
    formData.project = project.value;
    formData.form = form.value;
    form_name.value = form.value;

    var userToken = localStorage.getItem('collectorToken');
    formData.token = userToken;

    console.log("Getting fields");

    try {
        const response = await getGeoJSON(formData);
        console.log(response.data);

        // Create a Blob from the GeoJSON data
        const geoJSONBlob = new Blob([JSON.stringify(response.data)], {
            type: 'application/json'
        });

        // Create a temporary URL for the Blob
        const dataURI = window.URL.createObjectURL(geoJSONBlob);

        // Create a temporary anchor element
        const anchor = document.createElement('a');
        anchor.href = dataURI;
        anchor.download = 'data.geojson'; // Set the filename for the download

        // Trigger a click event to initiate the download
        anchor.click();

        // Clean up the anchor element and URL
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(dataURI);
    } catch (error) {
        // Handle any errors here
        console.error(error);
    } finally {
        // Set downloadingCsv to false in the finally block
        downloadingCsv.value = false;
    }
};



const showCharts = ref(false)
const customCharts = ref([])
const generateReport = async () => {
    showCharts.value = true
    // clear the charts first 
    customCharts.value = []
    console.log("reports........", computationMethod.value)

    var frequencies
    if (computationMethod.value == 'count') {
        frequencies = await generatePropertyFrequencies(downloadDataFiltered.value, selectedFields.value);

    } else {
        frequencies = await generatePropertyProportions(downloadDataFiltered.value, selectedFields.value);
        console.log("Proportions", frequencies)

    }

    //const result = await generatePropertyFrequencies(data, 'name');
    console.log('frequencies', frequencies);

    // loop through each propoert and get the responses 

    let chart = {}

    // Loop through the frequencies and extract the categories and data 
    if (typeChart.value == 'pie') {

        for (const key in frequencies) {

            if (frequencies.hasOwnProperty(key)) {
                const nestedData = frequencies[key];
                console.log('nestedData', nestedData)
                let keys = Object.keys(nestedData)
                let data = Object.values(nestedData)
                let series = []

                for (let i = 0; i < keys.length; i++) {
                    series.push({ value: data[i], name: keys[i] })
                }


                chart[key] = {
                    data: series,
                    key: key.toUpperCase()
                };

            }
        }
        console.log('Pie-chart', chart)
    }
    else {

        for (const key in frequencies) {
            if (frequencies.hasOwnProperty(key)) {
                const nestedData = frequencies[key];
                chart[key] = {
                    category: Object.keys(nestedData),
                    data: Object.values(nestedData),
                    key: key.toUpperCase()
                };

            }
            // valuesArray.push(obj)
        }
    }



    console.log("Array of Values:");
    console.log(chart);

    // loop through the extratced data and generated chart options
    for (const key in chart) {
        var updatedOptions

        if (typeChart.value == 'pie') {
            updatedOptions = {
                ...PieChartOption,
                title: {
                    ...PieChartOption.title,
                    //   text: obj[key].key 
                    text: computationMethod.value === 'count' ? chart[key].key : chart[key].key + '(%)',
                },

                series: {
                    ...PieChartOption.series[0],
                    data: chart[key].data    // data 
                },
            };
        }
        else {
            console.log("Bar chart......")
            updatedOptions = {
                ...option,
                title: {
                    ...option.title,
                    //   text: obj[key].key 
                    text: computationMethod.value === 'count' ? chart[key].key : chart[key].key + '(%)',
                },
                xAxis: {
                    ...option.xAxis,
                    data: chart[key].category // categories as received 
                },
                series: {
                    ...option.series[0],
                    data: chart[key].data    // data 
                },
            };

        }


        console.log('updatedOptions', updatedOptions)
        customCharts.value.push(updatedOptions)

    }

    console.log("charts,", customCharts.value)
}


// template option
option = {
    title: {
        text: '',
        subtext: 'National Slum Database, 2023',
        left: 'center',
        textStyle: {
            fontSize: 14
        },
        subtextStyle: {
            fontSize: 12
        }
    },
    toolbox: {
        show: true,
        feature: {


            mark: { show: true },
            dataView: { show: true, readOnly: false },
            restore: { show: true },
            saveAsImage: { show: true, pixelRatio: 4 }
        }
    },
    xAxis: {
        type: 'category',
        data: []
    },
    yAxis: {
        type: 'value'
    },
    series: [
        {
            data: [],
            type: 'bar',
            showBackground: true,
            backgroundStyle: {
                color: 'rgba(180, 180, 180, 0.2)'
            },

            label: {
                show: true,
                position: 'inside'
            },
        }
    ]
};


const submitterOptions = ref([])
const submitter_filter = ref()

const submitterList = async () => {
    submitterOptions.value = []
    let all = { value: 0, label: "All" }
    submitterOptions.value.push(all)
    projectListOptions.value = [];


    var formData = {};
    formData.form = form.value;
    form_name.value = form.value;

    var userToken = localStorage.getItem('collectorToken');
    formData.token = userToken;

    console.log("Getting fields");

    try {
        const response = await getSubmitters(formData);
        console.log(response.data);
        const ret = JSON.parse(response.data)

        ret.forEach(function (arrayItem) {
            const opt = {}
            opt.value = arrayItem.id
            opt.label = arrayItem.displayName
            console.log(opt)
            submitterOptions.value.push(opt)
        })


    } catch (error) {
        // Handle any errors here
        console.error(error);
    } finally {
        // Set downloadingCsv to false in the finally block
        console.log(".....")
    }
};





const loading = ref(false)

const disableGet = ref(true)

const showMatching = ref(false)


const DownloadXlsx = async () => {
    console.log('downloadDataFiltered', downloadDataFiltered.value)
 


    const fields = [];

    // Iterate through all records in downloadData.value
    for (const record of downloadDataFiltered.value) {
        const keys = Object.keys(record);

        // Iterate through the keys of each record and add them to the fields array
        for (const key of keys) {
            fields.push({ label: key, value: key });
        }
    }

    // Now, fields will contain properties from all records
    console.log(fields);





    // Preprae the data object 
    var dataObj = {}
    dataObj.sheet = 'data'
    dataObj.columns = fields

    dataObj.content = downloadDataFiltered.value




    let settings = {
        fileName: form_name.value, // Name of the resulting spreadsheet
        writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
        writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
    }

    // Enclose in array since the fucntion expects an array of sheets
    xlsx([dataObj], settings) //  download the excel file

}

const handleCommand = (command: string | number | object) => {

    if (command == 'raw') {
        ElMessage(`Downloading ${command}.  Please be patient. This may take a while`)

        downloadCsv()
    } else if (command == 'xlsx') {
        ElMessage(`Downloading ${command}.  Please be patient. This may take a while`)

        downloadFlattenedXLSX()
    }

    else if (command == 'geojson') {
        ElMessage(`Downloading ${command}.  Please be patient. This may take a while`)

        downloadGeoJSON()
    }

    else if (command == 'sync') {
        ElMessage(`Please wait as we fetch  and match with the database...`)

        syncData()
    }

    else if (command == 'media') {
        ElMessage(`Downloading data inclusive of all attachments.  Please be patient. This may take a while`)

        getMedia()
    }


    else if (command == 'report') {
        ElMessage(`Generating report based on the selected filters.....  Please be patient. This may take a while`)

        makeReport()
    }





    else {

        // geojson  remember to change 
        downloadFlattenedXLSX()
    }


}

const computationMethod = ref('count')


const typeChart = ref('bar')

const computationOptions = [
    {
        value: 'count',
        label: 'Count',
    },
    {
        value: 'proportion',
        label: 'Proportion (%)',
    }]

const chartOptions = [
    {
        value: 'pie',
        label: 'Pie Chart',
    },
    {
        value: 'bar',
        label: 'Bar Chart',
    }]


</script>

<template>
    <ContentWrap
v-loading="loadingPosting" element-loading-text="Loading the data.. Please wait......."
        :title="t('Surveys')" :message="t('Data Collected via collector.kesmis...')">


        <el-row :gutter="7">
 
            <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                <el-row :gutter="12">
                    <el-col :span="12">
                        <el-card v-loading="loading" shadow="hover" @click="loginUserToCollector">
                            <div class="card-content">
                                <!-- Add an image here -->
                                <img src="@/assets/svgs/odk.svg" key="1" fit="fill" alt="" class="w-50px" />
                                ODK Collector
                            </div>
                        </el-card>
                    </el-col>

                    <el-col :span="12">
                        <el-card v-loading="loading" shadow="hover">
                            <div v-if="showSelect" class="card-content">
                                <el-select
v-model="project" :onChange="handleSelectProject" filterable clearable
                                    placeholder="Select Project" style=" margin-right: 20px">
                                    <el-option
v-for="item in projectListOptions" :key="item.value" :label="item.label"
                                        :value="item.value" />
                                </el-select>
                            </div>
                        </el-card>
                    </el-col>
                </el-row>


                <div v-if="showForms" style="display: inline-block; margin-top: 10px">


                    <el-select v-model="form" :onChange="handleSelectForm" placeholder="Select Form">
                        <el-option
v-for="item in filteredForms" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
 
                    <div style="display: inline-block; margin-top: 20px; margin-left: 10px">

                        <el-select
v-model="submitter_filter" placeholder="Filter by Submitter"
                            :onChange="handleSelectSubmitter">
                            <el-option
v-for="item in submitterOptions" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                    </div>


                    <div style="display: inline-block; margin-left: 10px">
                        <el-dropdown
v-loading="downloadingCsv" @command="handleCommand"
                            class="el-button    el-button--plain  ">
                            <span class="el-dropdown-link">
                                Download
                                <el-icon class="el-icon--right">
                                    <arrow-down />
                                </el-icon>
                            </span>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item command="raw" :icon="Document">Raw Data</el-dropdown-item>
                                    <el-dropdown-item
command="xlsx" :disabled="disableDownloadOption"
                                        :icon="List">XLSX</el-dropdown-item>
                                    <el-dropdown-item
command="geojson" disabled
                                        :icon="LocationFilled">GeoJSOn</el-dropdown-item>
                                    <el-dropdown-item
command="media" disabled
                                        :icon="CameraFilled">Attachments</el-dropdown-item>
                                    <el-dropdown-item command="report" :icon="Histogram">Charts</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </div>
                    <el-divider content-position="left" style="flex: 1;">Chart Options</el-divider>

                    <div v-if="showReport" style="margin-top: 10px; display: flex; flex-wrap: wrap; align-items: flex-start;">

                    <el-select v-model="filterField" filterable  clearable placeholder="Filter By" style="margin-right: 5px; flex: 1;" size="small" :onChange="getUniqueValues">
                        <el-option v-for="item in filterFieldOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>

                    <el-select :onChange="filterCustom" :onClear="clearfilterCustom" filterable v-model="filterValue" clearable placeholder="Filter Value" style="margin-right: 5px; flex: 1;" size="small">
                        <el-option v-for="item in filterValueOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>

                    <el-select :onChange="generateReport" v-model="computationMethod" clearable placeholder="Computation" style="margin-right: 10px; flex: 1;" size="small">
                        <el-option v-for="item in computationOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>

                    <el-select :onChange="generateReport" v-model="typeChart" clearable placeholder="Type of Chart" style="margin-right: 10px; flex: 1;" size="small">
                        <el-option v-for="item in chartOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>

                </div>

                <el-scrollbar height="400px" style="flex: 1;">

                <el-row>

                    <el-col :span="6" v-for="(option, index) in fields" :key="index">
                        <el-checkbox v-model="selectedFields" :label="option" size="small" :onChange="generateReport" class="ellipsis-checkbox" />
                    </el-col>
                </el-row>
                <br />

                </el-scrollbar>

                    <div v-if="showChildParent" style="display: inline-block; margin-top: 20px">
                        <el-select
v-model="type" :onChange="handleSelectType" filterable clearable
                            placeholder="Select data to import" style=" margin-right: 20px">
                            <el-option-group v-for=" group in uploadOptions" :key="group.label" :label="group.label">
                                <el-option
v-for="item in group.options" :key="item.value" :label="item.label"
                                    :value="item.value" />
                            </el-option-group>
                        </el-select>

                        <el-select
v-model="selectedparent" :onChange="handleSelectParentModel"
                            placeholder="Select Parent Model">
                            <el-option
v-for="item in parentOptions" :key="item.value" :label="item.label"
                                :value="item.value" />
                        </el-select>
                    </div>
                    <el-text v-if="showMatching" class="button-container"> Matching data with database... Please
                        wait</el-text>
                    <div>
                        <el-progress
v-if="showMatching" class="button-container" :percentage="100" status="success"
                            :indeterminate="true" :duration="1" :show-text="false" />

                    </div>

                </div>

            </el-col>
            <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                <el-skeleton v-if="!showCharts" :animated="processingLoading" :rows="20" />
                <el-scrollbar height="600px">



                    <el-table v-if="showTable" :data="tableData" :size="small" border height="60vh" style="width: 100%">
                        <el-table-column prop="key1" label="Database Field" />
                        <el-table-column label="From Collector">
                            <template #default="scope">
                                <el-select
v-model="scope.row.key2" @change="updateSelect(scope.row, scope.$index)"
                                    filterable clearable>

                                    <el-option
v-for="(option, index) in selectOptions" :key="index" :label="option.label"
                                        :value="option.value" :disabled="option.disabled" />
                                </el-select>
                            </template>
                        </el-table-column>
                    </el-table>

                    <div v-if="showCharts">
                        <el-col
v-for="(chart) in customCharts" :key="chart" :span="24" :xl="24" :lg="24" :md="24" :sm="24"
                            :xs="24">
                            <div class="tabs-container">
                                <el-card>

                                    <ElSkeleton :loading="loading" animated>
                                        <v-chart class="chart" :option="chart" autoresize />
                                    </ElSkeleton>

                                </el-card>
                            </div>

                        </el-col>

                    </div>
                    <div class="button-container"> <!-- Wrap the buttons in a div -->
                        <span class="dialog-footer">
                            <el-button v-if="showTable" @click="showTable = false">Cancel</el-button>
                            <el-button v-if="showTable" type="primary" @click="handleSubmitData">Submit Data</el-button>
                        </span>
                    </div>



                </el-scrollbar>

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
    justify-content: center;
    /* Center horizontally */
    align-items: center;
    /* Center vertically */
    padding-top: 20px;
    /* Add padding to the top */

}
</style>


 
<style scoped>
.chart {
    height: 40vh;
}

.card-content {
    display: flex;
    align-items: center;
}

.card-icon {
    margin-right: 10px;
}

.card-divider {
    width: 1px;
    height: 80%;
    background-color: #e4e7ed;
    margin: 0 10px;
}

.card-value {
    flex-grow: 1;
}

.value-text {
    font-size: 24px;
    font-weight: bold;
}

.value-label {
    font-size: 14px;
    color: #999999;
}

.tabs-container {
    margin-top: 5px;
}

.cards-container {
    margin-top: 5px;
}


.icon-container {
    display: inline-block;
    position: relative;
    box-shadow: 0 2px 4px rgba(34, 35, 35, 0.2);
    padding: 5px;
    /* optional padding around the icon */
    border-radius: 10%;
    /* optional border radius for circular icon */
}
</style>


<style scoped>
.card-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
}
</style>
 

<style>
.dropdown-button .el-dropdown-link {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    padding: 10px 20px;
    /* Adjust padding as needed */
    border: 1px solid #409EFF;
    /* Button border color */
    background-color: #409EFF;
    /* Button background color */
    color: #fff;
    /* Button text color */
    border-radius: 4px;
    /* Button border radius */
    transition: background-color 0.3s, border-color 0.3s;
}

.dropdown-button .el-dropdown-link:hover {
    background-color: #66b1ff;
    /* Button background color on hover */
    border-color: #66b1ff;
    /* Button border color on hover */
}

.dropdown-button .el-icon-arrow-down {
    margin-left: 5px;
    /* Adjust the arrow's position */
}

.ellipsis-checkbox {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
    /* You can adjust this width as needed */
}
</style>
 

