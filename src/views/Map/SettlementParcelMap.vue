<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { getOneGeo, getfilteredGeo } from '@/api/settlements'
import { ref } from 'vue'
 
import { useRoute } from 'vue-router'


import { ElCard, ElButton, ElCheckboxGroup, ElCheckbox, ElCheckboxButton, ElDropdown, ElDropdownItem, ElDropdownMenu, ElSwitch, ElTooltip, ElOption, ElDivider } from 'element-plus'

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import * as turf from '@turf/turf'
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'
import { Back, Download, ArrowDown, ArrowLeft } from '@element-plus/icons-vue'

 import "mapbox-layer-switcher/styles.css";

import writeShapefile from '@/utils/writeShapefile'
import * as download from 'downloadjs'
import { ElMessage } from 'element-plus'
import { ElCollapse, ElCollapseItem } from 'element-plus';
import { onMounted, computed, reactive } from 'vue'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useRouter } from 'vue-router'

import axios from 'axios';
 import { XMLParser } from 'fast-xml-parser';


import { Icon } from '@iconify/vue';

// import { MapboxExportControl, Size, PageOrientation, Format, DPI} from "@/watergis/mapbox-gl-export";
// import '@watergis/mapbox-gl-export/css/styles.css';
 

 

const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;



const appStore = useAppStoreWithOut()


const { push } = useRouter()
const title = ref('')

const route = useRoute()

////Configurations //////////////
const model = 'settlement'
////////////

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

const filtergeo = ref([])

const projectTitle = ref('')

const facilityGeoPoints = ref()
const facilityGeoLines = ref()
const facilityGeoPolygons = ref()

const { t } = useI18n()

const facilityData = ref({})
const getGeodata = async (settlement_id, fmodel) => {
  const filterCol = 'settlement_id'
  const formData = {}
  formData.model = fmodel
  formData.columnFilterField = filterCol
  formData.selectedParents = settlement_id
  formData.id = settlement_id

  console.log(formData)

  await getfilteredGeo(formData)
    .then((response: { data: any }) => {
      if (response.data[0].json_build_object.features) {
        facilityData.value[fmodel] = response.data[0].json_build_object
          showLayerLegend.value=true
      }


    })



}

const showSatellite = ref(false);

const toggleFloatingDiv = async () => {



showSatellite.value = !showSatellite.value;
console.log('Show Satellite', showSatellite.value);

// Get the map style
let style = nmap.value.getStyle();

// Get all layers
let allLayers = style.layers;

// Log all layers to the console
console.log('before ', allLayers);



if (!showSatellite.value) {
  console.log('Remove Satellte');





  if (nmap.value.getLayer('Satellite')) {
    nmap.value.removeLayer('Satellite');
    nmap.value.removeSource('Satellite');

  }


} else {

  console.log('Add Satellte');



  if (nmap.value.getLayer('Satellite')) {
    nmap.value.removeLayer('Satellite');
    nmap.value.removeSource('Satellite');

  } else {

    icon.value = `<button>  <svg viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="si-glyph si-glyph-satellite" fill="#f20707"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>650</title> <defs> </defs> <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g fill="#fb0e0e"> <path d="M12.495,5.893 C12.832,6.231 14.184,4.877 13.847,4.541 L10.864,1.557 C10.526,1.219 9.174,2.573 9.51,2.909 L12.495,5.893 L12.495,5.893 Z" class="si-glyph-fill"> </path> <path d="M3.288,10.897 C3.072,10.68 2.597,10.802 2.23,11.168 C1.863,11.536 1.742,12.009 1.959,12.228 L3.233,13.501 C3.45,13.719 3.922,13.597 4.289,13.23 C4.658,12.864 4.779,12.388 4.562,12.172 L3.288,10.897 L3.288,10.897 Z" class="si-glyph-fill"> </path> <rect transform="translate(2.240100, 2.131300) rotate(-44.991897) translate(-2.240100, -2.131300) " x="-0.25987605" y="1.13130958" width="4.96295245" height="1.95398128" class="si-glyph-fill"> </rect> <path d="M12.088,8.374 L10.657,9.802 L9.918,9.063 L11.543,7.439 C11.814,7.168 11.81,6.723 11.531,6.447 L9.031,3.948 C8.757,3.673 8.314,3.67 8.043,3.939 L6.419,5.564 L5.684,4.829 L7.113,3.401 L5.718,2.007 L2.221,5.503 L3.614,6.897 L5.028,5.484 L5.763,6.219 L4.134,7.849 C3.864,8.12 3.866,8.564 4.141,8.838 L6.641,11.336 C6.917,11.612 7.363,11.617 7.632,11.346 L9.262,9.717 L10.001,10.456 L8.585,11.869 L9.967,13.25 L13.464,9.753 L12.088,8.374 L12.088,8.374 Z" class="si-glyph-fill"> </path> <rect transform="translate(13.426200, 12.673100) rotate(-45.056720) translate(-13.426200, -12.673100) " x="10.9262228" y="11.6731091" width="4.96795479" height="1.97998198" class="si-glyph-fill"> </rect> </g> </g> </g></svg> </button>`

    nmap.value.addLayer(
      {
        id: 'Satellite',
        source: { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 },
        type: "raster"
      },
      'country-label'
    );
  }



}

// Get the map style
style = nmap.value.getStyle();

// Get all layers
allLayers = style.layers;


// Log all layers to the console
console.log('after', allLayers);

}

