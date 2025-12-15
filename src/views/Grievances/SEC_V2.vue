<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">


 
import { Plus, Back, Download, Edit} from '@element-plus/icons-vue'

import { ref,computed,reactive } from 'vue'
import {
  ElPagination, ElInput,ElSelect,ElOption,ElTable,ElTableColumn, ElTabPane,ElTabs,ElOptionGroup, ElForm,ElFormItem,
  ElRow, ElTableV2, ElCard, ElDialog,ElIcon,ElButton,ElMessage} from 'element-plus'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import {
    loginCollector,deleteSubmissions,getSubmissionAttachments,downloadSubmissionAttachments,
    getSubmissions, getSubmissionXml, updateSubmissionXml} from '@/api/collector'

import { watch,onMounted } from 'vue';
 import writeXlsxFile from 'write-excel-file';


import { useRouter } from 'vue-router'
 
const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const showEditButtons =  ref(appStore.getEditButtons)


 
const mobileBreakpoint = 768;
const defaultPageSize = 10;
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
 
const secFormId = computed(() => forms.value.find((f:any) => f.xmlFormId === 'sec_officials')?.enketoId || '')
const grcFormId = computed(() => forms.value.find((f:any) => f.xmlFormId === 'grc_officials')?.enketoId || '')
const secXmlId = computed(() => forms.value.find((f:any) => f.xmlFormId === 'sec_officials')?.xmlFormId || 'sec_officials')
const grcXmlId = computed(() => forms.value.find((f:any) => f.xmlFormId === 'grc_officials')?.xmlFormId || 'grc_officials')

const normalizeInstanceId = (id: string) => (id && id.startsWith('uuid:') ? id : `uuid:${id}`)
const buildReturnUrl = (xmlId: string, instanceId: string) =>
  `https://collector.kesmis.go.ke/#/projects/1/forms/${encodeURIComponent(xmlId)}/submissions/${encodeURIComponent(instanceId)}`

const editDialogVisible = ref(false)
const editLoading = ref(false)
const saveLoading = ref(false)
// overall submission id (logical id)
const editOverallId = ref('')
// current version instanceId we are deprecating
const editCurrentVersionId = ref('')
// key to locate the specific official within the XML (national_id)
const editOfficialId = ref('')
const editXml = ref('')
const editForm = reactive({
  name: '',
  national_id: '',
  gender: '',
  mobile: '',
  category: '',
  sec_position: '',
  returning_officer: '',
  county_kisip_coordinator: '',
  npct_representative: ''
})

// Inline edit state for GRC officials
const grcEditDialogVisible = ref(false)
const grcEditLoading = ref(false)
const grcSaveLoading = ref(false)
const grcEditOverallId = ref('')
const grcEditCurrentVersionId = ref('')
const grcEditOfficialId = ref('')
const grcEditXml = ref('')
const grcEditForm = reactive({
  name: '',
  national_id: '',
  gender: '',
  mobile: '',
  category: '',
  grc_position: '',
  returning_officer: '',
  county_kisip_coordinator: '',
  npct_representative: ''
})

const inlineCategoryOptions = [
  { value: 'structure_owner', label: 'Structure Owner' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'youth', label: 'Youth' },
  { value: 'plwd', label: 'PLWD' },
  { value: 'ngo', label: 'NGO' },
  { value: 'faith_based', label: 'Faith-Based' },
  { value: 'widow', label: 'Widow' },
  { value: 'minority_marginalized', label: 'Minority Marginalized' },
  { value: 'chief', label: 'Chief' },
  { value: 'Asst. chief', label: 'Assistant Chief' },
  { value: 'Member of the County assembly', label: 'Member of the County Assembly' },
  { value: 'ward_admin', label: 'Ward Admin' }
]

const inlineSecPositionOptions = [
  { value: 'chairperson', label: 'Chairperson' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'organizing_secretary', label: 'Organizing Secretary' },
  { value: 'vice_chairperson', label: 'Vice Chairperson' },
  { value: 'member', label: 'Member' }
]
 
 

 
const loginUserToCollector = async () => { 
    var formData = {}
    formData.email = "kisip.mis@gmail.com"
    formData.password = "***REDACTED***"

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
                
              if(form.xmlFormId=="sec_officials" || form.xmlFormId=="grc_officials")
              forms.value.push(form)


            })

        })


          getSecData()
          getGRCData()
         
    })

