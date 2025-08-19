<!-- eslint-disable prettier/prettier -->
<script setup lang="tsx">


import { Back } from '@element-plus/icons-vue'

import { ref, computed } from 'vue'
import {
    ElInput, ElSelect, ElOption, ElButton, ElDialog,ElTable,ElTableColumn,ElPagination,ElCol,ElStatistic,ElIcon,ElMessage,
  ElRow, ElCard,ElDivider, ElEmpty
} from 'element-plus'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import {
  loginCollector, editSubmissions,
  getSubmissions,getCSVSubmissions,getGeoSubmissions, getProjectUsers
} from '@/api/collector'

import { useTransition } from '@vueuse/core'


import {
  ArrowRight,ChatLineRound,
  CaretBottom,
  CaretTop,
  Warning,
  Download,
} from '@element-plus/icons-vue'

import { watch, onMounted } from 'vue';

import DownloadCustom from '@/views/Components/DownloadCustomFields.vue';
import PermissionWrapper from '@/components/PermissionWrapper.vue';
import { useRouter } from 'vue-router'






const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)






const mobileBreakpoint = 768;
const defaultPageSize = 10;
const mobilePageSize = 5;
const pageSize = ref(10);
const currentPage = ref(1);
const width = ref(1080);

// Function to update pageSize based on window width
const updatePageSize = () => {

  console.log('window.innerWidth', window.innerWidth)
  width.value = window.innerWidth - 400
  if (window.innerWidth <= mobileBreakpoint) {
    pageSize.value = mobilePageSize;
  } else {
    pageSize.value = defaultPageSize;
  }
};



onMounted(async () => {

  console.log('window.innerWidth', window.innerWidth)

  window.addEventListener('resize', updatePageSize);
  updatePageSize(); // Initial check


})



console.log("userInfo--->", userInfo)





const projects = ref([])
const forms = ref([])
const projectOptions = ref([])
const loading = ref(false)


//const summary=ref()
const summary = ref({
        totalProjects: 0,
        totalForms: 0,
        totalSubmissions: 0,
        mostRecentSubmission: null,
        totalEnumerators: 0,
        enumerators: []
    });


const processProjectData = async (projectArray) => {
   
  summary.value.totalProjects=0
  summary.value.totalForms=0
  summary.value.totalSubmissions=0
  summary.value.mostRecentSubmission=null
  summary.value.totalEnumerators=0

    projectArray.forEach(project => {
        // Increment total projects
        summary.value.totalProjects += 1;

        // Add to the total number of forms
        summary.value.totalForms += project.forms || 0;

        // Add up submissions from all forms
        if (project.formList && Array.isArray(project.formList)) {
            project.formList.forEach(form => {
              summary.value.totalSubmissions += form.submissions || 0;

                // Update the most recent submission
                if (
                    form.lastSubmission &&
                    (!summary.value.mostRecentSubmission || new Date(form.lastSubmission) > new Date(summary.value.mostRecentSubmission))
                ) {
                  summary.value.mostRecentSubmission = form.lastSubmission;
                }
            });
        }
    });

    // Fetch enumerator counts for each project
    for (const project of projectArray) {
        try {
            const formData = {
                project_id: project.id,
                token: localStorage.getItem('collectorToken')
            };
            const response = await getProjectUsers(formData);
            if (response.data && Array.isArray(response.data)) {
                summary.value.totalEnumerators += response.data.length;
                // Add project name to each enumerator
                const enumeratorsWithProject = response.data.map(enumerator => ({
                    ...enumerator,
                    projectName: project.name || 'Unknown Project'
                }));
                summary.value.enumerators.push(...enumeratorsWithProject);
            }
        } catch (error) {
            console.error('Error fetching enumerators for project:', project.id, error);
        }
    }

   // return result;
}



