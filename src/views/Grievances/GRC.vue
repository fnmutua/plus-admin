<!-- eslint-disable prettier/prettier -->
<script setup lang="tsx">


import { Plus, Back } from '@element-plus/icons-vue'

import { ref, computed,toRaw, unref, reactive } from 'vue'
import {
  ElPagination, ElInput, ElSelect, ElOption, ElButton, ElDialog,ElMessage,ElCol,
  ElRow, ElTableV2, ElCard,ElTable,ElTableColumn, ElNotification, ElAlert, ElDrawer, ElForm, ElFormItem, ElDivider
} from 'element-plus'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import {
  loginCollector, editSubmissions,
  getSubmissions, getSettlements, createSubmission
} from '@/api/collector'

import {
  signupGRC
} from '@/api/register'


import { checkUser, checkUserNames } from '@/api/users'


import { watch, onMounted } from 'vue';
import type { TableInstance } from 'element-plus'

import DownloadCustom from '@/views/Components/DownloadCustomFields.vue';
import { useRouter } from 'vue-router'

import { ElCheckbox } from 'element-plus'
import type { CheckboxValueType, Column } from 'element-plus'

import type { FunctionalComponent } from 'vue'

import { getOneByCode } from '@/api/settlements'

import { Icon } from '@iconify/vue';
import PermissionWrapper from '@/components/PermissionWrapper.vue';
import {
  Download, CaretRight, Check, Close, Lock, Notification, Microphone,Delete,Edit,ArrowLeft,RefreshLeft,
  ArrowRight,
} from '@element-plus/icons-vue'

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)



const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const res = reader.result
      if (typeof res === 'string') {
        const commaIndex = res.indexOf(',')
        resolve((commaIndex >= 0 ? res.slice(commaIndex + 1) : res) as string)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })


const mobileBreakpoint = 768;
const defaultPageSize = 10;
const mobilePageSize = 5;
const pageSize = ref(10);
const currentPage = ref(1);
const width = ref(1080);
const isMobile = ref(false);

// Function to update pageSize based on window width
const updatePageSize = () => {

  console.log('window.innerWidth', window.innerWidth)
  width.value = window.innerWidth - 400
  isMobile.value = window.innerWidth <= mobileBreakpoint
  if (window.innerWidth <= mobileBreakpoint) {
    pageSize.value = mobilePageSize;
  } else {
    pageSize.value = defaultPageSize;
  }
};

// Computed property for drawer size
const drawerSize = computed(() => isMobile.value ? '100%' : '50%');



onMounted(async () => {

  console.log('window.innerWidth', window.innerWidth)

  window.addEventListener('resize', updatePageSize);
  updatePageSize(); // Initial check


})



console.log("userInfo--->", userInfo)





const projects = ref([])
const forms = ref([])
const loading = ref(false)
const fetchingData = ref(false)
const dataFetchStatus = ref('')
const settlementsList = ref<any[]>([])





const loginUserToCollector = async () => {
  var formData = {}
  formData.email = "kisip.mis@gmail.com"
  formData.password = "***REDACTED***"

  loading.value = true
  fetchingData.value = true
  dataFetchStatus.value = 'Connecting to server and fetching all GRC data...'


  try {
    const response = await loginCollector(formData)
    const token = response.token
    localStorage.setItem('collectorToken', token)
    const all_projects = JSON.parse(response.data)

    all_projects.forEach(function (project) {
      projects.value.push(project)
      project.formList.forEach(function (form) {
        forms.value.push(form)
      })
    })

    await getGRCData()
    await loadSecRoster()
    await fetchSettlements()
  } catch (error) {
    loading.value = false
    fetchingData.value = false
    dataFetchStatus.value = ''
  }

}

const grc_officials = ref([])



