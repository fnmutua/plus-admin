<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">


import { ElButton} from 'element-plus'
import {  Back} from '@element-plus/icons-vue'

import { ref,computed } from 'vue'
import {
  ElPagination, ElInput,ElSelect,ElOption, 
  ElRow, ElTableV2, ElCard} from 'element-plus'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import {
    loginCollector,deleteSubmissions,
    getSubmissions} from '@/api/collector'

import { watch,onMounted } from 'vue';

import DownloadCustom from '@/views/Components/DownloadCustomFields.vue';
import { useRouter } from 'vue-router'

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
 
 
 

 
const loginUserToCollector = async () => { 
    var formData = {}
    formData.email = "kisip.mis@gmail.com"
    formData.password = "Admin@2011"

    loading.value=true


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


        getGRCData()
         
    })



}

const grc_officials =ref([])



const countyOptions  =ref([])
const settlementOptions  =ref([])
const extractData = async (dataArray) => {

  // Extract unique counties and settlements
const uniqueCounties = new Set();
const uniqueSettlements = new Set();


  // Clear the grc_officials array
  grc_officials.value = [];

  // Helper function to determine if an official already exists
  const isDuplicate = (newOfficial) => {
    return grc_officials.value.some(existingOfficial =>
      existingOfficial.county === newOfficial.county &&
      existingOfficial.settlement === newOfficial.settlement &&
      existingOfficial.returning_officer === newOfficial.returning_officer &&
      existingOfficial.npct_representative === newOfficial.npct_representative &&     
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


    // Etxract Counties 

    if (data.group_location?.county) {
        uniqueCounties.add(data.group_location.county);
      }
      //Extratc Settleemnts 
      if (data.settlement_name) {
        uniqueSettlements.add(data.settlement_name);
      }


    // Ensure group_location and settlement_name exist before using them
    const official_details = {
      county: data.group_location?.county || "N/A",
      settlement: data.settlement_name || "N/A",
      returning_officer: data.grp_certification?.returning_officer || "N/A",
      npct_representative: data.grp_certification?.npct_representative || "N/A",
      date: data.date || "N/A",
      settlement: data.settlement_name || "N/A",
    };

    // Check if grc_officials array exists in each data object
    if (data.grc_officials && Array.isArray(data.grc_officials)) {
      // Loop through the grc_officials array within each data object
      data.grc_officials.forEach(official => {
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
          grc_officials.value.push(newOfficial);
        }
      });
    }
  });

    countyOptions.value = Array.from(uniqueCounties).map(county => ({ label: county, value: county }));
    settlementOptions.value = Array.from(uniqueSettlements).map(settlement => ({ label: settlement, value: settlement }));
    console.log(  countyOptions.value )
};



const getGRCData = async () => {  
  // Define the formData object with necessary fields
  const formData = {
    project: "1",
    form: "grc_officials",
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
    console.log(grc_officials.value); 

  } catch (error) {
    // Handle errors here
    console.error('Error:', error);
  } finally {
    // Reset loading state
    loading.value = false;
  }
};

 

const deleteRecord = async (row) => {  
  const formData = {
    project: "1",
    form: "grc_officials",
    token: localStorage.getItem('collectorToken')
  };

  try {
    // Await the response from getSubmissions
    const response = await deleteSubmissions(formData);

    console.log('Delete Submissions:', response);
 

  } catch (error) {
    // Handle errors here
    console.error('Delete Error:', error);
  }  

}
const totalItems = ref(); // Total number of rows (initially full dataset)


console.log("projects--->", projects.value)
console.log("forms--->", forms.value)

loginUserToCollector()
 

totalItems.value = grc_officials.value.length


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
  'npct_representative',
];

 

let columnsx = generateColumnsX(selectedAttributes);
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
        totalItems.value = grc_officials.value.length; // Reset total to initial value
      }
    };

// Computed property for filtered data based on the search term

const county_value =ref()
const sett_value =ref()
const filteredData = computed(() => {
  //const searchTerm = search.value.toLowerCase();
  // if (searchTerm) {
  //   return grc_officials.value.filter((data) => {
  //     const nameMatch = data.name?.toLowerCase().includes(searchTerm);
  //     const settlementMatch = data.settlement?.toLowerCase().includes(searchTerm);
  //     const telephoneMatch = data.mobile?.toLowerCase().includes(searchTerm); // Assuming 'mobile' is the telephone number
  //     const idMatch = data.national_id?.toLowerCase().includes(searchTerm); // Assuming 'national_id' is the unique identifier
  //     const countyMatch = data.county?.toLowerCase().includes(searchTerm); // Assuming 'national_id' is the unique identifier
  //     const NPCTMatch = data.npct_representative?.toLowerCase().includes(searchTerm); // Assuming 'national_id' is the unique identifier

  //     return nameMatch || settlementMatch || telephoneMatch || idMatch ||countyMatch ||NPCTMatch;
  //   });
  // }

  // return grc_officials.value; // Return all data if no search term

     const searchTerm = search.value.toLowerCase();
        const selectedCounty = county_value.value;
        const selectedSettlement = sett_value.value;
  
        return grc_officials.value.filter((data) => {
          const countyMatch = selectedCounty ? data.county === selectedCounty : true;
          const settlementMatch = selectedSettlement ? data.settlement === selectedSettlement : true;
  
          if (searchTerm) {
            const nameMatch = data.name?.toLowerCase().includes(searchTerm);
            const settlementTermMatch = data.settlement?.toLowerCase().includes(searchTerm);
            const telephoneMatch = data.mobile?.toLowerCase().includes(searchTerm);
            const idMatch = data.national_id?.toLowerCase().includes(searchTerm);
            const NPCTMatch = data.npct_representative?.toLowerCase().includes(searchTerm);
  
            return countyMatch && settlementMatch && (nameMatch || settlementTermMatch || telephoneMatch || idMatch || NPCTMatch);
          }
  
          return countyMatch && settlementMatch;
        });

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



</script>

<template>
  <el-card  v-loading="loading">
    <el-row type="flex" justify="start" gutter="10" style="display: flex; flex-wrap: nowrap; align-items: center; margin-bottom:10px">
 
      <div class="max-w-200px">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>
      </div>

      
    <el-select
      v-model="county_value"
      placeholder="Filter County"
      style=" margin-right: 5px;  width:250px"
     clearable
     filterable
    >
      <el-option
        v-for="item in countyOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
    <el-select v-model="sett_value" 
    placeholder="Filter Settlement"
    clearable
     filterable
      style=" margin-right: 5px; width:350px">
      <el-option
        v-for="item in settlementOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select> 

      <el-input clearable  v-model="search" placeholder="Search by Name, ID, Phone,County or Settlement" :onInput="filterTableData" style=" margin-right: 15px;" />

      <DownloadCustom    :data="paginatedData"   :all="grc_officials" />

      <!-- Download All Component -->
    </el-row>

   



    <div>
    <el-table-v2
    
     
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