console.log( 'forms.value', forms.value)

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

  // Clear the county and settlement options arrays
  countyOptions.value = [];
  settlementOptions.value = [];

  // Loop through the array of data
  dataArray.forEach(data => {
    if (!data) return; // Skip if no data exists

    // Extract county and settlement
    const county = data.group_location?.county || "N/A";
    const settlement = data.settlement_name  || "N/A";
    const settlement_code = data.group_location.pcode  || "N/A";
    const coordinator = data.grp_certification?.county_kisip_coordinator  || "N/A";
    const npct_representative = data.grp_certification?.npct_representative  || "N/A";
    const date = data.date  || "N/A";
    const key = data.meta_instanceID  || "N/A";
    const instanceID = data.meta_instanceID  || "N/A";
    const overallInstanceId = data.overallInstanceId || instanceID;
    
    // Ensure sec_officials array exists and is valid
    if (data.sec_officials && Array.isArray(data.sec_officials)) {
      // Check if the record for this county and settlement already exists
      if (!recordsMap.has(key)) {
        // If it doesn't exist, create a new entry in the map
        recordsMap.set(key, {
          county,
          settlement,
          settlement_code,
          coordinator,
          npct_representative,
          date, 
          instanceID,
          overallInstanceId,
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
          date: data.date || "N/A",
          instanceID: instanceID,
          overallInstanceId
        };

        // Add the official to the sec_officials array of the respective county and settlement
        recordsMap.get(key).sec_officials.push(newOfficial);
      });
    }
  });

  // Convert the map back to an array and assign it to sec_officials.value
  sec_officials.value = Array.from(recordsMap.values());

  console.log('sec_officials.value', sec_officials.value);

  // Extract unique counties and settlements for options
  const countyMap = new Map(); // Store counties with nested settlements

  recordsMap.forEach(record => {
    const { county, settlement } = record;

    // Add county if it doesn't already exist
    if (!countyMap.has(county)) {
      countyMap.set(county, new Set()); // Use a Set to ensure unique settlements
    }

    // Add the settlement to the respective county's settlement set
    countyMap.get(county).add(settlement);
  });

  // Convert the countyMap to countyOptions and settlementOptions
  countyOptions.value = Array.from(countyMap.keys()).map(county => ({
    label: county,
    value: county
  }));

  settlementOptions.value = Array.from(countyMap.entries()).flatMap(([county, settlements]) => 
    Array.from(settlements).map(settlement => ({
      label: settlement, // Combine county name with settlement
      value: settlement,
      county: county // Add the county field for easier filtering if needed
    }))
  );

  console.log(countyOptions.value);
  console.log(settlementOptions.value);
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
    const settlement = data.settlement_name  || "N/A";
    const settlement_code = data.group_location.pcode  || "N/A";

    const coordinator = data.grp_certification?.county_kisip_coordinator  || "N/A";
    const npct_representative = data.grp_certification?.npct_representative  || "N/A";
    const date = data.date  || "N/A";
    const key = data.meta_instanceID  || "N/A";
    const instance_id = data.meta_instanceID  || "N/A";
    const overallInstanceId = data.grc_overallInstanceId || data.overallInstanceId || instance_id;
    
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
          settlement_code,
          coordinator,
          npct_representative,
          date, 
          instance_id,
          overallInstanceId,
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
          date: data.date || "N/A",
          instance_id: data.meta_instanceID,
          overallInstanceId
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
    const { date, county, settlement,settlement_code } = secRecord;

    // Find matching grc_official record by date, county, and settlement
    const matchingGrcRecord = grc_officials.find(grcRecord => 
      grcRecord.settlement_code == settlement_code 
      // &&
      // grcRecord.county === county &&
      // grcRecord.settlement === settlement
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

    console.log('mergeOfficials.....')
    await mergeOfficials(sec_officials.value, grc_officials.value)

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
const xfilteredData = computed(() => { 
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

    
const filteredData = computed(() => {
  const searchTerm = search.value.toLowerCase();
  const selectedCounty = county_value.value;
  const selectedSettlement = sett_value.value;

  return sec_officials.value.map((data) => {
    // Check SEC and GRC arrays for matches
    const secArray = data.sec_officials || [];
    const grcArray = data.grc_officials || [];

    // County and settlement match logic for main data
    const countyMatch = selectedCounty ? data.county === selectedCounty : true;
    const settlementMatch = selectedSettlement ? data.settlement === selectedSettlement : true;

    // Function to filter the SEC or GRC array based on the search term
    const filterArray = (arr) => arr.filter((item) => {
      const nameMatch = item.name?.toLowerCase().includes(searchTerm);
      const settlementTermMatch = item.settlement?.toLowerCase().includes(searchTerm);
      const telephoneMatch = item.mobile?.toLowerCase().includes(searchTerm);
      const idMatch = item.national_id?.toLowerCase().includes(searchTerm);
      const NPCTMatch = item.npct_representative?.toLowerCase().includes(searchTerm);
      const GRCMatch = item.grc_position?.toLowerCase().includes(searchTerm);
      const SecMatch = item.sec_position?.toLowerCase().includes(searchTerm);
      const CategoryMatch = item.category?.toLowerCase().includes(searchTerm);
      
      // Return true if any field matches the search term
      return nameMatch || settlementTermMatch || telephoneMatch || idMatch || NPCTMatch || SecMatch ||GRCMatch ||CategoryMatch;
    });

    // Apply the filter to SEC and GRC arrays
    const filteredSec = filterArray(secArray);
    const filteredGrc = filterArray(grcArray);

    // Search term filtering logic
    if (searchTerm) {
      // Return the main data if county/settlement matches and either SEC or GRC officials match
      if (countyMatch && settlementMatch && (filteredSec.length || filteredGrc.length)) {
        return {
          ...data,
          sec_officials: filteredSec, // Update the SEC officials array with the filtered result
          grc_officials: filteredGrc, // Update the GRC officials array with the filtered result
        };
      }
    } else {
      // Return the data if county/settlement matches (no search term filtering needed)
      if (countyMatch && settlementMatch) {
        return {
          ...data,
          sec_officials: secArray, // Keep the original SEC officials array
          grc_officials: grcArray, // Keep the original GRC officials array
        };
      }
    }

    return null; // Return null if no match
  }).filter(data => data !== null); // Filter out any null results
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

 
const select_form=ref()
const action=ref()
const showAddDialog=ref(false)
const AddRecord = async () => {  
  action.value='add'
   showAddDialog.value=true
}

const openAddSec = () => {
  if (!secFormId.value) {
    ElMessage.error('SEC form link not available yet. Try reloading data.')
    return
  }
  const url = `https://collector.kesmis.go.ke/-/${encodeURIComponent(secFormId.value)}`
  window.open(url, '_blank')
}

const openAddGrc = () => {
  if (!grcFormId.value) {
    ElMessage.error('GRC form link not available yet. Try reloading data.')
    return
  }
  const url = `https://collector.kesmis.go.ke/-/${encodeURIComponent(grcFormId.value)}`
  window.open(url, '_blank')
}

const openEditSec = (overallId: string, currentId: string, nationalId?: string) => {
  if (!secFormId.value || !overallId) {
    ElMessage.error('Cannot open SEC edit form: missing form link or instance id.')
    return
  }
  startInlineSecEdit(overallId, currentId, nationalId)
}

const openEditGrc = (overallId: string, currentId: string, nationalId?: string) => {
  if (!grcFormId.value || !overallId) {
    ElMessage.error('Cannot open GRC edit form: missing form link or instance id.')
    return
  }
  startInlineGrcEdit(overallId, currentId, nationalId)
}

const startInlineGrcEdit = async (overallId: string, currentId: string, officialId?: string) => {
  grcEditOverallId.value = normalizeInstanceId(overallId)
  grcEditCurrentVersionId.value = normalizeInstanceId(currentId)
  grcEditOfficialId.value = officialId || ''
  grcEditDialogVisible.value = true
  grcEditLoading.value = true
  try {
    const xml = await fetchSubmissionXml(grcEditOverallId.value, grcXmlId.value)
    grcEditXml.value = xml
    const parsed = parseGrcXml(xml, grcEditOfficialId.value)
    if (!parsed) {
      ElMessage.error('Could not find this GRC official in the submission XML.')
      grcEditDialogVisible.value = false
      return
    }
    Object.assign(grcEditForm, parsed)
  } catch (e) {
    console.error('Fetch GRC submission XML failed', e)
    ElMessage.error('Failed to load GRC submission for edit.')
    grcEditDialogVisible.value = false
  } finally {
    grcEditLoading.value = false
  }
}

const startInlineSecEdit = async (overallId: string, currentId: string, officialId?: string) => {
  // overall submission id for path
  editOverallId.value = normalizeInstanceId(overallId)
  // current version id we are replacing
  editCurrentVersionId.value = normalizeInstanceId(currentId)
  editOfficialId.value = officialId || ''
  editDialogVisible.value = true
  editLoading.value = true
  try {
    const xml = await fetchSubmissionXml(editOverallId.value, secXmlId.value)
    editXml.value = xml
    const parsed = parseSecXml(xml, editOfficialId.value)
    if (!parsed) {
      ElMessage.error('Could not find this official in the submission XML.')
      editDialogVisible.value = false
      return
    }
    Object.assign(editForm, parsed)
  } catch (e) {
    console.error('Fetch SEC submission XML failed', e)
    ElMessage.error('Failed to load submission for edit.')
    editDialogVisible.value = false
  } finally {
    editLoading.value = false
  }
}

const fetchSubmissionXml = async (instanceId: string, xmlId: string) => {
  const res = await getSubmissionXml({
    project: '1',
    form: xmlId,
    token: localStorage.getItem('collectorToken'),
    submissionID: instanceId
  })
  if (!res || !res.data || !res.data.xml) {
    throw new Error('Backend did not return XML')
  }
  return res.data.xml as string
}

const parseSecXml = (xmlStr: string, nationalId: string) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlStr, 'text/xml')
  const officials = Array.from(doc.getElementsByTagName('sec_officials'))
  const target = officials.find((el) => {
    const id = el.getElementsByTagName('national_id')?.[0]?.textContent || ''
    return nationalId ? id === nationalId : !!id
  }) || officials[0]
  if (!target) return null
  const get = (tag) => target.getElementsByTagName(tag)?.[0]?.textContent || ''
  const root = doc.documentElement
  const grpCert =
    (Array.from(root.getElementsByTagName('*')) as Element[]).find(
      (el) => el.localName === 'grp_certification'
    ) || null
  const getCert = (tag: string) =>
    grpCert
      ? ((grpCert.getElementsByTagName(tag)?.[0]?.textContent as string) || '')
      : ''
  return {
    category: get('category'),
    name: get('name'),
    national_id: get('national_id'),
    gender: get('gender'),
    mobile: get('mobile'),
    sec_position: get('sec_position'),
    returning_officer: getCert('returning_officer'),
    county_kisip_coordinator: getCert('county_kisip_coordinator'),
    npct_representative: getCert('npct_representative')
  }
}

const parseGrcXml = (xmlStr: string, nationalId: string) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlStr, 'text/xml')
  const officials = Array.from(doc.getElementsByTagName('grc_officials'))
  const target = officials.find((el) => {
    const id = el.getElementsByTagName('national_id')?.[0]?.textContent || ''
    return nationalId ? id === nationalId : !!id
  }) || officials[0]
  if (!target) return null
  const get = (tag: string) => target.getElementsByTagName(tag)?.[0]?.textContent || ''
  const root = doc.documentElement
  const grpCert =
    (Array.from(root.getElementsByTagName('*')) as Element[]).find(
      (el) => el.localName === 'grp_certification'
    ) || null
  const getCert = (tag: string) =>
    grpCert
      ? ((grpCert.getElementsByTagName(tag)?.[0]?.textContent as string) || '')
      : ''
  return {
    category: get('category'),
    name: get('name'),
    national_id: get('national_id'),
    gender: get('gender'),
    mobile: get('mobile'),
    grc_position: get('grc_position'),
    returning_officer: getCert('returning_officer'),
    county_kisip_coordinator: getCert('county_kisip_coordinator'),
    npct_representative: getCert('npct_representative')
  }
}

const saveInlineSecEdit = async () => {
  if (!editXml.value || !editOverallId.value) {
    ElMessage.error('Nothing to save.')
    return
  }
  saveLoading.value = true
  try {
    const updatedXml = buildUpdatedSecXml(editXml.value, editCurrentVersionId.value, editForm, editOfficialId.value)
    await updateSubmissionXml({
      project: '1',
      form: secXmlId.value,
      token: localStorage.getItem('collectorToken'),
      submissionID: editOverallId.value,
      xml: updatedXml
    })
    ElMessage.success('Submission updated')
    editDialogVisible.value = false
    await getSecData()
    await getGRCData()
  } catch (e:any) {
    console.error('Save SEC edit failed', e)
    ElMessage.error(e?.message || 'Failed to save')
  } finally {
    saveLoading.value = false
  }
}

const buildUpdatedSecXml = (xmlStr: string, instanceId: string, formData: any, nationalId: string) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlStr, 'text/xml')
  const officials = Array.from(doc.getElementsByTagName('sec_officials'))
  const target = officials.find((el) => {
    const id = el.getElementsByTagName('national_id')?.[0]?.textContent || ''
    return nationalId ? id === nationalId : !!id
  }) || officials[0]
  if (!target) throw new Error('Official not found in XML')
  const set = (tag, val) => {
    let node = target.getElementsByTagName(tag)?.[0]
    if (!node) {
      node = doc.createElement(tag)
      target.appendChild(node)
    }
    node.textContent = val || ''
  }
  set('category', formData.category)
  set('name', formData.name)
  set('national_id', formData.national_id)
  set('gender', formData.gender)
  set('mobile', formData.mobile)
  set('sec_position', formData.sec_position)

  // update grp_certification at root level
  const root = doc.documentElement
  let grpCert =
    (Array.from(root.getElementsByTagName('*')) as Element[]).find(
      (el) => el.localName === 'grp_certification'
    ) || null
  if (!grpCert) {
    grpCert = doc.createElement('grp_certification')
    root.appendChild(grpCert)
  }
  const setCert = (tag: string, val: string) => {
    let node = grpCert!.getElementsByTagName(tag)?.[0]
    if (!node) {
      node = doc.createElement(tag)
      grpCert!.appendChild(node)
    }
    node.textContent = val || ''
  }
  setCert('returning_officer', formData.returning_officer)
  setCert('county_kisip_coordinator', formData.county_kisip_coordinator)
  setCert('npct_representative', formData.npct_representative)

  // add/update deprecatedID in meta and rotate instanceID
  // handle possible orx:meta/orx:instanceID namespacing by localName
  let meta: Element | null =
    (Array.from(root.getElementsByTagName('*')) as Element[]).find(
      (el) => el.localName === 'meta'
    ) || null
  if (!meta) {
    meta = doc.createElement('meta')
    root.appendChild(meta)
  }
  const instanceNode: Element | undefined =
    (Array.from(meta.getElementsByTagName('*')) as Element[]).find(
      (el) => el.localName === 'instanceID'
    ) || undefined
  const currentInstanceId = (instanceNode && instanceNode.textContent) || instanceId

  let deprecated: Element | undefined =
    (Array.from(meta.getElementsByTagName('*')) as Element[]).find(
      (el) => el.localName === 'deprecatedID'
    ) || undefined
  if (!deprecated) {
    deprecated = doc.createElement('deprecatedID')
    meta.appendChild(deprecated)
  }
  deprecated.textContent = currentInstanceId

  // assign a new instanceID for this version to avoid 409 conflicts
  const newIdCore = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
  const newInstanceId = `uuid:${newIdCore}`
  if (instanceNode) {
    instanceNode.textContent = newInstanceId
  } else {
    const newNode = doc.createElement('instanceID')
    newNode.textContent = newInstanceId
    meta.appendChild(newNode)
  }

  return new XMLSerializer().serializeToString(doc)
}