const loginUserToCollector = async () => {
  var formData = {}
  formData.email = "kisip.mis@gmail.com"
  formData.password = "***REDACTED***"

  loading.value = true


  await loginCollector(formData).then((response) => {
    // Assuming the token is in the response data
    const token = response.token;
    // Save the token to localStorage
    localStorage.setItem('collectorToken', token);
    console.log('collectorToken:', response);
    const all_projects = JSON.parse(response.data);
    console.log('projects:', projects.value);
    totalItems.value=all_projects.length

    processProjectData(all_projects)

    console.log('summary.value',summary.value)
    // loop through each project 
    all_projects.forEach(function (project) {


    // loop through each project 

   // Check if the value already exists in projectOptions to ensure uniqueness
    const description = project.description;
      if (!projectOptions.value.some(option => option.value === description)) {
        projectOptions.value.push({
          value: description,
          label: description
        });
      }
      
      projects.value.push(project)

      project.formList.forEach(function (form) {

        forms.value.push(form)


      })

    })


    getGRCData()

  })



}

const grc_officials = ref([])



const countyOptions = ref([])
const settlementOptions = ref([])
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
      submitter: data.meta.submitterName || "N/A",
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
  console.log(countyOptions.value)
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


const dialogVisible = ref(false)

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

const role = ref()







const submissionID = ref()
const dialog_title = ref('Edit Roles')


const editRecordSubmit = async (row) => {
  console.log(row)

  const formData = {
    project: "1",
    form: "grc_officials",
    submissionID: submissionID.value,
    role: role.value,
    token: localStorage.getItem('collectorToken')
  };

  try {
    // Await the response from getSubmissions
    const response = await editSubmissions(formData);
    console.log('Editing....', response)
    //console.log('Delete Submissions:', response);


  } catch (error) {
    // Handle errors here
    console.error('Delete Error:', error);
  }

}



const showAddDialog = ref(false)
const showEnumeratorsDialog = ref(false)
 

const totalItems = ref(); // Total number of rows (initially full dataset)

 
loginUserToCollector()


totalItems.value = grc_officials.value.length


console.log("totalItems.value--->", totalItems.value)

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
  'submitter',
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

const county_value = ref()
 

 


const category = ref([]);  // Store the selected categories as an array
 
// Watch the category to filter the projects based on the selected categories
watch([category, search], () => {
  // Filter projects based on selected categories and the free-text search
  filteredProjects.value = projects.value.filter(project => {
    // Filter by category
    const matchesCategory = category.value.length === 0 || category.value.includes(project.description);
    
    // Filter by search text (case-insensitive)
    const matchesSearch = project.description.toLowerCase().includes(search.value.toLowerCase()) ||
                          project.name.toLowerCase().includes(search.value.toLowerCase());
    
    // Both conditions must be true
    return matchesCategory && matchesSearch;
  });

  processProjectData( filteredProjects.value)

  // Reset pagination to the first page whenever the filter changes
  currentPage.value = 1;

});

// Computed property for filtered data based on selected categories and search text
const filteredProjects = ref(projects.value); // Initially set to all projects

// Computed property for paginated data based on filtered results
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredProjects.value.slice(start, end);
});

// Watch the filtered data to update totalItems and reset the pagination
watch(filteredProjects, (newValue) => {
  totalItems.value = newValue.length; // Update total based on filtered data
  if (search.value) {
    currentPage.value = 1; // Reset to the first page if filtering
  }
});




const router = useRouter()


 
 
 

 
 
