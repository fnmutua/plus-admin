<template>
  <div>
    <el-card class="box-card">
      <div class="max-w-200px">
          <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
            Back
          </el-button>
        </div>

        
      <el-steps :active="currentStep" finish-status="success" align-center class="small-steps">
        <el-step
v-for="(step, index) in steps" :key="index" :title="isMobile ? '' : step.title"
          @click="handleStepClick(index)" />
      </el-steps>
      <el-divider />

      <el-form 
:model="formData" :rules="currentStepRules" label-width="200px" :label-position="labelPosition"
        ref="dynamicFormRef">
        <el-row :gutter="16">
          <el-col
v-for="(field, index) in currentStepFields" :key="index" :span="24" :xs="24" :sm="24" :md="12" :lg="8"
            :xl="8">
            <el-form-item :id="field.id"  :label="field.label" :prop="field.name">
              <el-input v-if="field.type === 'text'" v-model="formData[field.name]" />
              <el-input v-else-if="field.type === 'textarea'" type="textarea" v-model="formData[field.name]" />
              <el-input-number
:min="field.min" v-else-if="field.type === 'number'" v-model="formData[field.name]"
                @change="getFieldChangeHandler(field.name)" />
              <el-date-picker v-else-if="field.type === 'date'" type="date" v-model="formData[field.name]" />
              <!-- Add more conditions for other field types as needed -->
              <el-select
v-else-if="field.type === 'select' && field.multiselect === 'false'   && !field.adminUnit  "
                v-model="formData[field.name]" :filterable="true" collapse-tags placeholder="Select"
                @change="getFieldChangeHandler(field.name)">
                <el-option
v-for="option in field.options" :key="option.value" :label="option.label"
                  :value="option.value" />
              </el-select> 

              <el-select
v-else-if="field.type === 'select' && field.multiselect === 'true'"
                v-model="formData[field.name]" :filterable="true" multiple collapse-tags placeholder="Select"
                @change="getFieldChangeHandler(field.name)">
                <el-option
v-for="option in field.options" :key="option.value" :label="option.label"
                  :value="option.value" />
              </el-select> 

              <el-select
v-else-if="field.type === 'select'  && field.adminUnit && field.name==='county_id' "
                v-model="formData[field.name]" :filterable="true"   collapse-tags placeholder="County"
                @change="getFieldChangeHandler(field.name)">
                <el-option
v-for="option in countyOptions" :key="option.value" :label="option.label"
                  :value="option.value" />
              </el-select>
 
              <el-select
                v-else-if="field.type === 'select' && field.adminUnit && field.name==='subcounty_id'"
                                v-model="formData[field.name]" :filterable="true"   collapse-tags placeholder="Subcounty"
                                @change="getFieldChangeHandler(field.name)">
                                <el-option
                v-for="option in subcountyOptionsFiltered" :key="option.value" :label="option.label"
                                  :value="option.value" />
              </el-select>
 

              <el-select
                v-else-if="field.type === 'select'   && field.adminUnit && field.name==='ward_id' "
                                v-model="formData[field.name]" :filterable="true"   collapse-tags placeholder="Ward"
                                @change="getFieldChangeHandler(field.name)">
                                <el-option
                v-for="option in wardOptionsFiltered" :key="option.value" :label="option.label"  :value="option.value" />
              </el-select>

              <el-select
                v-else-if="field.type === 'select'   && field.adminUnit && field.name==='settlement_id' "
                                v-model="formData[field.name]" :filterable="true"   collapse-tags placeholder="Settlement"
                                @change="getFieldChangeHandler(field.name)">
                                <el-option
                v-for="option in settOptionsFiltered" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
 

              <!-- <el-upload
