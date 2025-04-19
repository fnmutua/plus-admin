 
<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage, ElUpload, ElOption, ElSelect, ElTable, ElTableColumn, ElButton, ElCard, ElSteps, ElStep, ElAlert, ElInput,ElNotification } from 'element-plus';
import { getModelSpecs  } from '@/api/fields';
import { getSettlementListByCounty,BatchImportUpsert  } from '@/api/settlements'

import Fuse from 'fuse.js';
import * as GeoJsonValidation from 'geojson-validation';
import readFileAndConvertToGeoJSON from '@/utils/readShapefile'; // Adjust path as needed

// Type definitions
interface GeoJsonFeature {
  type: string;
  geometry: { type: string; coordinates: any };
  properties: Record<string, any>;
  crs?: { type: string; properties: { name: string } };
}

interface GeoJson {
  type: string;
  features: GeoJsonFeature[];
  crs?: { type: string; properties: { name: string } };
}

interface ParentEntity {
  code: string;
  county_id: number;
  subcounty_id: number;
  ward_id?: number;
  settlement_id?: number;
  id: number;
}

// Constants
const TABLE_OPTIONS = [
  { label: 'Projects', value: 'project' },
  { label: 'Settlements', value: 'settlement' },
  { label: 'Parcels', value: 'parcel' },
  { label: 'Structures', value: 'structure' },
  
  { label: 'Roads', value: 'road' },
  { label: 'Road Assets', value: 'road_asset' },
  { label: 'Sewer', value: 'sewer' },
  { label: 'Piped Water', value: 'piped_water' },
  { label: 'Health Facility', value: 'health_facility' },
  { label: 'School', value: 'education_facility' },
  { label: 'Water Point', value: 'water_point' },
  { label: 'Public Facility', value: 'public_facility' },
  { label: 'Other Facility', value: 'other_facility' },

   



];

const MODEL_MAPPINGS = {
  settlement: 'ward',
  default: 'settlement',
};

// State
const step = ref(0);
const geoJson = ref<GeoJson | null>(null);
const geoJsonProperties = ref<string[]>([]);
const targetTable = ref('');
const dbFields = ref<string[]>([]);
const geoJsonFieldMappings = ref<{ geoField: string; dbField: string }[]>([]);
const remappedGeoJson = ref<GeoJson | null>(null);
const importing = ref(false);
const usedDbFields = ref<Set<string>>(new Set());
const loading = ref({
  upload: false,
  appendParent: false,
  import: false,
});
const fieldSearch = ref('');
const previewCount = ref(1);

// Computed properties
const filteredFieldMappings = computed(() =>
  geoJsonFieldMappings.value.filter((mapping) =>
    mapping.geoField.toLowerCase().includes(fieldSearch.value.toLowerCase())
  )
);

/**
 * Strips Z coordinates from GeoJSON geometry.
 * @param geometry - GeoJSON geometry object
 * @returns Geometry with only X, Y coordinates
 */
const stripZ = (geometry: any) => {
  if (geometry?.coordinates) {
    const cleanCoords = (coords: any): any => {
      if (Array.isArray(coords[0])) {
        return coords.map(cleanCoords);
      }
      return coords.length >= 2 ? coords.slice(0, 2) : coords;
    };
    return {
      ...geometry,
      coordinates: cleanCoords(geometry.coordinates),
    };
  }
  return geometry;
};

/**
 * Handles file upload (GeoJSON, zipped shapefile, KML, or KMZ) and validation.
 * @param uploadFile - The uploaded file object
 */
