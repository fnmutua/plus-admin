<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">


import { ElButton } from 'element-plus'
import { Back, Plus } from '@element-plus/icons-vue'

import { ref, computed, reactive } from 'vue'
import {
  ElPagination, ElInput, ElSelect, ElOption, ElCol,ElTable,ElTableColumn,
  ElRow, ElCard, ElNotification, ElAlert, ElForm, ElFormItem, ElDrawer, ElSteps, ElStep, ElDescriptions
} from 'element-plus'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import {
  loginCollector,
  getSubmissions,
  createSubmission,
  getSettlements
} from '@/api/collector'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyByIdApi } from '@/api/adminunits'
import { watch, onMounted } from 'vue';

import DownloadCustom from '@/views/Components/DownloadCustomFields.vue';
import { useRouter } from 'vue-router'

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


const mobileBreakpoint = 768;
const defaultPageSize = 18;
const mobilePageSize = 5;
const pageSize = ref(18);
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

const countyListFromSettlements = computed<{ label: string; value: string | number }[]>(() => {
  const seen = new Map<string, string>()
  settlementsList.value.forEach((s: SettlementItem) => {
    const key = s.county_id ? String(s.county_id) : String(s.county_name || '')
    const label = s.county_name || key
    if (key && !seen.has(key)) seen.set(key, label)
  })
  return Array.from(seen, ([value, label]) => ({
    label,
    value: isNaN(Number(value)) ? value : Number(value)
  }))
})

const settlementOptionsByCounty = computed<{ label: string; value: string; code: string }[]>(() => {
  if (!createForm.group_location.county) return []
  return settlementsList.value
    .filter((s: SettlementItem) =>
      s.county_id
        ? String(s.county_id) === String(createForm.group_location.county)
        : s.county_name === createForm.group_location.county
    )
    .map((s: SettlementItem) => ({ label: s.sett_name, value: s.code, code: s.code }))
})

const resetCreateForm = () => {
  createForm.group_location.county = ''
  createForm.group_location.settlement = ''
  createForm.group_location.settlement_new = ''
  createForm.group_location.pcode = ''
  createForm.sec_officials = [
    {
      category: '',
      name: '',
      national_id: '',
      gender: '',
      mobile: '',
      sec_position: ''
    }
  ]
  createForm.grp_certification.returning_officer = ''
  createForm.grp_certification.county_kisip_coordinator = ''
  createForm.grp_certification.npct_representative = ''
  createForm.comments = ''
  createForm.photo = null
  createForm.sec_register = null
}

const addOfficial = () => {
  createForm.sec_officials.push({
    category: '',
    name: '',
    national_id: '',
    gender: '',
    mobile: '',
    sec_position: ''
  })
}

const removeOfficial = (index) => {
  if (createForm.sec_officials.length === 1) return
  createForm.sec_officials.splice(index, 1)
}

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

const handlePhotoChange = async (event) => {
  const file = event.target.files?.[0]
  if (file) {
    createForm.photo = {
      name: file.name,
      contentType: file.type,
      base64: await fileToBase64(file)
    }
  }
}

const handleRegisterChange = async (event) => {
  const file = event.target.files?.[0]
  if (file) {
    createForm.sec_register = {
      name: file.name,
      contentType: file.type,
      base64: await fileToBase64(file)
    }
  }
}



onMounted(async () => {

  console.log('window.innerWidth', window.innerWidth)

  window.addEventListener('resize', updatePageSize);
  updatePageSize(); // Initial check


})



console.log("userInfo--->", userInfo)

type SettlementItem = {
  id: string
  code: string
  sett_name: string
  county_name: string
  county_id?: string
}

type SecOfficialType = {
  category: string
  name: string
  national_id: string
  gender: string
  mobile: string
  sec_position: string
}

type FilePayload = {
  name: string
  contentType: string
  base64: string
}

type CreateFormType = {
  group_location: {
    county: string
    settlement: string
    settlement_new: string
    pcode: string
  }
  sec_officials: SecOfficialType[]
  grp_certification: {
    returning_officer: string
    county_kisip_coordinator: string
    npct_representative: string
  }
  comments: string
  photo: FilePayload | null
  sec_register: FilePayload | null
}