v-else-if="field.type === 'upload' && visibleUpload" v-model:file-list="fileList"
                class="upload-demo" action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
                :auto-upload="false" :show-file-list="false" :on-change="handleUploadGeo">
                <template #default>
                  <el-button type="primary">{{ fileList.length > 0 ? fileList[0].name : 'Select Geojson/Zipped Shp'
                  }}</el-button>
                  <span class="upload-filename" v-if="fileList.length > 0">{{ fileList[0].name }}</span>
                </template>
              </el-upload> -->


            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div class="button-container" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div>
          <el-tooltip content="Help" placement="top">
                <el-button color="#626aef"   type="info" @click="showTour"  :icon="InfoFilled" plain />
              </el-tooltip> 

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
        <h3 v-if="currentStep == totalSteps - 1 && showMessage" style="color: rgb(228, 30, 30); font-style: italic;">{{ wardMessage }}</h3>
      </div>

       <!-- <pre>{{ wardMessage}}</pre>  -->
      <div v-if="currentStep == totalSteps - 1" id="mapContainer" class="basemap"></div>
      <div v-if="currentStep == totalSteps - 1" id='coordinates' class='coordinates'></div>
    </el-card>
    <el-dialog v-model="showDialog" title="Select Location" width="70%">
      <el-row>
        <el-select v-model="county_id" class="m-2" @change="onSelectCounty" placeholder="Select" size="large">
          <el-option v-for="item in cascadeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>

        <el-select v-model="subcounty_id" class="m-2" @change="onSelectSubcounty" placeholder="Select" size="large">
          <el-option v-for="item in subcountyOptionsFiltered" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>

        <el-select v-model="ward_id" class="m-2" placeholder="Select" @change="onSelectWard" size="large">
          <el-option v-for="item in wardOptionsFiltered" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="settlement_id" class="m-2" placeholder="Select" @change="onSelectSettlement" size="large">
          <el-option v-for="item in settOptionsFiltered" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>

      </el-row>
      <template #footer>
        <div class="dialog-footer">
          <el-row justify="space-between">
            <el-col :span="12">
              <el-button @click="showDialog = false" style="float: left">Cancel</el-button>
            </el-col>
            <el-col :span="12">
              <el-button type="primary" @click="setLocationOnMobile" style="float: right">
                Confirm
              </el-button>
            </el-col>
          </el-row>
        </div>
      </template>
    </el-dialog>


      <el-dialog
      v-model="showUploadDialog"
      title="Upload a Zipped Shapefile/Geojson/KML/KMZ"
      width="30%" 
    >

    <el-upload
        v-model:file-list="fileList"
        class="upload-demo"
        action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleUploadGeo"
      >
        <template #trigger>
          <el-button type="primary">
            <i class="el-icon-upload"></i> <!-- Prepend upload icon here -->
            {{ fileList.length > 0 ? fileList[0].name : 'Select File' }}
          </el-button>
        </template>
        <template #default>
          <span class="upload-filename" v-if="fileList.length > 0">{{ fileList[0].name }}</span>
        </template>
      </el-upload>

   
    </el-dialog>

  </div>
  
  <el-tour v-model="isTourVisible" :z-index="100000" :on-close="endTour">
      <el-tour-step
        v-for="(step, index) in filteredTourSteps"
        :key="index"
        :target="step.target"
        :title="step.title"
        :description="step.content"
      />
    </el-tour>



 
</template>


<script lang="ts" setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { ElCard,ElPopconfirm, ElCascader, ElCascaderPanel,ElTooltip,ElTour,ElTourStep, ElDialog,  ElUpload, ElSwitch } from 'element-plus'
import { useRouter } from 'vue-router'

import { steps, formFields, formData, formRules } from './common/fields.ts'
import { subcountyOptions, wardOptions, settlementOptionsV2 } from './common/index.ts'
import { createHousehold, getOneHousehold, updateHousehold } from '@/api/households'
import shortid from 'shortid';
import { useRoute } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'

