<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'

import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import {
  ElButton, ElRate, ElTag, ElTabs, ElTabPane, ElDialog, ElCard,
  ElInput, ElBadge, ElDescriptions, ElDescriptionsItem, ElPopconfirm, ElTable, ElCol, ElRow,
  ElTableColumn, ElDropdown, ElDropdownMenu, ElDropdownItem, ElCheckbox
} from 'element-plus'
import { ElMessage, } from 'element-plus'
import { Position, View, Plus, Back, CircleCloseFilled, Download, Delete, Edit, Filter, InfoFilled, Search } from '@element-plus/icons-vue'

import { ref, reactive, computed } from 'vue'
import { ElPagination, ElTooltip } from 'element-plus'
import { useRouter } from 'vue-router'
import { DeleteRecord, updateOneRecord, deleteDocument } from '@/api/settlements'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { defineAsyncComponent,onMounted } from 'vue';

import xlsx from "json-as-xlsx"
import {
  searchByKeyWord
} from '@/api/settlements'

import filterDataByKeys from '@/utils/filterArrays'

import { getSummarybyField } from '@/api/summary'

import 'element-plus/theme-chalk/display.css'

////////////*************Map Imports***************////////

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf'
import { Icon } from '@iconify/vue';


import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { UserType } from '@/api/register/types'


import { MapboxLayerSwitcherControl } from "mapbox-layer-switcher";
import "mapbox-layer-switcher/styles.css";

// Type definitions
interface EvaluationData {
  id: string
  evaluation_title: string
  overall_rating: number
  evaluators: string
  isApproved: 'Pending' | 'Approved' | 'Rejected'
  reviewerId?: string
  reject_msg?: string
  model: string
  project: {
    title: string
    geom?: any
  }
  evaluation_type: {
    type: string
  }
  user: {
    name: string
  }
  updatedAt: string
  documents: any[]
  [key: string]: any
}

interface FormData {
  limit: number
  page: number
  curUser: number
  model: string
  searchField: string
  searchKeyword: string
  assocModel?: string
  filters: string[]
  filterValues: string[][]
  associated_multiple_models: string[]
  nested_models: string[]
  cache_key?: string
  returnAll?: boolean
}

interface SummaryFormData {
  model: string
  summaryField: string
  summaryFunction: string
  groupField: string[]
}

interface DeleteFormData {
  id: string
  model: string
  filesToDelete?: any[]
}

interface FieldData {
  label: string
  value: string
}

interface DataObject {
  sheet: string
  columns: FieldData[]
  content: any[]
}

interface MapboxLayerDefinition {
  id: string
  title: string
  visibility: string
  type: string
}

interface TableSlotDefault {
  row: EvaluationData
}



import UploadComponent from '@/views/Components/UploadComponent.vue';


import ListDocuments from '@/views/Components/ListDocuments.vue';





const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;





//*****************************Create**************************** */

///----------------------------------------------------------------------------------
const ruleForm = reactive({
  name: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  settlement_type: '',
  population: '',
  area: '',
  description: null,
  geom: null,
  id: '',
  dist_trunk: null,
  dist_town: null,
  parcel_no: null,
  parcel_owner: null,
  rim_no: null,
  isApproved: 'Pending',
  code: ''
})


const selectedCounty = ref()
const selectedSubCounty = ref(null)


const search_string = ref()

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)



const { push } = useRouter()
const value1 = ref<string[]>([])
const value2 = ref<string[]>([])
const value3 = ref<string>('')
var value4 = ref<string[]>([])
var value5 = ref<string[]>([])

const loadingGetData = ref(false)

const interVentionTypeOptions = ref<any[]>([])


const page = ref(1)
 
const loading = ref(true)
 
const currentPage = ref(1)
const activeTab = ref('list')
const enableSubcounty = ref(false)





const mobileBreakpoint = 768;
const defaultPageSize = 10;
const mobilePageSize = 5;
const pageSize = ref(defaultPageSize);

// Function to update pageSize based on window width
const updatePageSize = () => {
  if (window.innerWidth <= mobileBreakpoint) {
    pageSize.value = mobilePageSize;
  } else {
    pageSize.value = defaultPageSize;
  }
};

onMounted(async () => { 

 window.addEventListener('resize', updatePageSize);
   updatePageSize(); // Initial check
 
 })
















const total = ref(0)
const totalRejected = ref(0)
const totalApproved = ref(0)
const totalPending = ref(0)


//let tableDataList = ref<EvaluationData[]>([])
const tableDataList = ref<EvaluationData[]>([])
let tableDataListNew = ref<EvaluationData[]>([])
let tableDataListRejected = ref<EvaluationData[]>([])

//// ------------------parameters -----------------------////


const filters = ref<string[]>(['isApproved'])
const filterValues = ref<string[][]>([['Approved']]) // make sure the inner array is array




var tblData = ref<EvaluationData[]>([])

const associated_Model = ''
const associated_multiple_models = ['project', 'evaluation_type', 'users']
const nested_models = ['document', 'document_type'] // The mother, then followed by the child

const model = 'evaluation'
//// ------------------parameters -----------------------////



const { t } = useI18n()

