<!-- eslint-disable prettier/prettier -->
<!-- eslint-disable vue/no-deprecated-slot-scope-attribute -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { getParentIds, BatchImportUpsert } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { getModelSpecs } from '@/api/fields'

import {
  ElButton,
  ElSelect,
  ElTable,
  ElIcon,
  ElTableColumn,
  ElInput,
  ElSwitch,ElCol, ElRow,ElButtonGroup,
  ElUpload,
  ElOption,
  ElMessage, ElDivider, ElMessageBox, UploadProps, UploadUserFile, ElOptionGroup, ElNotification,
} from 'element-plus'
import {
  Upload,
  ArrowDown,
  Edit,
  Share,
  Delete,
  RefreshLeft,
  UploadFilled,
  ArrowRightBold,
  Close,
  Promotion,
  Tools
} from '@element-plus/icons-vue'

import { ref, reactive, watch } from 'vue'

import readXlsxFile from 'read-excel-file'
import { uuid } from 'vue-uuid'
import readShapefileAndConvertToGeoJSON from '@/utils/readShapefile'
import JSZip from 'jszip';
import * as shapefile from 'shapefile';



import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import * as turf from '@turf/turf'
import proj4 from 'proj4';
import shortid from 'shortid';

import { useRouter, useRoute } from 'vue-router'

const route = useRoute()
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
const loadingPosting = ref(false)
const showUploadinput = ref(false)
 const loadingText = ref()

///---------------------xlsx-
 

//// ------------------parameters -----------------------////
const matchOptions = ref([])
const reserveOptions = ref([])
const uploadObj = ref([])
const matchedObj = ref([])
const matchedObjwithparent = ref([])
const fieldSet = ref([])
const show = ref(false)
const showSwitch = ref(false)
const showSettleementSelect = ref(false)
const { t } = useI18n()


const showErrorMessage = (message) => {
  ElMessage({
    showClose: true,
    message: message,
    type: 'warning',
    duration: 10000
  })
}


const showUploadMessage = (message) => {
  ElNotification({
    title: 'Results',
    message: message,
    dangerouslyUseHTMLString: true,

    duration: 0,
    type: 'info',

  })
}

 


const uploadOptions = [
  {
    label: 'Polygons',
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
        value: 'county',
        label: 'Counties'
      },
      {
        value: 'ward',
        label: 'Wards'
      }
    ]
  },
  {
    label: 'Points',
    options: [

      {
        value: 'health_facility',
        label: 'Health Care Facility'
      },
      {
        value: 'education_facility',
        label: 'Schools'
      },

      {
        value: 'road_asset',
        label: 'Road Structures'
      },
      {
        value: 'water_point',
        label: 'Water Points'
      },



      {
        value: 'other_facility',
        label: 'Other Facility'
      }
    ]
  },
  {
    label: 'Linear',
    options: [
      {
        value: 'road',
        label: 'Roads'
      },
      {
        value: 'sewer',
        label: 'Sewer'
      },
 
    ]
  }
]




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


}