import mapboxgl from "mapbox-gl";
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { MapboxLayerSwitcherControl, MapboxLayerDefinition } from "mapbox-layer-switcher";
import { CreateRecord, DeleteRecord, updateOneRecord, getOneGeo, getOneSettlement, uploadDocuments, getfilteredGeo,duplicatePreCheck } from '@/api/settlements'

import "mapbox-layer-switcher/styles.css";
import * as turf from '@turf/turf'
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
import readShapefileAndConvertToGeoJSON from '@/utils/readShapefile'
import proj4 from 'proj4';
import { countyOptions } from './common';

import { Icon } from '@iconify/vue';
import { InfoFilled,Back} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'


const props1 = {
  checkStrictly: true,
}
 
const openMessageBox = (msg, duplicates) => {
  // Check if duplicates exist and dynamically extract keys
  const duplicateRecordsMsg = duplicates && duplicates.length > 0
    ? msg + `<br>` + 
      // Loop through duplicates and dynamically display all properties in a single line, separated by commas
      duplicates.map((duplicate, index) => {
        // Number each duplicate record starting from 1
        const recordNumber = index + 1;
        return `${recordNumber}. ` + 
          Object.entries(duplicate)
            .map(([key, value]) => `${key}: ${value || 'N/A'}`) // Combine key and value
            .join(', '); // Join the properties with commas
      }).join('<br>') // Separate each record with a line break
    : 'No duplicates found.';

  // Combine the initial message with the duplicates message
  const message = ` ${duplicateRecordsMsg}`;

  // Display the formatted message in a warning box with HTML formatting
  ElMessageBox.confirm(
    message, // Combined message with dynamic properties and HTML line breaks
    'Warning',
    {
      confirmButtonText: 'Proceed to Create',
      cancelButtonText: 'Cancel',
      type: 'warning',
      dangerouslyUseHTMLString: true, // Enable HTML rendering in the message box
    }
  )
    .then(() => {
      // Proceed nonethess 
 
      CreateRecord(formData)
                  .then(() => {
                    // This block will be executed after CreateRecord succeeds
                    goBack(); // Call goBack after successful record creation
                  })
                  .catch((error) => {
                    // Handle any errors that occur during CreateRecord
                    console.error("Error creating record:", error);
                    
                  });

 
    })
    .catch(() => {
      console.log("cancelled")
    });
};




 
const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;


const isMobile = computed(() => appStore.getMobile)

const showUploadDialog=ref(false)
const route = useRoute()
//const { push } = useRouter()
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

// for mobile only 
const county_id = ref()
const subcounty_id = ref()
const subcountyOptionsFiltered = ref([])
const ward_id = ref()
const wardOptionsFiltered = ref([])
const selectAdmin = ref()

const settOptionsFiltered = ref([])
const settlement_id = ref()
const area_ha = ref(0)


const onSelectCounty = (county_id) => {
  formData.subcounty_id = null
  formData.ward_id = null
  formData.settlement_id = null
  subcountyOptionsFiltered.value = subcountyOptions.value.filter((obj) => obj.county_id == county_id);
  console.log('changed county')
  console.log(subcountyOptionsFiltered)
  handleChangeLocation([county_id])

};


const onSelectSubcounty = (subcounty_id) => {
  formData.ward_id = null
  formData.settlement_id = null

 wardOptionsFiltered.value = wardOptions.value.filter((obj) => obj.subcounty_id == subcounty_id);
 handleChangeLocation([formData.county_id.value,subcounty_id ])

};
 
const centroid =ref(37,1)

const calculateArea = (geom) => {
   // Calculate the area using Turf.js
   const areaSquareMeters = turf.area(geom);

// Convert square meters to hectares
const areaHectares = areaSquareMeters / 10000;
area_ha.value= areaHectares.toFixed(4)
 
var centre = turf.centroid(geom);
  centroid.value = centre.geometry.coordinates

 };