const icon = ref(`<button>  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4.97883 9.68508C2.99294 8.89073 2 8.49355 2 8C2 7.50645 2.99294 7.10927 4.97883 6.31492L7.7873 5.19153C9.77318 4.39718 10.7661 4 12 4C13.2339 4 14.2268 4.39718 16.2127 5.19153L19.0212 6.31492C21.0071 7.10927 22 7.50645 22 8C22 8.49355 21.0071 8.89073 19.0212 9.68508L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L4.97883 9.68508Z" fill="#1C274C"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M2 8C2 8.49355 2.99294 8.89073 4.97883 9.68508L7.7873 10.8085C9.77318 11.6028 10.7661 12 12 12C13.2339 12 14.2268 11.6028 16.2127 10.8085L19.0212 9.68508C21.0071 8.89073 22 8.49355 22 8C22 7.50645 21.0071 7.10927 19.0212 6.31492L16.2127 5.19153C14.2268 4.39718 13.2339 4 12 4C10.7661 4 9.77318 4.39718 7.7873 5.19153L4.97883 6.31492C2.99294 7.10927 2 7.50645 2 8Z" fill="#1C274C"></path> <path opacity="0.7" d="M5.76613 10L4.97883 10.3149C2.99294 11.1093 2 11.5065 2 12C2 12.4935 2.99294 12.8907 4.97883 13.6851L7.7873 14.8085C9.77318 15.6028 10.7661 16 12 16C13.2339 16 14.2268 15.6028 16.2127 14.8085L19.0212 13.6851C21.0071 12.8907 22 12.4935 22 12C22 11.5065 21.0071 11.1093 19.0212 10.3149L18.2339 10L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L5.76613 10Z" fill="#1C274C"></path> <path opacity="0.4" d="M5.76613 14L4.97883 14.3149C2.99294 15.1093 2 15.5065 2 16C2 16.4935 2.99294 16.8907 4.97883 17.6851L7.7873 18.8085C9.77318 19.6028 10.7661 20 12 20C13.2339 20 14.2268 19.6028 16.2127 18.8085L19.0212 17.6851C21.0071 16.8907 22 16.4935 22 16C22 15.5065 21.0071 15.1093 19.0212 14.3149L18.2339 14L16.2127 14.8085C14.2268 15.6028 13.2339 16 12 16C10.7661 16 9.77318 15.6028 7.7873 14.8085L5.76613 14Z" fill="#1C274C"></path> </g></svg></button>`)