const isMobile = computed(() => appStore.getMobile)

const reviewWindowWidth = ref('40%')

if (isMobile.value) {
  reviewWindowWidth.value = "100%"
}




const handleClear = async () => {
  console.log('cleared....')
  enableSubcounty.value = false

  // clear all the fileters -------
  filterValues.value = []
  filters.value = []
  value1.value = []
  value2.value = []
  value3.value = ''
  value4.value = []
  value5.value = []

  pageSize.value = 5
  currentPage.value = 1
  tblData.value = []
  //----run the get data--------
  getAllSetllementsInitially()
}




const currentRow = ref()
const addMoreDocuments = ref(false)




const onPageChange = async (selPage: any) => {
  page.value = selPage

  //console.log('', activeTab.value)
  if (activeTab.value == 'list') {
    filters.value = ['isApproved']
    filterValues.value = [['Approved']]  // make sure the inner array is array
  } else if (activeTab.value == 'New') {
    filters.value = ['isApproved']
    filterValues.value = [['Pending']]  // make sure the inner array is array
  }
  else if (activeTab.value == 'Rejected') {
    filters.value = ['isApproved']
    filterValues.value = [['Rejected']]  // make sure the inner array is array
  }

  console.log("Where are we?", activeTab.value, filters.value, filterValues.value)

  if (search_string.value) {
    getFilteredBySearchData(activeTab.value, search_string.value)
  } else {
    getNewOrRejectedSettlements(activeTab.value)
  }


}

const onPageSizeChange = async (size: any) => {
  pageSize.value = size
  //getFilteredData(filters, filterValues)

  console.log(activeTab.value)
  if (activeTab.value === 'list') {
    filters.value = ['isApproved']
    filterValues.value = [['Approved']]  // make sure the inner array is array
  } else if (activeTab.value === 'New') {
    filters.value = ['isApproved']
    filterValues.value = [['Pending']]  // make sure the inner array is array

  }
  else if (activeTab.value === 'Rejected') {
    filters.value = ['isApproved']
    filterValues.value = [['Rejected']]  // make sure the inner array is array
  }


  if (search_string.value) {
    getFilteredBySearchData(activeTab.value, search_string.value)
  } else {
    getNewOrRejectedSettlements(activeTab.value)
  }



}

const clickTab = async (obj) => {

  page.value = 1
  activeTab.value = obj.props.name

  console.log("Loading tabs.............", obj.props.label)
  console.log("Loading activeTab.............", activeTab.value)
  console.log("Loading search_string.............", search_string.value)
  dynamicDocumentComponent.value = null

  if (obj.props.name === 'list') {
    filters.value = ['isApproved']
    filterValues.value = [['Approved']]  // make sure the inner array is array

  } else if (obj.props.name === "New") {
    filters.value = ['isApproved']
    filterValues.value = [['Pending']]  // make sure the inner array is array

  }
  else if (obj.props.name === "Rejected") {
    filters.value = ['isApproved']
    filterValues.value = [['Rejected']]  // make sure the inner array is array
  }

  console.log('Filters:', filters.value)
  console.log('Filters Value:', filterValues.value)

  if (search_string.value) {
    getFilteredBySearchData(obj.props.name, search_string.value)
  } else {
    getNewOrRejectedSettlements(obj.props.name)
  }
}



const getAllSetllementsInitially = async () => {
  // getFilteredData(filters, filterValues)
  await getNewOrRejectedSettlements('list')
  getSettlementCount()  // This gets the approved/new/rejecetd counts

}





const getSettlementCount = async () => {
  const formData: SummaryFormData = {
    model: 'evaluation',
    summaryField: 'isApproved',
    summaryFunction: 'count',
    groupField: ['isApproved']
  }

  const newSettCount = await getSummarybyField(formData)
  console.log('Settleemnt Count---->', newSettCount)

  let pending = await filterDataByKeys(newSettCount.Total, ['isApproved'], ['Pending']);
  let approved = await filterDataByKeys(newSettCount.Total, ['isApproved'], ['Approved']);
  let rejected = await filterDataByKeys(newSettCount.Total, ['isApproved'], ['Rejected']);

  console.log(pending)
  console.log(approved)
  console.log(rejected)

  totalPending.value = pending.length > 0 ? parseInt(pending[0].count) : 0
  totalApproved.value = approved.length > 0 ? parseInt(approved[0].count) : 0
  totalRejected.value = rejected.length > 0 ? parseInt(rejected[0].count) : 0

  console.log('New:', totalPending.value)
  console.log('Approved:', totalApproved.value)
  console.log('Rejecetd:', totalRejected.value)

}