const onSelectWard = (ward_id) => {

  formData.settlement_id = null
  settOptionsFiltered.value = settlementOptionsV2.value.filter((obj) => obj.ward_id == ward_id);
  handleChangeLocation([ formData.county_id.value,formData.subcounty_id.value,ward_id ])

};

const onSelectSettlement = (sett_id) => {
  formData.settlement_id = sett_id
  handleChangeLocation([ formData.county_id.value,formData.subcounty_id.value,formData.ward_id.value, sett_id ])

 // const selectedSettlement = settOptionsFiltered.value.filter((obj) => obj.value === sett_id);
 // selectAdmin.value = selectAdmin.value + ' | ' + selectedSettlement[0].label
};

const setLocationOnMobile = () => {
  formData.county_id = county_id.value
  formData.subcounty_id = subcounty_id.value
  formData.ward_id = ward_id.value
  formData.settlement_id = settlement_id.value
  formData.location = [county_id, subcounty_id, ward_id, settlement_id]
  handleChangeLocation([county_id.value, subcounty_id.value, ward_id.value])

  console.log('formData', formData)
  showDialog.value = false
};
/// - mobile end 

const fileList = ref([])
const visibleUpload = ref(false)

const newRecord = ref(true)

const map = ref()

const mapContainer = ref(null);
const geomScope = ref([])
const model = 'article'
const component_id = ref()

