<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElUpload, ElOption, ElSelect, ElTable, ElTableColumn, ElButton, ElCard, ElSteps, ElStep, ElAlert } from 'element-plus'
import { getModelSpecs } from '@/api/fields'
import Fuse from 'fuse.js'

// State
const step = ref(0)
const geoJson = ref(null)
const geoJsonProperties = ref<string[]>([])
const targetTable = ref('')
const dbFields = ref<string[]>([])
const geoJsonFieldMappings = ref<{ geoField: string; dbField: string }[]>([])
const remappedGeoJson = ref(null)
const importing = ref(false)
const usedDbFields = ref<Set<string>>(new Set())

// Table options
const tableOptions = [
  { label: 'Projects', value: 'project' },
  { label: 'Settlements', value: 'settlement' },
  { label: 'Facilities', value: 'facilities' }
]

// Handle GeoJSON Upload
const handleGeoJsonUpload = (uploadFile: any) => {
  const file = uploadFile.raw || uploadFile.file
  if (!file) return ElMessage.error('Invalid file')

  geoJson.value = null
  geoJsonProperties.value = []
  targetTable.value = ''
  dbFields.value = []
  geoJsonFieldMappings.value = []
  remappedGeoJson.value = null
  importing.value = false
  usedDbFields.value.clear()
  step.value = 0

  const reader = new FileReader()
  reader.onload = (e: any) => {
    try {
      const content = JSON.parse(e.target.result)
      geoJson.value = content
      const sampleProps = content.features?.[0]?.properties || {}
      geoJsonProperties.value = Object.keys(sampleProps)
      ElMessage.success('GeoJSON loaded successfully!')
      step.value = 1
    } catch (err) {
      ElMessage.error('Invalid GeoJSON format')
      console.error(err)
    }
  }
  reader.readAsText(file)
}

// Get model fields
const getModeldefinition = async (selModel: string) => {
  const formData = { model: selModel }
  try {
    const response = await getModelSpecs(formData)
    const data = response.data

    const fields = data
      .filter((obj: any) => obj.field !== 'id' && obj.field !== 'geom')
      .map((obj: any) => obj.field)

    if (selModel === 'project') {
      fields.push('activities')
    }

    dbFields.value = fields
    generateFuzzyMappings()
    step.value++
  } catch (err) {
    console.error("Error fetching model specs:", err)
  }
}

// Generate best fuzzy mappings (one-to-one)
const generateFuzzyMappings = () => {
  const fuse = new Fuse(dbFields.value, {
    includeScore: true,
    threshold: 0.5,
  })

  const matches: Record<string, { geoField: string; dbField: string; score: number }> = {}

  geoJsonProperties.value.forEach((geoField) => {
    const result = fuse.search(geoField)
    if (result.length > 0 && result[0].score !== undefined) {
      const bestMatch = result[0]
      const existing = matches[bestMatch.item]
      if (!existing || bestMatch.score < existing.score) {
        matches[bestMatch.item] = {
          geoField,
          dbField: bestMatch.item,
          score: bestMatch.score
        }
      }
    }
  })

  // Assign best unique matches
  geoJsonFieldMappings.value = geoJsonProperties.value.map((geoField) => {
    const match = Object.values(matches).find((m) => m.geoField === geoField)
    return {
      geoField,
      dbField: match ? match.dbField : ''
    }
  })

  usedDbFields.value = new Set(geoJsonFieldMappings.value.map(m => m.dbField).filter(Boolean))
}

// Helper to avoid multiple usage of same dbField
const isFieldTaken = (field: string, currentGeoField: string) => {
  return geoJsonFieldMappings.value.some(
    (item) => item.dbField === field && item.geoField !== currentGeoField
  )
}

const xhandleNextStep = async () => {
  if (step.value === 3) {
    await importGeoJson()
  } else {
    step.value++
  }
}