const projects = ref<any[]>([])
const forms = ref<any[]>([])
const loading = ref(false)
const fetchingData = ref(false)
const dataFetchStatus = ref('')
const settlementsList = ref<SettlementItem[]>([])
const createDrawerVisible = ref(false)
const creating = ref(false)
const creatingStatus = ref('')
const activeStep = ref(0)
const validationMessage = ref('')

const disableSettlementNew = computed(() => !!createForm.group_location.settlement)
const disableSettlementSelect = computed(() => !!createForm.group_location.settlement_new)
const disablePcode = computed(() => !!createForm.group_location.settlement)

const createForm = reactive<CreateFormType>({
  group_location: {
    county: '',
    settlement: '',
    settlement_new: '',
    pcode: ''
  },
  sec_officials: [
    {
      category: '',
      name: '',
      national_id: '',
      gender: '',
      mobile: '',
      sec_position: ''
    }
  ],
  grp_certification: {
    returning_officer: '',
    county_kisip_coordinator: '',
    npct_representative: ''
  },
  comments: '',
  photo: null,
  sec_register: null
})





watch(
  () => createForm.group_location.settlement,
  (val) => {
    if (val) {
      createForm.group_location.settlement_new = ''
    }
  }
)

watch(
  () => createForm.group_location.settlement_new,
  (val) => {
    if (val) {
      createForm.group_location.settlement = ''
      createForm.group_location.pcode = ''
    }
  }
)

const loginUserToCollector = async () => {
  const formData: { email: string; password: string } = {
    email: 'kisip.mis@gmail.com',
    password: '***REDACTED***'
  }

  loading.value = true
  fetchingData.value = true
  dataFetchStatus.value = 'Connecting to server and fetching all SEC data...'

  // Show notification that data fetching has started
  ElNotification({
    title: 'Fetching Data',
    message: 'We are fetching all SEC officials data. This may take a moment. You can continue using other features while data loads.',
    type: 'info',
    duration: 5000,
    position: 'top-right'
  })

  try {
    const response = await loginCollector(formData);
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


    await fetchSettlements()
    getSecData()
  } catch (error) {
    loading.value = false
    fetchingData.value = false
    dataFetchStatus.value = ''
    ElNotification({
      title: 'Error',
      message: 'Failed to connect to server. Please try again.',
      type: 'error',
      duration: 5000,
      position: 'top-right'
    })
  }

}

const sec_officials = ref<any[]>([])