const countyOptions = ref([])
const settlementOptions = ref([])
const settlementCodeMap = reactive<Record<string, string>>({})
const settlementCountyMap = reactive<Record<string, string>>({}) // Map settlement to county
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

    // Store settlement to county mapping
    if (official_details.settlement && official_details.settlement !== "N/A" && official_details.county && official_details.county !== "N/A") {
      settlementCountyMap[official_details.settlement] = official_details.county;
    }

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
        if (official_details.settlement && official_details.settlement_code) {
          settlementCodeMap[official_details.settlement] = official_details.settlement_code;
        }
      });
    }
  });

  countyOptions.value = Array.from(uniqueCounties).map(county => ({ label: county, value: county }));
  settlementOptions.value = Array.from(uniqueSettlements).map(settlement => ({
    label: settlement,
    value: settlement,
    code: settlementCodeMap[settlement] || '',
    county: settlementCountyMap[settlement] || ''
  }));
  console.log(countyOptions.value)
};



const getGRCData = async () => {
  // Define the formData object with necessary fields
  const formData = {
    project: "1",
    form: "grc_officials",
    token: localStorage.getItem('collectorToken')
  };

  // Update status message
  dataFetchStatus.value = 'Processing and extracting GRC officials data...'

  try {
    // Await the response from getSubmissions
    const response = await getSubmissions(formData);

    console.log('Submissions:', response);

    // Update status message
    dataFetchStatus.value = 'Extracting and organizing data...'

    // Await the extraction of data
    await extractData(response.data);

    // Log the extracted data
    console.log('grc_officials.value', grc_officials.value);
    
    // Update status message
    dataFetchStatus.value = 'Checking user accounts...'
    
    const usernames = grc_officials.value
      .filter(official => official.grc_position === "secretary") // Only secretaries
      .map(official => official.mobile); // Extract mobile numbers


    const form = {}
     form.usernames = usernames
    const res = await checkUserNames(form)
    console.log(res.data)



    // Merge the exists property back into grc_officials.value
      grc_officials.value = grc_officials.value.map(official => {
        // Find the match in the return.data array based on username
        const match = res.data.find(user => user.username === official.mobile);
        console.log(match)
        return {
          ...official,
          has_acc: match ? match.exists : 'N/A', // Default to false if no match is found
        };
      });

    console.log('Updated grc_officials:', grc_officials.value);

    // Update total items
    totalItems.value = grc_officials.value.length

  } catch (error) {
    // Handle errors here
    console.error('Error:', error);
  } finally {
    // Reset loading state
    loading.value = false;
    fetchingData.value = false;
    dataFetchStatus.value = '';
  }
};


const loadSecRoster = async () => {
  const formData = {
    project: '1',
    form: 'sec_officials',
    token: localStorage.getItem('collectorToken')
  }

  try {
    const response = await getSubmissions(formData)
    const seen = new Set()
    secRoster.value = []
    response.data.forEach((data) => {
      if (!data || !Array.isArray(data.sec_officials)) return

      const settlementLabel = data.settlement_name || data.group_location?.settlement || ''
      const countyLabel = data.group_location?.county || ''
      data.sec_officials.forEach((official) => {
        const entry = {
          settlement: settlementLabel,
          county: countyLabel,
          category: official.category || '',
          gender: official.gender || '',
          name: official.name || '',
          sec_position: official.sec_position || '',
          national_id: official.national_id || '',
          mobile: official.mobile || ''
        }
        const key = `${entry.national_id}-${entry.settlement}-${entry.sec_position}`
        if (!seen.has(key)) {
          seen.add(key)
          secRoster.value.push(entry)
        }
      })
    })
  } catch (error) {
    console.error('Error loading SEC roster for GRC creation', error)
  }
}