const selectedWard = ref()
const getNewOrRejectedSettlements = async (tab) => {

  loadingGetData.value = true




  if (tab === 'New') {
    filters.value = ['isApproved']
    filterValues.value = [['Pending']]  // make sure the inner array is array

  } else if (tab === 'Rejected') {
    filters.value = ['isApproved']
    filterValues.value = [['Rejected']]  // make sure the inner array is array
  }

  else {
    filters.value = ['isApproved']
    filterValues.value = [['Approved']]  // make sure the inner array is array
  }


  if (selectedCounty.value) {
    var selectOption = 'county_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes(selectedCounty.value) && selectedCounty.value.length > 0) {
      filterValues.value.splice(index, 0, selectedCounty.value) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

    // expunge the filter if the filter values are null
    if (selectedCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }

  }



  // Filter by subcounty  
  if (selectedSubCounty.value) {
    var selectOption = 'subcounty_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes(selectedSubCounty.value) && selectedSubCounty.value.length > 0) {
      filterValues.value.splice(index, 0, selectedSubCounty.value) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

    // expunge the filter if the filter values are null
    if (selectedSubCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }

  }


  // Filter by ward  
  if (selectedWard.value) {
    var selectOption = 'ward_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes(selectedWard.value) && selectedWard.value.length > 0) {
      filterValues.value.splice(index, 0, selectedWard.value) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

    // expunge the filter if the filter values are null
    if (selectedWard.value.length === 0) {
      filters.value.splice(index, 1)
    }

  }



  const formData: FormData = {
    limit: pageSize.value,
    page: page.value,
    curUser: 1, // Id for logged in user
    model: model,
    //-Search field--------------------------------------------
    searchField: 'evaluation_title',
    searchKeyword: '',
    //--Single Filter -----------------------------------------
    assocModel: associated_Model,
    // - multiple filters -------------------------------------
    filters: filters.value,
    filterValues: filterValues.value,
    associated_multiple_models: associated_multiple_models,
    nested_models: nested_models
    //cache_key: key
  }

  //-------------------------
  console.log(formData)
  const res = await getSettlementListByCounty(formData as any)
  //const res = await getListWithoutGeo(formData)

  loadingGetData.value = false
  console.log('found data..', res)
  total.value = res.total
  if (tab === 'New') {
    tableDataListNew.value = res.data
    console.log('New', res.data)
    //  total.value = totalPending.value
    //  console.log('total ---',total.value)

  } else if (tab === 'Rejected') {
    tableDataListRejected.value = res.data
    //   total.value = totalRejected.value

  } else {
    tableDataList.value = res.data
    //  total.value=totalApproved.value

    // console.log('Keys >>>>', flattenNestedArrays(res.data))
    /// model_fields.value = await flattenNestedArrays(res.data)


    res.data.forEach(function (arrayItem) {
      var dd = flattenJSON(arrayItem)

      flattenedData.value.push(dd)
    })



    var obj = flattenJSON(res.data[0])

    console.log('flatteda', obj)
    model_fields.value = Object.keys(obj);


  }



}
const flattenJSON = (obj = {}, res = {}, extraKey = '') => {
  for (let key in obj) {
    if (key !== 'geom' && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'email' && key !== 'phone' && key !== 'isApproved' && key !== 'createdBy' && key !== 'documents' && key !== 'user' && key !== 'code') {
      if ((typeof obj[key] !== 'object' || obj[key] === null) && key !== 'id') {
        res[extraKey + key] = obj[key];
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach((item, index) => {
          flattenJSON(item, res, `${extraKey}${key}.${index}.`);
        });
      } else {
        flattenJSON(obj[key], res, `${extraKey}${key}_`);
      }
    }
  }
  return res;
};


const model_fields = ref<string[]>([])
const flattenedData = ref<any[]>([])

const getFilteredData = async (selFilters, selfilterValues) => {
  loadingGetData.value = true

  console.log("loadingGetData", loadingGetData.value)
  const formData: FormData = {
    limit: pageSize.value,
    page: page.value,
    curUser: 1, // Id for logged in user
    model: model,
    //-Search field--------------------------------------------
    searchField: 'evaluation_title',
    searchKeyword: '',
    //--Single Filter -----------------------------------------
    assocModel: associated_Model,
    // - multiple filters -------------------------------------
    filters: selFilters,
    filterValues: selfilterValues,
    associated_multiple_models: associated_multiple_models,
    nested_models: nested_models
  }


  //-------------------------
  console.log('FormSubmitted', formData)
  const res = await getSettlementListByCounty(formData as any)

  console.log('After Querry - associated_multiple_models', res)
  tableDataList.value = res.data
  total.value = res.total
  loadingGetData.value = false


  // filter
  //if (showAdminButtons.value) {
  // getSettlementCount()  // This gets the approved/new/rejecetd counts

  //}

  // 


}







const ShowReviewDialog = ref(false)
const RejectDialog = ref(false)
const evaluation_raw = ref<EvaluationData>({} as EvaluationData)


const Review = (data: TableSlotDefault) => {
  console.log('On Click.....', data.row)

  // Allocate received object's properties to a new object
  evaluation_raw.value = {
    ...data.row
  };



  ShowReviewDialog.value = true



  formHeader.value = "Review Evaluation"

}

const approveEvaluation = async () => {


  console.log("Appprove")
  evaluation_raw.value.isApproved = 'Approved'
  evaluation_raw.value.reviewerId = userInfo.id

  evaluation_raw.value.model = 'evaluation'
  console.log(evaluation_raw)

  await updateOneRecord(evaluation_raw.value as any).then(() => { })
  ShowReviewDialog.value = false
  getFilteredData(filters, filterValues)
}


