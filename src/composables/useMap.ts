import { ref, Ref } from 'vue'
import mapboxgl from 'mapbox-gl'
import * as turf from '@turf/turf'
import type { GeoJSONCollection } from '@/types/geo'

export function useMap() {
  const map: Ref<mapboxgl.Map | null> = ref(null)
  const isDarkMode = ref(false)

  const initMap = (container: string, style: string) => {
    map.value = new mapboxgl.Map({
      container,
      style,
      center: [36.799473, -1.264257],
      zoom: 14
    })

    map.value.addControl(new mapboxgl.NavigationControl())
    map.value.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      })
    )

    return map.value
  }

  const addSettlementLayers = (geojson: GeoJSONCollection) => {
    if (!map.value) return

    map.value.addSource('farmers', {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    })

    map.value.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'farmers',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          'rgba(81, 187, 214, 0.47)',
          5,
          'rgba(241, 240, 117, 0.47)',
          10,
          'rgba(242, 140, 177, 0.47)'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          5,
          30,
          10,
          40
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': 'white'
      }
    })

    map.value.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'farmers',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    })

    map.value.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'farmers',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': 'green',
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': 'white'
      }
    })

    map.value.addLayer({
      id: 'settlementLabel',
      type: 'symbol',
      source: 'farmers',
      layout: {
        'text-field': ['concat', ['to-string', ['get', 'name']]],
        'text-size': 12,
        'text-offset': [0, 1]
      },
      paint: {
        'text-color': 'red',
        'text-halo-color': 'white',
        'text-halo-width': 1
      }
    })
  }

  const removeSettlementLayers = () => {
    if (!map.value) return

    const layers = ['clusters', 'cluster-count', 'unclustered-point', 'settlementLabel']
    const sources = ['farmers']

    layers.forEach(layer => {
      if (map.value?.getLayer(layer)) {
        map.value.removeLayer(layer)
      }
    })

    sources.forEach(source => {
      if (map.value?.getSource(source)) {
        map.value.removeSource(source)
      }
    })
  }

  const fitBounds = (geojson: GeoJSONCollection) => {
    if (!map.value) return
    const bounds = turf.bbox(geojson)
    map.value.fitBounds(bounds, { padding: 20 })
  }

  return {
    map,
    isDarkMode,
    initMap,
    addSettlementLayers,
    removeSettlementLayers,
    fitBounds
  }
} 