const fetchSettlements = async () => {
  const payload = {
    project: '1',
    token: localStorage.getItem('collectorToken')
  }
  try {
    const res = await getSettlements(payload)
    settlementsList.value = res.data || []

    // Normalize into options for selects/filters
    const settlementOpts = settlementsList.value.map((s: any) => {
      const label = s.sett_name || s.name || s.settlement_name || ''
      const county = s.county_name || s.county || ''
      const code = s.code || s.pcode || ''
      return {
        label,
        value: label,
        code,
        county
      }
    }).filter((s: any) => s.label)

    // Update settlement and county options with normalized list
    settlementOptions.value = settlementOpts
    const seenCounty = new Map<string, string>()
    settlementOpts.forEach((s: any) => {
      if (s.county && !seenCounty.has(s.county)) {
        seenCounty.set(s.county, s.county)
      }
      if (s.label && s.code) {
        settlementCodeMap[s.label] = s.code
      }
      if (s.label && s.county) {
        settlementCountyMap[s.label] = s.county
      }
    })
    countyOptions.value = Array.from(seenCounty, ([value, label]) => ({
      label,
      value
    }))
  } catch (error) {
    console.error('Fetch settlements error (GRC):', error)
  }
}


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

const isNewMemberPositionTaken = (pos, rowIndex) => {
  if (!pos) return false
  return newMembers.some((m, idx) => idx !== rowIndex && m.grc_position === pos)
}

const role = ref()

const secRoster = ref<any[]>([])
const createDrawerVisible = ref(false)
const creating = ref(false)
const grcCreateForm = reactive({
  group_location: {
    county: '',
    settlement: '',
    settlement_new: '',
    pcode: ''
  },
  sec_selected: [] as string[],
  comments: '',
  grp_certification: {
    returning_officer: '',
    county_kisip_coordinator: '',
    npct_representative: ''
  },
  photo: null as
    | {
        file: File
        name: string
        contentType: string
        base64?: string
      }
    | null,
  grc_register: null as
    | {
        file: File
        name: string
        contentType: string
        base64?: string
      }
    | null
})

const newMembers = reactive([
  { name: '', national_id: '', mobile: '', gender: '', grc_position: '' },
  { name: '', national_id: '', mobile: '', gender: '', grc_position: '' },
  { name: '', national_id: '', mobile: '', gender: '', grc_position: '' }
])

const secOptionKey = (o) => {
  // Create a unique key matching the format used in loadSecRoster
  // This ensures consistency and uniqueness
  if (o.national_id && o.national_id !== 'N/A' && o.national_id.trim() !== '') {
    return `${o.national_id}-${o.settlement}-${o.sec_position}`
  }
  // Fallback: use name-mobile-settlement-position for uniqueness when national_id is missing
  // This should be unique since loadSecRoster already deduplicates
  return `${o.name || ''}-${o.mobile || ''}-${o.settlement || ''}-${o.sec_position || ''}`
}

const availableSecOptions = computed(() => {
  const filtered = secRoster.value.filter(
    (o) =>
      o.settlement === grcCreateForm.group_location.settlement &&
      !['chairperson', 'chairman'].includes(String(o.sec_position || '').toLowerCase())
  )
  // Use a Map to track seen keys and ensure uniqueness
  const seen = new Map()
  return filtered
    .map((o) => {
      const key = secOptionKey(o)
      // If we've seen this key before, skip it (shouldn't happen due to loadSecRoster deduplication)
      if (seen.has(key)) {
        return null
      }
      seen.set(key, true)
      return {
        label: `${o.name} (${o.sec_position || 'Member'})`,
        value: key,
        originalData: o
      }
    })
    .filter(Boolean) // Remove null entries
})

const selectedSecMembers = computed(() => {
  if (!grcCreateForm.sec_selected || grcCreateForm.sec_selected.length === 0) return []
  
  // Find members by matching the selected keys
  return secRoster.value.filter((o) => {
    const key = secOptionKey(o)
    return (
      grcCreateForm.sec_selected.includes(key) &&
      o.settlement === grcCreateForm.group_location.settlement
    )
  })
})

