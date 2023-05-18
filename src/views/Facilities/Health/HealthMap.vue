<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { getOneGeo, getfilteredGeo } from '@/api/settlements'
import { ref } from 'vue'
import 'leaflet/dist/leaflet.css'
import { LMap, LGeoJson, LTileLayer, LMarker, LPopup, LControlLayers } from '@vue-leaflet/vue-leaflet'
import { featureGroup } from 'leaflet'
import { nextTick } from 'vue'
import { useRoute } from 'vue-router'


// import {
//   MapboxMap,
//   MapboxGeocoderControl,
//   MapboxAttributionControl,
//   MapboxDrawControl,
//   MapboxGeolocateControl,
//   MapboxGeogeometryPolygon,
//   MapboxNavigationControl,
//   MapboxSourceGeoJson,
//   MapboxScaleControl,
//   MapboxMarker,
//   MapboxPopup
// } from 'vue-mapbox-ts'



const route = useRoute()

////Configurations //////////////
const model = 'health_facility'
////////////

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

const filtergeo = ref([])
const map = ref()
const geo = ref()
const parcel_ref = ref()
const geoLoaded = ref(false)
const parcel_geo = ref([])
const mapCenter = ref([])
const facilityName = ref()
const { t } = useI18n()

const getAll = async () => {
  console.log('Get all facilities ')
  const id = route.params.id
  const settData = route.params.data
  console.log('Faciity ID, Data:', id, settData)

  const formData = {}
  formData.model = model
  formData.id = id

  console.log(formData)
  const res = await getOneGeo(formData)

  console.log('Facility Geo:', res.data[0].json_build_object.features)
  if (res.data[0].json_build_object.features) {
    filtergeo.value = res.data[0].json_build_object
    console.log(res.data[0].json_build_object.features[0].geometry.coordinates)
    var coords = res.data[0].json_build_object.features[0].geometry.coordinates

    var latLon = [coords[0], coords[1]]
    console.log(latLon)

    //coords.move(0, 1);   // rearrange to Lat,Lo

    mapCenter.value = latLon
    facilityName.value = res.data[0].json_build_object.features[0].properties.name
    geoLoaded.value = true

    // 0ms seems enough to execute resize after tab opens.
  }
}

const getParcelGeo = async () => {
  console.log('Get all parcels for this settleemtn ')
  const id = route.params.id
  const settData = route.params.data
  console.log('Settlement ID, Data:', id, settData)

  const formData = {}
  formData.model = 'parcel'
  formData.columnFilterField = 'settlement_id'
  formData.selectedParents = id
  formData.id = id

  console.log(formData)
  const res = await getfilteredGeo(formData)

  console.log('parcel Geo:', res.data[0].json_build_object.features)
  if (res.data[0].json_build_object.features) {
    parcel_geo.value = res.data[0].json_build_object

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
        map.value.leafletObject.fitBounds(group.getBounds(), { padding: [20, 20] })
      })
    }, 0) // 0ms seems enough to execute resize after tab opens.
  }
}


getAll()
//getParcelGeo()

console.log(model)
const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNrOW4wdGkxNjAwMTIzZXJ2OWk4MTBraXIifQ.KoO1I8-0V9jRCa0C3aJEqw'
const mapHeight = '480px'


</script>

<template>
  <ContentWrap :title="toTitleCase(facilityName)">
<!-- 

    <mapbox-map :height="mapHeight" :zoom="17" :center="mapCenter" :accessToken="MapBoxToken">
      <mapbox-marker v-if="geoLoaded" :lngLat="mapCenter">
        <mapbox-popup>
          <div v-if="geoLoaded">{{ facilityName }}</div>

          <template #icon>
            <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
          </template>


        </mapbox-popup>
      </mapbox-marker>

    </mapbox-map> -->


  </ContentWrap>
</template>

<style>
.leaflet-demo-control {
  background: white;
  border: 1px solid rgb(193, 215, 233);
  border-radius: 0.2em;
  padding: 0.5em;
}
</style>