const reject = async () => {
  RejectDialog.value = true
}

const rejectReason = ref('')
const confirmReject = async () => {
  console.log('Reject Msg', rejectReason.value)
  evaluation_raw.value.reject_msg = rejectReason.value
  evaluation_raw.value.isApproved = 'Rejected'

  console.log(ruleForm)
  evaluation_raw.value.model = 'evaluation'
  evaluation_raw.value.reviewerId = userInfo.id



  await updateOneRecord(evaluation_raw.value as any).then(() => { })
  RejectDialog.value = false
  ShowReviewDialog.value = false

  getFilteredData(filters, filterValues)

}

const viewProject = async (data: TableSlotDefault) => {
  console.log('On map.....', data.row.project);

  dialogMap.value = true;

  if (data.row.project.geom) {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for the dialog to fully load
    loadMap(data.row.project.geom);
  } else {
    ElMessage({
      message: 'This project does not have the boundary defined in the database!',
      type: 'warning',
    });
  }
};




const closeMap = () => {

  dialogMap.value = false
}


const loadMap = (geom) => {


  console.log(geom)

  var centroid = turf.centroid(geom)
  var mapCenter = centroid.geometry.coordinates
  var localBounds = turf.bbox(geom);

  console.log(localBounds)


  var nmap = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v12",
    // center: [37.137343, 1.137451], // starting position
    center: mapCenter, // starting position
    zoom: 12,

  })

  nmap.on('load', () => {

    nmap.addSource('layer', {
      type: 'geojson',
      // Use a URL for the value for the `data` property.
      //  data: turf.featureCollection(facilityGeoPolygons.value),
      data: geom,
      // data: 'https://data.humdata.org/dataset/e66dbc70-17fe-4230-b9d6-855d192fc05c/resource/51939d78-35aa-4591-9831-11e61e555130/download/kenya.geojson'
    });

    // Add a black outline around the polygon.
    nmap.addLayer({
      'id': 'outline',
      'type': 'line',
      'source': 'layer',
      'layout': {},
      'paint': {
        'line-color': 'black',
        'line-width': 2
      }
    });

    nmap.addLayer({
      'id': 'pontLayer',
      "type": "circle",
      'source': 'layer',
      'paint': {
        'circle-radius': 4,
        'circle-stroke-width': 2,
        'circle-color': 'red',
        'circle-stroke-color': 'white'
      }
    });


    nmap.addLayer({
      id: 'Satellite',
      source: { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 },
      type: "raster"
    }, 'outline');

    nmap.addLayer({
      id: 'Streets',
      source: { "type": "raster", "url": "mapbox://mapbox.streets", "tileSize": 256 },
      type: "raster"
    }, 'outline');



    nmap.setLayoutProperty('Satellite', 'visibility', 'none')


    const layers: MapboxLayerDefinition[] = [

      {
        id: "Satellite",
        title: "Satellite",
        visibility: 'none',
        type: 'base'
      },

      {
        id: "Streets",
        title: "Streets",
        visibility: 'none',
        type: 'base'
      },

    ];
    nmap.addControl(new MapboxLayerSwitcherControl(layers));

    const nav = new mapboxgl.NavigationControl();
    nmap.addControl(nav, "top-left");





    if (localBounds[0] == localBounds[2]) {

      // for points where the extent x1=x2
      nmap.fitBounds(localBounds, { maxZoom: 15, padding: 20 });
    } else {
      nmap.fitBounds(localBounds, { padding: 20 });

    }


    nmap.resize()
  })

}




const showPagination = ref(true)