const getParentOptions = async () => {

  await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: parentModel.value,
      searchField: 'name',
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


    parentObj.value.forEach(function (v) { delete v.geom });  // remove the parent geometry to avoid confusion 


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
  console.log(type)
  getModeldefinition(type)

  showUploadinput.value = true


  if (type != 'settlement' && !value_switch.value) {
    showSettleementSelect.value = true
    showSwitch.value = true
  } else {
    showSettleementSelect.value = false
    showSwitch.value = true

  }

  if (type === 'settlement') {
    model.value = 'settlement'
    parentModel.value = 'ward'
    parent_key.value = 'ward_id'
    code.value = 'pcode'
    // fieldSet.value = settlement_fields

    getParentOptions()
    console.log('settlements------>', type)
  } else if (type === 'parcel') {

    model.value = 'parcel'
    parentModel.value = 'settlement'
    parent_key.value = 'settlement_id'
    code.value = 'pcode'
    //fieldSet.value = settlement_fields
    getParentOptions()

    // fieldSet.value = parcel_fields
    console.log('parcel------>', fieldSet.value)

  }



  else if (type === 'health_facility') {
    // fieldSet.value = beneficiary_parcels
    model.value = 'health_facility'
    parentModel.value = 'settlement'
    parent_key.value = 'settlement_id'
    code.value = 'pcode'
    console.log('health_facility------>', fieldSet.value)
    getParentOptions()
  }

  else if (type === 'education_facility') {
    // fieldSet.value = beneficiary_parcels
    model.value = 'education_facility'
    parentModel.value = 'settlement'
    parent_key.value = 'settlement_id'
    code.value = 'pcode'
    console.log('education_facility------>', fieldSet.value)
    getParentOptions()
  }
  else if (type === 'road') {
    // fieldSet.value = beneficiary_parcels
    model.value = 'road'
    parentModel.value = 'settlement'
    parent_key.value = 'settlement_id'
    code.value = 'pcode'
    console.log('Road------>', fieldSet.value)
    getParentOptions()
  }

  else if (type === 'water_point') {
    // fieldSet.value = beneficiary_parcels
    model.value = 'water_point'
    parentModel.value = 'settlement'
    parent_key.value = 'settlement_id'
    code.value = 'pcode'
    getParentOptions()
  }


  else if (type === 'other_facility') {
    // fieldSet.value = beneficiary_parcels
    model.value = 'other_facility'
    parentModel.value = 'settlement'
    parent_key.value = 'settlement_id'
    code.value = 'pcode'
    console.log('other_facility------>', fieldSet.value)
    getParentOptions()
  }

  else if (type === 'ward') {
    // fieldSet.value = beneficiary_parcels
    model.value = 'ward'
    parentModel.value = 'subcounty'
    parent_key.value = 'subcounty_id'
    code.value = 'pcode'
    console.log('subcounty_id------>', fieldSet.value)
    getParentOptions()
  }






}





const handleProcess = async () => {
  console.log('upload--->', matchedObjwithparent.value)
  console.log('FieldSet--->', fieldSet.value)
  loadingPosting.value = true
  loadingText.value = 'Saving on the database. Please wait........'



  matchedObj.value = matchedObjwithparent.value.map((feature) => {
    let conv_feature = {}
    console.log(feature)

    for (var prop in feature) {
      var matched_field = fieldSet.value.filter((obj) => {
        return obj.match === prop
      })
      if (matched_field.length > 0) {
        conv_feature[matched_field[0].field] = feature[prop]
      }
      conv_feature.geom = (feature.geom)

    }
    console.log(conv_feature)
    if (!conv_feature.code) {
      conv_feature.code = shortid.generate()

    }
    return conv_feature
  })


  console.log('processed:', matchedObj)


  // ************** prepare data to server ***************** //

  var formData = {}
  formData.model = model.value
  formData.data = matchedObj.value


  console.log("importData--->", formData)


  // ************** Send data to server ***************** //
  await BatchImportUpsert(formData)
    .catch((error) => {
      console.log('Error------>', error.response.data.message)
      // ElMessage.error(error.response.data.message)
      showErrorMessage(error.response.data.message)

    })
    .then((response: { data: any }) => {
      loadingPosting.value = false
      loadingText.value = ''
    })



}


const makeOptions = (list) => {
  for (let i = 0; i < list.length; i++) {
    var opt = {}
    opt.value = list[i]
    opt.label = list[i]
    opt.disabled = false
    matchOptions.value.push(opt)
    reserveOptions.value.push(opt)

  }

  selectedValues.value = matchOptions

  console.log(matchOptions, matchOptions)
  //show.value=true
}

const handleClear = async () => {
  console.log('cleared....')
  settlement.value = ''
  // clear all the fileters -------
}

const handleSelectSettlement = async (settlement: any) => {
  settlement = settlement

}

const fileList = ref<UploadUserFile[]>([])

const handleRemove: UploadProps['onRemove'] = (file, uploadFiles) => {
  console.log(file, uploadFiles)
  show.value = false
  //uploadObj.value = []
 // matchedObj.value = []
   fieldSet.value = []
 // reset()

}





const handlePreview: UploadProps['onPreview'] = (uploadFile) => {
  console.log(uploadFile)
}

 

const handleFileChange = () => {
    console.log('uploaded...')
  
  disableProcess.value=false

}





const beforeRemove: UploadProps['beforeRemove'] = (uploadFile) => {
  return ElMessageBox.confirm(`Cancel the transfert of ${uploadFile.name} ?`).then(
    () => true,
    () => false
  )
}

 
 

const disableUploadSubmit = ref(false)
const disableProcess = ref(true)

