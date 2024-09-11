<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">


import { ElButton} from 'element-plus'
import {  Back} from '@element-plus/icons-vue'

import { ref,computed } from 'vue'
import {
  ElPagination, ElInput,
  ElRow, ElTableV2, ElCard} from 'element-plus'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import {
    loginCollector,
    getSubmissions} from '@/api/collector'

import { watch,onMounted } from 'vue';

import DownloadCustom from '@/views/Components/DownloadCustomFields.vue';

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

 
const mobileBreakpoint = 768;
const defaultPageSize = 20;
const mobilePageSize = 5;
const pageSize = ref(10);
const currentPage = ref(1);
const width = ref(1080);
 


// Function to update pageSize based on window width
const updatePageSize = () => {

  console.log('window.innerWidth',window.innerWidth)
  width.value=window.innerWidth -400
  if (window.innerWidth <= mobileBreakpoint) {
    pageSize.value = mobilePageSize;
  } else {
    pageSize.value = defaultPageSize;
  }
};



onMounted(async () => { 
 
  console.log('window.innerWidth',window.innerWidth)

 window.addEventListener('resize', updatePageSize);
   updatePageSize(); // Initial check
 
 
 })



console.log("userInfo--->", userInfo)

const projects =ref([])
const forms =ref([])
const loading =ref(false)
 

 
 

console.log("projects--->", projects.value)
console.log("forms--->", forms.value)

// temp data 

 

 
const loginUserToCollector = async () => { 
    var formData = {}
    formData.email = "kisip.mis@gmail.com"
    formData.password = "Admin@2011"

 


    await loginCollector(formData).then((response) => {
        // Assuming the token is in the response data
        const token = response.token;
        // Save the token to localStorage
        localStorage.setItem('collectorToken', token);
        console.log('collectorToken:', response);
        const all_projects = JSON.parse(response.data);
        console.log('projects:', projects);

        // loop through each project 
        all_projects.forEach(function (project) {
            
          projects.value.push(project)

            project.formList.forEach(function (form) {
                
              forms.value.push(form)


            })

        })


        getSecData()
         
    })



}

const sec_officials =ref([])

const extractData = async (dataArray) => {
  // Clear the sec_officials array
  sec_officials.value = [];

  // Helper function to determine if an official already exists
  const isDuplicate = (newOfficial) => {
    return sec_officials.value.some(existingOfficial =>
      existingOfficial.county === newOfficial.county &&
      existingOfficial.settlement === newOfficial.settlement &&
      existingOfficial.returning_officer === newOfficial.returning_officer &&
      existingOfficial.date === newOfficial.date &&
      existingOfficial.category === newOfficial.category &&
      existingOfficial.gender === newOfficial.gender &&
      existingOfficial.name === newOfficial.name &&
      existingOfficial.sec_position === newOfficial.sec_position &&
      existingOfficial.national_id === newOfficial.national_id &&
      existingOfficial.mobile === newOfficial.mobile
    );
  };

  // Loop through the array of data
  dataArray.forEach(data => {
    if (!data) return; // Skip if no data exists

    // Ensure group_location and settlement_name exist before using them
    const official_details = {
      county: data.group_location?.county || "N/A",
      settlement: data.settlement_name || "N/A",
      returning_officer: data.grp_certification?.returning_officer || "N/A",
      date: data.date || "N/A",
    };

    // Check if sec_officials array exists in each data object
    if (data.sec_officials && Array.isArray(data.sec_officials)) {
      // Loop through the sec_officials array within each data object
      data.sec_officials.forEach(official => {
        // Construct the complete official details object
        const newOfficial = {
          ...official_details,
          category: official.category || "N/A",
          gender: official.gender || "N/A",
          name: official.name || "N/A",
          sec_position: official.sec_position || "N/A",
          national_id: official.national_id || "N/A",
          mobile: official.mobile || "N/A",
        };

        // Only push the official if they do not already exist in the array
        if (!isDuplicate(newOfficial)) {
          sec_officials.value.push(newOfficial);
        }
      });
    }
  });
};


const getSecData = async () => {  
  // Define the formData object with necessary fields
  const formData = {
    project: "1",
    form: "sec_officials",
    token: localStorage.getItem('collectorToken')
  };

  // Set loading state
 /// loading.value = true;

  try {
    // Await the response from getSubmissions
    const response = await getSubmissions(formData);

    console.log('Submissions:', response);

    // Await the extraction of data
    await extractData(response.data);

    // Log the extracted data
    console.log(sec_officials.value); 

  } catch (error) {
    // Handle errors here
    console.error('Error:', error);
  } finally {
    // Reset loading state
    loading.value = false;
  }
};

 
const totalItems = ref(); // Total number of rows (initially full dataset)