const handleGeoJsonUpload = async (uploadFile: any) => {
  const file = uploadFile.raw || uploadFile.file;
  if (!file) {
    ElMessage.error('Invalid file');
    return;
  }

  // Reset state
  geoJson.value = null;
  geoJsonProperties.value = [];
  targetTable.value = '';
  dbFields.value = [];
  geoJsonFieldMappings.value = [];
  remappedGeoJson.value = null;
  importing.value = false;
  usedDbFields.value.clear();
  step.value = 0;
  loading.value.upload = true;

  try {
    let parsedGeoJson: GeoJson;

    // Check file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    console.log(`Uploading file: ${file.name} (Extension: ${fileExtension})`);

    if (fileExtension === 'zip' || fileExtension === 'kml' || fileExtension === 'kmz') {
      ElMessage.info(`Processing ${fileExtension === 'zip' ? 'shapefile' : fileExtension.toUpperCase()} file...`);
      parsedGeoJson = await readFileAndConvertToGeoJSON(file);
      if (!parsedGeoJson.features.length) {
        throw new Error('No valid features found in the file');
      }
    } else if (fileExtension === 'json' || fileExtension === 'geojson') {
      const text = await file.text();
      parsedGeoJson = JSON.parse(text);
      if (!GeoJsonValidation.isFeatureCollection(parsedGeoJson)) {
        throw new Error('Invalid GeoJSON: Must be a FeatureCollection');
      }
      // Ensure WGS84 CRS for GeoJSON
      parsedGeoJson.crs = parsedGeoJson.crs || { type: 'name', properties: { name: 'EPSG:4326' } };
      if (parsedGeoJson.crs.properties.name !== 'EPSG:4326') {
        ElMessage.warning('GeoJSON CRS is not WGS84. Assuming WGS84 for processing.');
        parsedGeoJson.crs = { type: 'name', properties: { name: 'EPSG:4326' } };
      }
    } else {
      throw new Error('Unsupported file type. Please upload a .json, .geojson, .zip (shapefile), .kml, or .kmz file.');
    }

    // Validate parsed GeoJSON
    if (!parsedGeoJson.features || !parsedGeoJson.features.length) {
      throw new Error('No valid features found in the processed file');
    }

    // Ensure all features have WGS84 CRS
    parsedGeoJson.features = parsedGeoJson.features.map((feature) => ({
      ...feature,
      crs: { type: 'name', properties: { name: 'EPSG:4326' } },
    }));

    geoJson.value = parsedGeoJson;
    geoJsonProperties.value = [
      ...new Set(
        parsedGeoJson.features.flatMap((f: GeoJsonFeature) => Object.keys(f.properties))
      ),
    ];
    ElMessage.success(`${fileExtension === 'zip' ? 'Shapefile' : fileExtension === 'kml' ? 'KML' : fileExtension === 'kmz' ? 'KMZ' : 'GeoJSON'} loaded successfully! ${parsedGeoJson.features.length} features found.`);
    step.value = 1;
  } catch (err) {
    console.error('File upload error:', err);
    ElMessage.error(err.message || 'Error processing file');
  } finally {
    loading.value.upload = false;
  }
};

/**
 * Fetches model fields from the API, appends parent entity properties, and generates fuzzy field mappings.
 * @param selModel - Selected model (e.g., 'settlement')
 */
const getModelDefinition = async (selModel: string) => {
  const formData = { model: selModel };
  loading.value.appendParent = true;
  try {
    const response = await getModelSpecs(formData);
    const data = response.data;

    const fields = data
      .filter((obj: any) => obj.field !== 'id' && obj.field !== 'geom')
      .map((obj: any) => obj.field);

    if (selModel === 'project') {
      fields.push('activities');
    }

    dbFields.value = fields;
    await appendParentEntityPropertiesBatch();
    generateFuzzyMappings();
    step.value++;
  } catch (err) {
    console.error('Model definition error:', err);
    ElMessage.error('Error fetching model specs');
  } finally {
    loading.value.appendParent = false;
  }
};

/**
 * Generates fuzzy mappings between GeoJSON properties and database fields.
 */
const generateFuzzyMappings = () => {
  const fuse = new Fuse(dbFields.value, { includeScore: true, threshold: 0.5 });
  const matches: Record<string, { geoField: string; dbField: string; score: number }> = {};

  geoJsonProperties.value.forEach((geoField) => {
    const result = fuse.search(geoField);
    if (result.length > 0 && result[0].score !== undefined) {
      const bestMatch = result[0];
      const existing = matches[bestMatch.item];
      if (!existing || bestMatch.score < existing.score) {
        matches[bestMatch.item] = {
          geoField,
          dbField: bestMatch.item,
          score: bestMatch.score,
        };
      }
    }
  });

  geoJsonFieldMappings.value = geoJsonProperties.value.map((geoField) => {
    const match = Object.values(matches).find((m) => m.geoField === geoField);
    return {
      geoField,
      dbField: match ? match.dbField : '',
    };
  });

  usedDbFields.value = new Set(geoJsonFieldMappings.value.map((m) => m.dbField).filter(Boolean));
};

/**
 * Checks if a database field is already mapped to another GeoJSON field.
 * @param field - Database field to check
 * @param currentGeoField - Current GeoJSON field being mapped
 * @returns True if the field is taken
 */
const isFieldTaken = (field: string, currentGeoField: string) => {
  return geoJsonFieldMappings.value.some(
    (item) => item.dbField === field && item.geoField !== currentGeoField
  );
};

/**
 * Appends parent entity properties (e.g., county_id) to GeoJSON features based on pcode.
 */