const ParcelGeodata = ref([])

const showParcelLegend = ref(false)
const showLayerLegend = ref(false)
const getParcels = async () => {
  const id = route.params.id
  const filterCol = 'settlement_id'

  const formData = {}
  formData.model = 'parcel'
  formData.columnFilterField = filterCol
  formData.selectedParents = id

  console.log(formData)

  formData.filtredGeoIds = [id]
  var parcelsPoly = []
  await getfilteredGeo(formData)
    .then((response: { data: any }) => {
      //   filtergeo.value = response.data[0].json_build_object
      console.log(response.data[0].json_build_object.features)
      if (response.data[0].json_build_object.features) {
        for (let i = 0; i < response.data[0].json_build_object.features.length; i++) {

          parcelsPoly.push(response.data[0].json_build_object.features[i])

        }
        showParcelLegend.value=true
      }  




    })
  ParcelGeodata.value = parcelsPoly
  console.log('Parcels Acqured', ParcelGeodata.value)




}


const getAll = async () => {
  console.log('Get all Settleemnts ')
  const id = route.params.id
  console.log('Project ID, Data:', id, route.params)

  const formData = {}
  formData.model = model
  formData.id = id

  console.log(formData)
  const res = await getOneGeo(formData)

  var points = []
  var lines = []
  var polygons = []


  console.log('Project Geo:', res.data[0].json_build_object.features)
  title.value = res.data[0].json_build_object.features[0].properties.name

  for (let i = 0; i < res.data[0].json_build_object.features.length; i++) {
    console.log("Geo Type -------->", res.data[0].json_build_object.features[i].geometry.type)
    projectTitle.value = res.data[0].json_build_object.features[i].properties.title
    filtergeo.value = res.data[0].json_build_object
    // sort accordign to shape 
    if (res.data[0].json_build_object.features[i].geometry.type === "Point") {
      points.push(res.data[0].json_build_object.features[i])
    } else if (res.data[0].json_build_object.features[i].geometry.type === "LineString" || res.data[0].json_build_object.features[i].geometry.type === "MultiLineString") {
      lines.push(res.data[0].json_build_object.features[i])
    } else {
      polygons.push(res.data[0].json_build_object.features[i])
    }
    facilityGeoPoints.value = points
    facilityGeoLines.value = lines
    facilityGeoPolygons.value = polygons

    console.log("facilityGeoPolygons",facilityGeoPolygons.value)

    // Now check if there are any drone images

  }
  await getParcels()
   getGeodata(route.params.id, 'health_facility')
   getGeodata(route.params.id, 'education_facility')
   getGeodata(route.params.id, 'road')
   getGeodata(route.params.id, 'sewer')
   getGeodata(route.params.id, 'water_point')
   getGeodata(route.params.id, 'piped_water')
   getGeodata(route.params.id, 'other_facility')



  loadMap()
}

const nmap = ref()

 