onMounted(async () => {

  //formData.value = JSON.parse(route.query.formData);
  // console.log('data>>',data)
  console.log('passed data', route.query.id)

  console.log('Loaded.......')
  component_id.value = route.params.domain
 


  const form = {}
  form.model = model
  form.id = route.query.id

  let ward_id



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
const cascadeOptions = ref([])
 

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

 
  





const handleStepClick = (index) => {

  currentStep.value = index;
}


const nextStep = async () => {
  if (currentStep.value < totalSteps.value - 1 && dynamicFormRef) {
    const formInstance = dynamicFormRef
    formInstance.value.validate((valid: boolean) => {
      if (valid) {
        console.log(formInstance)
        currentStep.value++;
      }
    });
  }
  console.log('xxxxx', currentStep.value, totalSteps.value)

   
};

 
 



const submitForm = async () => {
  const formInstance = dynamicFormRef
  formInstance.value.validate(async (valid: boolean) => {
    if (valid) {
      // Perform form submission logic

      formData.model = model
      formData.createdBy = userInfo.id
      formData.component_id = component_id.value

      
          // Calculate the area using Turf.js
          const areaSquareMeters = turf.area(geomScope.value);

          // Convert square meters to hectares
          const areaHectares = areaSquareMeters / 10000;
            formData.area = areaHectares.toFixed(4)

           console.log('formData.value', formData.value)


    
      //formData.geom =geomScope.value


      if (newRecord.value) {
            formData.isApproved = 'Pending';
            formData.code = shortid.generate();
            formData.checkFields = ["name", "county_id"]; // additional checks for duplicates

            // Perform the duplicate check first
            duplicatePreCheck(formData)
              .then(response => {
                console.log('Success:', response);
                
                CreateRecord(formData)
                  .then(() => {
                    // This block will be executed after CreateRecord succeeds
                    goBack(); // Call goBack after successful record creation
                  })
                  .catch((error) => {
                    // Handle any errors that occur during CreateRecord
                    console.error("Error creating record:", error);
                    
                  });

              })
              .catch(error => {
                // Check if duplicates were found 
                  openMessageBox(error.response.data.message,error.response.data.duplicates )
                  // Prompt user for confirmation 
                console.error('Error during duplicate check:', error);
                // Handle duplicate check error (e.g., server issues)
              });
          } else {
            // Calculate area using Turf.js if newRecord is not present
            const areaSquareMeters = turf.area(formData.geom);
            const areaHectares = areaSquareMeters / 10000;
            formData.area = areaHectares.toFixed(4);

            // Proceed to update the record if no new record creation
            updateOneRecord(formData)
              .then(updateResponse => {
                console.log('Record updated successfully:', updateResponse);
                // Handle the successful update here
              })
              .catch(updateError => {
                console.error('Error during record update:', updateError);
                // Handle server error or other issues
              });
          }



      //goBack()

      // push({
      //    name: 'Health'
      // })

    } else {
      // Handle form validation errors
      console.log('fail validation')
    }
  });

};


 



// Function to get the field change handler based on field name
const getFieldChangeHandler = (fieldName: string) => {
  const field = formFields.flat().find((f) => f.name === fieldName);
  if (fieldName == 'county_id') {
    onSelectCounty(formData[fieldName])
  }


  if (fieldName == 'subcounty_id') {
    onSelectSubcounty(formData[fieldName])
  }
  if (fieldName == 'ward_id') {
    onSelectWard(formData[fieldName])
  }
  if (fieldName == 'settlement_id') {
    onSelectSettlement(formData[fieldName])
  }

 
  return undefined;
};


// Addd message if project Geometry is not found 
const   wardMessage = "This settlement does not have location geometry defined. The ward geometry is shown instead. Edit to reflect the actual settlement location"

const showMessage =ref(false)



const isTourVisible =ref(false)
const showTour = () => {

isTourVisible.value=true

 
}

const filteredTourSteps = computed(() => {

const fil = tourSteps.value.filter(step => step.step == currentStep.value && step.visible==true);
console.log('filteredTourSteps', fil)
return fil
});


const endTour = () => { 
 
}


const tourSteps = ref([
  {
    step: 0,
    target: '#btn1',
    title: 'County Selection',
    content: 'Start by selecting the county where the settlement is located.',
    visible: true
  },
  {
    step: 0,
    target: '#btn2',
    title: 'Constituency Selection',
    content: 'Now, choose the constituency that falls within the selected county.',
    visible: true
  },
  {
    step: 0,
    target: '#btn3',
    title: 'Ward Selection',
    content: 'Next, pick the ward that corresponds to the selected constituency.',
    visible: true
  },
  {
    step: 0,
    target: '#btn4',
    title: 'Settlement Name',
    content: 'Type the settlements name',
    visible: true
  },
  {
    step: 0,
    target: '#btn5',
    title: 'Settlement Type',
    content: 'Indicate whether the settlement is a Slum or an Informal Settlement.',
    visible: true
  },
  {
    step: 0,
    target: '#btn6',
    title: 'Parcel Number',
    content: 'Enter the parcel number for the where the settlement is located.',
    visible: true
  },
  {
    step: 0,
    target: '#btn7',
    title: 'Parcel Ownership',
    content: 'Specify whether the parcel is publicly or privately owned.',
    visible: true
  },
  {
    step: 0,
    target: '#btn8',
    title: 'Survey Plan (RIM)',
    content: 'Provide the RIM or survey plan number associated with this settlement.',
    visible: true
  },
  {
    step: 0,
    target: '#btn9',
    title: 'Area (Ha)',
    content: 'Enter the total area of the parcel in hectares.',
    visible: true
  },
  {
    step: 0,
    target: '#btn10',
    title: 'Population',
    content: 'Estimate the population residing within the settlement.',
    visible: true
  },
  {
    step: 0,
    target: '#btn11',
    title: 'Survey Status',
    content: 'Indicate whether the parcel has been officially surveyed.',
    visible: true
  },
  {
    step: 0,
    target: '#btn12',
    title: 'Land Use',
    content: 'Describe the predominant land use within the settleemnt.',
    visible: true
  },
  {
    step: 0,
    target: '#btn13',
    title: 'Proximity to River',
    content: 'Specify if the parcel is located near a river.',
    visible: true
  },
  {
    step: 0,
    target: '#btn14',
    title: 'Utility Way-leave',
    content: 'Indicate if the parcel lies on a utility way-leave.',
    visible: true
  },
  {
    step: 0,
    target: '#btn15',
    title: 'Road Reserve',
    content: 'Specify if the parcel is on a road reserve.',
    visible: true
  },
  {
    step: 0,
    target: '#btn16',
    title: 'Structure Types',
    content: 'Select the types of structures found in the settlement.',
    visible: true
  },
  {
    step: 0,
    target: '#btn17',
    title: 'Development Level',
    content: 'Choose the level of development within the settlement.',
    visible: true
  },
  {
    step: 0,
    target: '#btn18',
    title: 'Building Materials',
    content: 'Identify the typical building materials used in the area.',
    visible: true
  },
  {
    step: 0,
    target: '#btn19',
    title: 'Structure Spacing',
    content: 'Enter the average distance between structures in meters.',
    visible: true
  },
  {
    step: 0,
    target: '#btn20',
    title: 'Urban Center Proximity',
    content: 'Specify the distance from the parcel to the nearest urban center.',
    visible: true
  },
  {
    step: 0,
    target: '#btn21',
    title: 'Trunk Road Proximity',
    content: 'Enter the distance from the settlement to the nearest trunk road.',
    visible: true
  },
  {
    step: 0,
    target: '#btn22',
    title: 'Encumbrances',
    content: 'Indicate if there are any court cases or claims related to the parcel.',
    visible: true
  },
  {
    step: 0,
    target: '#btn23',
    title: 'Status',
    content: 'Set the current status of the settlement as Active or Decommissioned.',
    visible: true
  },
  {
    step: 0,
    target: '#btn24',
    title: 'Comments/Remarks',
    content: 'Add any additional comments or remarks about the settlement.',
    visible: true
  },

  {
    step: 1,
    target: '#mapContainer',
    title: 'Map',
    content: 'The Map displays the settlement location based on the selected ward. Zoom in to the settlement location',
    visible: true
  },
  {
    step: 1,
    target: '#upload',
    title: 'Upload Location geometry',
    content: 'Upload geojson/shapefile. Current supports .shp (zipped), .json and .geojson ',
    visible: true
  }
  


]);


// Watch dependencies and log changes (or trigger additional actions)
watch(
    [currentStep,tourSteps],
    (newValues, oldValues) => {
      console.log("Dependencies changed:", newValues);
      console.log("Filtered steps:", filteredTourSteps.value);
      // Any other side effects or actions can be performed here
    },
    { immediate: true }
  );


</script>
<style>
.small-steps .el-step {
  width: 50px;
  /* Adjust the width as per your requirement */
  height: 35px;
  /* Adjust the height as per your requirement */
  line-height: 20px;
  /* Adjust the line-height as per your requirement */
  padding-bottom: 5px;
  /* Add 5 pixels bottom padding */

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

<style scoped>
.basemap {
  width: 100%;
  height: 65vh;
}



.coordinates {
  display: block;
  position: absolute; /* Use absolute positioning to position it within the container */
  width: 10%;
  bottom: 15; /* Set to 0 to align it at the bottom */
  left: 50%; /* Set to 50% to horizontally center it */
  transform: translateX(-50%); /* Use transform to horizontally center it */
  background-color: rgba(10, 10, 10, 0.85);
  color: #fbfbfb;
  text-align: center;
  font-size: 10px;
  z-index: 10;
  border-radius: 5px;
}


.upload {
  display: block;
  position: relative;
  width: 24%;
  top: 100px;
  left: 20px;
  /* Updated to move the element to the top left corner */
  background-color: rgba(195, 26, 26, 0.85);
  color: #fbfbfb;
  text-align: center;
  font-size: 10px;
  z-index: 10;
  border-radius: 5px;
}

.mapbox-custom-control {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
}

.upload-filename {
  margin-left: 10px;
}

.switch-container {
  display: inline-block;
  width: auto;
  white-space: nowrap;
}


.my-image-button {
  background: url("data:image/png;base64 etc...");
}


</style>