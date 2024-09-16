<!-- eslint-disable prettier/prettier -->
<script setup lang="tsx">


import { ElButton,ElDialog} from 'element-plus'
import {  Back} from '@element-plus/icons-vue'

import { ref,computed,unref } from 'vue'
import {
  ElPagination, ElInput,ElSelect,ElOption, 
  ElRow, ElTableV2, ElCard} from 'element-plus'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import {
    loginCollector,deleteSubmissions,editSubmissions,
    getSubmissions} from '@/api/collector'

    import {
      signupGRC} from '@/api/register'


    

import { watch,onMounted } from 'vue';

import DownloadCustom from '@/views/Components/DownloadCustomFields.vue';
import { useRouter } from 'vue-router'

import { ElCheckbox } from 'element-plus'
import type { CheckboxValueType, Column } from 'element-plus'

import type { FunctionalComponent } from 'vue'

import { getOneByCode } from '@/api/settlements'



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
       settlement_code: data.pcode || "N/A",
      submissionID: data.meta_instanceID
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
          grc_position: official.grc_position || "N/A",
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


const dialogVisible=ref(false)

const options = [
  {
    value: 'chairman',
    label: 'Chairman',
  },

  {
    value: 'secretary',
    label: 'Secretary',
  },
  {
    value: 'member',
    label: 'Member',
  },


]

const role =ref()







const submissionID = ref()
const dialog_title=ref('Edit Roles')
const editRecord = async (row) => {  

  dialogVisible.value=true
  submissionID.value=row.submissionID

}
 

const editRecordSubmit = async (row) => {  
 console.log(row)
 
const formData = {
project: "1",
form: "grc_officials",
submissionID:submissionID.value,
role:role.value,
token: localStorage.getItem('collectorToken')
};

try {
// Await the response from getSubmissions
 const response = await editSubmissions(formData);
console.log('Editing....',response)
//console.log('Delete Submissions:', response);


} catch (error) {
// Handle errors here
console.error('Delete Error:', error);
}  

}