const loadMap = async () => {
  nmap.value = new mapboxgl.Map({
    container: "mapContainer",
    style: "mapbox://styles/mapbox/streets-v12",
    //  style: './style.json',
    center: [37.137343, 1.137451], // starting position
    zoom: 6,
  })







  nmap.value.on('load', async () => {
    nmap.value.addSource('polygons', {
      type: 'geojson',
      // Use a URL for the value for the `data` property.
      data: turf.featureCollection(facilityGeoPolygons.value),
    });

    nmap.value.addSource('parcels', {
      type: 'geojson',
      // Use a URL for the value for the `data` property.
      data: turf.featureCollection(ParcelGeodata.value),
    
    });
 
    for (let i = 0; i < baselayers.value.length; i++) {
      console.log('Base Layers',baselayers.value[i])
      let url 
  

      if (baselayers.value[i]=='Satellite') {
        url = 'mapbox://mapbox.satellite'
           
      nmap.value.addLayer({
      id: baselayers.value[i],
      type: 'raster',
      source: {
        type: 'raster',
        tileSize: 256,
        url: url
         },
         layout: {
        visibility: 'none'
      }
      });

      }
 

      else if (baselayers.value[i]=='Imagery') {


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

          console.log('Drone Layers >>',glayers) 
 
          const intersectingLayer = glayers.map((layer) => {
                // Generate the bounding box
            console.log(layer.name)
                
                 const coords =  [
                layer.bbox.westBoundLongitude,
                layer.bbox.southBoundLatitude,
                layer.bbox.eastBoundLongitude,
                layer.bbox.northBoundLatitude
                ] ;
 
                //console.log(facilityGeoPoints.value)
               // console.log(facilityGeoLines.value)
              //  console.log(facilityGeoPolygons.value)
            let overlap 
            if (facilityGeoPoints.value.length>0) {
              console.log('facilityGeoPoints.value.length>0',facilityGeoPoints.value)
                overlap = turf.booleanIntersects(turf.bboxPolygon(coords), facilityGeoPoints.value[0]);
            } 
            else if (facilityGeoLines.value.length>0) {
                overlap = turf.booleanIntersects(turf.bboxPolygon(coords), facilityGeoLines.value[0]);

            } else {

              var settBBOX = turf.bbox(facilityGeoPolygons.value[0])
                console.log(settBBOX)
          
                  overlap = turf.booleanIntersects(turf.bboxPolygon(settBBOX),turf.bboxPolygon(coords));
                console.log(overlap, turf.bboxPolygon(settBBOX),turf.bboxPolygon(coords))

            }


               
            if (overlap) {
              return layer  ;  
                }
              
        }).filter(layer => layer !== undefined);;


        // Filter the intersecting layers
      
          console.log("Overlapping layers:", intersectingLayer);

          if (intersectingLayer.length>0) {
            var server = 'https://kesmis.go.ke/geoserver/kisip/wms'

                  nmap.value.addLayer({
                    'id': baselayers.value[i],
                    'type': 'raster',
                    'source': {
                      'type': 'raster',
                      'tiles': [ server+'?&bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=' + intersectingLayer[0].name ],
                        'tileSize': 256
                    },
                    'paint': {},
                  },
                  );

          }

        
        });

      }

   
    }

    
    nmap.value.addLayer({
      'id': 'Parcels',
      "type": "fill",
      'source': 'parcels',
      'paint': {
        'fill-color': [
          'case',
          ['==', ['get', 'landuse_id'], 0],
          '#8C675D',
          ['==', ['get', 'landuse_id'], 1],
          '#800080',
          ['==', ['get', 'landuse_id'], 2],
          '#F6C567',
          ['==', ['get', 'landuse_id'], 3],
          '#6FDC6E',
          ['==', ['get', 'landuse_id'], 4],
          '#FFFF00',
          ['==', ['get', 'landuse_id'], 5],
          '#FF1D1E',
          ['==', ['get', 'landuse_id'], 6],
          '#73B2FF',
          ['==', ['get', 'landuse_id'], 7],
          '#DCDCDC',
          ['==', ['get', 'landuse_id'], 8],
          '#FDFD96',
          ['==', ['get', 'landuse_id'], 9],
          '#FDFD96',
          'white'],
        'fill-opacity': 0.8,
        "fill-outline-color": "white"

      }
    });






    // Load facility data here
    for (let prop in facilityData.value) {
      //console.log(prop, facilityData.value[prop].features[0].geometry.type);
      facilityLayers.value.push(prop)
      filteredLayers.value.push(prop)

      nmap.value.addSource(prop, {
        type: 'geojson',
        data: facilityData.value[prop],
      });

      if (facilityData.value[prop].features[0].geometry.type == 'Point') {
        nmap.value.addLayer({
          'id': prop,
          "type": "circle",
          'source': prop,
          'paint': {
            'circle-radius': 8,
            'circle-stroke-width': 2,
            'circle-color': prop === 'health_facility' ? 'yellow' : prop === 'education_facility' ?
              'green' : prop === 'road' ? 'red' : prop === 'sewer' ? 'purple' : prop === 'water_point' ? 'blue'
                : prop === 'piped_water' ? 'blue' : 'gray','circle-stroke-color': 'white'
          }
        });

       



      } else if (facilityData.value[prop].features[0].geometry.type == 'LineString') {
        const layer = ({
          'id': prop,
          "type": "line",
          'source': prop,
          'paint': {
            'line-color': prop === 'piped_water' ? 'blue' : prop === 'sewer' ? 'purple' : 'red',
            'line-width': 2, // Adjust the thickness as desired
          }
        });

        // if (prop === 'sewer') {
        // //  layer.paint['line-dasharray'] = [0, 4, 3];

        //   // Add a dot in between the dashes
        //     const dashArray = layer.paint['line-dasharray'];
        //     const dotInBetween = dashArray.flatMap(dash => [dash, 1]); // 1 represents the dot
        // //    layer.paint['line-dasharray'] = dotInBetween;


        // }
        nmap.value.addLayer(layer);
      }
      else
      {
        nmap.value.addLayer({
          'id': prop,
          'type': 'fill',
          'source': prop,
          'layout': {},
          'paint': {
            'fill-color': 'gray',
            'fill-opacity': 0.5,
            'fill-outline-color': 'white'
          }
        });

      } 



      nmap.value.on('click', prop, (e) => {
      console.log("click props..........")
      // Copy coordinates array.
       const parcel_no = e.features[0].properties.name ?e.features[0].properties.name :e.features[0].properties.title
  
         const clickedLocation = e.lngLat;

     
      new mapboxgl.Popup({ offset: [0, 0] })
        .setLngLat(clickedLocation)
        .setHTML('<h1><u><strong>Details</strong></u><h1>' + '<h3><strong> Layer: </strong>'
          + prop + '</h3><p><strong> Name/Title:  </strong> '  + parcel_no + '</p>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
        .addTo(nmap.value);
      });
    
    }


    if(facilityGeoPoints.value.length>0) {

        console.log('Point Layer')

        nmap.value.addSource('PointSettlement', {
        type: 'geojson',
        data: facilityGeoPoints.value[0],
        });

        nmap.value.addLayer({
          'id': 'PointSettlementLayer',
          "type": "circle",
          'source': 'PointSettlement',
          'paint': {
            'circle-radius': 8,
            'circle-stroke-width': 2,
            'circle-color' : 'red',
            'circle-stroke-color': 'white'
          }
        });


        }
 
    // Load the boundary layer with red outline
    nmap.value.addLayer({
      'id': 'Boundary',
      "type": "line",
      'source': 'polygons',
      'paint': {
        'line-color': 'red',
        'line-width':2,
        'line-dasharray'  :[2,4]
      }
    });

    nmap.value.addLayer({
        'id': 'AreaLabels',
        'type': 'symbol',
        'source': 'polygons',
        'layout': {
          'text-field': [
            'concat',
            ['to-string', ['get', 'area']],
            ' Ha.' // Add ' ha' after the area value
          ],
          'text-size': 14,
          'text-offset': [0, 1]
        },
        'paint': {
          'text-color': 'red'
        }
      });



    nmap.value.addLayer({
      'id': 'Labels',
      'type': 'symbol',
      'source': 'parcels',
      'layout': {
        'text-field': ['get', 'parcel_no'],
        'text-size': 14,
        'text-offset': [0, 1]
      },
      'paint': {
        'text-color': 'white'
      }
    });


     





    ///=============

    // switch it off until the user selects to
    nmap.value.setLayoutProperty('Satellite', 'visibility', 'none')

 
    nmap.value.resize()
    var bounds = turf.bbox((filtergeo.value));



    if (facilityGeoPoints.value.length>0) {
      nmap.value.fitBounds(bounds, { maxZoom: 15, padding: 20 });
     } else {
        nmap.value.fitBounds(bounds, { padding: 20 });
  }










    // Change the cursor to a pointer when the mouse is over the places layer.
    nmap.value.on('mouseenter', 'points-layer', () => {
      nmap.value.getCanvas().style.cursor = 'pointer';
    });
    // Change it back to a pointer when it leaves.
    nmap.value.on('mouseleave', 'points-layer', () => {
      nmap.value.getCanvas().style.cursor = '';
    });


    nmap.value.on('click', 'Parcels', (e) => {
      console.log("click line..........")
      // Copy coordinates array.
      const coordinates = e.features[0].geometry.coordinates.slice();
      const parcel_no = e.features[0].properties.parcel_no;
      const landuse = e.features[0].properties.landuse_id;
      const area = e.features[0].properties.area_ha;

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      console.log(coordinates[0][0])
      var centroid = turf.centroid(e.features[0])
      console.log(centroid.geometry.coordinates)
      while (Math.abs(e.lngLat.lng - coordinates[0][0]) > 180) {
        coordinates[0][0] += e.lngLat.lng > coordinates[0][0] ? 360 : -360;
      }
      new mapboxgl.Popup({ offset: [0, 0] })
        .setLngLat(centroid.geometry.coordinates)
        .setHTML('<h1><u><strong>Parcel Details</strong></u><h1>' + '<h3><strong> Parcel Number: </strong>' + parcel_no + '</h3><p><strong> Area:  </strong> ' + area.toFixed(4) + '(Ha.)' + '</p>') // CHANGE THIS TO REFLECT THE PROPERTIES YOU WANT TO SHOW
        .addTo(nmap.value);
    });

    console.log("resizing....")

    const nav = new mapboxgl.NavigationControl();
    nmap.value.addControl(nav, "top-right");


      
  function addInfo(map) {

      class InfoButton {
        onAdd(map) {
          const div = document.createElement("div");
          div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
          div.innerHTML = icon.value;
          div.addEventListener("contextmenu", (e) => e.preventDefault());
          div.addEventListener("click", () => toggleFloatingDiv());

          return div;
        }
      }
      const infoBttn = new InfoButton();
      nmap.value.addControl(infoBttn, "top-right");
    }
    addInfo(nmap.value)

     /// to fix later 

      //     nmap.value.addControl(new MapboxExportControl({
      //     PageSize: Size.A3,
      //     PageOrientation: PageOrientation.Portrait,
      //     Format: Format.PNG,
      //     DPI: DPI[96],
      //     Crosshair: true,
      //     PrintableArea: true
      // }), 'top-right');


  })

}