const saveInlineGrcEdit = async () => {
  if (!grcEditXml.value || !grcEditOverallId.value) {
    ElMessage.error('Nothing to save.')
    return
  }
  grcSaveLoading.value = true
  try {
    const updatedXml = buildUpdatedGrcXml(
      grcEditXml.value,
      grcEditCurrentVersionId.value,
      grcEditForm,
      grcEditOfficialId.value
    )
    await updateSubmissionXml({
      project: '1',
      form: grcXmlId.value,
      token: localStorage.getItem('collectorToken'),
      submissionID: grcEditOverallId.value,
      xml: updatedXml
    })
    ElMessage.success('GRC submission updated')
    grcEditDialogVisible.value = false
    await getSecData()
    await getGRCData()
  } catch (e: any) {
    console.error('Save GRC edit failed', e)
    ElMessage.error(e?.message || 'Failed to save')
  } finally {
    grcSaveLoading.value = false
  }
}

const buildUpdatedGrcXml = (xmlStr: string, instanceId: string, formData: any, nationalId: string) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlStr, 'text/xml')
  const officials = Array.from(doc.getElementsByTagName('grc_officials'))
  const target = officials.find((el) => {
    const id = el.getElementsByTagName('national_id')?.[0]?.textContent || ''
    return nationalId ? id === nationalId : !!id
  }) || officials[0]
  if (!target) throw new Error('GRC official not found in XML')
  const set = (tag: string, val: string) => {
    let node = target.getElementsByTagName(tag)?.[0]
    if (!node) {
      node = doc.createElement(tag)
      target.appendChild(node)
    }
    node.textContent = val || ''
  }
  set('category', formData.category)
  set('name', formData.name)
  set('national_id', formData.national_id)
  set('gender', formData.gender)
  set('mobile', formData.mobile)
  set('grc_position', formData.grc_position)

  // update grp_certification at root level
  const root = doc.documentElement
  let grpCert =
    (Array.from(root.getElementsByTagName('*')) as Element[]).find(
      (el) => el.localName === 'grp_certification'
    ) || null
  if (!grpCert) {
    grpCert = doc.createElement('grp_certification')
    root.appendChild(grpCert)
  }
  const setCert = (tag: string, val: string) => {
    let node = grpCert!.getElementsByTagName(tag)?.[0]
    if (!node) {
      node = doc.createElement(tag)
      grpCert!.appendChild(node)
    }
    node.textContent = val || ''
  }
  setCert('returning_officer', formData.returning_officer)
  setCert('county_kisip_coordinator', formData.county_kisip_coordinator)
  setCert('npct_representative', formData.npct_representative)

  // add/update deprecatedID in meta and rotate instanceID
  let meta: Element | null =
    (Array.from(root.getElementsByTagName('*')) as Element[]).find(
      (el) => el.localName === 'meta'
    ) || null
  if (!meta) {
    meta = doc.createElement('meta')
    root.appendChild(meta)
  }
  const instanceNode: Element | undefined =
    (Array.from(meta.getElementsByTagName('*')) as Element[]).find(
      (el) => el.localName === 'instanceID'
    ) || undefined
  const currentInstanceId = (instanceNode && instanceNode.textContent) || instanceId

  let deprecated: Element | undefined =
    (Array.from(meta.getElementsByTagName('*')) as Element[]).find(
      (el) => el.localName === 'deprecatedID'
    ) || undefined
  if (!deprecated) {
    deprecated = doc.createElement('deprecatedID')
    meta.appendChild(deprecated)
  }
  deprecated.textContent = currentInstanceId

  const newIdCore = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
  const newInstanceId = `uuid:${newIdCore}`
  if (instanceNode) {
    instanceNode.textContent = newInstanceId
  } else {
    const newNode = doc.createElement('instanceID')
    newNode.textContent = newInstanceId
    meta.appendChild(newNode)
  }

  return new XMLSerializer().serializeToString(doc)
}



 
const row=ref()

