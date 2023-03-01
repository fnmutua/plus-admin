<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, getHHsByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import {
    ElButton, ElSelect, FormInstance, ElLink, MessageParamsWithType, ElTabs, ElTabPane, ElDialog, ElInputNumber, ElInput, ElDatePicker, ElForm, ElFormItem, ElUpload, ElCascader, FormRules, ElPopconfirm, ElTable, ElTableColumn, UploadUserFile
} from 'element-plus'
import { ElMessage } from 'element-plus'
import { Position, TopRight, Plus, User, Download, Delete, Edit, Filter, InfoFilled } from '@element-plus/icons-vue'

import { ref, reactive, h } from 'vue'
import { ElPagination, ElTooltip, ElOption, ElDivider } from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument, uploadDocuments, getfilteredGeo } from '@/api/settlements'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { uuid } from 'vue-uuid'

import xlsx from "json-as-xlsx"
import { getAllGeo } from '@/api/settlements'
import {
    searchByKeyWord
} from '@/api/settlements'

////////////*************Map Imports***************////////

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf'
import { Icon } from '@iconify/vue';

import { onMounted } from 'vue'

import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { UserType } from '@/api/register/types'
const MapBoxToken =
    'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
mapboxgl.accessToken = MapBoxToken;






const searchString = ref()

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const tabDisabled = ref(true)

// Hide buttons if not admin 
const showAdminButtons = ref(false)

if (userInfo.roles.includes("admin")) {
    showAdminButtons.value = true
}

const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
var value4 = ref([])
var value5 = ref([])

const morefileList = ref<UploadUserFile[]>([])


const interVentionTypeOptions = ref([])
const benefitTypeOptions = ref([])
const houseHoldOptions = ref([])
const interventionsOptions = ref([])

const component_id = ref([])

const domain_id = 1
const page_title = 'Environmental Interventions'

const tmp_domain = ref()




const settlementOptions = ref([])
const page = ref(1)
const pSize = ref(5)
const selCounties = []
const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)
const showEditSaveButton = ref(false)
const showAddSaveButton = ref(true)
const formheader = ref('Edit Project')


let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']


// - -----Model configs ------------
const model = 'project'
var filters = ['domain_id']
var filterValues = [[domain_id]]  // make sure the inner array is array
var tblData = []
const associated_Model = ''
const associated_multiple_models = ['settlement', 'domain', 'programme', 'component', 'document']

//// ------------------parameters -----------------------////
const fileUploadList = ref<UploadUserFile[]>([])

const facilityGeo = ref([])
const facilityGeoPoints = ref()
const facilityGeoLines = ref([])
const facilityGeoPolygons = ref([])
const geoLoaded = ref(false)


const { t } = useI18n()

const formatter = (row) => {
    if (row.documentation) {


        return h(ElLink, { href: row.documentation, download: row.documentation, type: 'danger' }, h(Icon, {
            icon: "ic:outline-download-for-offline", height: '36'
        }))

        // return h(ElLink, { href: row.documentation, download: row.documentation, type: 'danger' }, h(Icon, { icon: "material-symbols:cloud-download", height: '36' }), 'Download ')


    } else {
        return
    }

}

const columns: TableColumn[] = [
    {
        field: 'index',
        label: t('userDemo.index'),
        type: 'index'
    },

    {
        field: 'title',
        label: t('Title')
    },

    {
        field: 'programme.title',
        label: t('Programme')
    },

    {
        field: 'component.title',
        label: t('Component')
    },

    {
        field: 'settlement.name',
        label: t('Settlement')
    },
    {
        field: 'documentation',
        label: t('Documents'),
        formatter: formatter
    },
    {
        field: 'action',
        width: "300",
        fixed: "right",
        label: 'Operations'
    }
]
const handleClear = async () => {
    console.log('cleared....')

    // clear all the fileters -------
    filterValues = []
    filters = []
    value1.value = ''
    value2.value = ''
    value3.value = ''
    value4.value = ''
    value5.value = ''
    value6.value = ''

    pSize.value = 5
    currentPage.value = 1
    tblData.value = []
    //----run the get data--------
    getAllBeneficiaries()
}