const getFilteredBySearchData = async (tab, searchKey) => {


  if (selectedCounty.value) {
    var selectOption = 'county_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes(selectedCounty.value) && selectedCounty.value.length > 0) {
      filterValues.value.splice(index, 0, selectedCounty.value) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

    // expunge the filter if the filter values are null
    if (selectedCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }

  }

  // Filter by subcounty  
  if (selectedSubCounty.value) {
    var selectOption = 'subcounty_id'
    if (!filters.value.includes(selectOption)) {
      filters.value.push(selectOption)
    }
    var index = filters.value.indexOf(selectOption) // 1

    // clear previously selected
    if (filterValues[index]) {
      // filterValues[index].length = 0
      filterValues.value.splice(index, 1)
    }

    if (!filterValues.value.includes(selectedSubCounty.value) && selectedSubCounty.value.length > 0) {
      filterValues.value.splice(index, 0, selectedSubCounty.value) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

    // expunge the filter if the filter values are null
    if (selectedSubCounty.value.length === 0) {
      filters.value.splice(index, 1)
    }

  }


  const formData: FormData = {
    limit: pageSize.value,
    page: page.value,
    curUser: 1, // Id for logged in user
    model: model,
    //-Search field--------------------------------------------
    searchField: 'evaluation_title',
    searchKeyword: searchKey,
    //--Single Filter -----------------------------------------
    //assocModel: associated_Model,
    // - multiple filters -------------------------------------
    filters: filters.value,
    filterValues: filterValues.value,
    associated_multiple_models: associated_multiple_models,
    nested_models: nested_models,
    cache_key: 'SeacrchByKey_' + search_string.value,
    returnAll: true
  }
  //-------------------------
  console.log(formData)
  console.log('activeTab', tab)
  const res = await searchByKeyWord(formData as any)

  if (tab === 'list') {

    tableDataList.value = res.data





  } else if (tab === 'New') {
    tableDataListNew.value = res.data

  } else {
    tableDataListRejected.value = res.data


  }


  total.value = res.total
  loading.value = false


}

const searchByName = async (filterString: any) => {

  console.log('filterString', filterString)
  value3.value = filterString
  search_string.value = filterString

  getFilteredBySearchData(activeTab.value, search_string.value)
}




const getCountyNames = async () => {
}





const getSubCountyNames = async () => {
}












//getSettlementsOptions()
getAllSetllementsInitially()


getCountyNames()
getSubCountyNames()


console.log('Options---->', interVentionTypeOptions)















const activeName = ref('list')
const AddEvaluation = () => {
  push({
    name: 'AddEvaluation'
  })
}

const formHeader = ref('Edit Settlement')

const editSettlement = (data: TableSlotDefault) => {

  push({
    name: 'AddEvaluation',
    query: { id: data.row.id }

  });


}



const DeleteSettlement = (data: TableSlotDefault) => {
  console.log('----->', data)
  let formData: DeleteFormData = {
    id: data.row.id,
    model: model
  }

  DeleteRecord(formData as any).then(response => {
    console.log(response)
    // remove the deleted object from array list 
    let index = tableDataList.value.indexOf(data.row);
    if (index !== -1) {
      tableDataList.value.splice(index, 1);
    }

  })
    .catch(error => {
      console.log(error)

    });

  console.log(tableDataList.value)

  // Delete docuemnts only if there's any docuemnt to delete 
  if (data.row.documents.length > 0) {
    formData.filesToDelete = data.row.documents

    deleteDocument(formData as any)

  }


}






const showSelectFields = ref(false)
const selectedFields = ref<string[]>([])


const DownloadXlsx = async () => {
  showSelectFields.value = true

}


const handleDownloadSelectFields = async () => {
  console.log('selectedFields ---', selectedFields.value)

  if (selectedFields.value.length < 1) {
    ElMessage.warning('Specify the fields you want on the exported file')
    return

  }



  let fields: FieldData[] = []

  for (let i = 0; i < selectedFields.value.length; i++) {
    var fld: FieldData = {
      label: selectedFields.value[i],
      value: selectedFields.value[i]
    }
    fields.push(fld)
  }

  console.log(fields)




  // Preprae the data object 
  var dataObj: DataObject = {
    sheet: 'data',
    columns: fields,
    content: []
  }

  let dataHolder: any[] = []
  // loop through the table data and sort the data 
  // change here !
  for (let i = 0; i < flattenedData.value.length; i++) {
    let thisRecord: any = {
      index: i + 1
    }

    //   console.log('flattened ??',i,  flattenedData.value[i])

    for (let j = 0; j < fields.length; j++) {
      var fieldLabel = fields[j].label
      thisRecord[fieldLabel] = flattenedData.value[i][fieldLabel]

      console.log('fld', thisRecord)


    }
    // thisRecord.name = tableDataList.value[i].name
    // thisRecord.county = tableDataList.value[i].county.name
    // thisRecord.population = tableDataList.value[i].population
    // thisRecord.area = tableDataList.value[i].area
    // thisRecord.description = tableDataList.value[i].description
    // thisRecord.code = tableDataList.value[i].code
    // thisRecord.CountyID = tableDataList.value[i].county_id
    // thisRecord.SubcountyID = tableDataList.value[i].subcounty ? tableDataList.value[i].subcounty.id : null;


    dataHolder.push(thisRecord)
  }
  dataObj.content = dataHolder




  let settings = {
    fileName: model, // Name of the resulting spreadsheet
    writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
    writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
  }

  // Enclose in array since the fucntion expects an array of sheets
  xlsx([dataObj], settings) //  download the excel file

}




console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "80px"
} else {
  dialogWidth.value = "25%"
  actionColumnWidth.value = "180px"

}

const getDocumentTypes = async () => {
}
getDocumentTypes()







const tableRowClassName = (data) => {
  // console.log('Row Styling --------->', data.row)
  if (data.row.documents.length > 0) {
    return 'warning-row'
  }
  return ''
}









/// Uplaod docuemnts from a central component 
const mfield = 'settlement_id'
const ChildComponent = defineAsyncComponent(() => import('@/views/Components/UploadComponent.vue'));
const dynamicComponent = ref();
const componentProps = ref({
  message: 'Hello from parent',
  showDialog: addMoreDocuments,
  data: currentRow.value,
  umodel: model,
  field: mfield
});



function toggleComponent(row) {
  console.log('Compnnent data', row)
  componentProps.value.data = row
  dynamicComponent.value = null; // Unload the component
  addMoreDocuments.value = true; // Set any additional props

  setTimeout(() => {
    dynamicComponent.value = ChildComponent; // Load the component
  }, 100); // 0.1 seconds
}