function formatDateAgo(dateString) {
  const date = new Date(dateString);

 
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000); // Difference in seconds

  if (seconds < 0) {
    return 'Just now'; // Handle future dates
  }

  const intervals = {
    year: Math.floor(seconds / 31536000), // Number of seconds in a year
    month: Math.floor(seconds / 2592000), // Number of seconds in a month (approx)
    day: Math.floor(seconds / 86400), // Number of seconds in a day
    hour: Math.floor(seconds / 3600), // Number of seconds in an hour
    minute: Math.floor(seconds / 60), // Number of seconds in a minute
  };

  if (intervals.year > 1) {
    return `${intervals.year} years ago`;
  } else if (intervals.year === 1) {
    return '1 year ago';
  } else if (intervals.month > 1) {
    return `${intervals.month} months ago`;
  } else if (intervals.month === 1) {
    return '1 month ago';
  } else if (intervals.day > 1) {
    return `${intervals.day} days ago`;
  } else if (intervals.day === 1) {
    return '1 day ago';
  } else if (intervals.hour > 1) {
    return `${intervals.hour} hours ago`;
  } else if (intervals.hour === 1) {
    return '1 hour ago';
  } else if (intervals.minute > 1) {
    return `${intervals.minute} minutes ago`;
  } else if (intervals.minute === 1) {
    return '1 minute ago';
  } else {
    return 'Just now';
  }
}

const { push } = useRouter()

const handleRowDblClick = (row) => {

 console.log(row)

push({
  name: 'SurveyDetails',
  params: { projectId: row.projectId,  form_name: row.name,   xmlFormId: row.xmlFormId } 

})

}


  // Define the formData object with necessary fields


 
const loadingStates = ref({});
 