const handleSelectPhase = async (phase: any) => {
    var selectOption = 'intervention_phase'
    if (!filters.includes(selectOption)) {
        filters.push(selectOption)
    }
    var index = filters.indexOf(selectOption) // 1
    console.log('intervention_phase : index--->', index)

    // clear previously selected
    if (filterValues[index]) {
        // filterValues[index].length = 0
        filterValues.splice(index, 1)
    }

    if (!filterValues.includes(phase) && phase.length > 0) {
        filterValues.splice(index, 0, phase) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

    // expunge the filter if the filter values are null
    if (phase.length === 0) {
        filters.splice(index, 1)
    }

    console.log('FilterValues:', filterValues)
    console.log('filters:', filters)

    getFilteredData(filters, filterValues)
}

const filterByType = async (title: any) => {
    var selectOption = 'settlement_id'
    if (!filters.includes(selectOption)) {
        filters.push(selectOption)
    }
    var index = filters.indexOf(selectOption) // 1
    console.log('intervention_type_id : index--->', index)

    // clear previously selected
    if (filterValues[index]) {
        // filterValues[index].length = 0
        filterValues.splice(index, 1)
    }

    if (!filterValues.includes(title) && title.length > 0) {
        filterValues.splice(index, 0, title) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
    }

    // expunge the filter if the filter values are null
    if (title.length === 0) {
        filters.splice(index, 1)
    }

    console.log('filters:', filters)
    console.log('FilterValues:', filterValues)

    getFilteredData(filters, filterValues)
}

const filterByProgramme = async (title: any) => {
    var filters = ['domain_id', 'programme_id']
    var filterValues = [[domain_id], title]
    console.log('filters:', filters)
    console.log('FilterValues:', filterValues)
    getFilteredData(filters, filterValues)
}

const filterBySettlement = async (title: any) => {
    var filters = ['domain_id', 'settlement_id']
    var filterValues = [[domain_id], title]
    console.log('filters:', filters)
    console.log('FilterValues:', filterValues)
    getFilteredData(filters, filterValues)
}





const currentRow = ref()
const addMoreDocuments = ref()
const addMoreDocs = (data: TableSlotDefault) => {

    currentRow.value = data

    addMoreDocuments.value = true

    console.log('currentRow', currentRow.value)

}

const submitMoreDocuments = async () => {
    console.log('More files.....', morefileList)

    // uploading the documents 
    const fileTypes = []
    const formData = new FormData()
    let files = []
    for (var i = 0; i < morefileList.value.length; i++) {
        console.log('------>file', morefileList.value[i])
        var format = morefileList.value[i].name.split('.').pop() // get file extension
        //  formData.append("file",this.multipleFiles[i],this.fileNames[i]+"_"+dateVar+"."+this.fileTypes[i]);
        fileTypes.push(format)
        // formData.append('file', fileList.value[i])
        // formData.file = fileList.value[i]
        formData.append('file', morefileList.value[i].raw)
        formData.append('DocType', format)

    }


    formData.append('parent_code', currentRow.value.id)
    formData.append('model', model)
    formData.append('grp', 'Project Documentation')
    formData.append('code', uuid.v4())
    formData.append('column', 'project_id')  //Column to save ID 



    console.log(formData)
    await uploadDocuments(formData)

}


const onPageChange = async (selPage: any) => {
    console.log('on change change: selected counties ', selCounties)
    page.value = selPage
    getFilteredData(filters, filterValues)
}

const onPageSizeChange = async (size: any) => {
    pSize.value = size
    getFilteredData(filters, filterValues)
}

const getAllBeneficiaries = async () => {
    getFilteredData(filters, filterValues)
}

const destructure = (obj) => {
    // console.log('deconstructing......')
    const simpleObj = {}
    for (let key in obj) {
        const value = obj[key]
        const type = typeof value
        if (['string', 'boolean'].includes(type) || (type === 'number' && !isNaN(value))) {
            simpleObj[key] = value
        } else if (type === 'object') {
            Object.assign(simpleObj, destructure(value))
        }
    }

    return simpleObj
}
const getFilteredData = async (selFilters, selfilterValues) => {
    const formData = {}
    formData.limit = pSize.value
    formData.page = page.value
    formData.curUser = 1 // Id for logged in user
    formData.model = model
    //-Search field--------------------------------------------
    formData.searchField = 'name'
    formData.searchKeyword = ''
    //--Single Filter -----------------------------------------

    formData.assocModel = associated_Model

    // - multiple filters -------------------------------------
    formData.filters = selFilters
    formData.filterValues = selfilterValues
    formData.associated_multiple_models = associated_multiple_models

    //-------------------------
    //console.log(formData)
    const res = await getSettlementListByCounty(formData)

    console.log('After Querry - associated_multiple_models', res)
    tableDataList.value = res.data
    total.value = res.total


    tblData.value = [] // reset the table data
    console.log('TBL-b4-', tblData)
    let filteredIds = []
    res.data.forEach(function (arrayItem) {
        console.log(arrayItem)
        filteredIds.push(arrayItem.id)

        var dd = destructure(arrayItem)
        delete dd['0']
        delete dd['1']

        tblData.value.push(dd)
    })

    console.log('Now get the filtered Geo for --', filteredIds)

    formData.columnFilterField = 'id'
    formData.selectedParents = []
    formData.filtredGeoIds = filteredIds
    const fgeo = await getfilteredGeo(formData)

    console.log('the filtred GEO --', fgeo)


    if (fgeo.data[0].json_build_object) {
        var points = []
        var lines = []
        var polygons = []
        facilityGeo.value = fgeo.data[0].json_build_object
        console.log('Geo Returns---', fgeo.data[0].json_build_object.features)
        console.log("Facility Geo", facilityGeo)

        if (fgeo.data[0].json_build_object.features === null) {

            // No geo found so intiialize the points, lines and polygons to empty arrays 
            facilityGeoPoints.value = []
            facilityGeoLines.value = []
            facilityGeoPolygons.value = []
        }
        else {
            tabDisabled.value = false

            for (let i = 0; i < fgeo.data[0].json_build_object.features.length; i++) {
                console.log("Geo Type -------->", fgeo.data[0].json_build_object.features[i].geometry.type)

                if (fgeo.data[0].json_build_object.features[i].geometry.type === "Point") {

                    points.push(fgeo.data[0].json_build_object.features[i])
                } else if (fgeo.data[0].json_build_object.features[i].geometry.type === "LineString" || fgeo.data[0].json_build_object.features[i].geometry.type === "MultiLineString") {

                    lines.push(fgeo.data[0].json_build_object.features[i])

                } else {
                    polygons.push(fgeo.data[0].json_build_object.features[i])

                }

            }

            console.log('Points ---x-------', points)

            facilityGeoPoints.value = points
            facilityGeoLines.value = lines
            facilityGeoPolygons.value = polygons

            console.log('Lines--->', facilityGeoPoints.value)


            //markerLatlon.value = res.data[0].json_build_object.features[0].geometry.coordinates
        }


        geoLoaded.value = true


    }


    console.log('TBL-4f', tblData)
}



const getInterventionTypes = async () => {
    const res = await getCountyListApi({
        params: {
            pageIndex: 1,
            limit: 100,
            curUser: 1, // Id for logged in user
            model: 'intervention_type',
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
            var countyOpt = {}
            countyOpt.value = arrayItem.id
            countyOpt.label = arrayItem.type + '(' + arrayItem.id + ')'
            //  console.log(countyOpt)
            interVentionTypeOptions.value.push(countyOpt)
        })
    })
}