const countyOptions = ref<{ label: string; value: string }[]>([])
const settlementOptions = ref<{ label: string; value: string }[]>([])
const extractData = async (dataArray) => {

  // Extract unique counties and settlements
  const uniqueCounties = new Set();
  const uniqueSettlements = new Set();


  // Clear the sec_officials array
  sec_officials.value = [];

  // Helper function to determine if an official already exists
  const isDuplicate = (newOfficial) => {
    return sec_officials.value.some(existingOfficial =>
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
      submitter: data.meta.submitterName || "N/A",
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

  countyOptions.value = Array.from(uniqueCounties).map((county) => ({ label: String(county), value: String(county) }))
  settlementOptions.value = Array.from(uniqueSettlements).map((settlement) => ({ label: String(settlement), value: String(settlement) }))
  console.log(countyOptions.value)
};



const getSecData = async () => {
  // Define the formData object with necessary fields
  const formData: any = {
    project: "1",
    form: "sec_officials",
    token: localStorage.getItem('collectorToken')
  };

  // Add county filtering if user is county level (following Sett.vue pattern)
  if (userInfo && userInfo.roles) {
    const countyRole = userInfo.roles.find(role =>
      role.user_roles?.location_level === "county" && role.user_roles?.county_id
    );

    if (countyRole) {
      let countyName: string | null = null;
      
      // Get county name - first check if it exists in countyOptions (used in select dropdown)
      // Fetch county name from API to match against countyOptions
      try {
        const countyResponse = await getCountyByIdApi(countyRole.user_roles.county_id);
        if (countyResponse && countyResponse.data) {
          const fetchedCountyName = countyResponse.data.name;
          
          // Check if this county name exists in countyOptions
          const countyInOptions = countyOptions.value.find(c =>
            c.value === fetchedCountyName || c.label === fetchedCountyName
          );
          
          // Use the county name from countyOptions if found, otherwise use the fetched name
          countyName = countyInOptions ? (countyInOptions.value || countyInOptions.label) : fetchedCountyName;
          console.log('County name for filter:', countyName, countyInOptions ? '(found in countyOptions)' : '(from API)');
        }
      } catch (error) {
        console.error('Error fetching county name:', error);
      }

      if (countyName) {
        formData.filters = ['county'];
        formData.filterValues = [[countyName]];
        formData.filterOperator = ['in'];
        console.log('Adding county filter to request:', { filters: formData.filters, filterValues: formData.filterValues });
      } else {
        console.warn('County name not found for county_id:', countyRole.user_roles.county_id);
      }
    }
  }

  // Update status message
  dataFetchStatus.value = 'Processing and extracting SEC officials data...'

  try {
    // Await the response from getSubmissions
    const response = await getSubmissions(formData);

    console.log('Submissions:', response);

    // Update status message
    dataFetchStatus.value = 'Extracting and organizing data...'

    // Await the extraction of data
    await extractData(response.data);

    // Log the extracted data
    console.log(sec_officials.value);

    // Update total items
    totalItems.value = sec_officials.value.length

    // Show success notification
    ElNotification({
      title: 'Data Loaded Successfully',
      message: `Successfully loaded ${sec_officials.value.length} SEC official records. You can now filter and search the data.`,
      type: 'success',
      duration: 5000,
      position: 'top-right'
    })

  } catch (error) {
    // Handle errors here
    console.error('Error:', error);
    ElNotification({
      title: 'Error Loading Data',
      message: 'Failed to load SEC officials data. Please try refreshing the page.',
      type: 'error',
      duration: 5000,
      position: 'top-right'
    })
  } finally {
    // Reset loading state
    loading.value = false;
    fetchingData.value = false;
    dataFetchStatus.value = '';
  }
};

const fetchSettlements = async () => {
  const payload: any = {
    project: '1',
    token: localStorage.getItem('collectorToken')
  }

  // Add county filtering if user is county level
  if (userInfo && userInfo.roles) {
    const countyRole = userInfo.roles.find(role =>
      role.user_roles?.location_level === "county" && role.user_roles?.county_id
    );

    if (countyRole) {
      let countyName: string | null = null;
      
      // First try to get county name from countyListFromSettlements
      const countyData = countyListFromSettlements.value.find(c =>
        String(c.value) === String(countyRole.user_roles.county_id)
      );

      if (countyData) {
        countyName = countyData.label;
      } else {
        // Fallback: fetch county name from API
        try {
          const countyResponse = await getCountyByIdApi(countyRole.user_roles.county_id);
          if (countyResponse && countyResponse.data) {
            countyName = countyResponse.data.name;
          }
        } catch (error) {
          console.error('Error fetching county name:', error);
        }
      }

      if (countyName) {
        // For settlements, filter by county_name
        payload.filters = ['county_name'];
        payload.filterValues = [[countyName]];
        payload.filterOperator = ['in'];
      }
    }
  }
  try {
    const res = await getSettlements(payload)
    settlementsList.value = res.data || []
    if (!settlementsList.value.length) {
      console.warn('Settlements list is empty')
    }
  } catch (error) {
    console.error('Fetch settlements error:', error)
    ElNotification({
      title: 'Error',
      message: 'Failed to fetch settlements list',
      type: 'error'
    })
  }
}

// Backend path used in Sett.vue: fetch settlements filtered by county from main DB
const fetchSettlementsByCounty = async (countyId: string | number) => {
  const numericCountyId = Number(countyId)
  if (!countyId || Number.isNaN(numericCountyId)) return
  try {
    const formData: any = {
      model: 'settlement',
      filters: ['county_id'],
      filterValues: [[numericCountyId]],
      filterOperator: ['in'],
      limit: 500,
      page: 1,
      returnAll: true
    }
    const res = await getSettlementListByCounty(formData)
    const data: any[] = (res as any).data || (res as any).list || []
    settlementsList.value = data.map((s: any) => ({
      id: s.id || s.__id,
      code: s.code,
      sett_name: s.name || s.sett_name || s.settlement_name,
      county_name: s.county?.name || s.county_name,
      county_id: s.county_id
    }))
  } catch (error) {
    console.error('Fetch settlements by county error:', error)
    ElNotification({
      title: 'Error',
      message: 'Failed to fetch settlements for selected county',
      type: 'error'
    })
  }
}



const totalItems = ref<number>(0); // Total number of rows (initially full dataset)


console.log("projects--->", projects.value)
console.log("forms--->", forms.value)

loginUserToCollector()


totalItems.value = sec_officials.value.length


console.log("totalItems.value--->", totalItems.value)

const formatTitle = (attribute) => {
  // Replace underscores with spaces, capitalize first letter of each word
  return attribute
    .replace(/_/g, ' ') // Replace underscores with spaces
    .toLowerCase() // Convert to lowercase
    .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
};

const buildXml = () => {
  const now = new Date()
  const start = now.toISOString()
  const end = now.toISOString()
  const dateOnly = now.toISOString().slice(0, 10)
  const selectedEntity = settlementsList.value.find(
    (s) => s.code === createForm.group_location.settlement
  )
  const settlementLabel = selectedEntity?.sett_name || createForm.group_location.settlement
  const countyLabel =
    selectedEntity?.county_name ||
    countyListFromSettlements.value.find((c) => String(c.value) === String(createForm.group_location.county))?.label ||
    createForm.group_location.county

  const esc = (s = '') =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  const officialsXml = createForm.sec_officials
    .map(
      (o) => `
        <sec_officials>
          <category>${esc(o.category)}</category>
          <name>${esc(o.name)}</name>
          <national_id>${esc(o.national_id)}</national_id>
          <gender>${esc(o.gender)}</gender>
          <mobile>${esc(o.mobile)}</mobile>
          <position_select></position_select>
          <taken_select></taken_select>
          <sec_position>${esc(o.sec_position)}</sec_position>
        </sec_officials>`
    )
    .join('')

  const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })

  // Instance-only XML as required by Central; settlement uses entity name, code remains in pcode
  return `<?xml version="1.0"?>
<data id="sec_officials">
  <start>${esc(start)}</start>
  <end>${esc(end)}</end>
  <today>${esc(dateOnly)}</today>
  <group_location>
    <county>${esc(countyLabel)}</county>
    <settlement>${esc(settlementLabel)}</settlement>
    <settlement_new>${esc(createForm.group_location.settlement_new)}</settlement_new>
    <pcode>${esc(createForm.group_location.pcode)}</pcode>
  </group_location>
  ${officialsXml}
  <grp_certification>
    <returning_officer>${esc(createForm.grp_certification.returning_officer)}</returning_officer>
    <county_kisip_coordinator>${esc(createForm.grp_certification.county_kisip_coordinator)}</county_kisip_coordinator>
    <npct_representative>${esc(createForm.grp_certification.npct_representative)}</npct_representative>
  </grp_certification>
  <comments>${esc(createForm.comments)}</comments>
  <photo>${createForm.photo ? esc(createForm.photo.name) : ''}</photo>
  <sec_photo>
    <sec_register>${createForm.sec_register ? esc(createForm.sec_register.name) : ''}</sec_register>
  </sec_photo>
  <meta>
    <instanceID>uuid:${uuid()}</instanceID>
  </meta>
</data>`
}