const appendParentEntityPropertiesBatch = async () => {
  if (!geoJson.value) {
    ElMessage.error('GeoJSON is not loaded yet.');
    return;
  }

  const pcodesSet = new Set<string>();
  geoJson.value.features.forEach((feature: GeoJsonFeature) => {
    if (feature.properties?.pcode) {
      pcodesSet.add(feature.properties.pcode);
    }
  });

  const pcodesArray = Array.from(pcodesSet);
  if (!pcodesArray.length) {
    ElMessage.warning('No pcode found in any features.');
    return;
  }

  try {
    const formData = {
      curUser: 1,
      model: targetTable.value === 'settlement' ? MODEL_MAPPINGS.settlement : MODEL_MAPPINGS.default,
      searchField: 'name',
      searchKeyword: '',
      assocModel: '',
      filters: ['code'],
      filterValues: [pcodesArray],
      associated_multiple_models: [],
    };

    const response = await getSettlementListByCounty(formData);
    const parentData: ParentEntity[] = Array.isArray(response.data)
      ? response.data
      : Object.values(response.data);

    if (!parentData.length) {
      ElMessage.warning('No parent data found for provided pcodes.');
      return;
    }

    const updatedFeatures = geoJson.value.features.map((feature: GeoJsonFeature) => {
      const pcode = feature.properties?.pcode;
      if (!pcode) return feature;

      const parent = parentData.find((item) => item.code === pcode);
      if (!parent) return feature;

      return {
        ...feature,
        properties: {
          ...feature.properties,
          county_id: parent.county_id,
          subcounty_id: parent.subcounty_id,
          ward_id: targetTable.value === 'settlement' ? parent.id : null,
          settlement_id: targetTable.value !== 'settlement' ? parent.id : null,
        },
      };
    });

    geoJson.value = { ...geoJson.value, features: updatedFeatures };
    geoJsonProperties.value = [
      ...new Set(
        geoJson.value.features.flatMap((f: GeoJsonFeature) => Object.keys(f.properties))
      ),
    ];
    ElMessage.success('Parent entity details appended successfully!');
  } catch (err) {
    console.error('Parent entity error:', err);
    ElMessage.error('Error fetching parent entity details.');
  }
};

/**
 * Remaps GeoJSON features based on field mappings.
 */
const remapGeoJson = () => {
  if (!geoJson.value) return;

  const fieldMap: Record<string, string> = Object.fromEntries(
    geoJsonFieldMappings.value.map(({ geoField, dbField }) => [geoField, dbField])
  );

  const newGeoJson = {
    ...geoJson.value,
    features: geoJson.value.features.map((feat: GeoJsonFeature) => {
      const newProps: Record<string, any> = {};
      for (const key in feat.properties) {
        const mappedKey = fieldMap[key];
        if (mappedKey) {
          newProps[mappedKey] = feat.properties[key];
        }
      }
      return { ...feat, properties: newProps };
    }),
  };

  remappedGeoJson.value = newGeoJson;
};

/**
 * Imports the remapped GeoJSON to the database.
 */
 const importGeoJson = async () => {
  if (!remappedGeoJson.value) return;

  loading.value.import = true;

  try {
    const featuresImport = remappedGeoJson.value.features.map((f: GeoJsonFeature) => ({
      ...f.properties,
      geom: JSON.stringify(stripZ(f.geometry)),
    }));

    const formData = {
      model: targetTable.value,
      data: featuresImport,
    };

    const response = await BatchImportUpsert(formData);
    const resData = response.data || response;

    console.log('Import response:', resData);

    if (Array.isArray(resData.errors) && resData.errors.length > 0) {
      const errorDetails = resData.errors.map((err: any, index: number) => {
        const featureIndex = err.index ?? index;
        const reason = err.detail ?? 'Unknown error';
        return `Feature ${featureIndex + 1}: ${reason}`;
      }).join('<br>');

      ElNotification({
        title: 'Import Completed with Errors',
        message: `
          <div style="max-height: 65vh; overflow-y: auto; font-size: 13px; line-height: 1.4;">
            Failed to import ${resData.failedCount} of ${featuresImport.length} features:<br>
            ${errorDetails}
          </div>
        `,
        type: 'error',
        duration: 0,
        dangerouslyUseHTMLString: true,
      });

      return;
    }

    if (resData.failedCount > 0) {
      ElMessage.warning(`Imported ${featuresImport.length - resData.failedCount} of ${featuresImport.length} features successfully, but ${resData.failedCount} failed. Check logs for details.`);
    } else {
      ElMessage.success(`GeoJSON imported successfully! ${featuresImport.length} features imported.`);
    }

  } catch (err) {
    console.error('Import error:', err);
    ElNotification({
      title: 'Import Error',
      message: err.message || 'Error importing GeoJSON. Please check the data and try again.',
      type: 'error',
      duration: 0,
    });
  } finally {
    loading.value.import = false;
  }
};