const getBeneficiaryType = async () => {
    const res = await getCountyListApi({
        params: {
            pageIndex: 1,
            limit: 100,
            curUser: 1, // Id for logged in user
            model: 'benefit_type',
            searchField: 'type',
            searchKeyword: '',
            sort: 'ASC'
        }
    }).then((response: { data: any }) => {
        console.log('Received response:', response)
        //tableDataList.value = response.data
        var ret = response.data

        loading.value = false

        ret.forEach(function (arrayItem: { id: string; type: string }) {
            var opt = {}
            opt.value = arrayItem.id
            opt.label = arrayItem.type + '(' + arrayItem.id + ')'
            //  console.log(countyOpt)
            benefitTypeOptions.value.push(opt)
        })
    })
}
const getHouseholds = async () => {
    const res = await getCountyListApi({
        params: {
            pageIndex: 1,
            limit: 100,
            curUser: 1, // Id for logged in user
            model: 'households',
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
            var opt = {}
            opt.value = arrayItem.id
            opt.label = arrayItem.name + '| ' + arrayItem.gender + ' | ' + arrayItem.national_id
            //  console.log(countyOpt)
            houseHoldOptions.value.push(opt)
        })
    })
}

const getInterventions = async () => {
    const formData = {}

    formData.model = 'intervention'
    //-Search field--------------------------------------------
    formData.searchField = 'name'
    formData.searchKeyword = ''
    //--Single Filter -----------------------------------------


    // - multiple filters -------------------------------------

    formData.associated_multiple_models = ['settlement', 'cluster']

    //-------------------------
    //console.log(formData)
    console.log('before Intervention Options')

    //const rxes = await getSettlementListByCounty(formData)
    //console.log('Inside Intervention Options', rxes)

    const res = await getSettlementListByCounty(formData).then((response: { data: any }) => {
        console.log('Received response:', response)
        //tableDataList.value = response.data
        var ret = response.data

        loading.value = false

        ret.forEach(function (arrayItem: { id: string; type: string }) {
            var opt = {}
            opt.value = arrayItem.id
            opt.settlement_id = arrayItem.settlement.id

            opt.label = arrayItem.settlement.name + ' | ' + arrayItem.cluster.contract + ' | ' + arrayItem.id
            //  console.log(countyOpt)
            interventionsOptions.value.push(opt)
        })
    })
}




const getSettlementsOptions = async () => {
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
            var countyOpt = {}
            countyOpt.value = arrayItem.id
            countyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
            //  console.log(countyOpt)
            settlementOptions.value.push(countyOpt)
        })
    })
}



const viewOnMap = (data: TableSlotDefault) => {
    console.log('On map.....', data.row)


    if (data.row.geom === null) {
        var msg = 'This Project does not have the location defined in the database!'
        // open(msg)
        ElMessage({
            message: 'This Project does not have the boundary defined in the database!',
            type: 'warning',
        })

    } else {

        push({
            path: '/interventions/kisip/map/:id',
            name: 'ProjectMap',
            params: { id: data.row.id }
        })
    }
}