const validateOfficialsData = () => {
  const len = createForm.sec_officials.length
  const positionSet = new Set()
  const nationalSet = new Set()

  for (let i = 0; i < len; i++) {
    const o = createForm.sec_officials[i]
    if (!o.category || !o.name || !o.national_id || !o.gender || !o.mobile || !o.sec_position) {
      return { ok: false, msg: `Row ${i + 1}: all fields are required.` }
    }

    if (!['member', 'Ex-official'].includes(o.sec_position)) {
      if (positionSet.has(o.sec_position)) {
        return { ok: false, msg: `Role ${o.sec_position} already selected.` }
      }
      positionSet.add(o.sec_position)
    }

    if (nationalSet.has(o.national_id)) {
      return { ok: false, msg: `National ID ${o.national_id} is duplicated.` }
    }
    nationalSet.add(o.national_id)
  }

  return { ok: true, msg: '' }
}

const validationState = computed(() => validateOfficialsData())
const submitDisabled = computed(() => !validationState.value.ok || creating.value)

const isPositionTaken = (pos, rowIndex) => {
  if (!pos || pos === 'member' || pos === 'Ex-official') return false
  return createForm.sec_officials.some((o, idx) => idx !== rowIndex && o.sec_position === pos)
}

const goNext = () => {
  if (activeStep.value === 0) {
    if (!createForm.group_location.county || !(createForm.group_location.settlement || createForm.group_location.settlement_new)) {
      validationMessage.value = 'County and settlement are required.'
      ElNotification({ title: 'Missing info', message: validationMessage.value, type: 'warning' })
      return
    }
    if (!createForm.group_location.settlement && createForm.group_location.settlement_new && !createForm.group_location.pcode) {
      validationMessage.value = 'Settlement code is required when adding a new settlement.'
      ElNotification({ title: 'Missing info', message: validationMessage.value, type: 'warning' })
      return
    }
    validationMessage.value = ''
    activeStep.value = 1
    return
  }

  if (activeStep.value === 1) {
    const state = validateOfficialsData()
    validationMessage.value = state.msg
    if (!state.ok) {
      ElNotification({ title: 'Incomplete officials', message: state.msg, type: 'warning' })
      return
    }
    activeStep.value = 2
  }
}