//console.log('healthgeo',healthgeo)
getAll()


const editSettlement = () => {
  console.log(route.params.id)
  push({
  name: 'AddSettlementX',
    query: { id: route.params.id }
  
  });
}



const downloadMap = () => {
  ElMessage({
    message: 'Downloading in GeoJson format.....',
    type: 'warning',
  })

  let collection
  if (facilityGeoPolygons.value.length >0) {

      collection = turf.featureCollection(facilityGeoPolygons.value)
  } else {

    collection = turf.featureCollection(facilityGeoPoints.value)


  }
 
  console.log('points', facilityGeoPoints.value.length)
  console.log('poly', facilityGeoPolygons.value.length)

 // facilityGeoPoints

  //download(JSON.stringify(collection), title.value +".geojson", "text/plain");
  downloadJSON(collection, title.value +".geojson")
 
 
}

function downloadJSON(jsonObj, fileName) {

  console.log('downloading......')
  // Convert the JSON object to a JSON string
  const jsonString = JSON.stringify(jsonObj, null, 2);

  // Create a Blob with the JSON string
  const blob = new Blob([jsonString], { type: 'application/json' });

  // Create a link element
  const link = document.createElement('a');

  // Set the download attribute and file name
  link.download = fileName || 'download.json';

  // Create a URL for the Blob and set it as the href attribute of the link
  link.href = window.URL.createObjectURL(blob);

  // Append the link to the document
  document.body.appendChild(link);

  // Trigger a click on the link to start the download
  link.click();

  // Remove the link from the document
  document.body.removeChild(link);
}