// component for docuemnts 
const rowData = ref()
const documentComponent = defineAsyncComponent(() => import('@/views/Components/ListDocuments.vue'));
const dynamicDocumentComponent = ref();
const DocumentComponentProps = ref({
  message: 'documents',
  data: rowData.value,
  docmodel: model,

});


function handleExpand(row) {
  dynamicDocumentComponent.value = null; // Unload the component
  rowData.value = row
  DocumentComponentProps.value.data = row
  setTimeout(() => {
    dynamicDocumentComponent.value = documentComponent; // Load the component
  }, 100); // 0.1 seconds
}




// Revised molde for downlaod



// get model fields 

//  getModeldefinition()

console.log('model_fields.value', model_fields.value)


const combinedLessons = (row: any) => {
  const lessons: any[] = [];
  for (const key in row) {
    if (key.startsWith('lessons_') && Array.isArray(row[key])) {
      lessons.push(...row[key]);
    }
  }
  return lessons;
};

const dialogMap = ref(false)



const router = useRouter()

const goBack = () => {
  // Add your logic to handle the back action
  // For example, you can use Vue Router to navigate back
  if (router) {
    // Use router.back() to navigate back
    router.back()
  } else {
    console.warn('Router instance not available.')
  }
}

</script>

<template>
  <el-card v-loading="loadingGetData" element-loading-text="Loading the data.. Please wait.......">


    <div v-if="dynamicComponent">
      <upload-component :is="dynamicComponent" v-bind="componentProps" />
    </div>


    <el-row type="flex" justify="start" gutter="10" style="display: flex; flex-wrap: nowrap; align-items: center;">

      <div class="max-w-200px">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>
      </div>

      <!-- Title Search -->
        <el-input
v-model="search_string" :suffix-icon="Search" placeholder="Enter search text" style="width: 100%;"
        @input="searchByName" />




      <!-- Action Buttons -->
      <div style="display: flex; align-items: center; gap: 10px; margin-left: 10px;">
        <el-tooltip content="Create Evaluation" placement="top">
          <el-button v-if="showEditButtons" @click="AddEvaluation" type="primary" :icon="Plus" />
        </el-tooltip>


        <el-button @click="DownloadXlsx" type="primary" :icon="Download" />
        <el-button @click="handleClear" type="primary" :icon="Filter" />

      </div>

    </el-row>







    <el-row />

    <el-tabs @tab-click="clickTab" v-model="activeName" class="custom-tab">
      <el-tab-pane name="list">
        <template #label>
          <span class="custom-tabs-label">
            <el-badge type="primary" :value="totalApproved" class="item">
              <el-button link>List</el-button>
            </el-badge>
          </span>
        </template>

        <el-table
:data="tableDataList" style="width: 100%" border :row-class-name="tableRowClassName"
          @expand-change="handleExpand">
          <el-table-column type="expand">
            <template #default="props">
              <div m="4">
                <h3>Documents</h3>
                <div>
                  <list-documents :is="dynamicDocumentComponent" v-bind="DocumentComponentProps" />
                </div>
                <el-button
style="margin-left: 10px;margin-top: 5px" size="small" v-if="showEditButtons" type="success"
                  :icon="Plus" circle @click="toggleComponent(props.row)" />
              </div>
            </template>
          </el-table-column>
           <el-table-column label="Title" prop="evaluation_title" sortable />
          <el-table-column label="Project" prop="project.title" width="200px" sortable />
          <el-table-column label="Type" prop="evaluation_type.type" sortable />
          <el-table-column label="Rating (0-Poor, 5-Best)" prop="overall_rating" width="200px">
            <template #default="{ row }">
              <div>
                <el-rate
v-model="row.overall_rating" disabled show-score text-color="#ff9900"
                  score-template="{value}" />
              </div>
            </template>
          </el-table-column>


          <el-table-column label="Lessons" width="200px">
            <template #default="{ row }">
              <div>
                <el-tag v-for="(lesson, index) in combinedLessons(row)" :key="index">
                  {{ lesson }}
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
            <template #default="scope">
              <el-dropdown v-if="isMobile">
                <span class="el-dropdown-link">
                  <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
v-if="showEditButtons" @click="editSettlement(scope as TableSlotDefault)"
                      :icon="Edit">Edit</el-dropdown-item>
                    <el-dropdown-item
@click="viewProject(scope as TableSlotDefault)"
                      :icon="Position">Map</el-dropdown-item>
                    <el-dropdown-item
v-if="showAdminButtons" @click="DeleteSettlement(scope.row as TableSlotDefault)"
                      :icon="Delete" color="red">Delete</el-dropdown-item>

                  </el-dropdown-menu>
                </template>
              </el-dropdown>


              <div v-else>
                <el-tooltip v-if="showEditButtons" content="Edit" placement="top">
                  <el-button
type="success" size="small" :icon="Edit" @click="editSettlement(scope as TableSlotDefault)"
                    circle />
                </el-tooltip>
                <el-tooltip content="View Project" placement="top">
                  <el-button