const getFieldChangeHandler = async () => {  
 
  if (action.value=='add') {
    const formValue = select_form.value; // Get the selected value
    const url = `https://collector.kesmis.go.ke/-/${encodeURIComponent(formValue)}`; // Construct the URL

    // Open the constructed URL in a new tab
    window.open(url, '_blank');
   
  }else {

    console.log('Editing......')
    console.log(row.value)
    const formValue = select_form.value; // Get the selected value

    const url = `https://collector.kesmis.go.ke/-/edit/${encodeURIComponent(formValue)}?instance_id=${row.value.instanceID}&return_url=https%3A%2F%2Fcollector.kesmis.go.ke%2F%23%2Fprojects%2F1%2Fforms%2Fsec_officials%2Fsubmissions%2Fuuid%3A7800ad58-a9a9-40c6-9a8a-a10706e47fc3`; // Construct the URL
    console.log(url)


    //  https://collector.kesmis.go.ke/-/edit/1OsFcLEnpbbg5bP32nd9x2MDEOcYyP7?instance_id=uuid:7800ad58-a9a9-40c6-9a8a-a10706e47fc3
 


  }

  showAddDialog.value=false
    
}



const handleEdit = async (data) => {  
  row.value=data

 action.value='edit'
showAddDialog.value=true

}