const submitFiles = async () => {

  //disable to prevent multiple uplaods/submits


  disableUploadSubmit.value = true
  disableProcess.value=true
  console.log('on Submit....', fileList.value)
  loadingPosting.value = true
  loadingText.value = 'Matching fields.. Please wait.......'
  if (fileList.value.length == 0) {
    //  ElMessage.error('Select a  File first!')
    showErrorMessage('Select a  File first!')
    reset()

  } else {


    const fileType = fileList.value[0].raw.type;
    const extension = fileList.value[0].raw.name.split('.').pop().toLowerCase();

    console.log('fileType', fileType, extension)

    if (fileType === 'application/x-zip-compressed' || extension === 'zip' || extension === 'rar') {
      // console.log('Reading Shp file....')
      // const zip = await JSZip.loadAsync(fileList.value[0].raw);
      // const shapefileData = await readShapefile(zip);
      // const geojson = await convertToGeoJSON(shapefileData);
      // //console.log(geojson)
      // loadOptions(geojson)
      var rfile = fileList.value[0].raw

      readShp(rfile)

    }
    else if (fileType === 'application/json' || extension === 'geojson') {
      var rfile = fileList.value[0].raw

      console.log("File type", rfile.name.split('.').pop())

      let reader = new FileReader()

      let ftype = rfile.name.split('.').pop()

      console.log('------Json----')
      reader.onload = readJson
      reader.readAsText(rfile)
    }


    else {
      // ElMessage.error('Please select a zipped shapefile or a geojon file')
      showErrorMessage('Please select a zipped shapefile or a geojon file')


      loadingPosting.value = false

      return false;
    }



  }


}

const reset = async () => { 

  console.log('reseting')
  disableUploadSubmit.value = false
  
  matchOptions.value =[]
   reserveOptions.value = []
  uploadObj.value = []
  matchedObj.value = []
  matchedObjwithparent.value = []
  fieldSet.value = []
  show.value = false
  showSwitch.value =false
  showSettleementSelect.value = false
  fileList.value=[]

  
}

const readShp = async (file) => {
  console.log('Reading Shp file....')

  // await getGeoJSON(file)
  readShapefileAndConvertToGeoJSON(file)
    .then((geojson) => {

      console.log("Geo>", geojson)
      console.log("Geo1>", geojson[0])

      var collection = turf.featureCollection(geojson);

      console.log(collection)
      loadOptions(collection)




    })
    .catch((error) => {
      console.error(error)
      //ElMessage.error('Invalid shapefiles. Check your zipped file')
      showErrorMessage('valid shapefiles. Check your zipped file')


    })

  //uploadPolygon(feat)
}


const readJson = (event) => {
  let str = event.target.result
  let json = JSON.parse(str)


  console.log(json)

  loadOptions(json)

}