const goPrev = () => {
  if (activeStep.value > 0) activeStep.value -= 1
}

const openCreateDrawer = () => {
  resetCreateForm()
  activeStep.value = 0
  createDrawerVisible.value = true
}

const handleCountyChange = (val: string | number) => {
  createForm.group_location.county = val ? String(val) : ''
  createForm.group_location.settlement = ''
  createForm.group_location.pcode = ''
  // Fetch settlements from main backend (Sett.vue style) for this county if numeric id exists
  if (val && !Number.isNaN(Number(val))) {
    fetchSettlementsByCounty(val)
  }
}

const submitCreate = async () => {
  const state = validateOfficialsData()
  if (!state.ok) {
    validationMessage.value = state.msg
    ElNotification({ title: 'Cannot submit', message: state.msg, type: 'warning' })
    return
  }

  if (!createForm.group_location.settlement && createForm.group_location.settlement_new && !createForm.group_location.pcode) {
    validationMessage.value = 'Settlement code is required when adding a new settlement.'
    ElNotification({ title: 'Missing info', message: validationMessage.value, type: 'warning' })
    return
  }

  creating.value = true
  creatingStatus.value = 'Submitting SEC record...'

  try {
    // Update pcode from selected settlement if available
    const sel = settlementOptionsByCounty.value.find(
      (s) => s.value === createForm.group_location.settlement
    )
    if (sel) {
      createForm.group_location.pcode = sel.code
      // ensure settlement holds the selected code while label is used in XML
      createForm.group_location.settlement = sel.value
    }

    const xml = buildXml()
    const attachments: { name: string; content: string; contentType: string }[] = []
    if (createForm.photo) {
      attachments.push({
        name: createForm.photo.name,
        content: createForm.photo.base64,
        contentType: createForm.photo.contentType
      })
    }
    if (createForm.sec_register) {
      attachments.push({
        name: createForm.sec_register.name,
        content: createForm.sec_register.base64,
        contentType: createForm.sec_register.contentType
      })
    }

    const payload = {
      project: '1',
      form: 'sec_officials',
      token: localStorage.getItem('collectorToken'),
      xml,
      attachments
    }

    await createSubmission(payload)
    ElNotification({
      title: 'Success',
      message: 'SEC record created',
      type: 'success'
    })
    createDrawerVisible.value = false
    resetCreateForm()
    getSecData()
  } catch (error) {
    console.error('Create SEC error:', error)
    ElNotification({
      title: 'Error',
      message: 'Failed to create SEC record',
      type: 'error'
    })
  } finally {
    creating.value = false
    creatingStatus.value = ''
  }
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
  'sec_position',
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
    totalItems.value = sec_officials.value.length; // Reset total to initial value
  }
};

// Computed property for filtered data based on the search term