const deleteRecord = async (row) => {  

  console.log("Delete..............", row)
  const formData = {
    project: "1",
    form: "grc_officials",
    submissionID:row.submissionID,
    token: localStorage.getItem('collectorToken')
  };

  try {
    // Await the response from getSubmissions
    //const response = await deleteSubmissions(formData);

    console.log('Delete Submissions disabled');
 

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
  'grc_position',
  'category', 
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
const position =ref()


const filteredData = computed(() => { 
  // return grc_officials.value; // Return all data if no search term

     const searchTerm = search.value.toLowerCase();
        const selectedCounty = county_value.value;
        const selectedSettlement = sett_value.value;
        
        const selectedPosition = position.value;

        console.log('selectedPosition',selectedPosition)
  
        


        return grc_officials.value.filter((data) => {
          const countyMatch = selectedCounty ? data.county === selectedCounty : true;
          const settlementMatch = selectedSettlement ? data.settlement === selectedSettlement : true;
          const selectedPositionMatch = selectedPosition ? data.grc_position === selectedPosition : true;
  
          if (searchTerm) {
            const nameMatch = data.name?.toLowerCase().includes(searchTerm);
            const settlementTermMatch = data.settlement?.toLowerCase().includes(searchTerm);
            const telephoneMatch = data.mobile?.toLowerCase().includes(searchTerm);
            const idMatch = data.national_id?.toLowerCase().includes(searchTerm);
            const postTMatch = data.grc_position?.toLowerCase().includes(searchTerm);
            const NPCTMatch = data.npct_representative?.toLowerCase().includes(searchTerm);
  
            return countyMatch && settlementMatch && (nameMatch || settlementTermMatch || telephoneMatch || idMatch || NPCTMatch || postTMatch );
          }
  
          return countyMatch && settlementMatch &&selectedPositionMatch;
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


const columns: Column<any>[] = [
  {
    key: 'operations',
    title: 'Operations',
    cellRenderer: ({ rowData }) => (
      <>
        <ElButton  onClick={() => editRecord(rowData)} size="small">Edit</ElButton>
        
        <ElButton onClick={() => deleteRecord(rowData)}  size="small" type="danger">
          Delete
        </ElButton>
      </>
    ),
    width: 150,
    align: 'center',
  }
]

// Assuming columnsx is an array
columnsx.push(...columns);

//columnsx.push(columns)


type SelectionCellProps = {
  value: boolean
  intermediate?: boolean
  onChange: (value: CheckboxValueType) => void
}
const SelectionCell: FunctionalComponent<SelectionCellProps> = ({
  value,
  intermediate = false,
  onChange,
}) => {
  return (
    <ElCheckbox
      onChange={onChange}
      modelValue={value}
      indeterminate={intermediate}
    />
  )
}

columnsx.unshift({
  key: 'selection',
  width: 50,
  cellRenderer: ({ rowData }) => {
    const onChange = (value: CheckboxValueType) => (rowData.checked = value)
    return <SelectionCell value={rowData.checked} onChange={onChange} />
  },

  headerCellRenderer: () => {
    const _data = unref(paginatedData)
    const onChange = (value: CheckboxValueType) =>
      (paginatedData.value = _data.map((row) => {
        row.checked = value
        return row
      }))
    const allSelected = _data.every((row) => row.checked)
    const containsChecked = _data.some((row) => row.checked)

    return (
      <SelectionCell
        value={allSelected}
        intermediate={containsChecked && !allSelected}
        onChange={onChange}
      />
    )
  },
})


const getSelectedRows =  () => {
  const selectedRows = paginatedData.value.filter((row) => row.checked)
  console.log(selectedRows[0])


    // Loop through the selected rows
    selectedRows.forEach(async (row) => {

      console.log(row)
 

      await getOneByCode({'model':'settlement','code':row.settlement_code })
            .then((res) => {
             

              console.log(res)
              var formData = {}
                  formData.username = row.mobile,
                  formData.name = row.name,
                  formData.phone = row.mobile,
                  formData.password = 'User@2024',
                  formData.role = ["grm"]
                  formData.location_level = "settlement"
                  formData.location_id = res.data.id
                  formData.location_field= "settlement_id"
          

              signupGRC(formData).then((response) => {
                console.log(response)
              })

            })
            .catch((error) => {
              // Handle the error here
              console.log('Error:', error);
            });





     })
  
  // .post(server +'api/auth/signup', {
  //     username: userForm.username,
  //     password: userForm.password,
  //     name: userForm.name,
  //     email: userForm.email,
  //     role: ['public']
  //   })



}


// Computed property to check if any row is selected
const anyRowSelected = computed(() => {
  return paginatedData.value.some((row) => row.checked)
})



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

    <el-select v-model="position" 
    placeholder="Filter positions"
    clearable
     filterable
      style=" margin-right: 5px; width:350px">
      <el-option
        v-for="item in options"
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
    <el-button style="margin-top: 20px;"  v-if="anyRowSelected" @click="getSelectedRows">Generate Accounts</el-button>

  </div>


  <div style="margin-top: 20px;">
  <!-- Pagination component -->
 
  <el-pagination layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
        v-model:page-size="pageSize" :page-sizes="[5, 10, 15, 20, 50, 100]" :total="totalItems" :background="true"
        @size-change="handlePageSizeChange" @current-change="handlePageChange" class="mt-4" />

  </div>

 
  
  </el-card>
 
  <el-dialog
    v-model="dialogVisible"
    :title="dialog_title"
    width="450"
 
  >
  <el-select
      v-model="role"
      placeholder="Select Role"
      size="small"
      style="width: 95%"
    >
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="editRecordSubmit">
          Confirm
        </el-button>
      </div>
    </template>
  </el-dialog>


</template>
