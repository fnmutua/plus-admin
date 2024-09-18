<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">


import { ElButton} from 'element-plus'
import {  Back} from '@element-plus/icons-vue'

import { ref,computed } from 'vue'
import {
  ElPagination, ElInput,ElSelect,ElOption,ElTable,ElTableColumn, ElTabPane,ElTabs,
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
        all_projects.forEach(  function (project) {
            
          projects.value.push(project)

            project.formList.forEach(function (form) {
                
              forms.value.push(form)


            })

        })


          getSecData()
          getGRCData()
         
    })



}

const sec_officials =ref([])
const grc_officials =ref([])



const countyOptions  =ref([])
const settlementOptions  =ref([])
 

const extractData = async (dataArray) => {
  // Create a map to store county and settlement records
  const recordsMap = new Map();

  // Clear the sec_officials array
  sec_officials.value = [];

  // Helper function to create a unique key for each county and settlement
 
  // Loop through the array of data
  dataArray.forEach(data => {
    if (!data) return; // Skip if no data exists

    // Extract county and settlement
    const county = data.group_location?.county || "N/A";
    const settlement = data.group_location?.county  || "N/A";
    const coordinator = data.grp_certification?.county_kisip_coordinator  || "N/A";
    const npct_representative = data.grp_certification?.npct_representative  || "N/A";
    const date = data.date  || "N/A";
    const key = data.meta_instanceID  || "N/A";
    
    // Create a unique key based on county and settlement
   // const key = createKey(county, settlement);

    // Ensure sec_officials array exists and is valid
    if (data.sec_officials && Array.isArray(data.sec_officials)) {
      // Check if the record for this county and settlement already exists
      if (!recordsMap.has(key)) {
        // If it doesn't exist, create a new entry in the map
        recordsMap.set(key, {
          county,
          settlement,
          coordinator,
          npct_representative,
          date, 
          sec_officials: [] // Initialize empty array for officials
        });
      }

      // Loop through the sec_officials array within each data object
      data.sec_officials.forEach(official => {
        // Construct the official details object
        const newOfficial = {
          category: official.category || "N/A",
          gender: official.gender || "N/A",
          name: official.name || "N/A",
          sec_position: official.sec_position || "N/A",
          national_id: official.national_id || "N/A",
          mobile: official.mobile || "N/A",
          returning_officer: data.grp_certification?.returning_officer || "N/A",
          npct_representative: data.grp_certification?.npct_representative || "N/A",
          date: data.date || "N/A"
        };

        // Add the official to the sec_officials array of the respective county and settlement
        recordsMap.get(key).sec_officials.push(newOfficial);
      });
    }
  });

  // Convert the map back to an array and assign it to sec_officials.value
  sec_officials.value = Array.from(recordsMap.values());


  console.log('sec_officials.value',sec_officials.value)
  // Extract unique counties and settlements for options
  const uniqueCounties = new Set();
  const uniqueSettlements = new Set();

  recordsMap.forEach(record => {
    uniqueCounties.add(record.county);
    uniqueSettlements.add(record.settlement);
  });

  countyOptions.value = Array.from(uniqueCounties).map(county => ({ label: county, value: county }));
  settlementOptions.value = Array.from(uniqueSettlements).map(settlement => ({ label: settlement, value: settlement }));

  console.log(countyOptions.value);
};