const county_value = ref()
const sett_value = ref()
const position = ref()
const category = ref()
const filteredData = computed(() => {
  //const searchTerm = search.value.toLowerCase();
  // if (searchTerm) {
  //   return sec_officials.value.filter((data) => {
  //     const nameMatch = data.name?.toLowerCase().includes(searchTerm);
  //     const settlementMatch = data.settlement?.toLowerCase().includes(searchTerm);
  //     const telephoneMatch = data.mobile?.toLowerCase().includes(searchTerm); // Assuming 'mobile' is the telephone number
  //     const idMatch = data.national_id?.toLowerCase().includes(searchTerm); // Assuming 'national_id' is the unique identifier
  //     const countyMatch = data.county?.toLowerCase().includes(searchTerm); // Assuming 'national_id' is the unique identifier
  //     const NPCTMatch = data.npct_representative?.toLowerCase().includes(searchTerm); // Assuming 'national_id' is the unique identifier

  //     return nameMatch || settlementMatch || telephoneMatch || idMatch ||countyMatch ||NPCTMatch;
  //   });
  // }

  // return sec_officials.value; // Return all data if no search term

  const searchTerm = search.value.toLowerCase();
  const selectedCounty = county_value.value;
  const selectedSettlement = sett_value.value;
  const selectedCategory= category.value;
  const selectedPosition= position.value;


  console.log(sec_officials.value)

  return sec_officials.value.filter((data) => {
    const countyMatch = selectedCounty ? data.county === selectedCounty : true;
  

    const settlementMatch = selectedSettlement && selectedSettlement.length > 0
      ? selectedSettlement.includes(data.settlement)
      : true;


    const categoryMatch = selectedCategory && selectedCategory.length > 0
      ? selectedCategory.includes(data.category)
      : true;

    const positionMatch = selectedPosition && selectedPosition.length > 0
      ? selectedPosition.includes(data.sec_position)
      : true;

    if (searchTerm) {
      const nameMatch = data.name?.toLowerCase().includes(searchTerm);
      const settlementTermMatch = data.settlement?.toLowerCase().includes(searchTerm);
      const telephoneMatch = data.mobile?.toLowerCase().includes(searchTerm);
      const idMatch = data.national_id?.toLowerCase().includes(searchTerm);
      const NPCTMatch = data.submitter?.toLowerCase().includes(searchTerm);

      return countyMatch && settlementMatch && (nameMatch || settlementTermMatch || telephoneMatch || idMatch || NPCTMatch);
    }

    return countyMatch && settlementMatch && categoryMatch && positionMatch;
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

watch(
  () => createForm.group_location.settlement,
  (val) => {
    const sel = settlementOptionsByCounty.value.find((s) => s.value === val)
    if (sel) {
      createForm.group_location.pcode = sel.code
    }
  }
)

watch(
  () => createForm.group_location.county,
  () => {
    createForm.group_location.settlement = ''
    createForm.group_location.pcode = ''
  }
)


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




const category_options =  [
  { "value": "structure_owner", "label": "Structure Owner" },
  { "value": "tenant", "label": "Tenant" },
  { "value": "youth", "label": "Youth" },
  { "value": "plwd", "label": "PLWD" },
  { "value": "ngo", "label": "NGO" },
  { "value": "faith_based", "label": "Faith-Based" },
  { "value": "widow", "label": "Widow" },
  { "value": "minority_marginalized", "label": "Minority Marginalized" },
  { "value": "chief", "label": "Chief" },
  { "value": "Asst. chief", "label": "Assistant Chief" },
  { "value": "Member of the County assembly", "label": "Member of the County Assembly" },
  { "value": "ward_admin", "label": "Ward Admin" }
]

const SEC_options =  [
{ "value": "chairperson", "label": "Chairperson" },
{ "value": "secretary", "label": "Secretary" },
  { "value": "organizing_secretary", "label": "Organizing Secretary" },
  { "value": "vice_chairperson", "label": "Vice Chairperson" },
  { "value": "member", "label": "Member" }
]


</script>

<template>
  <el-card>
    <!-- Status Alert -->
 

    <div v-loading="loading" element-loading-text="Loading data...">
    <el-row
type="flex" justify="start" :gutter="10"
      style="display: flex; flex-wrap: nowrap; align-items: center; margin-bottom:10px">

      <div class="max-w-200px">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>
      </div>

        <el-select
v-model="county_value" placeholder="Filter County" clearable filterable
        style=" margin-right: 5px;  width:250px">
          <el-option v-for="item in countyOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select
multiple
v-model="sett_value" placeholder="Filter Settlement" clearable filterable collapse-tags	
        style=" margin-right: 5px; width:350px">
          <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>

        <el-select
multiple  v-model="position" placeholder="Filter By Position" clearable filterable collapse-tags	
        style=" margin-right: 5px; width:350px">
          <el-option v-for="item in SEC_options" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>


        <el-select
multiple
v-model="category" placeholder="Filter By Category" clearable filterable collapse-tags	
        style=" margin-right: 5px; width:350px">
          <el-option v-for="item in category_options" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>


        <el-input
clearable v-model="search" placeholder="Search by Name, ID, Phone.."
        :onInput="filterTableData" style=" margin-right: 15px;" />

      <el-tooltip content="Add SEC" placement="top">
        <el-button type="primary" :icon="Plus" @click="openCreateDrawer" />
      </el-tooltip>

        <DownloadCustom :data="paginatedData" :all="sec_officials" />


    </el-row>


<!-- 
    <el-table-v2 :columns="columnsx" :data="paginatedData" :width="width" :height="450" fixed>
      <template #empty>
        <div class="flex items-center justify-center h-100%">
          <el-empty />
        </div>
      </template>
    </el-table-v2> -->



    <el-table
      :data="paginatedData"
      row-key="national_id"
      style="width: 100%"
    >
    
      <el-table-column property="name" label="Name"  sortable />
      <el-table-column property="gender" label="Gender" />
      <el-table-column property="category" label="Category" sortable />
      <el-table-column property="sec_position" label="Position" sortable />
      <el-table-column property="mobile" label="Phone" />
      <el-table-column property="date" label="Date formed"  sortable/>

       <el-table-column label="Location">
        <template #default="{ row }">
          {{ row.settlement ? row.settlement + ', ' : '' }}{{ row.county }}
        </template>
      </el-table-column>
  </el-table>
  


    <div style="margin-top: 20px;">
      <!-- Pagination component -->

      <el-pagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
        v-model:page-size="pageSize" :page-sizes="[5, 10,  20, 50, 100,1000,10000]" :total="totalItems" :background="true"
        @size-change="handlePageSizeChange" @current-change="handlePageChange" class="mt-4" />

    </div>
    </div>

  </el-card>

  <el-drawer v-model="createDrawerVisible" title="Create SEC Record" size="45%">
    <el-steps :active="activeStep" finish-status="success" align-center style="margin-bottom: 16px;">
      <el-step title="Location" description="County & settlement" />
      <el-step title="Officials" description="Officials list" />
      <el-step title="Review & Submit" />
    </el-steps>

    <div v-if="activeStep === 0">
      <el-form label-position="top">
        <el-row :gutter="10">
          <el-col :xs="24" :sm="12" :md="12">
            <el-form-item label="County">
              <el-select
                v-model="createForm.group_location.county"
                filterable
                clearable
                placeholder="Select county"
                @change="handleCountyChange"
              >
                <el-option v-for="c in countyListFromSettlements" :key="c.value" :label="c.label" :value="c.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="12">
            <el-form-item label="Settlement">
              <el-select
                v-model="createForm.group_location.settlement"
                filterable
                clearable
                placeholder="Select settlement"
                :disabled="disableSettlementSelect"
              >
                <el-option v-for="s in settlementOptionsByCounty" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="10">
          <el-col :xs="24" :sm="12" :md="12">
            <el-form-item label="Settlement (new if not listed)">
              <el-input
                v-model="createForm.group_location.settlement_new"
                placeholder="New settlement name"
                :disabled="disableSettlementNew"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="12">
            <el-form-item label="Settlement Code">
              <el-input
                v-model="createForm.group_location.pcode"
                placeholder="Enter settlement code"
                :disabled="disablePcode"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="10">
          <el-col :xs="24" :sm="12" :md="12">
            <el-form-item label="Comments">
              <el-input v-model="createForm.comments" type="textarea" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="10">
          <el-col :xs="24" :sm="12" :md="12">
            <el-form-item label="Committee Photo">
              <input type="file" accept="image/*" @change="handlePhotoChange" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="12">
            <el-form-item label="Register Photo">
              <input type="file" accept="image/*" @change="handleRegisterChange" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <div v-else-if="activeStep === 1">
      <div style="margin-bottom: 10px;">
        <el-button type="primary" plain size="small" @click="addOfficial">Add Official</el-button>
        <span style="margin-left: 8px; color: #909399;">Roles must be unique except Member / Ex-official.</span>
      </div>
      <el-alert
        v-if="!validationState.ok"
        type="info"
        :title="validationState.msg || 'Fill all required fields and avoid duplicate roles/IDs.'"
        show-icon
        style="margin-bottom: 8px;"
      />
      <el-table :data="createForm.sec_officials" border size="small" style="width: 100%;">
        <el-table-column type="index" width="50" label="#" />
        <el-table-column label="Category">
          <template #default="{ row }">
            <el-select v-model="row.category" filterable placeholder="Category" size="small">
              <el-option v-for="item in category_options" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="Name">
          <template #default="{ row }">
            <el-input v-model="row.name" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="National ID">
          <template #default="{ row }">
            <el-input v-model="row.national_id" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="Gender">
          <template #default="{ row }">
            <el-select v-model="row.gender" placeholder="Gender" size="small">
              <el-option v-for="g in ['male','female']" :key="g" :label="g" :value="g" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="Mobile">
          <template #default="{ row }">
            <el-input v-model="row.mobile" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="Position">
          <template #default="scope">
            <el-select v-model="scope.row.sec_position" filterable placeholder="Position" size="small">
              <el-option
                v-for="item in SEC_options"
                :key="item.value"
                :label="item.label"
                :value="item.value"
                :disabled="isPositionTaken(item.value, scope.$index)"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column width="100" label="Remove">
          <template #default="{ $index }">
            <el-button type="danger" size="small" @click="removeOfficial($index)" :disabled="createForm.sec_officials.length <= 1">Remove</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-else>
      <el-alert
        v-if="!validationState.ok"
        type="warning"
        :title="validationState.msg || 'Complete officials list to enable submit.'"
        show-icon
        style="margin-bottom: 12px;"
      />
      <el-descriptions title="Group Location" :column="2" border>
        <el-descriptions-item label="County">{{ createForm.group_location.county }}</el-descriptions-item>
        <el-descriptions-item label="Settlement">
          {{
            settlementOptionsByCounty.find((s) => s.value === createForm.group_location.settlement)?.label ||
            createForm.group_location.settlement
          }}
        </el-descriptions-item>
        <el-descriptions-item label="PCODE">{{ createForm.group_location.pcode }}</el-descriptions-item>
        <el-descriptions-item label="Comments">{{ createForm.comments }}</el-descriptions-item>
      </el-descriptions>
      <el-row :gutter="10" style="margin-top: 12px;">
        <el-col :xs="24" :sm="12" :md="8">
          <el-form-item label="Returning Officer">
            <el-input v-model="createForm.grp_certification.returning_officer" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-form-item label="County KISIP Coordinator">
            <el-input v-model="createForm.grp_certification.county_kisip_coordinator" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-form-item label="KISIP NPCT Representative">
            <el-input v-model="createForm.grp_certification.npct_representative" />
          </el-form-item>
        </el-col>
      </el-row>
      <div style="margin-top: 12px;">
        <el-table :data="createForm.sec_officials" border>
          <el-table-column type="index" width="50" label="#" />
          <el-table-column prop="name" label="Name" />
          <el-table-column prop="national_id" label="National ID" />
          <el-table-column prop="gender" label="Gender" />
          <el-table-column prop="mobile" label="Mobile" />
          <el-table-column prop="sec_position" label="Position" />
          <el-table-column prop="category" label="Category" />
        </el-table>
      </div>
    </div>

    <template #footer>
      <div style="display: flex; justify-content: space-between; width: 100%;">
        <div>
          <el-button @click="createDrawerVisible = false">Cancel</el-button>
        </div>
        <div>
          <el-button v-if="activeStep > 0" @click="goPrev">Previous</el-button>
          <el-button v-if="activeStep < 2" type="primary" @click="goNext">Next</el-button>
          <el-button v-else type="primary" :loading="creating" :disabled="submitDisabled" @click="submitCreate">Submit</el-button>
        </div>
      </div>
    </template>
  </el-drawer>

</template>