const resetCreateFormGrc = () => {
  grcCreateForm.group_location.county = ''
  grcCreateForm.group_location.settlement = ''
  grcCreateForm.group_location.settlement_new = ''
  grcCreateForm.group_location.pcode = ''
  grcCreateForm.sec_selected = []
  grcCreateForm.comments = ''
  grcCreateForm.grp_certification.returning_officer = ''
  grcCreateForm.grp_certification.county_kisip_coordinator = ''
  grcCreateForm.grp_certification.npct_representative = ''
  grcCreateForm.photo = null
  grcCreateForm.grc_register = null
  newMembers.forEach((m) => {
    m.name = ''
    m.national_id = ''
    m.mobile = ''
    m.gender = ''
    m.category = ''
    m.grc_position = ''
  })
}

const handlePhotoChange = async (event) => {
  const file = event.target.files?.[0]
  if (file) {
    grcCreateForm.photo = {
      file,
      name: file.name,
      contentType: file.type,
      base64: await fileToBase64(file)
    }
  }
}

const handleRegisterChange = async (event) => {
  const file = event.target.files?.[0]
  if (file) {
    grcCreateForm.grc_register = {
      file,
      name: file.name,
      contentType: file.type,
      base64: await fileToBase64(file)
    }
  }
}

// Computed property to filter settlements by selected county
const settlementOptionsByCounty = computed(() => {
  if (!grcCreateForm.group_location.county) return []
  return settlementOptions.value.filter(settlement => 
    settlement.county === grcCreateForm.group_location.county
  )
})

watch(
  () => grcCreateForm.group_location.county,
  () => {
    grcCreateForm.group_location.settlement = ''
    grcCreateForm.group_location.settlement_new = ''
    grcCreateForm.group_location.pcode = ''
    grcCreateForm.sec_selected = []
  }
)

watch(
  () => grcCreateForm.group_location.settlement,
  (val) => {
    grcCreateForm.group_location.settlement_new = ''
    if (val) {
      const selectedSettlement = settlementOptionsByCounty.value.find(s => s.value === val)
      grcCreateForm.group_location.pcode = selectedSettlement?.code || settlementCodeMap[val] || ''
    } else {
      grcCreateForm.group_location.pcode = ''
    }
    grcCreateForm.sec_selected = []
  }
)







const submissionID = ref()
const dialog_title = ref('Edit Roles')
const editRecord = async (row) => {

  dialogVisible.value = true
  submissionID.value = row.submissionID

}


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