/**
 * Handles navigation between steps and triggers import.
 */
const handleNextStep = async () => {
  if (step.value === 2) {
    remapGeoJson();
  }
  if (step.value === 3) {
    await importGeoJson();
  } else {
    step.value++;
  }
};
</script>

<template>
  <el-card>
    <el-steps
      :active="step"
      finish-status="success"
      align-center
      aria-label="File import steps"
    >
      <el-step title="Upload File" aria-label="Step 1: Upload GeoJSON, shapefile, KML, or KMZ" />
      <el-step title="Select Target Table" aria-label="Step 2: Select target table" />
      <el-step title="Match Fields" aria-label="Step 3: Match fields to database fields" />
      <el-step title="Review & Import" aria-label="Step 4: Review and import data" />
    </el-steps>

    <!-- Step 0: Upload File -->
    <div v-if="step === 0" class="mt-4">
      <el-upload
        action=""
        :auto-upload="false"
        :show-file-list="true"
        :on-change="handleGeoJsonUpload"
        :limit="1"
        accept=".json,.geojson,.zip,.kml,.kmz"
        aria-label="Upload GeoJSON, zipped shapefile, KML, or KMZ"
      >
        <el-button type="primary" :loading="loading.upload">Upload File</el-button>
      </el-upload>
      <p class="text-sm text-gray-500 mt-2">Supported formats: .json, .geojson, .zip (shapefile), .kml, .kmz</p>
    </div>

    <!-- Step 1: Select Target Table -->
    <div v-if="step === 1" class="mt-4">
      <el-select
        v-model="targetTable"
        placeholder="Select destination table"
        @change="getModelDefinition"
        aria-label="Select destination table"
        :disabled="loading.appendParent"
      >
        <el-option
          v-for="table in TABLE_OPTIONS"
          :key="table.value"
          :label="table.label"
          :value="table.value"
        />
      </el-select>
    </div>

    <!-- Step 2: Match Fields -->
    <div v-if="step === 2" class="mt-4">
      <el-input
        v-model="fieldSearch"
        placeholder="Search fields"
        clearable
        class="mb-2"
        aria-label="Search fields"
      />
      <div class="max-h-[60vh] overflow-auto border rounded bg-gray-50 p-2">
        <el-table :data="filteredFieldMappings" style="width: 100%">
          <el-table-column prop="geoField" label="Source Field" />
          <el-table-column label="Matched DB Field">
            <template #default="{ row }">
              <el-select
                v-model="row.dbField"
                clearable
                filterable
                placeholder="Select DB Field"
                aria-label="Select database field for mapping"
              >
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
    </div>

    <!-- Step 3: Review & Import -->
    <div v-if="step === 3" class="mt-4">
      <el-alert
        title="Ready to import. Below is the remapped sample data."
        type="success"
        aria-label="Import ready"
      />
      <el-select
        v-model="previewCount"
        placeholder="Select number of records to preview"
        class="mt-2"
        aria-label="Select number of records to preview"
      >
        <el-option label="1" :value="1" />
        <el-option label="5" :value="5" />
        <el-option label="10" :value="10" />
      </el-select>
      <div
        v-if="remappedGeoJson && remappedGeoJson.features?.length"
        class="mt-2 max-h-60 overflow-auto border rounded bg-gray-50 p-2"
      >
        <pre class="text-sm whitespace-pre-wrap">
          {{ JSON.stringify(remappedGeoJson.features.slice(0, previewCount).map(f => f.properties), null, 2) }}
        </pre>
      </div>
    </div>

    <!-- Navigation -->
    <div class="mt-4 flex justify-between">
      <el-button
        :disabled="step === 0 || loading.appendParent || loading.import"
        @click="step--"
        aria-label="Go to previous step"
      >
        Back
      </el-button>
      <el-button
        type="primary"
        :loading="importing || loading.appendParent || loading.import"
        @click="handleNextStep"
        aria-label="Proceed to next step or import"
      >
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
.mb-2 {
  margin-bottom: 0.5rem;
}
.flex {
  display: flex;
}
.justify-between {
  justify-content: space-between;
}
.text-sm {
  font-size: 0.875rem;
}
.text-gray-500 {
  color: #6b7280;
}
</style>
 