type="warning" size="small" :icon="Position"
                    @click="viewProject(scope as TableSlotDefault)" circle />
                </el-tooltip>


                <el-tooltip v-if="showAdminButtons" content="Delete" placement="top">
                  <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled"
                    icon-color="#626AEF" title="Are you sure to delete this report?"
                    @confirm="DeleteSettlement(scope.row as TableSlotDefault)">
                    <template #reference>
                      <el-button type="danger" size="small" :icon=Delete circle />
                    </template>
                  </el-popconfirm>
                </el-tooltip>

              </div>
            </template>

          </el-table-column>

        </el-table>


      </el-tab-pane>

      <el-tab-pane name="New" v-if=showEditButtons>
        <template #label>
          <span class="custom-tabs-label">
            <el-badge type="success" :value="totalPending" class="item">
              <el-button link>New</el-button>
            </el-badge>
          </span>
        </template>

        <el-table
:data="tableDataListNew" style="width: 100%" border :row-class-name="tableRowClassName"
          @expand-change="handleExpand">
          <el-table-column type="expand">
            <template #default="props">
              <div m="4">
                <h3>Documents</h3>
                <div>
                  <list-documents :is="dynamicDocumentComponent" v-bind="DocumentComponentProps" />
                </div>
                <el-button
style="margin-left: 10px;margin-top: 5px" size="small" v-if="showEditButtons" type="success"
                  :icon="Plus" circle @click="toggleComponent(props.row)" />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Title" prop="evaluation_title" sortable />
          <el-table-column label="Project" prop="project.title" sortable  width="200px" />
          <el-table-column label="Type" prop="evaluation_type.type" sortable />
          <el-table-column label="Rating (0-Poor, 5-Best)" prop="overall_rating" width="200px">
            <template #default="{ row }">
              <div>
                <el-rate
v-model="row.overall_rating" disabled show-score text-color="#ff9900"
                  score-template="{value}" />
              </div>
            </template>
          </el-table-column>


          <el-table-column label="Findings" width="300px">
            <template #default="{ row }">
              <div>
                <el-tag v-for="(lesson, index) in combinedLessons(row)" :key="index">
                  {{ lesson }}
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
            <template #default="scope">
              <el-dropdown v-if="isMobile">
                <span class="el-dropdown-link">
                  <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
v-if="showEditButtons" @click="editSettlement(scope as TableSlotDefault)"
                      :icon="Edit">Edit</el-dropdown-item>
                    <el-dropdown-item
@click="viewProject(scope as TableSlotDefault)"
                      :icon="Position">Project</el-dropdown-item>
                    <el-dropdown-item
v-if="showAdminButtons" @click="DeleteSettlement(scope.row as TableSlotDefault)"
                      :icon="Delete" color="red">Delete</el-dropdown-item>

                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <div v-else>
                <el-tooltip v-if="showEditButtons" content="Edit" placement="top">
                  <el-button
type="success" size="small" :icon="Edit" @click="editSettlement(scope as TableSlotDefault)"
                    circle />
                </el-tooltip>
                <el-tooltip content="View Project" placement="top">
                  <el-button
type="warning" size="small" :icon="Position"
                    @click="viewProject(scope as TableSlotDefault)" circle />
                </el-tooltip>

                <el-tooltip content="Review" placement="top">
                  <el-button
v-show="showAdminButtons" type="success" size="small" :icon="View"
                    @click="Review(scope as TableSlotDefault)" circle />
                </el-tooltip>
                <el-tooltip v-if="showAdminButtons" content="Delete" placement="top">
                  <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled"
                    icon-color="#626AEF" title="Are you sure to delete this settlement?"
                    @confirm="DeleteSettlement(scope.row as TableSlotDefault)">
                    <template #reference>
                      <el-button type="danger" size="small" :icon=Delete circle />
                    </template>
                  </el-popconfirm>
                </el-tooltip>

              </div>
            </template>

          </el-table-column>

        </el-table>


      </el-tab-pane>

      <el-tab-pane name="Rejected" v-if=showEditButtons :badge="5">
        <template #label>
          <span class="custom-tabs-label">
            <el-badge :value="totalRejected.toString()" class="item">
              <el-button link>Rejected</el-button>
            </el-badge>
          </span>
        </template>
        <el-table
:data="tableDataListRejected" style="width: 100%" border :row-class-name="tableRowClassName"
          @expand-change="handleExpand">
          <el-table-column type="expand">
            <template #default="props">
              <div m="4">
                <h3>Documents</h3>
                <div>
                  <list-documents :is="dynamicDocumentComponent" v-bind="DocumentComponentProps" />
                </div>
                <el-button
style="margin-left: 10px;margin-top: 5px" size="small" v-if="showEditButtons" type="success"
                  :icon="Plus" circle @click="toggleComponent(props.row)" />
              </div>
            </template>
          </el-table-column>
           <el-table-column label="Title" prop="evaluation_title" sortable />
          <el-table-column label="Project" prop="project.title" sortable  width="200px"/>
          <el-table-column label="Type" prop="evaluation_type.type" sortable />

          <el-table-column label="Rating (0-Poor, 5-Best)" prop="overall_rating" width="200px">
            <template #default="{ row }">
              <div>
                <el-rate