console.log("projects--->", projects.value)
console.log("forms--->", forms.value)

loginUserToCollector()
 

totalItems.value = sec_officials.value.length


console.log("totalItems.value--->",totalItems.value)

const formatTitle = (attribute) => {
  // Replace underscores with spaces, capitalize first letter of each word
  return attribute
    .replace(/_/g, ' ') // Replace underscores with spaces
    .toLowerCase() // Convert to lowercase
    .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
};

const generateColumnsX = (attributes, prefix = 'column-', width = 150) => {
  if (!Array.isArray(attributes)) {
    throw new Error('Attributes must be an array');
  }

  return attributes.map((attribute, index) => ({
    key: `${prefix}${index}`,
    dataKey: attribute,
    title: formatTitle(attribute), // Use formatted title
    width: width,
  }));
};
// Example usage
const selectedAttributes = [
  'date',
  'county',
  'settlement',
  'name',
  'gender',
  'national_id',
  'mobile',
  'category',
  
];

 

const columnsx = generateColumnsX(selectedAttributes);
console.log(columnsx);



    const handlePageChange = (page) => {
      currentPage.value = page;
    };


    const handlePageSizeChange = (newSize) => {
      pageSize.value = newSize;
      currentPage.value = 1; // Reset to first page when changing page size
    };

    const search = ref('')
 

   // Filter data and reset pagination on search input change
   const filterTableData = () => {
      if (!search.value) {
        // If search is cleared, reset the pagination and total to original data
        currentPage.value = 1;
        totalItems.value = sec_officials.value.length; // Reset total to initial value
      }
    };

// Computed property for filtered data based on the search term
const filteredData = computed(() => {
  const searchTerm = search.value.toLowerCase();

  if (searchTerm) {
    return sec_officials.value.filter((data) => {
      const nameMatch = data.name?.toLowerCase().includes(searchTerm);
      const settlementMatch = data.settlement?.toLowerCase().includes(searchTerm);
      const telephoneMatch = data.mobile?.toLowerCase().includes(searchTerm); // Assuming 'mobile' is the telephone number
      const idMatch = data.national_id?.toLowerCase().includes(searchTerm); // Assuming 'national_id' is the unique identifier
      const countyMatch = data.county?.toLowerCase().includes(searchTerm); // Assuming 'national_id' is the unique identifier

      return nameMatch || settlementMatch || telephoneMatch || idMatch ||countyMatch;
    });
  }

  return sec_officials.value; // Return all data if no search term
});

    
    // Computed property for filtered data based on the search term
    const xfilteredData = computed(() => {
      if (search.value) {
        return sec_officials.value.filter((data) =>
          data.name.toLowerCase().includes(search.value.toLowerCase())
        );
      }
      return sec_officials.value; // Return all data if no search term
    });

    // Computed property for paginated data based on filtered results
    const paginatedData = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return filteredData.value.slice(start, end);
    });

    // Watch the filtered data to update totalItems and reset the pagination
    watch(filteredData, (newValue) => {
      totalItems.value = newValue.length; // Update total based on filtered data
      if (search.value) {
        currentPage.value = 1; // Reset to the first page if filtering
      }
    });

</script>

<template>
  <el-card>
    <el-row type="flex" justify="start" gutter="10" style="display: flex; flex-wrap: nowrap; align-items: center; margin-bottom:10px">

      <div class="max-w-200px">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>
      </div>
      <el-input  v-model="search" placeholder="Search by Name, ID, Phone,County or Settlement" :onInput="filterTableData" style=" margin-right: 15px;" />

      <DownloadCustom    :data="paginatedData"   :all="sec_officials" />

      <!-- Download All Component -->
    </el-row>

   



    <div>
    <el-table-v2
    
      v-loading="loading"
      :columns="columnsx"
      :data="paginatedData"
      :width="width"
      :height="650"
      fixed
    >
      <template #empty>
        <div class="flex items-center justify-center h-100%">
          <el-empty />
        </div>
      </template>
    </el-table-v2>
  </div>


  <div style="margin-top: 20px;">
  <!-- Pagination component -->
 
  <el-pagination layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
        v-model:page-size="pageSize" :page-sizes="[5, 10, 15, 20, 50, 100]" :total="totalItems" :background="true"
        @size-change="handlePageSizeChange" @current-change="handlePageChange" class="mt-4" />

  </div>

 
  
  </el-card>
 
</template>