const extractGRCData = async (dataArray) => {
  // Create a map to store county and settlement records
  const recordsMap = new Map();

  // Clear the sec_officials array
  grc_officials.value = [];

  // Helper function to create a unique key for each county and settlement
 
  // Loop through the array of data
  dataArray.forEach(data => {
    if (!data) return; // Skip if no data exists

    // Extract county and settlement
    const county = data.group_location?.county || "N/A";
    const settlement = data.group_location?.county  || "N/A";
    const coordinator = data.grp_certification?.county_kisip_coordinator  || "N/A";
    const npct_representative = data.grp_certification?.npct_representative  || "N/A";
    const date = data.date  || "N/A";
    const key = data.meta_instanceID  || "N/A";
    
    // Create a unique key based on county and settlement
   // const key = createKey(county, settlement);

    // Ensure grc_officials array exists and is valid
    if (data.grc_officials && Array.isArray(data.grc_officials)) {
      // Check if the record for this county and settlement already exists
      if (!recordsMap.has(key)) {
        // If it doesn't exist, create a new entry in the map
        recordsMap.set(key, {
          county,
          settlement,
          coordinator,
          npct_representative,
          date, 
          grc_officials: [] // Initialize empty array for officials
        });
      }

      // Loop through the grc_officials array within each data object
      data.grc_officials.forEach(official => {
        // Construct the official details object
        const newOfficial = {
          category: official.category || "N/A",
          gender: official.gender || "N/A",
          name: official.name || "N/A",
          grc_position: official.grc_position || "N/A",
          national_id: official.national_id || "N/A",
          mobile: official.mobile || "N/A",
          returning_officer: data.grp_certification?.returning_officer || "N/A",
          npct_representative: data.grp_certification?.npct_representative || "N/A",
          date: data.date || "N/A"
        };

        // Add the official to the sec_officials array of the respective county and settlement
        recordsMap.get(key).grc_officials.push(newOfficial);
      });
    }
  });

  // Convert the map back to an array and assign it to sec_officials.value
  grc_officials.value = Array.from(recordsMap.values());


  console.log('grc_officials.value',grc_officials.value)
  // Extract unique counties and settlements for options
  const uniqueCounties = new Set();
  const uniqueSettlements = new Set();

  recordsMap.forEach(record => {
    uniqueCounties.add(record.county);
    uniqueSettlements.add(record.settlement);
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



const mergeOfficials = (sec_officials, grc_officials) => {
  // Loop through each sec_official entry
 
  sec_officials.forEach(secRecord => {
    const { date, county, settlement } = secRecord;

    // Find matching grc_official record by date, county, and settlement
    const matchingGrcRecord = grc_officials.find(grcRecord => 
      grcRecord.date === date &&
      grcRecord.county === county &&
      grcRecord.settlement === settlement
    );

  //  console.log("matchingGrcRecord....",matchingGrcRecord.grc_officials)


    // If a matching grc_official record is found, copy its officials to sec_officials
    if (matchingGrcRecord && matchingGrcRecord.grc_officials) {
    

      // Merge the GRC officials into the SEC officials array (this assumes simple concatenation)
      secRecord.grc_officials = [
        ...matchingGrcRecord.grc_officials
      ];
    }
  });
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
    await extractGRCData(response.data);

    // Log the extracted data
    console.log(grc_officials.value); 

    console.log('Waiitng.....')
    mergeOfficials(sec_officials.value, grc_officials.value)

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
        totalItems.value = sec_officials.value.length; // Reset total to initial value
      }
    };

// Computed property for filtered data based on the search term

const county_value =ref()
const sett_value =ref()
const filteredData = computed(() => {
  

     const searchTerm = search.value.toLowerCase();
        const selectedCounty = county_value.value;
        const selectedSettlement = sett_value.value;
  
        return sec_officials.value.filter((data) => {
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
const customCellStyle = () => {
      return {
        color: '#888', // Gray text
        fontStyle: 'italic', // Italic font
      };
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

      <DownloadCustom    :data="paginatedData"   :all="sec_officials" />

      <!-- Download All Component -->
    </el-row>

   
    <el-table :data="paginatedData" border style="width: 100%">
    <el-table-column type="expand">
      <template #default="props">
        <div m="4"> 
          <el-tabs tab-position="top" class="demo-tabs">
                  <el-tab-pane >
                    <template #label>
                        <el-badge  style="margin-left: 10px;" :value="props.row.sec_officials.length" type="warning" class="item" :offset="[10, 5]"> 
                          Settlement Executive Committee(SEC)
                        </el-badge>
                      </template>
                      <el-table :data="props.row.sec_officials"  >
                        <el-table-column label="#" type="index" />
                        <el-table-column label="Name" prop="name" />
                      <el-table-column label="National ID" prop="national_id" />
                      <el-table-column label="Gender" prop="gender" />
                      <el-table-column label="Phone" prop="mobile" />
                      <el-table-column label="Category" prop="category" />
                      <el-table-column label="SEC Position" prop="sec_position" />
                    </el-table>
                  </el-tab-pane>
                  <el-tab-pane >
                    <template #label>
                        <el-badge  style="margin-left: 10px;" :value="props.row.grc_officials.length" type="warning" class="item" :offset="[10, 5]"> 
                          Grievance Redress Committee (GRC)
                        </el-badge>
                      </template>
                      <el-table :data="props.row.grc_officials" class="styled-table">
                        <el-table-column label="#" type="index" />
                        <el-table-column label="Name" prop="name" />
                        <el-table-column label="National ID" prop="national_id" />
                        <el-table-column label="Gender" prop="gender" />
                        <el-table-column label="Phone" prop="mobile" />
                        <el-table-column label="Category" prop="category" />
                        <el-table-column label="GRC Position" prop="grc_position" />
                      </el-table>

                  </el-tab-pane>
                </el-tabs>  
              </div>
            </template>
          </el-table-column>
 

    <el-table-column label="Date" prop="date" />
    <el-table-column label="County" prop="county" />
    <el-table-column label="Settlement" prop="settlement" />
    <el-table-column label="Coordinator" prop="coordinator" />
    <el-table-column label="NPCT Rep" prop="npct_representative" />
  </el-table>


   
  <el-pagination layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
        v-model:page-size="pageSize" :page-sizes="[5, 10, 15, 20, 50, 100]" :total="totalItems" :background="true"
        @size-change="handlePageSizeChange" @current-change="handlePageChange" class="mt-4" />

  
  </el-card>
 
</template>


<style scoped>
.styled-table .el-table__body-wrapper tbody tr td {
  color: gray;        /* Gray text */
  font-style: italic; /* Italic font */
}
</style>