v-model="row.overall_rating" disabled show-score text-color="#ff9900"
                  score-template="{value}" />
              </div>
            </template>
          </el-table-column>


          <el-table-column label="Findings" width="300px">
            <template #default="{ row }">
              <div>
                <el-tag v-for="(lesson, index) in combinedLessons(row)" :key="index">
                  {{ lesson }}
                </el-tag>
              </div>
            </template>
          </el-table-column>


          <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
            <template #default="scope">
              <el-dropdown v-if="isMobile">
                <span class="el-dropdown-link">
                  <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
v-if="showEditButtons" @click="editSettlement(scope as TableSlotDefault)"
                      :icon="Edit">Edit</el-dropdown-item>
                    <el-dropdown-item
@click="viewProject(scope as TableSlotDefault)"
                      :icon="Position">Project</el-dropdown-item>
                    <el-dropdown-item
v-if="showAdminButtons" @click="DeleteSettlement(scope.row as TableSlotDefault)"
                      :icon="Delete" color="red">Delete</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <div v-else>
                <el-tooltip content="View Project" placement="top">
                  <el-button
type="warning" size="small" :icon="Position"
                    @click="viewProject(scope as TableSlotDefault)" circle />
                </el-tooltip>
                <el-tooltip content="Review" placement="top">
                  <el-button
v-show="showAdminButtons" type="success" size="small" :icon="View"
                    @click="Review(scope as TableSlotDefault)" circle />
                </el-tooltip>
                <el-tooltip content="Delete" placement="top">
                  <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled"
                    icon-color="#626AEF" title="Are you sure to delete this report?"
                    @confirm="DeleteSettlement(scope.row as TableSlotDefault)">
                    <template #reference>
                      <el-button v-if="showAdminButtons" type="danger" size="small" :icon=Delete circle />
                    </template>
                  </el-popconfirm>
                </el-tooltip>

              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>


      <ElPagination
v-if="showPagination" layout="sizes, prev, pager, next, total" v-model:currentPage="page"
        v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 100]" :total="total" :background="true"
        @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
    </el-tabs>


    <el-dialog v-model="showSelectFields" title="Select Fields" width="50%">
      <el-row>
        <el-col :span="6" v-for="(field, index) in model_fields" :key="index">
          <el-checkbox v-model="selectedFields" :label="field" :value="field">{{ field }}</el-checkbox>
        </el-col>
      </el-row>
      <el-button type="success" @click="handleDownloadSelectFields()">Download</el-button>
    </el-dialog>

    <el-dialog v-model="ShowReviewDialog" :title="formHeader" :width="reviewWindowWidth" draggable>
      <el-descriptions title="" direction="vertical" :column="2" size="small" border>
        <el-descriptions-item label="Project">{{ evaluation_raw.project.title }}</el-descriptions-item>
        <el-descriptions-item label="Title" :span="2">{{ evaluation_raw.evaluation_title }}</el-descriptions-item>
        <el-descriptions-item label="Overall Rating">{{ evaluation_raw.overall_rating }}</el-descriptions-item>
        <el-descriptions-item label="Evaluators"> {{ evaluation_raw.evaluators }} </el-descriptions-item>
        <el-descriptions-item label="Submitted By"> {{ evaluation_raw.user.name }} </el-descriptions-item>
        <el-descriptions-item label="Date"> {{ evaluation_raw.updatedAt }} </el-descriptions-item>


      </el-descriptions>
      <template #footer>
        <span v-if="showAdminButtons" class="dialog-footer">
          <el-button type="success" @click="approveEvaluation">Approve</el-button>
          <el-button type="danger" @click="reject">Reject</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="RejectDialog" title="Reason for rejection" width="20%">
      <el-input v-model="rejectReason" placeholder="" />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="RejectDialog = false">Cancel</el-button>
          <el-button type="primary" @click="confirmReject">
            Confirm
          </el-button>
        </span>
      </template>
    </el-dialog>


    <el-dialog v-model="dialogMap" width="50%" draggable :before-close="closeMap" :show-close="false">
      <template #header="{ titleId, titleClass }">
        <div class="my-header">
          <h4 :id="titleId" :class="titleClass">Project Location</h4>

          <el-button type="danger" :icon="CircleCloseFilled" @click="closeMap">Close Map</el-button>

        </div>
      </template>
      <div id="mapContainer" class="basemap"></div>

    </el-dialog>


  </el-card>
</template>




<style scoped>
.basemap {
  width: 100%;
  height: 75vh;
}
.el-table .warning-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

.el-table .success-row {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
}
.el-row {
  margin-bottom: 20px;
}

.el-row:last-child {
  margin-bottom: 0;
}

.el-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}

.item {
  margin-top: 10px;
  margin-right: 40px;
}

.demo-tabs>.el-tabs__content {
  padding: 32px;
  color: #6b778c;
  font-size: 32px;
  font-weight: 600;
}

.demo-tabs .custom-tabs-label .el-icon {
  vertical-align: middle;
}

.demo-tabs .custom-tabs-label span {
  vertical-align: middle;
  margin-left: 4px;
}

.custom-tab.is-active {
  color: red;
}

.basemap {
  width: 100%;
  height: 75vh;
  /* Set the height to 75% of the viewport height */
  border: 1px solid #e2dcdc;
  /* Outline */
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
  /* Shadow */
}

.my-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
</style>