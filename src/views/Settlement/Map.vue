<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { getOneGeo, getfilteredGeo } from '@/api/settlements'
import { ref } from 'vue'
import 'leaflet/dist/leaflet.css'
import { LMap, LGeoJson, LTileLayer, LControlLayers } from '@vue-leaflet/vue-leaflet'
import { featureGroup } from 'leaflet'
import { nextTick } from 'vue'
import { useRoute } from 'vue-router'

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
const map = ref()
const geo = ref()
const parcel_ref = ref()
const parcel_geo = ref([])

const { t } = useI18n()

const getAll = async () => {
  console.log('Get all Settleemnts ')
  const id = route.params.id
  const settData = route.params.data
  console.log('Settlement ID, Data:', id, settData)

  const formData = {}
  formData.model = model
  formData.id = id

  console.log(formData)
  const res = await getOneGeo(formData)

  console.log('Settlement Geo:', res.data[0].json_build_object.features)
  if (res.data[0].json_build_object.features) {
    filtergeo.value = res.data[0].json_build_object

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

  }
}
getAll()
getParcelGeo()

console.log(model)
</script>

<template>
  <ContentWrap :title="toTitleCase(model.replace('_', ' '))" :message="t('Settlement  Map ')">
    <l-map ref="map" :zoom="16" :center="[-1.30853, 36.917257]" style="height: 66vh">
      <l-tile-layer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'"
        layer-type="base" min-zoom="1" max-zoom="21" useBounds="true" class="map" :max-bounds="maxBounds"
        name="Satellite" />
      <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" layer-type="base" min-zoom="1"
        max-zoom="21" useBounds="true" class="map" name="OpenStreetMap" />

      <l-geo-json ref="geo" layer-type="overlay" name="Settlement" :geojson="filtergeo" />
      <l-geo-json ref="parcel_ref" layer-type="overlay" name="Parcel" :geojson="parcel_geo" />

      <l-control-layers position="topright" />
    </l-map>
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