const prepareSheetData = (officialsArray) => {
  const columns = [
    {
      value: 'County',
      fontWeight: 'bold',
      type: String
    },
    {
      value: 'Settlement',
      fontWeight: 'bold',
      type: String
    },
    {
      value: 'Category',
      fontWeight: 'bold',
      type: String
    },
    {
      value: 'Name',
      fontWeight: 'bold',
      type: String
    },
    {
      value: 'Gender',
      fontWeight: 'bold',
      type: String
    },
    {
      value: 'Position',
      fontWeight: 'bold',
      type: String
    },
    {
      value: 'National ID',
      fontWeight: 'bold',
      type: String
    },
    {
      value: 'Mobile',
      fontWeight: 'bold',
      type: String
    }
  ];

  let sec_officials = [];
  let grc_officials = [];

  // Check if the officialsArray is nested, and flatten if necessary
  officialsArray.forEach(officialGroup => {
    if (Array.isArray(officialGroup.sec_officials)) {
      // If it's a nested array, loop through each official inside
      officialGroup.sec_officials.forEach(official => {
        sec_officials.push([
          { type: String, value: officialGroup.county },
          { type: String, value: officialGroup.settlement },
          { type: String, value: official.category },
          { type: String, value: official.name },
          { type: String, value: official.gender },
          { type: String, value: official.sec_position },
          { type: String, value: official.national_id },
          { type: String, value: official.mobile }
        ]);
      });
    }

    if (Array.isArray(officialGroup.grc_officials)) {
      // If it's a nested array, loop through each official inside
      officialGroup.grc_officials.forEach(official => {
        grc_officials.push([
          { type: String, value: officialGroup.county },
          { type: String, value: officialGroup.settlement },
          { type: String, value: official.category },
          { type: String, value: official.name },
          { type: String, value: official.gender },
          { type: String, value: official.grc_position },
          { type: String, value: official.national_id },
          { type: String, value: official.mobile }
        ]);
      });
    }
  });

  // Return the columns and data rows for both SEC and GRC officials
  return [
    [columns, ...sec_officials], // SEC Officials
    [columns, ...grc_officials]  // GRC Officials
  ];
};
const calculateColumnWidths = (data, headers) => {
  // Initialize column widths based on header lengths
  const widths = headers.map((header, idx) => {
    let maxWidth = header.value.length;
    // Iterate over the data rows (skip first row which is headers)
    for (let i = 1; i < data.length; i++) {
      const cellValue = data[i][idx]?.value ?? '';
      const valueLength = cellValue.toString().length;
      maxWidth = Math.max(maxWidth, valueLength);
    }
    // Ensure widths are within a reasonable limit
    return Math.min(maxWidth + 2, 50);
  });
  return widths;
};