const legendItems = [
  {
    "label": "Residential",
    "color": "#8C675D"
  },
  {
    "label": "Industrial",
    "color": "#800080"
  },
  {
    "label": "Education",
    "color": "#F6C567"
  },
  {
    "label": "Recreation",
    "color": "#6FDC6E"
  },
  {
    "label": "Public Purpose",
    "color": "#FFFF00"
  },
  {
    "label": "Commercial",
    "color": "#FF1D1E"
  },
  {
    "label": "Public Utility",
    "color": "#73B2FF"
  },
  {
    "label": "Transportation",
    "color": "#DCDCDC"
  },
  {
    "label": "Undeveloped",
    "color": "#FDFD96"
  },
  {
    "label": "Agricultural",
    "color": "#FDFD96"
  }
]

const boundaryItems = [
  {
    "label": "Boundary",
    "color": "black"
  },
]


const isMobile = computed(() => appStore.getMobile)

const showContent = ref(true)

const state = reactive({
  isOnline: navigator.onLine
});


onMounted(() => {




  console.log('Mounted..... Checking status', state.isOnline)
  if (isMobile.value) {
    showContent.value = false;
  }
  window.addEventListener('online', () => {
    console.log('App is online')
    state.isOnline = true;
  });
  window.addEventListener('offline', () => {
    console.log('App is offline')
    state.isOnline = false;
  });

})