const loadMap = () => {
    var nmap = new mapboxgl.Map({
        container: "mapContainer",
        style: "mapbox://styles/mapbox/streets-v11",
        center: [37.137343, 1.137451], // starting position
        zoom: 6,

    })

    console.log("resizing....")
    const nav = new mapboxgl.NavigationControl();
    nmap.addControl(nav, "top-right");
    nmap.on('load', () => {
        nmap.addSource('lines', {
            type: 'geojson',
            // Use a URL for the value for the `data` property.
            data: turf.featureCollection(facilityGeoLines.value),
            // data: 'https://data.humdata.org/dataset/e66dbc70-17fe-4230-b9d6-855d192fc05c/resource/51939d78-35aa-4591-9831-11e61e555130/download/kenya.geojson'
        });

        nmap.addSource('points', {
            type: 'geojson',
            // Use a URL for the value for the `data` property.
            data: turf.featureCollection(facilityGeoPoints.value),
            // data: 'https://data.humdata.org/dataset/e66dbc70-17fe-4230-b9d6-855d192fc05c/resource/51939d78-35aa-4591-9831-11e61e555130/download/kenya.geojson'
        });


        nmap.addSource('polygons', {
            type: 'geojson',
            // Use a URL for the value for the `data` property.
            data: turf.featureCollection(facilityGeoPolygons.value),
            // data: 'https://data.humdata.org/dataset/e66dbc70-17fe-4230-b9d6-855d192fc05c/resource/51939d78-35aa-4591-9831-11e61e555130/download/kenya.geojson'
        });


        nmap.addLayer({
            'id': 'points-layer',
            "type": "circle",
            'source': 'points',
            'paint': {
                "circle-color": 'green'
            }
        });

        nmap.addLayer({
            'id': 'lines',
            'type': 'line',
            'source': 'lines',
            'paint': {
                'line-width': 3,
                // Use a get expression (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-get)
                // to set the line-color to a feature property value.
                'line-color': 'red'
            }
        });




        nmap.addLayer({
            'id': 'polygons-layer',
            "type": "fill",
            'source': 'polygons',
            'paint': {
                'fill-color': '#0080ff', // blue color fill
                'fill-opacity': 0.2
            }

        });
        // Add a black outline around the polygon.
        // nmap.addLayer({
        //   'id': 'outline',
        //   'type': 'line',
        //   'source': 'polygons',
        //   'layout': {},
        //   'paint': {
        //     'line-color': '#000',
        //     'line-width': 1
        //   }
        // });

        nmap.resize()


        var bounds = turf.bbox((facilityGeo.value));
        nmap.fitBounds(bounds, { padding: 20 });



        nmap.on('click', 'points-layer', (e) => {
            console.log("Onclikc..........")
            // Copy coordinates array.
            const coordinates = e.features[0].geometry.coordinates.slice();
            const description = e.features[0].properties.asset_type;
            const condition = e.features[0].properties.asset_condition;

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
            new mapboxgl.Popup({ offset: [0, -15] })
                .setLngLat(coordinates)
                .setHTML('<h3>' + description + '</h3><p>' + condition + '</p>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
                .addTo(nmap);

        });


        // Change the cursor to a pointer when the mouse is over the places layer.
        nmap.on('mouseenter', 'points-layer', () => {
            nmap.getCanvas().style.cursor = 'pointer';
        });

        // Change it back to a pointer when it leaves.
        nmap.on('mouseleave', 'points-layer', () => {
            nmap.getCanvas().style.cursor = '';
        });



        nmap.on('click', 'lines-layer', (e) => {
            console.log("click line..........")
            // Copy coordinates array.
            const coordinates = e.features[0].geometry.coordinates.slice();
            const description = e.features[0].properties.asset_type;
            const condition = e.features[0].properties.asset_condition;

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
            new mapboxgl.Popup({ offset: [0, -15] })
                .setLngLat(coordinates)
                .setHTML('<h3>' + description + '</h3><p>' + condition + '</p>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
                .addTo(nmap);


        });


        nmap.on('click', 'polygons-layer', (e) => {
            console.log("click line..........")
            // Copy coordinates array.
            const coordinates = e.features[0].geometry.coordinates.slice();
            const description = e.features[0].properties.title;
            const condition = e.features[0].properties.programme;

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
            new mapboxgl.Popup({ offset: [0, -15] })
                .setLngLat(coordinates)
                .setHTML('<h3>' + description + '</h3><p>' + condition + '</p>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
                .addTo(nmap);


        });

        // Change the cursor to a pointer when the mouse is over the places layer.
        nmap.on('mouseenter', 'lines-layer', () => {
            nmap.getCanvas().style.cursor = 'pointer';
        });

        // Change it back to a pointer when it leaves.
        nmap.on('mouseleave', 'lines-layer', () => {
            nmap.getCanvas().style.cursor = '';
        });

    });


}


const onMap = async (obj) => {
    console.log("Loading map....cs.........", obj.props.label)
    console.log(facilityGeoLines.value.length, facilityGeoPoints.value.length, facilityGeoPolygons.value.length)


    if (obj.props.label == "Map") {

        if (facilityGeoLines.value.length == 0 && facilityGeoPoints.value.length == 0 && facilityGeoPolygons.value.length == 0) {
            ElMessage({
                message: 'The listed projects do not have geometry',
                type: 'warning',
            })
        }
        else {
            loadMap()
            //console.log(map.value)
            //maxBounds.value = turf.bbox(facilityGeo.value);
        }

    }

}

const getGeo = async () => {

    const formData = {}
    formData.model = model


    console.log(formData)
    const res = await getAllGeo(formData)



    if (res.data[0].json_build_object) {
        var points = []
        var lines = []
        var polygons = []
        facilityGeo.value = res.data[0].json_build_object
        console.log('Geo Returns---', res.data[0].json_build_object.features)
        console.log("Facility Geo", facilityGeo)

        for (let i = 0; i < res.data[0].json_build_object.features.length; i++) {
            console.log("Geo Type -------->", res.data[0].json_build_object.features[i].geometry.type)

            if (res.data[0].json_build_object.features[i].geometry.type === "Point") {

                points.push(res.data[0].json_build_object.features[i])
            } else if (res.data[0].json_build_object.features[i].geometry.type === "LineString" || res.data[0].json_build_object.features[i].geometry.type === "MultiLineString") {

                lines.push(res.data[0].json_build_object.features[i])

            } else {
                polygons.push(res.data[0].json_build_object.features[i])

            }

        }

        console.log('Points ---x-------', points)

        // facilityGeoPoints.value = points
        // facilityGeoLines.value = lines
        // facilityGeoPolygons.value = polygons

        console.log('Lines--->', facilityGeoPoints.value)


        //markerLatlon.value = res.data[0].json_build_object.features[0].geometry.coordinates
        geoLoaded.value = true


    }



}

const getFilteredBySearchData = async (searchString) => {
    const formData = {}
    formData.limit = pSize.value
    formData.page = page.value
    formData.curUser = 1 // Id for logged in user
    formData.model = model

    //-Search field--------------------------------------------
    formData.searchField = 'title'
    formData.searchKeyword = searchString
    //--Single Filter -----------------------------------------

    //formData.assocModel = associated_Model

    // - multiple filters -------------------------------------
    formData.filters = filters
    formData.filterValues = filterValues
    formData.associated_multiple_models = associated_multiple_models

    //-------------------------
    console.log(formData)
    const res = await searchByKeyWord(formData)

    console.log('After -----x ------Querry', res)
    tableDataList.value = res.data
    total.value = res.total
    loading.value = false

    tblData.value = [] // reset the table data

}

const searchByName = async (filterString: any) => {
    searchString.value = filterString

    getFilteredBySearchData(searchString.value)
}


const programmeOptions = ref([])
const getProgrammeOptions = async () => {
    const res = await getCountyListApi({
        params: {
            pageIndex: 1,
            limit: 100,
            curUser: 1, // Id for logged in user
            model: 'programme',
            searchField: 'title',
            searchKeyword: '',
            sort: 'ASC'
        }
    }).then((response: { data: any }) => {
        console.log('Received response:', response)
        //tableDataList.value = response.data
        var ret = response.data

        loading.value = false

        ret.forEach(function (arrayItem: { id: string; type: string }) {
            var countyOpt = {}
            countyOpt.value = arrayItem.id
            countyOpt.label = arrayItem.title + '(' + arrayItem.id + ')'
            //  console.log(countyOpt)
            programmeOptions.value.push(countyOpt)
        })
    })
}


const domainProgrammeOptions = ref([])
const getComponentsProgrameDomains = async () => {
    var filters = ['id']    // filter component options by Domain
    var filterValues = [component_id.value]   // Domain ID acquired from the path 


    const formData = {}
    formData.limit = 100
    formData.page = 1
    formData.curUser = 1 // Id for logged in user
    formData.model = 'domain'
    //-Search field--------------------------------------------
    formData.searchField = 'name'
    formData.searchKeyword = ''
    //--Single Filter -----------------------------------------
    formData.filters = filters
    formData.filterValues = filterValues


    formData.associated_multiple_models = ['component']

    //-------------------------
    //console.log(formData)
    await getSettlementListByCounty(formData).then((response: { data: any }) => {
        //console.log('Domains:', response)
        //tableDataList.value = response.data
        var ret = response.data

        loading.value = false

        ret.forEach(function (arrayItem: { id: string; title: string }) {
            let domain = {}
            domain.value = arrayItem.id
            domain.label = arrayItem.title
            domain.children = []


            var comps = arrayItem.components
            //console.log('copns........', comps)
            comps.forEach(function (comp: { id: string; title: string }) {
                var compx = {}
                compx.value = comp.id
                compx.label = comp.title
                //console.log(compx)
                domain.children.push(compx)
                //   console.log('compns', compx)
            })
            // console.log(domain)

            if (domain.children.length > 0) {
                console.log("----->", domain)
                domainProgrammeOptions.value.push(domain)
            }

            //domainProgrammeOptions.value.push(domain)
        })
    })

    console.log('Domain >>>>', domainProgrammeOptions)

}
const componentCategoryOptions = ref([])

const getComponentsComponentDomains = async () => {
    var filters = ['domain_id']    // filter component options by Domain
    var filterValues = [[domain_id]]  // Domain ID acquired from the path 


    const formData = {}
    formData.limit = 100
    formData.page = 1
    formData.curUser = 1 // Id for logged in user
    formData.model = 'component'
    //-Search field--------------------------------------------
    formData.searchField = ''
    formData.searchKeyword = ''
    //--Single Filter -----------------------------------------
    formData.filters = filters
    formData.filterValues = filterValues
    formData.associated_multiple_models = ['domain', 'project_category']

    //-------------------------
    console.log(formData)
    await getSettlementListByCounty(formData).then((response: { data: any }) => {

        var ret = response.data
        let compIds = []


        ret.forEach(function (component: { id: string; title: string }) {
            compIds.push(component.id)

            let compInst = {}
            compInst.value = component.id
            compInst.label = component.title
            compInst.children = []

            var categories = component.project_categories
            console.log("Component categories >>>>>>", categories)



            categories.forEach(function (comp: { id: string; title: string }) {
                var compx = {}
                compx.value = comp.id
                compx.label = comp.title
                //console.log(compx)
                compInst.children.push(compx)
                //   console.log('compns', compx)
            })
            // console.log(domain)

            if (compInst.children.length > 0) {
                console.log("----->", compInst)
                componentCategoryOptions.value.push(compInst)
            }




        })

        console.log("Component Domain >>>>>>", compIds)
        console.log("domainProgrammeOptions >>>>>>", componentCategoryOptions)
        component_id.value = compIds
        loading.value = false


    })


}

const countyOptions = ref([])
const countyRefList = ref()

const getCounties = async () => {
    const res = await getCountyListApi({
        params: {
            pageIndex: 1,
            limit: 100,
            curUser: 1, // Id for logged in user
            model: 'county',
            searchField: 'name',
            searchKeyword: '',
            sort: 'ASC'
        }
    }).then((response: { data: any }) => {
        console.log('Received response:', response)
        //tableDataList.value = response.data
        var ret = response.data
        countyRefList.value = ret
        loading.value = false

        ret.forEach(function (arrayItem: { id: string; type: string }) {
            var county = {}
            county.value = arrayItem.id
            county.label = arrayItem.name + '(' + arrayItem.id + ')'
            //  console.log(countyOpt)
            countyOptions.value.push(county)
        })
    })
}


getBeneficiaryType()
getHouseholds()
getInterventionTypes()
getSettlementsOptions()
getAllBeneficiaries()
getInterventions()
getProgrammeOptions()
getCounties()
//getGeo()
getComponentsComponentDomains()
//getComponentsProgrameDomains()


console.log('Options---->', interVentionTypeOptions)



//*****************************Create**************************** */

///----------------------------------------------------------------------------------
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
    settlement_id: '',
    county_id: '',
    location_level: '',
    title: '',
    type: '',
    programme_id: '',
    domain_id: '',
    category_id: null,
    status: '',
    period: null,
    cost: 0,
    male_beneficiaries: 0,
    female_beneficiaries: 0,
    geom: '',
    id: '',
    code: ''
})






const DeleteBeneficiary = (data: TableSlotDefault) => {
    console.log('----->', data.row.id)
    let formData = {}
    formData.id = data.row.id
    formData.model = model

    DeleteRecord(formData)

    console.log(tableDataList.value)

    // remove the deleted object from array list 
    let index = tableDataList.value.indexOf(data.row);
    if (index !== -1) {
        tableDataList.value.splice(index, 1);
    }

}


const editForm = async (formEl: FormInstance | undefined) => {
    if (!formEl) return
    await formEl.validate(async (valid, fields) => {
        if (valid) {
            ruleForm.model = model
            await updateOneRecord(ruleForm).then(() => { })


            const fileTypes = []
            const updateformData = new FormData()

            for (var i = 0; i < fileUploadList.value.length; i++) {
                console.log('------>file', fileUploadList.value[i])
                var format = fileUploadList.value[i].name.split('.').pop() // get file extension
                //  formData.append("file",this.multipleFiles[i],this.fileNames[i]+"_"+dateVar+"."+this.fileTypes[i]);
                fileTypes.push(format)
                // formData.append('file', fileList.value[i])
                // formData.file = fileList.value[i]
                updateformData.append('file', fileUploadList.value[i].raw)
                updateformData.append('DocType', format)

            }


            updateformData.append('parent_code', ruleForm.id)
            updateformData.append('model', model)
            updateformData.append('grp', 'Project Documentation')
            updateformData.append('code', uuid.v4())
            updateformData.append('column', 'project_id')


            // formData.append('DocTypes', fileTypes)

            console.log(updateformData)
            await uploadDocuments(updateformData)









        } else {
            console.log('error in editiinh!', fields)
        }
    })
}

const handleClose = () => {

    console.log("Closing the dialoig")
    showAddSaveButton.value = true
    showEditSaveButton.value = false

    ruleForm.settlement_id = null
    ruleForm.intervention_phase = null
    ruleForm.intervention_id = null
    ruleForm.hh_id = null
    ruleForm.benefit_type_id = null



    formheader.value = 'Add Beneficiary'
    AddDialogVisible.value = false

}





const activeName = ref('list')
const AddProject = () => {

    console.log("Adding Projects")
    // push({
    //   path: '/interventions/kisip/add',
    //   name: 'AddInterventionProjectsV2'
    // })

    push({
        path: '/interventions/add/:domain',
        name: 'AddInterventionProjectsV2',
        params: { domain: domain_id }
    })

}

const AddDialogVisible = ref(false)
const formHeader = ref('Edit Project')

const editProject = (data: TableSlotDefault) => {

    showEditSaveButton.value = true

    console.log(data)
    ruleForm.id = data.row.id

    ruleForm.location_level = data.row.location_level

    ruleForm.title = data.row.title
    ruleForm.programme_id = data.row.programme_id
    ruleForm.status = data.row.status
    ruleForm.domain_id = data.row.domain_id
    ruleForm.category_id = data.row.category_id
    tmp_domain.value = [data.row.component_id, data.row.category_id]
    ruleForm.period = data.row.period
    ruleForm.male_beneficiaries = data.row.male_beneficiaries
    ruleForm.female_beneficiaries = data.row.female_beneficiaries
    ruleForm.cost = data.row.cost
    ruleForm.settlement_id = data.row.settlement_id
    ruleForm.county_id = data.row.county_id
    ruleForm.code = data.row.code
    ruleForm.geom = data.row.geom
    fileUploadList.value = data.row.documents


    if (data.row.settlement_id) {
        showSettlement.value = true
    }
    if (data.row.county_id) {
        showCounty.value = true

    }

    console.log(data.row.domain_id)

    AddDialogVisible.value = true
}

const removeDocument = (data: TableSlotDefault) => {
    console.log('----->', data)
    let formData = {}
    formData.id = data.id
    formData.model = model
    formData.filesToDelete = [data.name]
    deleteDocument(formData)
}


const DeleteProject = (data: TableSlotDefault) => {
    console.log('----->', data)
    let formData = {}
    formData.id = data.id
    formData.model = model

    DeleteRecord(formData)

    console.log(tableDataList.value)


    // Delete docuemnts only if there's any docuemnt to delete 
    if (data.documents.length > 0) {
        formData.filesToDelete = data.documents
        deleteDocument(formData)

    }
    // remove the deleted object from array list 
    let index = tableDataList.value.indexOf(data.row);
    if (index !== -1) {
        tableDataList.value.splice(index, 1);
    }

}

const tableRowClassName = (data) => {
    console.log('Row Styling --------->', data.row)
    if (data.row.documents.length > 0) {
        return 'warning-row'
    }
    return ''
}


const DownloadXlsx = async () => {
    console.log(tableDataList.value)

    // change here !
    let fields = [
        { label: "S/No", value: "index" }, // Top level data
        { label: "Title", value: "title" }, // Top level data
        { label: "Settlement", value: "settlement" }, // Custom format
        { label: "Programme", value: "programme" }, // Run functions
        { label: "Status", value: "status" }, // Run functions
        { label: "Beneficiaries(#Male)", value: "male_beneficiaries" }, // Run functions
        { label: "Beneficiaries(#Female)", value: "female_beneficiaries" }, // Run functions
        { label: "Cost", value: "cost" }, // Run functions
    ]


    // Preprae the data object 
    var dataObj = {}
    dataObj.sheet = 'data'
    dataObj.columns = fields

    let dataHolder = []
    // loop through the table data and sort the data 
    // change here !
    for (let i = 0; i < tableDataList.value.length; i++) {
        let thisRecord = {}
        tableDataList.value[i]
        thisRecord.index = i + 1
        thisRecord.title = tableDataList.value[i].title
        thisRecord.settlement = tableDataList.value[i].settlement.name
        thisRecord.programme = tableDataList.value[i].programme.title
        thisRecord.female_beneficiaries = tableDataList.value[i].female_beneficiaries
        thisRecord.male_beneficiaries = tableDataList.value[i].male_beneficiaries
        thisRecord.cost = tableDataList.value[i].cost
        thisRecord.status = tableDataList.value[i].status

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


const handleChangeComponentCategory = (selected) => {

    ruleForm.component_id = selected[0]
    ruleForm.category_id = selected[1]

    //console.log(selected)

}

const locationOptions = [
    {
        label: "National",
        value: 1
    },
    {
        label: "County",
        value: 2
    },
    {
        label: "Settlement",
        value: 3
    },

    {
        label: "Other",
        value: 4
    },
]

const showCounty = ref(false)
const showSettlement = ref(false)

const handleSelectLocation = async (location: any) => {
    if (location == 2) {
        // county 
        showCounty.value = true
        showSettlement.value = false
        ruleForm.settlement_id = null
        ruleForm.geom = null

    }
    else if (location == 3) {
        //settlement 
        showCounty.value = false
        showSettlement.value = true
        ruleForm.county_id = null
        ruleForm.geom = null

    } else {
        // National 
        showCounty.value = false
        showSettlement.value = false
        ruleForm.geom = null

    }

}

</script>

<template>
    <ContentWrap :title="page_title" :message="t(' The list of intervention beneficiaries. Use the filters to subset')">
        <el-divider border-style="dashed" content-position="left">Filters</el-divider>


        <!-- <div style="display: inline-block; margin-left: 10px">
                                    <el-select v-model="value4" :onChange="filterBySettlement" :onClear="handleClear" multiple clearable filterable
                                        collapse-tags placeholder="By Settlement">
                                        <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label" :value="item.value" />
                                    </el-select>
                                </div> -->

        <div style="display: inline-block; margin-left: 10px">

            <el-select v-model="value5" filterable placeholder="Select Programme" multiple :onChange="filterByProgramme">
                <el-option v-for="item in programmeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>


        </div>

        <div style="display: inline-block; margin-left: 20px">
            <el-select v-model="value3" multiple clearable filterable remote :remote-method="searchByName" reserve-keyword
                placeholder="Search by Name" />
        </div>

        <div style="display: inline-block; margin-left: 20px">
            <el-button :onClick="handleClear" type="primary" :icon="Filter" />
        </div>

        <div v-if="showAdminButtons" style="display: inline-block; margin-left: 20px">
            <el-tooltip content="Add Project" placement="top">
                <el-button :onClick="AddProject" type="primary" :icon="Plus" />
            </el-tooltip>
        </div>

        <div style="display: inline-block; margin-left: 20px">
            <el-tooltip content="Download" placement="top">
                <el-button :onClick="DownloadXlsx" type="primary" :icon="Download" />
            </el-tooltip>
        </div>


        <el-divider border-style="dashed" content-position="left">Results</el-divider>

        <el-tabs @tab-click="onMap" v-model="activeName" type="border-card">
            <el-tab-pane label="List" name="list">
                <el-table :data="tableDataList" style="width: 100%" :row-class-name="tableRowClassName">
                    <el-table-column type="expand">
                        <template #default="props">
                            <div m="4">
                                <h3>Documents</h3>
                                <el-table :data="props.row.documents">
                                    <el-table-column label="Name" prop="name" />
                                    <el-table-column label="Type" prop="category" />

                                    <el-table-column label="Actions">
                                        <template #default="scope">
                                            <el-link :href="props.row.documents[scope.$index].name" download>
                                                <Icon icon="material-symbols:download-for-offline-rounded" color="#46c93a"
                                                    width="36" />
                                            </el-link>
                                            <el-tooltip content="Delete" placement="top">
                                                <el-popconfirm confirm-button-text="Yes" cancel-button-text="No"
                                                    :icon="InfoFilled" icon-color="#626AEF"
                                                    title="Are you sure to delete this document?"
                                                    @confirm="removeDocument(scope.row)">
                                                    <template #reference>
                                                        <el-button v-if="showAdminButtons" type="danger" :icon=Delete
                                                            circle />
                                                    </template>
                                                </el-popconfirm>
                                            </el-tooltip>
                                        </template>
                                    </el-table-column>
                                </el-table>
                                <el-button @click="addMoreDocs(props.row)" type="info" round>Add Documents</el-button>

                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="Title" width="400" prop="title" />
                    <el-table-column label="Settlement" prop="settlement.name" />
                    <el-table-column label="Programme" prop="programme.title" />
                    <el-table-column label="Component" prop="component.title" />


                    <el-table-column fixed="right" label="Operations" width="200">
                        <template #default="scope">

                            <el-tooltip v-if="showAdminButtons" content="Edit" placement="top">
                                <el-button type="success" :icon="Edit" @click="editProject(scope as TableSlotDefault)"
                                    circle />
                            </el-tooltip>
                            <el-tooltip content="View on Map" placement="top">
                                <el-button type="warning" :icon="Position" @click="viewOnMap(scope as TableSlotDefault)"
                                    circle />
                            </el-tooltip>
                            <el-tooltip content="Delete" placement="top">
                                <!-- <el-popconfirm confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled"
                                        icon-color="#626AEF" title="Are you sure to delete this report?"
                                        @confirm="DeleteProject(scope.row as TableSlotDefault)"> -->



                                <el-popconfirm width="220" confirm-button-text="OK" cancel-button-text="No, Thanks"
                                    :icon="InfoFilled" icon-color="#626AEF" title="Are you sure to delete this?"
                                    @confirm="DeleteProject(data as TableSlotDefault)">




                                    <template #reference>
                                        <el-button v-if="showAdminButtons" type="danger" :icon=Delete circle />
                                    </template>
                                </el-popconfirm>
                            </el-tooltip>
                        </template>
                    </el-table-column>

                </el-table>

                <ElPagination layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
                    v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 1000]" :total="total" :background="true"
                    @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
            </el-tab-pane>

            <el-tab-pane label="Map" name="Map" :disabled="tabDisabled">
                <div id="mapContainer" class="basemap"></div>
            </el-tab-pane>
        </el-tabs>



        <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formheader" width="30%" draggable>
            <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px">
                <el-form-item label="Location" prop="location_level">
                    <el-select v-model="ruleForm.location_level" filterable placeholder="Select Location"
                        @change="handleSelectLocation">
                        <el-option v-for="item in locationOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </el-form-item>

                <el-form-item v-if=showSettlement label="Settlement" prop="settlement_id">
                    <el-select v-model="ruleForm.settlement_id" filterable placeholder="Select Settlement">
                        <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </el-form-item>

                <el-form-item v-if=showCounty label="County" prop="county_id">
                    <el-select v-model="ruleForm.county_id" filterable placeholder="Select County"
                        @change="handleSelectCounty">
                        <el-option v-for="item in countyOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </el-form-item>


                <el-form-item label="Title">
                    <el-input v-model="ruleForm.title" />
                </el-form-item>

                <el-form-item label="Beneficiaries (M)">
                    <el-input-number v-model="ruleForm.male_beneficiaries" />
                </el-form-item>
                <el-form-item label="Beneficiaries (F)">
                    <el-input-number v-model="ruleForm.female_beneficiaries" />
                </el-form-item>

                <el-form-item label="Cost">
                    <el-input-number v-model="ruleForm.cost" />
                </el-form-item>

                <el-form-item label="Period" prop="period">
                    <el-date-picker v-model="ruleForm.period" type="monthrange" range-separator="To"
                        start-placeholder="Start date" end-placeholder="End date" />
                </el-form-item>

                <el-row>
                    <el-col :span="12" :lg="12" :md="12" :sm="12" :xs="24">
                        <el-form-item label="Programme" prop="programme_id">
                            <!-- <el-select v-model="ruleForm.programme_id" filterable placeholder="Select" :onChange="handleChangeProgramme"> -->
                            <el-select v-model="ruleForm.programme_id" filterable placeholder="Select">
                                <el-option v-for="item in programmeOptions" :key="item.value" :label="item.label"
                                    :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" :lg="12" :md="12" :sm="12" :xs="24">
                        <el-form-item label="Domain" prop="domain_id">
                            <el-cascader v-model="tmp_domain" :options="componentCategoryOptions" :show-all-levels="false"
                                @change="handleChangeComponentCategory" />
                        </el-form-item>
                    </el-col>

                </el-row>




                <el-form-item label="Documentation"> <el-upload v-model:file-list="fileUploadList" class="upload-demo"
                        multiple :limit="3" :auto-upload="false">
                        <el-button type="primary">Click to upload</el-button>
                        <template #tip>
                            <div class="el-upload__tip">
                                pdf/xlsx/csv/jpg/png files with a size less than 20mb.
                            </div>
                        </template>
                    </el-upload></el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="AddDialogVisible = false">Cancel</el-button>
                    <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>

                </span>
            </template>
        </el-dialog>

        <el-dialog v-model="addMoreDocuments" title="Upload More Documents" width="30%">
            <el-upload v-model:file-list="morefileList" class="upload-demo"
                action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple :limit="5"
                :auto-upload="false">
                <el-button type="primary">Click to upload</el-button>
                <template #tip>
                    <div class="el-upload__tip">
                        jpg/png files with a size less than 500KB.
                    </div>
                </template>
            </el-upload>
            <el-button type="secondary" @click="submitMoreDocuments()">Submit</el-button>

        </el-dialog>

    </ContentWrap>
</template>
 
<style scoped>
.basemap {
    width: 100%;
    height: 400px;
}
</style>

<style>
.el-table .warning-row {
    --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

.el-table .success-row {
    --el-table-tr-bg-color: var(--el-color-success-light-9);
}
</style>