const deleteRecord = async (row) => {

  console.log("Delete..............", row)
  const formData = {
    project: "1",
    form: "grc_officials",
    submissionID: row.submissionID,
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


const AddRecord = () => {
  resetCreateFormGrc()
  createDrawerVisible.value = true
}

const submitCreateGrc = async () => {
  if (!grcCreateForm.group_location.county || !grcCreateForm.group_location.settlement) {
    return
  }

  if (selectedSecMembers.value.length !== 2) {
    return
  }

  const newMembersValid = newMembers.every(
    (m) => m.name && m.national_id && m.mobile && m.gender && m.grc_position
  )

  if (!newMembersValid) {
    return
  }

  const officials = [
    ...selectedSecMembers.value.map((o) => ({
      category: o.category,
      name: o.name,
      national_id: o.national_id,
      gender: o.gender,
      mobile: o.mobile,
      grc_position: 'member'
    })),
    ...newMembers.map((m) => ({
      ...m
    }))
  ]

  if (officials.length !== 5) {
    return
  }

  creating.value = true
  try {
    const attachments: { name: string; content: string; contentType: string }[] = []
    if (grcCreateForm.photo?.base64) {
      attachments.push({
        name: grcCreateForm.photo.name,
        content: grcCreateForm.photo.base64,
        contentType: grcCreateForm.photo.contentType
      })
    }
    const registerNames: string[] = []
    if (grcCreateForm.grc_register?.base64) {
      attachments.push({
        name: grcCreateForm.grc_register.name,
        content: grcCreateForm.grc_register.base64,
        contentType: grcCreateForm.grc_register.contentType
      })
      registerNames.push(grcCreateForm.grc_register.name)
    }

    const { xml } = buildGrcXml(officials, registerNames)

    console.log('GRC submit payload attachments:', attachments.map((a) => a.name))

    const payload = {
      project: '1',
      form: 'grc_officials',
      token: localStorage.getItem('collectorToken'),
      xml,
      attachments
    }
    await createSubmission(payload)
    createDrawerVisible.value = false
    resetCreateFormGrc()
    await getGRCData()
  } catch (error) {
    console.error('Create GRC error:', error)
  } finally {
    creating.value = false
  }
}

const totalItems = ref(); // Total number of rows (initially full dataset)


console.log("projects--->", projects.value)
console.log("forms--->", forms.value)

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

const buildGrcXml = (officials, registerNames: string[] = []) => {
  const now = new Date()
  const start = now.toISOString()
  const end = now.toISOString()
  const dateOnly = now.toISOString().slice(0, 10)

  const esc = (s = '') =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  const officialsXml = officials
    .map(
      (o) => `
        <grc_officials>
          <category>${esc(o.category)}</category>
          <name>${esc(o.name)}</name>
          <national_id>${esc(o.national_id)}</national_id>
          <gender>${esc(o.gender)}</gender>
          <mobile>${esc(o.mobile)}</mobile>
          <position_select></position_select>
          <taken_select></taken_select>
          <grc_position>${esc(o.grc_position)}</grc_position>
        </grc_officials>`
    )
    .join('')

  const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
  const instanceId = `uuid:${uuid()}`

  const secPhotoNames = registerNames.length ? registerNames : [grcCreateForm.grc_register?.name].filter(Boolean)
  const registerXml = secPhotoNames
    .map(
      (name) => ` <grc_register>${esc(name)}</grc_register> `
    )
    .join('')

  const xml = `<?xml version="1.0"?>
<data id="grc_officials">
  <start>${esc(start)}</start>
  <end>${esc(end)}</end>
  <today>${esc(dateOnly)}</today>
  <group_location>
    <county>${esc(grcCreateForm.group_location.county)}</county>
    <settlement>${esc(grcCreateForm.group_location.settlement)}</settlement>
    <settlement_new>${esc(grcCreateForm.group_location.settlement_new)}</settlement_new>
    <pcode>${esc(grcCreateForm.group_location.pcode)}</pcode>
  </group_location>
  ${officialsXml}
  <grp_certification>
    <returning_officer>${esc(grcCreateForm.grp_certification.returning_officer)}</returning_officer>
    <county_kisip_coordinator>${esc(grcCreateForm.grp_certification.county_kisip_coordinator)}</county_kisip_coordinator>
    <npct_representative>${esc(grcCreateForm.grp_certification.npct_representative)}</npct_representative>
  </grp_certification>
  <comments>${esc(grcCreateForm.comments)}</comments>
  <location></location>
  <photo>${esc(grcCreateForm.photo?.name)}</photo>
  ${registerXml}
  <meta>
    <instanceID>${esc(instanceId)}</instanceID>
  </meta>
</data>`
  return { xml, instanceId }
}

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
const sett_value = ref()
const position = ref()

// Computed property to filter settlements by selected county in filter section
const filteredSettlementOptions = computed(() => {
  if (!county_value.value) return settlementOptions.value
  return settlementOptions.value.filter(settlement => 
    settlement.county === county_value.value
  )
})

// Watch county filter to clear settlement filter when county changes
watch(
  () => county_value.value,
  () => {
    sett_value.value = null
  }
)

const filteredData = computed(() => {
  // return grc_officials.value; // Return all data if no search term

  const searchTerm = search.value.toLowerCase();
  const selectedCounty = county_value.value;
  const selectedSettlement = sett_value.value;

  const selectedPosition = position.value;

  console.log('selectedPosition', selectedPosition)
  console.log('selectedPosition2', grc_officials.value)




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
      const NPCTMatch = data.submitter?.toLowerCase().includes(searchTerm);

      return countyMatch && settlementMatch && (nameMatch || settlementTermMatch || telephoneMatch || idMatch || NPCTMatch || postTMatch);
    }

    return countyMatch && settlementMatch && selectedPositionMatch;
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
    // cellRenderer: ({ rowData }) => (
    //   <>
    //     <ElButton  onClick={() => editRecord(rowData)} size="small">Edit</ElButton>

    //     <ElButton onClick={() => deleteRecord(rowData)}  size="small" type="danger">
    //       Delete
    //     </ElButton>
    //   </>
    // ),
    width: 150,
    align: 'center',
  }
]

const xcolumns: Column<any>[] = [
  {
    key: 'operations',
    title: 'Operations',
    cellRenderer: ({ rowData }) => (
      <>
        <ElButton onClick={() => editRecord(rowData)} size="small">Edit</ElButton>

        <ElButton onClick={() => deleteRecord(rowData)} size="small" type="danger">
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

 

const getSelectedRows = () => {
  // Filter selected rows where has_acc is NOT true
 
  //const selectedRows = paginatedData.value.filter(row => row.checked && !row.has_acc);
  //const selectedRows = paginatedData.value.filter(row => row.checked && !row.has_acc);

  //console.log(selectedRows)
  
  if (multipleSelection.value.length === 0) {
  ElMessage({
    message: 'The selected GRCs already have accounts',
    type: 'warning',
  });
}

  // Loop through the filtered selected rows
  multipleSelection.value.forEach(async (row) => {
    console.log(row);

    await getOneByCode({ model: "settlement", code: row.settlement_code })
      .then((res) => {
        console.log('sett-ID', res);
        const formData = {
          username: row.mobile,
          name: row.name,
          phone: row.mobile,
          password: "User@2024",
          role: ["grm"],
          isactive:true,
          location_level: "settlement",
          location_id: res.data.id,
          location_field: "settlement_id",
        };

        signupGRC(formData).then((response) => {
          console.log(response);
        });
      })
      .catch((error) => {
        console.log("Error:", error); // Handle the error
      });
  });
};


// Computed property to check if any row is selected
// const anyRowSelected = computed(() => {
//   return paginatedData.value.some((row) => row.checked)
// })

const anyRowSelected=ref(false)

const multipleTableRef = ref<TableInstance>()
const multipleSelection = ref()

const selectable = (row: any) => !row.has_acc;
const handleSelectionChange = (val: any[]) => {
  multipleSelection.value = val
  anyRowSelected.value=true

  multipleSelection.value = val.map(toRaw); // Convert proxies to raw objects


 }


</script>

<template>
  <el-card>
    <!-- Status Alert -->
    <el-alert
      v-if="fetchingData && dataFetchStatus"
      :title="dataFetchStatus"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 15px;"
    >
      <template #default>
        <div>
          <p>{{ dataFetchStatus }}</p>
          <p style="font-size: 12px; margin-top: 5px; color: #909399;">
            You can use the filters and search while data is being loaded.
          </p>
        </div>
      </template>
    </el-alert>

    <div v-loading="loading" element-loading-text="Loading data...">
    <el-row :gutter="10" style="margin-bottom: 10px;">
      <el-col :xs="24" :sm="24" :md="24">
        <el-row :gutter="10" :style="isMobile ? 'flex-wrap: wrap;' : 'flex-wrap: nowrap; display: flex; align-items: center;'">
          <el-col :xs="24" :sm="12" :md="3" style="margin-bottom: 8px;">
            <el-button type="primary" plain :icon="Back" @click="goBack" style="width: 100%;">
              <span v-if="!isMobile">Back</span>
            </el-button>
          </el-col>

          <el-col :xs="24" :sm="12" :md="3" style="margin-bottom: 8px;">
            <el-select
              v-model="county_value" 
              placeholder="Filter County" 
              clearable
              filterable
              style="width: 100%;"
            >
              <el-option v-for="item in countyOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-col>

          <el-col :xs="24" :sm="12" :md="4" style="margin-bottom: 8px;">
            <el-select
              v-model="sett_value" 
              placeholder="Filter Settlement" 
              clearable 
              filterable
              :disabled="!county_value"
              style="width: 100%;"
            >
              <el-option v-for="item in filteredSettlementOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-col>

          <el-col :xs="24" :sm="12" :md="3" style="margin-bottom: 8px;">
            <el-select
              v-model="position" 
              placeholder="Filter Position" 
              clearable 
              filterable
              style="width: 100%;"
            >
              <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-col>

          <el-col :xs="24" :sm="12" :md="3" style="margin-bottom: 8px;">
            <el-input
              clearable 
              v-model="search" 
              placeholder="Search..."
              :onInput="filterTableData" 
              style="width: 100%;"
            />
          </el-col>

          <el-col :xs="24" :sm="24" :md="4" style="margin-bottom: 8px; margin-left: auto;">
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <el-tooltip content="Add GRC" placement="top">
                <el-button v-if="showEditButtons" :onClick="AddRecord" type="primary" :icon="Plus" />
              </el-tooltip>
              <DownloadCustom :data="paginatedData" :all="grc_officials" />
            </div>
          </el-col>
        </el-row>
      </el-col>
    </el-row>





    <div>




      <el-table
      ref="multipleTableRef"
      :data="paginatedData"
      row-key="national_id"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" :selectable="selectable"   width="55" />
    
      <el-table-column property="name" label="Name"  sortable />
      <el-table-column property="gender" label="Gender" />
      <el-table-column property="category" label="Category" sortable/>
      <el-table-column property="grc_position"  label="Position" sortable/>
      <el-table-column property="mobile" label="Phone"  />
      <el-table-column property="date" label="Date formed"  sortable/>


      
      <el-table-column label="Location">
        <template #default="{ row }">
          {{ row.settlement ? row.settlement + ', ' : '' }}{{ row.county }}
        </template>
      </el-table-column>
  </el-table>

      <!-- <el-table-v2 :columns="columnsx" :data="paginatedData" :width="width" :height="450" fixed>
        <template #empty>
          <div class="flex items-center justify-center h-100%">
            <el-empty />
          </div>
        </template>
      </el-table-v2> -->
      <el-button 
        style="margin-top: 20px; width: 100%;" 
        v-if="anyRowSelected" 
        @click="getSelectedRows"
        :size="isMobile ? 'default' : 'default'"
      >
        Generate Accounts
      </el-button>

    </div>


    <div style="margin-top: 20px;">
      <!-- Pagination component -->

      <el-pagination
        :layout="isMobile ? 'prev, pager, next' : 'sizes, prev, pager, next, total'" 
        v-model:currentPage="currentPage"
        v-model:page-size="pageSize" 
        :page-sizes="[5, 10, 15, 20, 50, 100,1000,10000]" 
        :total="totalItems" 
        :background="true"
        :small="isMobile"
        @size-change="handlePageSizeChange" 
        @current-change="handlePageChange" 
        class="mt-4" 
      />

    </div>
    </div>

  </el-card>

  <el-drawer v-model="createDrawerVisible" title="Create GRC" :size="drawerSize" :direction="isMobile ? 'btt' : 'rtl'">
    <el-form label-position="top">
      <el-row :gutter="10">
        <el-col :xs="24" :sm="12" :md="12">
          <el-form-item label="County">
            <el-select v-model="grcCreateForm.group_location.county" filterable clearable placeholder="Select county">
              <el-option v-for="c in countyOptions" :key="c.value" :label="c.label" :value="c.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="12">
          <el-form-item label="Settlement">
            <el-select
              v-model="grcCreateForm.group_location.settlement"
              filterable
              clearable
              placeholder="Select settlement"
              :disabled="!grcCreateForm.group_location.county"
            >
              <el-option v-for="s in settlementOptionsByCounty" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
<!-- 
      <el-row :gutter="10">
        <el-col :xs="24" :sm="12" :md="12">
          <el-form-item label="Settlement Code (optional)">
            <el-input v-model="grcCreateForm.group_location.pcode" placeholder="Enter settlement code" />
          </el-form-item>
        </el-col>
      </el-row> -->

      <el-divider content-position="left">Pick 2 SEC members (no chairs)</el-divider>
      <el-select
        v-model="grcCreateForm.sec_selected"
        multiple
        filterable
        :multiple-limit="2"
        placeholder="Select exactly 2 SEC members for this settlement"
        style="width: 100%; margin-bottom: 10px;"
      >
        <el-option v-for="opt in availableSecOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>

      <div style="overflow-x: auto; margin-bottom: 12px;">
        <el-table
          v-if="selectedSecMembers.length"
          :data="selectedSecMembers"
          border
          size="small"
          style="width: 100%; min-width: 500px;"
        >
          <el-table-column prop="name" label="Name" />
          <el-table-column prop="sec_position" label="SEC Position" />
          <el-table-column prop="gender" label="Gender" />
          <el-table-column prop="mobile" label="Phone" />
        </el-table>
      </div>

      <el-divider content-position="left">Add 3 new members</el-divider>
      <el-row v-for="(member, idx) in newMembers" :key="idx" :gutter="10" style="margin-bottom: 8px;">
        <el-col :xs="24" :sm="24" :md="6">
          <el-input v-model="member.name" size="small" :placeholder="`Name #${idx + 1}`" style="width: 100%;" />
        </el-col>
        <el-col :xs="24" :sm="12" :md="4">
          <el-input v-model="member.national_id" size="small" placeholder="National ID" style="width: 100%;" />
        </el-col>
        <el-col :xs="24" :sm="12" :md="4">
          <el-input v-model="member.mobile" size="small" placeholder="Phone" style="width: 100%;" />
        </el-col>
        <el-col :xs="24" :sm="12" :md="3">
          <el-select v-model="member.gender" size="small" placeholder="Gender" style="width: 100%;">
            <el-option label="Male" value="male" />
            <el-option label="Female" value="female" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="3">
          <el-input v-model="member.category" size="small" placeholder="Category" disabled value="Member" style="width: 100%;" />
        </el-col>
        <el-col :xs="24" :sm="12" :md="4">
          <el-select v-model="member.grc_position" size="small" placeholder="GRC Position" style="width: 100%;">
            <el-option
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
              :disabled="isNewMemberPositionTaken(item.value, idx)"
            />
          </el-select>
        </el-col>
      </el-row>

      <el-row :gutter="10" style="margin-top: 8px;">
        <el-col :xs="24" :sm="12" :md="12">
          <el-form-item label="GRC Photo">
            <input type="file" accept="image/*" @change="handlePhotoChange" />
            <div v-if="grcCreateForm.photo" style="font-size: 12px; color: #606266; margin-top: 4px;">
              {{ grcCreateForm.photo.name }}
            </div>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="12">
          <el-form-item label="Signed list (PDF or photo)">
            <input type="file" accept="image/*,.pdf" @change="handleRegisterChange" />
            <div v-if="grcCreateForm.grc_register" style="font-size: 12px; color: #606266; margin-top: 4px;">
              {{ grcCreateForm.grc_register.name }}
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <div :style="isMobile ? 'display: flex; flex-direction: column; gap: 8px; margin-top: 12px;' : 'text-align: right; margin-top: 12px;'">
        <el-button @click="createDrawerVisible = false" :style="isMobile ? 'width: 100%;' : ''">Cancel</el-button>
        <el-button type="primary" :loading="creating" @click="submitCreateGrc" :style="isMobile ? 'width: 100%;' : ''">Submit</el-button>
      </div>
    </el-form>
  </el-drawer>

  <el-dialog v-model="dialogVisible" :title="dialog_title" :width="isMobile ? '90%' : '450'">
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

</template>