console.log(model)
const facilityLayers = ref([])
const filteredLayers = ref([])
const baselayers = ref(['Imagery'])
const filteredBaselayers = ref([])

const parcels = ref(true)
const parcelLabels = ref(true)


const handleCheckboxChange = (option:String) => {

  for (let i = 0; i < facilityLayers.value.length; i++) {
    // console.log('opt', option[i])

    if (option.includes(facilityLayers.value[i])) {
      console.log('in', facilityLayers.value[i])

          nmap.value.setLayoutProperty(
            facilityLayers.value[i],
          'visibility',
          'visible'
       );
    }
    else {
      console.log('out', facilityLayers.value[i])
      nmap.value.setLayoutProperty(
            facilityLayers.value[i],
          'visibility',
          'none'
       );
    }

  }
     
    }


 
 const handleSwitchParcels = (option) => {

let opt 
  if (option) {
      opt='visible'
   } else {
    opt='none'
}

  console.log('out',option)
  nmap.value.setLayoutProperty(
    'Parcels',
      'visibility',
      opt
   );



 
}
    

 const handleSwitchLabels = (option) => {

  let opt 
    if (option) {
        opt='visible'
     } else {
      opt='none'
  }
 
    console.log('out',option)
    nmap.value.setLayoutProperty(
      'Labels',
        'visibility',
        opt
     );
 

 
   
 }
  
 const handleChangeVisibility = (option:String) => {

for (let i = 0; i < baselayers.value.length; i++) {
  // console.log('opt', option[i])

  if (option.includes(baselayers.value[i])) {
    console.log('in', baselayers.value[i])

        nmap.value.setLayoutProperty(
          baselayers.value[i],
        'visibility',
        'visible'
     );
  }
  else {
    console.log('out', baselayers.value[i])
    nmap.value.setLayoutProperty(
      baselayers.value[i],
        'visibility',
        'none'
     );
  }

}
   
  }
 

 


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

const showEditButtons =  ref(appStore.getEditButtons)


</script>
 