const DownloadXlsx = async () => {  
  try {
    // Make sure GRC officials are merged onto SEC records before export
    await mergeOfficials(sec_officials.value, grc_officials.value);

    // Use filteredData to export all filtered results, not just current page
    const secSheetData = prepareSheetData(filteredData.value);

    // Calculate column widths for both sheets
    const secHeaders = secSheetData[0][0];
    const grcHeaders = secSheetData[1][0];
    const sec_col_widths = calculateColumnWidths(secSheetData[0], secHeaders);
    const grc_col_widths = calculateColumnWidths(secSheetData[1], grcHeaders);

    console.log('col_width', sec_col_widths);

    await writeXlsxFile([secSheetData[0], secSheetData[1]], {
      columns: [
        sec_col_widths.map((width) => ({ width })), 
        grc_col_widths.map((width) => ({ width }))
      ],  
      sheets: ['SEC', 'GRC'],
      fileName: 'sec_grc.xlsx'
    });

    ElMessage.success('Excel file downloaded successfully');
  } catch (error) {
    console.error('Error downloading Excel:', error);
    ElMessage.error('Failed to download Excel file');
  }
}

const downloadSettlementXlsx = async (row) => {
  try {
    // Make sure GRC officials are merged onto SEC records before export
    await mergeOfficials(sec_officials.value, grc_officials.value);

    // Filter data to only include this specific settlement
    const settlementData = sec_officials.value.filter(item => 
      item.settlement === row.settlement && item.county === row.county
    );

    if (settlementData.length === 0) {
      ElMessage.warning('No data found for this settlement');
      return;
    }

    const secSheetData = prepareSheetData(settlementData);

    // Calculate column widths for both sheets
    const secHeaders = secSheetData[0][0];
    const grcHeaders = secSheetData[1][0];
    const sec_col_widths = calculateColumnWidths(secSheetData[0], secHeaders);
    const grc_col_widths = calculateColumnWidths(secSheetData[1], grcHeaders);

    // Create filename with settlement name (sanitize for filename)
    const settlementName = (row.settlement || 'settlement').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${settlementName}_sec_grc.xlsx`;

    await writeXlsxFile([secSheetData[0], secSheetData[1]], {
      columns: [
        sec_col_widths.map((width) => ({ width })), 
        grc_col_widths.map((width) => ({ width }))
      ],  
      sheets: ['SEC', 'GRC'],
      fileName: fileName
    });

    ElMessage.success(`Excel file for ${row.settlement} downloaded successfully`);
  } catch (error) {
    console.error('Error downloading Excel:', error);
    ElMessage.error('Failed to download Excel file');
  }
}

 // Computed property to filter settlement options based on selected county
 const filteredSettlementOptions = computed(() => {
      if (!county_value.value) {
        return settlementOptions.value; // Return all settlements if no county is selected
      }
      return settlementOptions.value.filter(
        (settlement) => settlement.county === county_value.value
      );
    });



const documents =ref([])
 async function handleExpand(row) {
  documents.value=[]
  console.log(row)
 
   // Define the formData object with necessary fields
   const secForm = {
    project: "1",
    form: "sec_officials",
    submissionID: row.sec_officials[0].instanceID,
    token: localStorage.getItem('collectorToken')
  };
 
    const response = await getSubmissionAttachments(secForm);


 // Ensure response.attachments is an array and append the fields
const finalResponse = {
  attachments: response.attachments.map(attachment => ({
    ...attachment, // Spread the original attachment data
    submissionID: secForm.submissionID, // Add submissionID
    category: 'SEC', // Add submissionID
    form:'sec_officials',
    project: secForm.project // Add project
  })),
};

console.log('finalResponse',finalResponse)

// Get GRC 
console.log('GRC',row.grc_officials)
const grcForm = {
    project: "1",
    form: "grc_officials",
    submissionID: row.grc_officials[0].instance_id,
    token: localStorage.getItem('collectorToken')
  };
 
    const grc = await getSubmissionAttachments(grcForm);


 // Ensure response.attachments is an array and append the fields
const grcResponse = {
  attachments: grc.attachments.map(attachment => ({
    ...attachment, // Spread the original attachment data
    submissionID: grcForm.submissionID, // Add submissionID
    category: 'GRC', // Add submissionID
    form:'grc_officials',
    project: grcForm.project // Add project
  })),
};

 


 // Merging arrays and removing duplicates based on 'submissionID'
const mergedArray = finalResponse.attachments.concat(grcResponse.attachments).filter((item, index, self) =>
  index === self.findIndex((t) => t.submissionID === item.submissionID)
);


documents.value=mergedArray

console.log('mergedDocumentstsArray',documents.value)

}

const viewLoading =ref(false)

const downloadFile = async (data) => {
  console.log(data);
  viewLoading.value = true;
  const formData = {};
  formData.attachmentName = data.name;
  formData.submissionID = data.submissionID;
  formData.project = data.project;
  formData.form = data.form;
  formData.token = localStorage.getItem('collectorToken')
  formData.responseType = 'blob';
 

  // Attach a 'beforeunload' event listener to the window
  window.addEventListener('beforeunload', () => {
    if (viewLoading.value) {
      console.log('Download has started.');
      viewLoading.value = false;
    }
  });

  try {
    const response = await downloadSubmissionAttachments(formData);
    console.log(response);

    // response.data should already be a Blob when responseType is 'blob'
    // Get file extension to determine MIME type
    const fileExtension = data.name.split('.').pop().toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'csv': 'text/csv'
    };
    const mimeType = mimeTypes[fileExtension] || 'application/octet-stream';

    // Create blob from response data (it should already be a Blob)
    let blob;
    if (response.data instanceof Blob) {
      blob = response.data;
    } else if (response.data instanceof ArrayBuffer) {
      blob = new Blob([response.data], { type: mimeType });
    } else {
      // Fallback: convert to blob
      blob = new Blob([response.data], { type: mimeType });
    }

    const url = URL.createObjectURL(blob);
    console.log(url);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', data.name);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    viewLoading.value = false;
  } catch (error) {
    console.error('Download error:', error);
    ElMessage.error('Failed to download file');
    viewLoading.value = false;
  }
};



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
    <el-select
    v-model="sett_value" 
    placeholder="Filter Settlement"
    clearable
     filterable
      style=" margin-right: 5px; width:350px">
      <el-option
        v-for="item in filteredSettlementOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select> 
      <el-input clearable  v-model="search" placeholder="Search by Name, ID ,Phone, Position, Category..." :onInput="filterTableData" style=" margin-right: 15px;" />
      <!-- <el-tooltip content="Add GRC" placement="top">   <el-button v-if="showEditButtons" :onClick="AddRecord" type="primary" :icon="Plus" style=" margin-right: 15px;"/> </el-tooltip> -->
      <el-button v-if="showEditButtons" @click="DownloadXlsx" type="primary" style=" margin-right: 15px;">
        <el-icon style="margin-right: 5px;"><Download /></el-icon>
        Download
      </el-button>
      <el-button v-if="showEditButtons" @click="openAddSec" type="primary" plain style="margin-right: 8px;">Add SEC</el-button>
      <el-button v-if="showEditButtons" @click="openAddGrc" type="primary" plain>Add GRC</el-button>

      <!-- <DownloadCustom    :data="paginatedData"   :all="sec_officials" /> -->
     </el-row>
   
    <el-table :data="paginatedData" border style="width: 100%" @expand-change="handleExpand">  
     <el-table-column type="expand">
      <template #default="props">
        <div m="4"> 
          <el-tabs tab-position="top" class="demo-tabs">
                  <el-tab-pane >
                    <template #label>   Settlement Executive Committee(SEC)  </template>
                      <el-table :data="props.row.sec_officials" style=" margin-bottom:10px"  >
                        <el-table-column label="#" type="index" />
                        <el-table-column label="Name" prop="name" />
                      <el-table-column label="National ID" prop="national_id" />
                      <el-table-column label="Gender" prop="gender" />
                      <el-table-column label="Phone" prop="mobile" />
                      <el-table-column label="Category" prop="category" />
                      <el-table-column label="SEC Position" prop="sec_position" />
                      <el-table-column width="90" label="">
                        <template #default="scope">
                          <el-button
                            link
                            type="primary"
                            size="small"
                            @click="openEditSec(props.row.overallInstanceId, scope.row.instanceID, scope.row.national_id)"
                          >Edit</el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                   </el-tab-pane>
                  <el-tab-pane >
                    <template #label> Grievance Redress Committee (GRC)  </template>
                      <el-table :data="props.row.grc_officials" class="styled-table">
                        <el-table-column label="#" type="index" />
                        <el-table-column label="Name" prop="name" />
                        <el-table-column label="National ID" prop="national_id" />
                        <el-table-column label="Gender" prop="gender" />
                        <el-table-column label="Phone" prop="mobile" />
                        <el-table-column label="Category" prop="category" />
                        <el-table-column label="GRC Position" prop="grc_position" />
                        <el-table-column width="90" label="">
                          <template #default="scope">
                            <el-button
                              link
                              type="primary"
                              size="small"
                              @click="openEditGrc(scope.row.overallInstanceId, scope.row.instance_id, scope.row.national_id)"
                            >Edit</el-button>
                          </template>
                        </el-table-column>
                      </el-table>
                  </el-tab-pane>
                  <el-tab-pane >
                    <template #label> Documents  </template>
                    <div v-for="(doc, index) in documents" :key="index" style="margin-left: 25px">
                      <el-button  @click="downloadFile(doc)"   link type="primary" size="small" :icon="Download">{{ doc.name }}  -  {{ doc.category }} </el-button>
                    </div>
                  </el-tab-pane>
                </el-tabs>  
              </div>
            </template>
          </el-table-column>
 

    <el-table-column label="Settlement" prop="settlement" />
    <el-table-column label="County" prop="county" />

    <el-table-column label="Coordinator" prop="coordinator" />
    <el-table-column label="NPCT Rep" prop="npct_representative" />
    <el-table-column label="Date" prop="date" />
    <el-table-column fixed="right" label="" min-width="40">
      <template #default="props">
        <el-button type="primary" plain @click="downloadSettlementXlsx(props.row)">
          <el-icon style="margin-right: 5px;"><Download /></el-icon>
          Download
        </el-button>
       </template>
    </el-table-column>
  </el-table>

  <el-pagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
        v-model:page-size="pageSize" :page-sizes="[5, 10, 15, 20, 50, 100,200]" :total="totalItems" :background="true"
        @size-change="handlePageSizeChange" @current-change="handlePageChange" class="mt-4" />

  </el-card>
 
  <el-dialog
    v-model="showAddDialog"
    title="Add/Edit Form"
    width="450"
  >
    <el-form label-position="top">
      <el-form-item label="Select SEC/GRC form">
        <el-select
          v-model="select_form"
          placeholder="Choose form to open"
          size="small"
          style="width: 95%"
          @change="getFieldChangeHandler()"
        >
          <el-option
            v-for="item in forms"
            :key="item.enketoId"
            :label="item.name"
            :value="item.enketoId"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showAddDialog = false">Cancel</el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog
    v-model="editDialogVisible"
    title="Edit SEC Official"
    width="500"
  >
    <el-tabs type="border-card" v-loading="editLoading">
      <el-tab-pane label="Official Details">
        <el-form label-position="top">
          <el-form-item label="Official Name">
            <el-input v-model="editForm.name" />
          </el-form-item>
          <el-form-item label="National ID Number">
            <el-input v-model="editForm.national_id" />
          </el-form-item>
          <el-form-item label="Gender">
            <el-select v-model="editForm.gender" placeholder="Gender">
              <el-option label="male" value="male" />
              <el-option label="female" value="female" />
            </el-select>
          </el-form-item>
          <el-form-item label="Mobile Phone">
            <el-input v-model="editForm.mobile" />
          </el-form-item>
          <el-form-item label="Category">
            <el-select v-model="editForm.category" placeholder="Select category">
              <el-option
                v-for="item in inlineCategoryOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="SEC Position">
            <el-select v-model="editForm.sec_position" placeholder="Select SEC position">
              <el-option
                v-for="item in inlineSecPositionOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="Certification">
        <el-form label-position="top">
          <el-form-item label="Returning Officer*">
            <el-input v-model="editForm.returning_officer" />
          </el-form-item>
          <el-form-item label="County KISIP Coordinator*">
            <el-input v-model="editForm.county_kisip_coordinator" />
          </el-form-item>
          <el-form-item label="KISIP NPCT Representative">
            <el-input v-model="editForm.npct_representative" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="editDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="saveLoading" @click="saveInlineSecEdit">Save</el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog
    v-model="grcEditDialogVisible"
    title="Edit GRC Official"
    width="500"
  >
    <el-tabs type="border-card" v-loading="grcEditLoading">
      <el-tab-pane label="Official Details">
        <el-form label-position="top">
          <el-form-item label="Official Name">
            <el-input v-model="grcEditForm.name" />
          </el-form-item>
          <el-form-item label="National ID Number">
            <el-input v-model="grcEditForm.national_id" />
          </el-form-item>
          <el-form-item label="Gender">
            <el-select v-model="grcEditForm.gender" placeholder="Gender">
              <el-option label="male" value="male" />
              <el-option label="female" value="female" />
            </el-select>
          </el-form-item>
          <el-form-item label="Mobile Phone">
            <el-input v-model="grcEditForm.mobile" />
          </el-form-item>
          <el-form-item label="Category">
            <el-select v-model="grcEditForm.category" placeholder="Select category">
              <el-option
                v-for="item in inlineCategoryOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="GRC Position">
            <el-select v-model="grcEditForm.grc_position" placeholder="Select GRC position">
              <el-option
                v-for="item in inlineSecPositionOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="Certification">
        <el-form label-position="top">
          <el-form-item label="Returning Officer*">
            <el-input v-model="grcEditForm.returning_officer" />
          </el-form-item>
          <el-form-item label="County KISIP Coordinator*">
            <el-input v-model="grcEditForm.county_kisip_coordinator" />
          </el-form-item>
          <el-form-item label="KISIP NPCT Representative">
            <el-input v-model="grcEditForm.npct_representative" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="grcEditDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="grcSaveLoading" @click="saveInlineGrcEdit">Save</el-button>
      </div>
    </template>
  </el-dialog>

</template>


<style scoped>
.styled-table .el-table__body-wrapper tbody tr td {
  color: gray;        /* Gray text */
  font-style: italic; /* Italic font */
}

.gray-out {
    background-color: #f0f0f0; /* Light gray background */
    color: gray; /* Gray text */
  }

</style>