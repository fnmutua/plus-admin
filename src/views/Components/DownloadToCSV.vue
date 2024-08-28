<template>
  <div v-loading="downloading" style="display: inline-block; margin-left: 5px">
    <el-tooltip content="Download" placement="top">
      <el-button :onClick="DownloadViaComponent" type="primary" :icon="Finished" />
    </el-tooltip>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, toRefs } from 'vue';
import { ElButton, ElTooltip } from 'element-plus';
import { Finished } from '@element-plus/icons-vue';
// Import your APIs, store, and other dependencies here
import xlsx from 'json-as-xlsx';
import exportFromJSON from 'export-from-json'

const props = defineProps({
  model: String,
  associated_models: Array,
  tbl: Array,
  data: {
    type: Array,
    required: true,
    default: () => []
  }
});

const downloading = ref(false);
const model = ref();
const data = ref([]);

onMounted(async () => {
  console.log('Data passed via props:', props.data);
  model.value = props.model;

  // If data is passed as a promise
  if (props.data instanceof Promise) {
    try {
      const resolvedData = await props.data;
      data.value = resolvedData;
    } catch (error) {
      console.error('Error resolving data:', error);
    }
  } else {
    data.value = props.data;
  }
});


const flattenJSON = (obj = {}, res = {}, extraKey = '') => {
  for (let key in obj) {
    if (
      key !== 'geom' &&
      key !== 'createdAt' &&
      key !== 'updatedAt' &&
      key !== 'email' &&
      key !== 'phone' &&
      key !== 'isApproved' &&
      key !== 'createdBy' &&
      key !== 'isActive' &&
      key !== 'documents' &&
      key !== 'user'
    ) {
      if (
        (typeof obj[key] !== 'object' || obj[key] === null)
      ) {
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


const DownloadViaComponent = async () => {
  downloading.value = true;

  try {
    console.log('Downloading...', model.value, data.value);

    // Implement your downloading logic here, e.g., using json-as-xlsx
    // Example usage with json-as-xlsx:
    if (data.value && data.value.length) {

   
         
      console.log('data.value' ,data.value )
     
          const fileName = 'project_template'
          const exportType = exportFromJSON.types.csv
          if (data.value) exportFromJSON({ data, fileName, exportType })


            }

  } catch (error) {
    console.error('Error during download:', error);
  } finally {
    downloading.value = false;
  }
};
</script>