<template>
  <el-card class="box-card">
    <template #header>
      <div class="card-header">

        <div class="max-w-200px">
          <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
            Back
          </el-button>
        </div>


        <h1 style="font-weight: bold;">{{ toTitleCase(title.replace('_', ' ')) + ' Settlement' }}</h1>

        <div>
          
           
          <el-tooltip content="Edit Settlement" placement="top"> 
         
            <el-button  v-if="showEditButtons" type="success" :onClick="editSettlement" style="  margin-left: 5px">
              <Icon :size=24 icon='uil:edit' />
            </el-button>
          </el-tooltip>
          <el-tooltip content="Download Data" placement="top"> 
         
         <el-button type="primary" :onClick="downloadMap" style="  margin-left: 5px">
           <Icon :size=24 icon='ic:sharp-file-download' />
         </el-button>
       </el-tooltip>


        </div>

      </div>
    </template>


    <div class="map-container">

      <div id="mapContainer" class="basemap"></div>


    </div>
    <div id="floating-div">

   <el-collapse v-model="collapse">
          <el-collapse-item title="Key">
            <div class="legend">
                     
              <div >
                <div v-for="item in boundaryItems" :key="item.label" class="line-item">
                <div class="line-color"></div>
                <div class="legend-label">{{ item.label }}</div>
              </div>
              </div> 
             
            </div>
          </el-collapse-item>  

        <el-collapse-item title="Parcels" name="Parcels" v-if="showParcelLegend">
        
            <div ><el-checkbox   v-model="parcels" @change="handleSwitchParcels">
              <span class="legend-label">Parcels</span>
            </el-checkbox> </div>
         
           
               <div v-for="item in legendItems" :key="item.label" class="legend-item">
                <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
                <div class="legend-label">{{ item.label }}</div>
              </div>
              <div> <el-checkbox   v-model="parcelLabels" @change="handleSwitchLabels">
                <span class="legend-label-text">Labels</span>
              </el-checkbox>  </div>

      </el-collapse-item>  


       <el-collapse-item title="Overlays" name="checkboxes" v-if="showLayerLegend">
     <el-checkbox-group v-model="filteredLayers" @change="handleCheckboxChange"  class="checkbox-group-vertical">
        <el-checkbox v-for="item in facilityLayers" :label="item" :key="item">{{ item }}</el-checkbox>
      </el-checkbox-group>

       </el-collapse-item>
       
       <el-collapse-item title="Base" name="baseLayers"  >
     <el-checkbox-group v-model="filteredBaselayers" @change="handleChangeVisibility"  class="checkbox-group-vertical">
        <el-checkbox v-for="item in baselayers" :label="item" :key="item">{{ item }}</el-checkbox>
      </el-checkbox-group>

       </el-collapse-item>



        </el-collapse>  


     
 

    </div>



  </el-card>
</template>  

 

 
<style scoped>
.basemap {
  width: 100%;
  height: 75vh; /* Set the height to 75% of the viewport height */
}
</style>

<style>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text {
  font-size: 16px;
}

.item {
  margin-bottom: 18px;
}
</style>


<style scoped>
.demo-button-style {
  margin-top: 24px;
}
</style>
<style>
h1 {
  text-align: center;
}


.map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.map {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

.legend {
  padding: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.line-color {
  border-top: 3px dotted rgb(14, 1, 1);

  margin-right: 10px;
  width: 15px;

}

.line-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  border-style: dashed;
}



.legend-color {
  width: 20px;
  height: 20px;
  margin-right: 10px;
}

.legend-label {
  font-size: 14px;
}

#floating-div {
  position: absolute;
  top: 120px;
  left: 50px;
  z-index: 10;
  background-color: white;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}


.checkbox-group-vertical {
  display: flex;
  flex-direction: column;
}


.full-height {
  height: 100vh; /* Set the height to 100% of the viewport height */
  overflow: auto; /* Add scrollbars if content exceeds viewport height */
}
</style>