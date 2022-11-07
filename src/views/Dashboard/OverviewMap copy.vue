<script setup lang="ts">
import { Form, FormExpose } from '@/components/Form'
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { reactive, unref, ref } from 'vue'
import {
 ElProgress,
  ElCard,
  ElCol
} from 'element-plus'

 
 import { getCountyGeoAll } from '@/api/counties'
 import { getSumbyField } from '@/api/summary'

 import 'leaflet/dist/leaflet.css'
import { LMap, LGeoJson, LTileLayer, LControlLayers } from '@vue-leaflet/vue-leaflet'
import { featureGroup } from 'leaflet'
import { nextTick } from 'vue'
import { count } from 'console'
 

const filtergeo = ref([])
const map = ref()
const geo = ref()
const parcel_ref = ref()
const countyGeo = ref([])

 



function getColor(d) {
   console.log(d)
 
  if (!d) {
    return 'white'
  }
  if (d > 0 && d <= 5  ) {
    return '#fee5d9'
  }
  if (d > 5 && d <= 10  ) {
    return '#fcbba1'
  }

  if (d > 10 && d <= 15  ) {
    return '#fc9272'
  }
  if (d > 15  && d <= 20   ) {
    return '#fb6a4a'
}

if (d > 20   ) {
    return '#a50f15'
}

 



}
function updateStyle() {
  // console.log('Updating style....')

  if (geo.value.leafletObject) {


  const geojsonLayer = geo.value.leafletObject

  // console.log(geojsonLayer)
  if (!geojsonLayer) {
    return
  }

  let styleFunction

  styleFunction = (feature) => {
    // add feature here to access this prop
    // console.log(feature.properties.landuse_id)
    return {
      weight: 1,
      opacity: 0.85,
      borderWidth: '2',
      borderColor: 'white',
      color: getColor(feature.properties.slums), // send it here
      fillOpacity:0.85
 
    }
  }
  geo.value.leafletObject.setStyle(styleFunction)

}
}





const getSettlementSumByCounty= async () => {
  const formData={}
  formData.model='settlement'
  formData.sumField='county_id'
  const settPerCounty = await getSumbyField(formData)
  return settPerCounty.Total
}

const getCountyNames = async () => {
  const formData={}
  formData.model='county'
  const res = await getCountyGeoAll(formData)
  console.log(res.data[0].json_build_object)
  if (res.data[0].json_build_object.features) {
    countyGeo.value = res.data[0].json_build_object

    // noe get the settleemnt summary SS
    const sumbyCounty = await getSettlementSumByCounty()
    console.log(sumbyCounty)


     // transfer the couts to the Geojson layer for display   
    countyGeo.value.features.forEach(function (feature) {
       const cnty = sumbyCounty.filter(object => {
            return object.county_id === feature.properties.id;
          });
          if (cnty.length>0) {
            feature.properties.slums = parseInt(cnty[0].count)
         //   console.log(cnty[0].count)
          }
      
 
      });

 




    setTimeout(() => {
      //   this.$refs.resizeMap();
      //  map.value.leafletObject.invalidateSize()

      // After building your geoJson layers, just add this:
      nextTick().then(() => {
        var group = new featureGroup()

        map.value.leafletObject.eachLayer(function (layer) {
          //    console.log(layer.feature)
          if (layer.feature != undefined) {
            group.addLayer(layer)
          }
        })

        //  console.log(group.getBounds())
    //    map.value.leafletObject.fitBounds(group.getBounds(), { padding: [20, 20] })
    updateStyle()
      })
    }, 0) // 0ms seems enough to execute resize after tab opens.
  }
  
 
}
getCountyNames()

  

const countries = 'ke'
 
 

const title = 'Distribution of Informal Settlements'
const MapBoxToken ='pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'

const mapHeight = '450px'

//mapStyle="mapbox://styles/agspatial/ckd30gjyt3h8l1io35ve1fso4"


</script>

<template>
  <ContentWrap :title="title">
 

    <el-row :gutter="20">
      <el-col :span="10">
        <el-card class="box-card">
 <l-map ref="map" :zoom="6" :center="[ 0.606,37.817]" style="height: 66vh">
      <l-tile-layer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        layer-type="base"
        min-zoom="1"
        max-zoom="21"
        useBounds="true"
        class="map"
         name="OpenStreetMap"
      />

       <l-geo-json
        ref="geo"
        layer-type="overlay"
        name="Counties"
        :geojson="countyGeo"
        @ready="updateStyle"
      />
      <l-control-layers position="topright" />
    </l-map>   

        </el-card>
      </el-col>

      <el-col :span="5">
        <el-card class="box-card">
          <el-progress :text-inside="true" :stroke-width="26" :percentage="70" />

          >
        </el-card>
      </el-col>
    </el-row>
   </ContentWrap>
</template>