const handleNextStep = async () => {
  if (step.value === 2) {
    // Generate remappedGeoJson when transitioning from Step 2 (matching) to Step 3 (review)
    const fieldMap: Record<string, string> = Object.fromEntries(
      geoJsonFieldMappings.value.map(({ geoField, dbField }) => [geoField, dbField])
    )

    const newGeoJson = {
      ...geoJson.value,
      features: geoJson.value.features.map((feat: any) => {
        const newProps: Record<string, any> = {}
        for (const key in feat.properties) {
          const mappedKey = fieldMap[key]
          if (mappedKey) {
            newProps[mappedKey] = feat.properties[key]
          }
        }
        return { ...feat, properties: newProps }
      })
    }

    remappedGeoJson.value = newGeoJson

    console.log(remappedGeoJson.value)
  }

  if (step.value === 3) {
    await importGeoJson()
  } else {
    step.value++
  }
}



// Final import
const importGeoJson = async () => {
  importing.value = true
  const fieldMap: Record<string, string> = Object.fromEntries(
    geoJsonFieldMappings.value.map(({ geoField, dbField }) => [geoField, dbField])
  )

  const newGeoJson = {
    ...geoJson.value,
    features: geoJson.value.features.map((feat: any) => {
      const newProps: Record<string, any> = {}
      for (const key in feat.properties) {
        const mappedKey = fieldMap[key]
        if (mappedKey) {
          newProps[mappedKey] = feat.properties[key]
        }
      }
      return { ...feat, properties: newProps }
    })
  }

  remappedGeoJson.value = newGeoJson

  try {
    const res = await fetch('/api/import-geojson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: targetTable.value, data: newGeoJson })
    })

    if (!res.ok) throw new Error('Failed to import')
    ElMessage.success('GeoJSON imported successfully!')
  } catch (err) {
    console.error(err)
    ElMessage.error('Error importing GeoJSON')
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <el-card>
    <el-steps :active="step" finish-status="success" align-center>
      <el-step title="Upload GeoJSON" />
      <el-step title="Select Target Table" />
      <el-step title="Match Fields" />
      <el-step title="Review & Import" />
    </el-steps>

    <!-- Step 0 -->
    <div v-if="step === 0" class="mt-4">
      <el-upload
        action=""
        :auto-upload="false"
        :show-file-list="true"
        :on-change="handleGeoJsonUpload"
        :limit="1"
      >
        <el-button type="primary">Upload GeoJSON</el-button>
      </el-upload>
    </div>

    <!-- Step 1 -->
    <div v-if="step === 1" class="mt-4">
      <el-select v-model="targetTable" placeholder="Select destination table" @change="getModeldefinition">
        <el-option v-for="table in tableOptions" :key="table.value" :label="table.label" :value="table.value" />
      </el-select>
    </div>

    <!-- Step 2 -->
    <div v-if="step === 2" class="mt-4">
      <el-table :data="geoJsonFieldMappings" style="width: 100%">
        <el-table-column prop="geoField" label="GeoJSON Field" />
        <el-table-column label="Matched DB Field">
          <template #default="{ row }">
            <el-select v-model="row.dbField" clearable placeholder="Select DB Field">
              <el-option
                v-for="field in dbFields"
                :key="field"
                :label="field"
                :value="field"
                :disabled="isFieldTaken(field, row.geoField)"
              />
            </el-select>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Step 3 -->
    <div v-if="step === 3" class="mt-4">
      <el-alert title="Ready to import. Below is the remapped sample data. (first 1 record)" type="success" />
 
      <div v-if="remappedGeoJson && remappedGeoJson.features?.length">
             <pre class="mt-2">
        {{ JSON.stringify(remappedGeoJson.features.slice(0, 1).map(f => f.properties), null, 2) }}
            </pre>
          </div>
 
    </div>

    <!-- Navigation -->
    <div class="mt-4 flex justify-between">
      <el-button :disabled="step === 0" @click="step--">Back</el-button>
      <el-button type="primary" :loading="importing" @click="handleNextStep">
        {{ step === 3 ? 'Import' : 'Next' }}
      </el-button>
    </div>
  </el-card>
</template>

<style scoped>
.mt-2 {
  margin-top: 0.5rem;
}
.mt-4 {
  margin-top: 1rem;
}
.flex {
  display: flex;
}
.justify-between {
  justify-content: space-between;
}
</style>