const loadOptions = (json) => {

  var featureType = json.type

  if (featureType === 'FeatureCollection') {
    console.log('xFeatureCollection:', json)
  } else if (featureType === 'Features' || featureType === 'Features') {

    console.log("features:", json)

  } else {
    console.log("Unknwon Features")
  }

  console.log('json ---->', json.type)

  const targetProj = "+proj=longlat +datum=WGS84 +no_defs"

  let sourceProj
  let epsgCode
  let crsProp = json.crs ? json.crs.properties.name : null;

  // //       try {
  // //           crsProp = json.crs.properties.name;
  // //       }
  // //       catch (error) {
  // //         console.warn('Error extracting EPSG code:', error); // Log warning message
  // //         ElMessage.warning('The uploaded file lacks Coordinate system definition. Assuming GCS WGS84')
  // //         epsgCode = 4326
  // // }
  // if (crsProp !== null) {
  //   console.log('crs >>>',crsProp)
  //   epsgCode = crsProp.match(/EPSG::(\d+)/)[1]?crsProp.match(/EPSG::(\d+)/)[1]: 4326
  //   if (!epsgCode) {
  //     epsgCode=4326
  //           }

  // } else {
  //   ElMessage.warning('The uploaded file lacks Coordinate system definition. Assuming GCS WGS84')
  //          epsgCode = 4326
  //       }

  // Using includes() method

  if (crsProp && crsProp.includes('EPSG')) {
    console.log('The string contains the character "EPSG"');
    epsgCode = crsProp.match(/EPSG::(\d+)/)[1]
  } else {
    epsgCode = 4326
  }



  //const epsgCode = crsProp? crsProp.match(/EPSG::(\d+)/)[1]:4326




  if (epsgCode == 21037) {
    // zone 37S
    sourceProj = "+proj=utm + zone=37 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  }
  else if (epsgCode == 21097) {
    // zone 37 N
    sourceProj = "+proj=utm + zone=37 + north + a=6378249.145 + rf=293.465 + towgs84=-157,-2,-299,0,0,0,0 + units=m + no_defs";
  }
  else if (epsgCode == 21036) {
    // zone 36 S
    sourceProj = "+proj=utm + zone=36 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  }
  else if (epsgCode == 21096) {
    // zone 36N
    sourceProj = "+proj=utm + zone=36 + north + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  }

  else {
    sourceProj = "+proj=longlat +datum=WGS84 +no_defs"

  }


  proj4.defs("SOURCE_CRS", sourceProj);
  proj4.defs("WGS84", targetProj);



  console.log('json.features', json.features)

  // makeOptions(fields)
  for (let i = 0; i < json.features.length; i++) {


    var feature = json.features[i]

    // Check if the properties field exists
    if (!feature.hasOwnProperty('properties')) {
      // Add the properties field
      Object.assign(feature, { properties: {} });
    }
    console.log('feature b4projectoion', feature)


    const geometry = json.features[i].geometry;
    // Check if the geometry type is "Polygon" or "MultiPolygon"
    if (geometry && geometry.type === "Polygon") {
          // If it's a single polygon, project its coordinates
          geometry.coordinates = geometry.coordinates.map(ring => {
            return ring.map(coordinate => {
              return proj4("SOURCE_CRS", "WGS84", coordinate);
            });
          });
        }

    else if (geometry && geometry.type === "MultiPolygon") {
        // If it's a MultiPolygon, loop through all polygons and project their coordinates
        geometry.coordinates.forEach(polygon => {
          polygon.forEach((ring, ringIndex) => {
            geometry.coordinates[ringIndex] = ring.map(coordinate => {
              return proj4("SOURCE_CRS", "WGS84", coordinate);
            });
          });
        });
      }

    else if (geometry && geometry.type === "LineString") {
      // If it's a single polygon, project its coordinates
      geometry.coordinates = geometry.coordinates.map(coordinate => {
        return proj4("SOURCE_CRS", "WGS84", coordinate);
      });
    }

    else if (geometry && geometry.type === "MultiLineString") {
        // If it's a MultiLineString, project the coordinates of each LineString
        geometry.coordinates = geometry.coordinates.map(lineString => {
          return lineString.map(coordinate => {
            return proj4("SOURCE_CRS", "WGS84", coordinate);
          });
        });
      }


    else if (geometry && geometry.type === "Point") {
      // If it's a single point, project its coordinates
      geometry.coordinates = proj4("SOURCE_CRS", "WGS84", geometry.coordinates);
    }


      else if (geometry && geometry.type === "MultiPoint") {
    // If it's a MultiPoint, project the coordinates of each point
    geometry.coordinates = geometry.coordinates.map(coordinate => {
      return proj4("SOURCE_CRS", "WGS84", coordinate);
    });
  }


    else {
      continue
    }

    console.log('geometry', geometry)
    var crs = { type: 'name', properties: { name: 'EPSG:4326' } }
    feature.geometry.crs = crs

    feature.geometry = geometry
    console.log(feature)

    feature.properties['createdBy'] = userInfo.id
    uploadObj.value.push(feature)  // Push to the temporary holder

  }




  console.log('rows-uploadObj------>', uploadObj.value)
  console.log('rows-parentObj------>', parentObj.value)
  //console.log('uploadObj.value[0]------>', uploadObj.value[0])

  //console.log('rows-uploadObj---PCODE--->', uploadObj.value[0].properties.pcode)

  let failedCount = 0
  uploadObj.value.map((upload, i) => {
    console.log('------------>', i, upload);
    var thisFeature = upload.properties;
    thisFeature.geom = upload.geometry;

    console.log('------matchedObj------>', i, thisFeature);

    if (settlement.value) {
      // Show the matching table if only any match is observed

      var filterParent = parentObj.value.filter(function (el) {
        return el['id'] === settlement.value;
      });

      console.log('------filterParent------>', filterParent);

      if (filterParent.length > 0) {
        // Here we add a prefix to the parent details to avoid confusion
        let pre = parentModel.value + '_'; // A prefix to differentiate parent and child
        let pfeature = Object.keys(filterParent[0]).reduce(
          (a, c) => ((a[`${pre}${c}`] = filterParent[0][c]), a),
          {}
        );

        const mergedFeature = { ...thisFeature, ...pfeature }; // Merge the feature with the parent details
        matchedObjwithparent.value.push(mergedFeature);
      } else {
        console.log('No match......');
        //ElMessage.error('The selected settlement did not match any records in the database!');
        showErrorMessage('The selected settlement did not match any records in the database!')
        //show.value = false;
        loadingPosting.value = false;
        failedCount = failedCount + 1
        console.log('move away.....');
        return
      }
    }

    else {
      if (upload.properties[code.value]) {
        var filterParent = parentObj.value.filter(function (el) {
          return el['code'] === upload.properties[code.value];
        });

        console.log('------filterParent------>', filterParent);

        if (filterParent.length > 0) {
          // Here we add a prefix to the parent details to avoid confusion
          let pre = parentModel.value + '_'; // A prefix to differentiate parent and child
          let pfeature = Object.keys(filterParent[0]).reduce(
            (a, c) => ((a[`${pre}${c}`] = filterParent[0][c]), a),
            {}
          );

          const mergedFeature = { ...thisFeature, ...pfeature }; // Merge the feature with the parent details
          matchedObjwithparent.value.push(mergedFeature);
        } else {
          console.log('No match......');
          push({ name: 'Importgeo' });
          //ElMessage.error('The parent Code ' + uploadObj.value[0].properties.pcode + ' (pcode) did not match any records in the database!');
          showErrorMessage('The parent Code ' + thisFeature.pcode + ' (pcode) did not match any records in the database!')
          loadingPosting.value = false;
          //show.value = false;
          console.log('move away.....');
          failedCount = failedCount + 1

          return;
        }
      } else {
        console.log('The parent Code is required');
        //ElMessage.error('The parent Code (pcode) is required in the uploaded File!');
        showErrorMessage('The parent Code (pcode) is required in the uploaded File!')

        loadingPosting.value = false;
        return;
      }
    }
  });


  console.log('Finished Matching -->', matchedObjwithparent.value)
  let successCount = 0
  if (matchedObjwithparent.value.length > 0) {
    show.value = true;
    successCount = matchedObjwithparent.value.length
    //showUploadMessage(matchedObjwithparent.value.length + ' will now be uploaded' + failedCount +'Failed to match')
  }

  const successColor = 'green';
  const failColor = 'red';

  const result = `
      <strong style="color: ${successColor}">${successCount}</strong>: Will be uploaded<br>
      <strong style="color: ${failColor}">${failedCount}</strong>: Failed to match
  `;


  //const result = '<strong>'+ successCount  +'</strong>' + ': will now be uploaded  <br>' + '<strong>'+ failedCount + '</strong>' +': Failed to match '   

  showUploadMessage(result)


  console.log('show Match?', show.value)
  console.log('children', matchedObjwithparent.value)
  loadingPosting.value = false
  const mergedfields = (Object.getOwnPropertyNames(matchedObjwithparent.value[0]));  // get properties from first row

  console.log('mergedfields', mergedfields)

  makeOptions(mergedfields)





}



const handleClearField = async (row) => {
  console.log('Cleared.......', row)
  //matchOptions.value = reserveOptions.value
  //fieldSet.value = []


}

const selectedValues = ref()

const prevValue = ref()

const disableSubmitMatched =ref(true)
const updateSelect = async (row, index) => {
  disableSubmitMatched.value=false
  // Remove the previously selected value for this row from the selectedValues array
  prevValue.value = selectedValues.value[index];


  if (prevValue.value) {
    const prevIndex = matchOptions.value.findIndex((option) => option.value === prevValue.value);
    if (prevIndex !== -1) {
      matchOptions.value[prevIndex].disabled = false;
    }
  }

  // Disable the selected value in the selectOptions array
  const selectedIndex = matchOptions.value.findIndex((option) => option.value === row.key2);
  if (selectedIndex !== -1) {
    matchOptions.value[selectedIndex].disabled = true;
  }

  // Update the selectedValues array
  selectedValues.value[index] = row.key2;

  console.log('selectedValues', selectedValues)
}


</script>

<template>
  <ContentWrap :title="t('Upload Geometry Data')" :message="t('Ensure you have the required fields Geojson ')">


    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12"> 
        <div  > 

          <div style="display: inline-block; margin-left: 20px">
        <el-select v-model="type" :onChange="handleSelectType" :onClear="handleClear" placeholder="Select data to import">
          <el-option-group v-for=" group in uploadOptions" :key="group.label" :label="group.label">
            <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
          </el-option-group>
        </el-select>
      </div>



      <div style="display: inline-block; margin-left: 20px">
        <el-select
v-if="showSettleementSelect" v-model="settlement" :onChange="handleSelectSettlement"
          :onClear="handleClear" clearable filterable collapse-tags placeholder="Select Settlement">
          <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>


      <div style="margin-top: 20px">

      <el-upload
    class="upload-demo"
    drag
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    v-if="showUploadinput" ref="upload" v-model:file-list="fileList"
    :on-preview="handlePreview" :on-remove="handleRemove" :before-remove="beforeRemove" :on-change="handleFileChange"
        :auto-upload="false"
  >
    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
    <div class="el-upload__text">
      Drop file here or <em>click to upload</em>
    </div>
    <template #tip>
      <div class="el-upload__tip">
        Only zipped shapefile (.zip), json and geojson formats are support
      </div>
    </template>
       </el-upload>
       </div>
  <div class="button-group-container" v-if="showUploadinput">
    <el-button-group  class="mt-1" style="width: 100%">

      
    <el-button :disabled="disableProcess" @click="submitFiles" type="primary"   style="display: inline-block; margin-left: 5px" class="mt-1" >
      Process
      <el-icon class="el-icon--right"> <Promotion/> </el-icon>
    </el-button>
    <el-button @click="reset" type="warning"   class="mt-1"  style="display: inline-block; margin-left: 5px"  >
      Reset
      <el-icon class="el-icon--right"> <Close/> </el-icon>
    </el-button>

    <el-button v-if="showUploadinput &&!disableSubmitMatched" class="mt-1"   @click="handleProcess" type="primary"  style="display: inline-block; margin-left: 5px" >
          Submit Data<el-icon class="el-icon--right">
            <UploadFilled />
          </el-icon>
        </el-button>
  </el-button-group>
</div>






      <!-- <el-upload
       v-if="showUploadinput" ref="upload" v-model:file-list="fileList" class="upload-demo"
        action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" :limit="1" :on-exceed="handleExceed"
        :on-preview="handlePreview" :on-remove="handleRemove" :before-remove="beforeRemove" :on-change="handleFileChange"
        :auto-upload="false">
        <template #trigger>
          <el-button  :disabled="disableUploadSubmit" type="plain">Select File <el-icon class="el-icon--right"> <UploadFilled/> </el-icon>
          </el-button>
        </template>

            
        <el-button
v-if="showUploadinput" class="mt-3" :disabled="disableProcess"  
            @click="submitFiles" type="primary" plain>
            Process
            <el-icon class="el-icon--right"> <Promotion/> </el-icon>
                </el-button>
                <el-button v-if="showUploadinput"  @click="reset" type="warning" plain>
                  Reset
                  <el-icon class="el-icon--right">  <Close/> </el-icon>
          </el-button>

      </el-upload> -->


  

        </div>
      </el-col>
  
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12"> 
        <div class="grid-content ep-bg-purple-light" > 

          <el-table size="small" v-if="show" :data="fieldSet" stripe="stripe" style="height: 400px; overflow-y: scroll;" border >
        <el-table-column prop="column" label="Field">
          <template #default="scope">
            <el-input v-model="scope.row.field" controls-position="left" disabled />
          </template>
        </el-table-column>
        <el-table-column prop="match" label="Match">
          <template #default="scope">


            <el-select v-model="scope.row.match" @change="updateSelect(scope.row, scope.$index)" filterable clearable>
              <el-option
v-for="(option, index) in matchOptions" :key="index" :label="option.label" :value="option.value"
                :disabled="option.disabled" />
            </el-select>

          </template>
        </el-table-column>
      </el-table>
    



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
</style>

<style>
.button-group-container {
  display: flex;
  justify-content: space-between;
}


.table-container {
  height: 200px;
  /* Adjust the height as needed */
  overflow-y: auto;
}



.button-group-container {
  display: flex;
  width: 100%;
}

.button-group {
  flex: 1;
  display: flex;
  justify-content: space-between;
}



</style>