// Function to handle download
const handleDownload = async (row) => {
  try {
    // Send the row ID to the endpoint
 

    console.log(row)


    const formData = {
      project:   row.projectId,
      form: row.xmlFormId,
      token: localStorage.getItem('collectorToken')
    };

  //downloading.value=true

   loadingStates.value[row.xmlFormId] = true;
    // Await the response from getSubmissions
    const response = await getCSVSubmissions(formData);
   loadingStates.value[row.xmlFormId] = false;
    console.log(response)

    // Extract CSV string from response.data.data
    const csvData = response.data;
    if (!csvData) {
          loadingStates.value[row.xmlFormId] = false;
      throw new Error('No CSV data received');
    }

    // Create a Blob from the CSV string
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });

    // Create a URL for the Blob
    const fileUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = fileUrl;

    // Set the filename (use Content-Disposition if provided, else default)
    const fileName = response.headers['content-disposition']
      ? response.headers['content-disposition'].split('filename=')[1]?.replace(/"/g, '')
      : `submissions_${row.xmlFormId}_${Date.now()}.csv`;
    link.setAttribute('download', fileName);

    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(fileUrl);


    

    ElMessage.success('Download started');
  } catch (error) {
 
      loadingStates.value[row.xmlFormId] = false;
    console.error('Download error:', error);
    ElMessage.error('Failed to download file');
  }
};
 
 const handleDownloadGeo = async (row) => {
  try {
    // Initialize loading state for this row
       loadingStates.value[row.xmlFormId] = true;


       console.log('loadingStates',row)

    // Prepare form data
    const formData = {
      project: row.projectId,
      form: row.xmlFormId,
      token: localStorage.getItem('collectorToken'),
    };

    console.log('Requesting GeoJSON for:', formData);

    // Await the response from getGeoSubmissions
    const response = await getGeoSubmissions(formData);
      loadingStates.value[row.xmlFormId] = false;
    // Extract GeoJSON data (FeatureCollection)
    const geojsonData = response.data;
    if (!geojsonData || geojsonData.type !== 'FeatureCollection') {
      throw new Error('Invalid GeoJSON data received');
    }

    // Stringify the GeoJSON object
    const data = JSON.stringify(geojsonData);

    // Create a Blob from the GeoJSON string
    const blob = new Blob([data], { type: 'application/geo+json' });

    // Create a URL for the Blob
    const fileUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = fileUrl;

    // Set the filename
    const fileName = response.headers['content-disposition']
      ? response.headers['content-disposition'].split('filename=')[1]?.replace(/"/g, '')
      : `submissions_${row.xmlFormId}_${Date.now()}.geojson`;
    link.setAttribute('download', fileName);

    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(fileUrl);

    ElMessage.success('GeoJSON download started');
  } catch (error) {
    console.error('GeoJSON download error:', error);
    ElMessage.error('Failed to download GeoJSON file');
  } finally {
    // Clear loading state
       loadingStates.value[row.xmlFormId] = false;
  }
};

const handleDownloadEnumerators = () => {
  try {
    // Create CSV content
    const headers = ['Name', 'Project Name'];
    const csvContent = [
      headers.join(','),
      ...summary.value.enumerators.map(enumerator => 
        `"${enumerator.displayName || 'N/A'}","${enumerator.projectName || 'N/A'}"`
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `enumerators_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    ElMessage.success('Enumerator data downloaded successfully');
  } catch (error) {
    console.error('Error downloading enumerator data:', error);
    ElMessage.error('Failed to download enumerator data');
  }
};

</script>

<template>
  <el-card v-loading="loading">


    <el-card style="margin-bottom: 5px;"> 

    <el-row :gutter="20">
        <el-col :span="5" :lg="5" :md="12" :sm="24" :xs="24" shadow="hover">
          <el-card   shadow="hover">
            <el-statistic title="Number of Data Collection Projects" :value="summary.totalProjects" />
          </el-card>
      </el-col>
      <el-col :span="5" :lg="5" :md="12" :sm="24" :xs="24" shadow="hover">

        <el-card   shadow="hover">
          <el-statistic title="Number of Data Collection Forms" :value="summary.totalForms" />
        </el-card>

      </el-col>
      <el-col :span="5" :lg="5" :md="12" :sm="24" :xs="24">
 

        <el-card  shadow="hover" >
          <el-statistic title="Total Submissions" :value="summary.totalSubmissions" />
        </el-card>

      </el-col>

      <el-col :span="5" :lg="5" :md="12" :sm="24" :xs="24" >
            
        <el-card  shadow="hover">
          <el-statistic title="Latest Submission" :value="formatDateAgo(summary.mostRecentSubmission)" />
        </el-card>

      </el-col>

      <el-col :span="4" :lg="4" :md="12" :sm="24" :xs="24" >
            
        <el-card  shadow="hover">
          <el-statistic title="Total Enumerators" :value="summary.totalEnumerators">
            <template #title>
              <span>Total Enumerators</span>
              <PermissionWrapper :permissions="'survey:export'">
                <el-button 
                  type="success" 
                  size="small" 
                  plain
                  @click="handleDownloadEnumerators"
                  style="margin-left: 8px;"
                >
                  <el-icon><Download /></el-icon>
                </el-button>
              </PermissionWrapper>
            </template>
          </el-statistic>
        </el-card>

      </el-col>
    </el-row>
    </el-card>



    <el-row type="flex" justify="start" gutter="10"       style="display: flex; flex-wrap: nowrap; align-items: center; margin-bottom:10px">

    

      <el-col :span="8" :lg="8" :md="12" :sm="24" :xs="24" >

      <el-select
multiple v-model="category" placeholder="Filter By Category" style=" margin-right: 5px;  width:95%" clearable
        filterable>
        <el-option v-for="item in projectOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      
    </el-col>

    <el-col :span="8" :lg="8" :md="12" :sm="24" :xs="24" >

      <el-input
clearable v-model="search" placeholder="Search by project name"
        :onInput="filterTableData" style=" margin-right: 15px;" />

      </el-col>
 

      <el-col :span="6" :lg="6" :md="12" :sm="24" :xs="24" >


      <DownloadCustom :data="paginatedData" :all="projects" />

    </el-col>
    </el-row>





    <div>

     <el-table :data="paginatedData"  border  style="width: 100%" v-if="paginatedData.length > 0"  >
      <el-table-column type="index" width="50" />

      <el-table-column type="expand">
            <template #default="props">
                <div class="nested-table-container" style="padding: 16px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;">
                <el-table
                    :data="props.row.formList"
                    border
                    stripe
                    style="width: 100%;"
                    row-class-name="clickable-row"
                    @row-dblclick="handleRowDblClick"
                >
                    <el-table-column label="Name" prop="name" />
                    <el-table-column label="Status" prop="state" />
                    <el-table-column label="Submissions" prop="submissions" />
                    <el-table-column label="Last Submission" prop="lastSubmission" />

                    
                    <el-table-column label="Download" width="250" >
                      <!-- Scoped slot for the download button -->
                      <template #default="scope">
                        <PermissionWrapper :permissions="'survey:export'">
                          <el-button
                            type="primary"
                            size="small"
                            @click="handleDownload(scope.row)"
                             v-loading="loadingStates[scope.row.xmlFormId]"
                          >
                            CSV
                          </el-button>
                        </PermissionWrapper>

                        <PermissionWrapper :permissions="'survey:export'">
                          <el-button
                          type="success"
                          size="small"
                          @click="handleDownloadGeo(scope.row )"
                          v-loading="loadingStates[scope.row.xmlFormId]"
                          style="margin-left: 8px;"
                        >
                          GeoJSON
                        </el-button>
                        </PermissionWrapper>


                      </template>
                    </el-table-column>


                </el-table>
                </div>
            </template>
            </el-table-column>

    <el-table-column label="Category" prop="description"  sortable/>
    <el-table-column label="Name" prop="name" sortable />
    <el-table-column   label="#Forms"   sortable>
        <!-- Use a scoped slot to customize the rendering of the date column -->
        <template #default="scope">
          <span>{{ (scope.row.formList.length) }}</span>
        </template>
      </el-table-column>
    <el-table-column prop="lastSubmission" label="Latest Submission" sortable>
        <!-- Use a scoped slot to customize the rendering of the date column -->
        <template #default="scope">
          <span>{{ formatDateAgo(scope.row.lastSubmission) }}</span>
        </template>
      </el-table-column>




  </el-table>

  <!-- Show message when no data -->
  <div v-else class="no-data-message">
    <el-empty description="No survey data available" />
  </div>

  <div style="margin-top: 20px;" v-if="paginatedData.length > 0">
 
 <el-pagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
   v-model:page-size="pageSize" :page-sizes="[5, 10, 15, 20, 50, 100]" :total="totalItems" :background="true"
   @size-change="handlePageSizeChange" @current-change="handlePageChange" class="mt-4" />

</div>
 
    </div>
 


  </el-card>

  <el-dialog v-model="dialogVisible" :title="dialog_title" width="450">
    <el-select v-model="role" placeholder="Select Role" size="small" style="width: 95%">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
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


  <el-dialog v-model="showAddDialog" title="Add GRC Member" width="450">
    <el-select v-model="role" placeholder="Select Role" size="small" style="width: 95%">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
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

  <el-dialog v-model="showEnumeratorsDialog" title="Enumerator List" width="600">
    <el-table :data="summary.enumerators" border style="width: 100%">
      <el-table-column label="Name" prop="displayName" />
      <el-table-column label="Project Name" prop="projectName" />
    </el-table>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showEnumeratorsDialog = false">Close</el-button>
        <el-button type="success" @click="handleDownloadEnumerators">
          Download CSV
        </el-button>
      </div>
    </template>
  </el-dialog>

</template>
<style>
/* Add hover effect and cursor pointer for rows */
.clickable-row {
  cursor: pointer;
  color: #409eff; /* Link-like color */
  transition: background-color 0.2s;
}
.clickable-row:hover {
  background-color: #f5f7fa;
}
</style>



<style scoped>
:global(h2#card-usage ~ .example .example-showcase) {
  background-color: var(--el-fill-color) !important;
}

.el-statistic {
  --el-statistic-content-font-size: 28px;
}

.statistic-card {
  height: 100%;
  padding: 20px;
  border-radius: 4px;
  background-color: var(--el-bg-color-overlay);
}

.statistic-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-top: 16px;
}

.statistic-footer .footer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.statistic-footer .footer-item span:last-child {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
}

.green {
  color: var(--el-color-success);
}
.red {
  color: var(--el-color-error);
}

.no-data-message {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  margin: 20px 0;
}
</style>
