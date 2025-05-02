<script setup lang="ts">
import { onMounted, reactive, computed } from 'vue'
import {
  ElButton, ElTimeline, ElTimelineItem, ElCol, ElRow, ElForm, ElFormItem, ElInput, ElUpload, ElMessage,ElPopconfirm, 
  ElCard, ElTabs, ElTabPane, ElTable, ElTableColumn, ElTooltip, ElDialog, ElSelect, ElOption, ElIcon, ElCollapse, ElCollapseItem, ElSwitch, ElDatePicker,
} from 'element-plus'
// Locally
import { getOneGrievance } from '@/api/grievance'
import { uploadGrievanceDocuments, logGrievanceAction, getActionFile, updateGrievanceStatus, sendOverdueReminder,
  updateGrievance, sendAcknowledgement, deleteCascade,revertGrievanceHistory,getGrievanceHistoryByGrievanceId} from '@/api/grievance'
import { uuid } from 'vue-uuid'


import { Icon } from '@iconify/vue';
import {
  Download, CaretRight, Check, Close, Lock, Notification, Microphone,Delete,Edit,ArrowLeft,RefreshLeft,
  ArrowRight,
} from '@element-plus/icons-vue'

import {
  getOneGeo,
  getOneSettlement,
  getSettlementListByCounty,
  getfilteredGeo
} from '@/api/settlements'
import { getCountyAuth, getSettlementByCountyAuth } from '@/api/register'
import type { UploadUserFile } from 'element-plus'

import {   getGRMStaffByLocation } from '@/api/users'


import { ref } from 'vue'

import '@dafcoe/vue-collapsible-panel/dist/vue-collapsible-panel.css'
import { useRoute } from 'vue-router'
import { Back } from '@element-plus/icons-vue'

import { useRouter } from 'vue-router'
import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'

import {
  signupGRM
} from '@/api/register'


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

 
const isSuperAdmin = ref(userInfo.roles.some(role => role.name === "super_admin"));

console.log('userInfo',isSuperAdmin.value)

function getLocationLevels(user) {
  // Check if the 'roles' array exists and has data
  if (user && user.roles && Array.isArray(user.roles)) {
    // Extract the location_level from each role
    return user.roles.map(role => role.user_roles.location_level).filter(level => level); // Filter to remove null/undefined values
  }
  return []; // Return an empty array if no roles exist
}


const current_user_roles = getLocationLevels(userInfo)

console.log('current_user_roles', current_user_roles)

const activeName = ref('details')
// Resolve, Escalate, Documentation 

const route = useRoute()

const Grievance = ref(
  {
    'code': null,
    'complainant': null,
    'telephone': null,
    'county': null,
    'settlement': null,
    'nature': null,
    'is_GBV': null,
    'description': null,
    'status': null,
    'plea': null,
    'date_reported': null
  }
)



const GrievanceDocuments = ref([])

const GrievanceLogs = ref([])
const GrievanceNotifications = ref([])

//// ------------------parameters -----------------------////

//const associated_Model = ''
const associated_multiple_models = ['county', 'settlement', 'grievance_document', 'grievance_notification', {
  "name": "grievance_log",
  "nestedAssociations": ["users", "grievance_document"]
}]

const formattedLabels = {}
const formatLabel = async (key) => {
  // Convert key to string and replace underscores with spaces
  let formattedKey = String(key).replace(/_/g, ' ');

  // Convert formattedKey to proper case
  formattedKey = formattedKey.replace(/\b\w/g, char => char.toUpperCase());

  console.log('formattedKey', formattedKey)
  return formattedKey;
};


function formatSentence(text) {


  // Replace underscores with spaces
  let formattedText = String(text).replace(/_/g, ' ');

  // Capitalize the first letter
  formattedText = formattedText.charAt(0).toUpperCase() + formattedText.slice(1);

  // Ensure proper punctuation and spacing
  // This is a basic example; you might need more complex rules based on requirements
  formattedText = formattedText.replace(/(\.\s*)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());

  return formattedText;
}


const button_label = ref()
const button_color = ref()
const button_icon = ref()
const button_disabled = ref(true)

const StatusOptions = ref([
  {
    value: 'Sorting',
    label: 'Sorting',
  },
  {
    value: 'Investigation',
    label: 'Investigate Grievance',
  },
  {
    value: 'Under Review',
    label: 'Under Review (in progress)',
  },
  {
    value: 'Escalated',
    label: 'Escalate ',
  },
  {
    value: 'Resolved',
    label: 'Resolve Grievance',
  },
  {
    value: 'Rejected',
    label: 'Reject Grievance',
  },
  {
    value: 'In Court',
    label: 'In Court',
  },

  {
    value: 'Referred',
    label: 'Refer Grievance',
  },
  {
    value: 'Closed',
    label: 'Close Grievance',
  },
])


const showActionButton=ref(true)

const FullGrievanceData=ref()

const showRefferalField=ref(false)
const shouldShowReminder=ref(false)
 

const processGrievance = async() => { 
  const id = route.params.id
  const formData = {}
  formData.associated_multiple_models = associated_multiple_models
  formData.id = id

  const res = await getOneGrievance(formData)
  console.log('FullGrievanceData', res.data)
  FullGrievanceData.value=res.data
  shouldShowReminder.value= new Date(res.data.status_expiry_date) < new Date();
  console.log(  'shouldShowReminder.value', getStageDuration(res.data.status))

  // Get the Details of the Grievance
  Grievance.value.id = id
  Grievance.value.code = res.data.code
  Grievance.value.complainant = res.data.name
  Grievance.value.telephone = res.data.phone
  Grievance.value.county = res.data.county.name
  Grievance.value.settlement = res.data.settlement.name
  Grievance.value.nature = res.data.nature
  Grievance.value.is_GBV = res.data.isgbv
  Grievance.value.description = res.data.description
  Grievance.value.status = res.data.status
  Grievance.value.date_reported = res.data.date_reported
  Grievance.value.plea = res.data.plea
  Grievance.value.current_level = res.data.current_level


  if(Grievance.value.status =='Closed' || Grievance.value.status =='In Court' ) {
   showActionButton.value=false
  } else {
    showActionButton.value=true
  }

  console.log('res.data.current_level', res.data.current_level)
  console.log('current_user_roles', current_user_roles[0])

  if (current_user_roles[0] === res.data.current_level || current_user_roles[0]  == "national") {
//  if (current_user_roles[0] == res.data.current_level) {
    console.log('user roles matches grievances', current_user_roles[0]  )
    button_disabled.value = false

  } else {


    button_disabled.value = true
  } 

  if (Grievance.value.status == 'Sorting') {
    button_label.value = 'Review and Sort';
    button_color.value = 'primary';
    button_icon.value = 'icon-park-solid:sort';

    StatusOptions.value = [
      {
        value: 'Rejected',
        label: 'Reject Grievance',
      },
      {
        value: 'Investigation',
        label: 'Investigating Grievance',
      },

      {
    value: 'Under Review',
    label: 'Under Review (in progress)',
    },
      {
        value: 'Escalated',
        label: 'Escalate',
      },
      {
        value: 'Referred',
        label: 'Refer Grievance',
      },
      {
        value: 'Resolved',
        label: 'Resolve Grievance',
      },

      

    ]


  }
  else if (Grievance.value.status == 'Investigation') {
    button_label.value = 'Review Status';
    button_color.value = 'warning';
    button_icon.value = 'icon-park-solid:preview-open';

    StatusOptions.value = [
      {
        value: 'Resolved',
        label: 'Resolve Grievance',
      },
      {
        value: 'Escalated',
        label: 'Escalate',
      },
      {
    value: 'Under Review',
        label: 'Under Review (in progress)',
      },
      {
        value: 'Referred',
        label: 'Refer Grievance',
      },
      {
        value: 'Rejected',
        label: 'Reject Grievance',
      },
    ]
  }

  else if (Grievance.value.status == 'Under Review') {
    button_label.value = 'Review Status';
    button_color.value = 'warning';
    button_icon.value = 'icon-park-solid:preview-open';

    StatusOptions.value = [
    {
    value: 'Under Review',
    label: 'Under Review (in progress)',
  },
      {
        value: 'Resolved',
        label: 'Resolve Grievance',
      },
      {
        value: 'Escalated',
        label: 'Escalate',
      },
     
      {
        value: 'Referred',
        label: 'Refer Grievance',
      },
      {
        value: 'Rejected',
        label: 'Reject Grievance',
      },
    ]
  }

   else if (Grievance.value.status == 'Escalated') {
    button_label.value = 'Review Status';
    button_color.value = 'warning';
    button_icon.value = 'icon-park-solid:preview-open';

    StatusOptions.value = [
      {
        value: 'Resolved',
        label: 'Resolve Grievance',
      },
      {
        value: 'Investigation',
        label: 'Investigating Grievance',
      },
      {
    value: 'Under Review',
        label: 'Under Review (in progress)',
      },
      {
        value: 'Escalated',
        label: 'Escalate',
      },

      {
        value: 'Referred',
        label: 'Refer Grievance',
      },
      {
        value: 'Rejected',
        label: 'Reject Grievance',
      },
    ]



     // If grievance is at national level, remove some options
     if (Grievance.value.current_level === 'national') {
        StatusOptions.value = StatusOptions.value.filter(option => 
          option.value !== 'Escalated' && option.value !== 'Referred'
        );

           // Add option to send back to county
     StatusOptions.value.push({
          value: 'Returned',
          label: 'Send Back to County',
        });
    }
  

       // If grievance is at county level
       if (Grievance.value.current_level === 'county') {
        // Add option to send back to settlement
        StatusOptions.value.push({
          value: 'Returned',
          label: 'Send Back to Settlement',
        });
    }
  }

  else if (Grievance.value.status == 'Referred') {
    button_label.value = 'Review Status';
    button_color.value = 'warning';
    button_icon.value = 'icon-park-solid:preview-open';

    StatusOptions.value = [
      {
        value: 'Resolved',
        label: 'Resolve Grievance',
      },
      {
        value: 'Investigation',
        label: 'Investigating Grievance',
      },
      {
    value: 'Under Review',
        label: 'Under Review (in progress)',
      },
      {
        value: 'Escalated',
        label: 'Escalate',
      },

      {
        value: 'Referred',
        label: 'Refer Grievance',
      },
      {
        value: 'Rejected',
        label: 'Reject Grievance',
      },
    ]



     // If grievance is at national level, remove some options
     if (Grievance.value.current_level === 'national') {
        StatusOptions.value = StatusOptions.value.filter(option => 
          option.value !== 'Escalated' && option.value !== 'Referred'
        );

           // Add option to send back to county
     StatusOptions.value.push({
          value: 'Returned',
          label: 'Send Back to County',
        });
    }
  

       // If grievance is at county level
       if (Grievance.value.current_level === 'county') {
        // Add option to send back to settlement
        StatusOptions.value.push({
          value: 'Returned',
          label: 'Send Back to Settlement',
        });
    }
  }

  else if (  Grievance.value.status == 'ExternalReferral'  ) {
    button_label.value = 'Review Status';
    button_color.value = 'warning';
    button_icon.value = 'icon-park-solid:preview-open';


    StatusOptions.value = [
      {
        value: 'Closed',
        label: 'Close Grievance',
      }
    ]
  }

  else if (Grievance.value.status == 'In Court') {
    button_label.value = 'Review Status';
    button_color.value = 'warning';
    button_icon.value = 'icon-park-solid:preview-open';

    StatusOptions.value = [
      {
        value: 'Closed',
        label: 'Close Grievance',
      }
    ]
  }
 
  else if (Grievance.value.status == 'Closed') {
    button_label.value = 'Review Status';
    button_color.value = 'warning';
    button_icon.value = 'icon-park-solid:preview-open';

    StatusOptions.value = [
      {
        value: 'Referred',
        label: 'Refer to Court',
      }

    ]


  }

  else if (Grievance.value.status == 'Resolved') {
    button_label.value = 'Review/Close grievance';
    button_color.value = 'success';
    button_icon.value = 'typcn:tick';

    StatusOptions.value = [
      {
        value: 'Closed',
        label: 'Close Grievance',
      },
    
    ]


  }

 
  else {
    button_label.value = 'Review Status';
    button_color.value = 'warning';
    button_icon.value = 'icon-park-solid:preview-open';

    StatusOptions.value = [
      {
        value: 'Sorting',
        label: 'Sorting',
      },
      {
        value: 'Investigation',
        label: 'Investigating Grievance',
      },

      {
        value: 'Escalated',
        label: 'Escalated',
      },
      {
        value: 'Resolved',
        label: 'Resolved',
      },

      {
        value: 'Referred',
        label: 'Refer Grievance',
      },
      {
        value: 'Closed',
        label: 'Closed',
      },
    ]
  }



// Check if level is 'county' or 'national', then add the external agency option
if (res.data.current_level  == 'county' || res.data.current_level  == 'national') {
  showRefferalField.value=true
  StatusOptions.value.push({
    value: 'ExternalReferral',
    label: 'Refer to External Agency',
  });
}else {
  showRefferalField.value=false

}



  // if(res.data.status=='Escalated'){
  //   action.value='Escalated'
  // }
  // else if (res.data.status=='Resolved')  {
  //   action.value=='Resolve'
  // }



  for (const key in Grievance.value) {
    formattedLabels[key] = await formatLabel(key);
  }

  console.log('formattedLabels.value', formattedLabels)
  // Get the Greivance Documents 

  GrievanceDocuments.value = res.data.grievance_documents
  GrievanceLogs.value = res.data.grievance_logs
  GrievanceNotifications.value = res.data.grievance_notifications

  console.log('Grievance.value', Grievance.value)
  console.log('GrievanceDocuments.value', GrievanceDocuments.value)
  console.log('GrievanceLogs.value', GrievanceLogs.value)
  console.log('GrievanceNotifications.value', GrievanceNotifications.value)


}

function getDifferences(before, after, parentKey = '') {
  const differences = [];

  for (const key in before) {
    const currentKey = parentKey ? `${parentKey}.${key}` : key;

    if (typeof before[key] === 'object' && before[key] !== null) {
      if (Array.isArray(before[key])) {
        // Compare arrays deeply
        if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
          differences.push({
            field: currentKey,
            before: before[key].join(', '),
            after: (after[key] || []).join(', '),
          });
        }
      } else {
        // Recursively compare nested objects
        differences.push(...getDifferences(before[key], after[key] || {}, currentKey));
      }
    } else {
      // Compare primitive values
      if (before[key] !== after[key]) {
        differences.push({
          field: currentKey,
          before: before[key] || '',
          after: after[key] || '',
        });
      }
    }
  }

  return differences;
}



const editHistory = ref([])
const getGrievanceHistory = async (grievance_id) => {

const model = 'grievance_history'

const formData = {}
formData.model = model
formData.grievance_id = grievance_id



//-Search field--------------------------------------------
formData.searchField = 'name'
formData.excludeGeom = false
formData.associated_multiple_models = ['users']

//--Single Filter -----------------------------------------


// - multiple filters -------------------------------------
formData.filters = ['grievance_id']
formData.filterValues = [[grievance_id]]

//formData.cache_key = 'SeacrchByKey_' + search_string.value

//-------------------------
console.log("formData", formData)
//console.log(formData)
const res = await getGrievanceHistoryByGrievanceId(formData)

console.log('Greivance History collected........', res.data)
const rawHistory = res.data;

// Process the differences for nested properties
editHistory.value = rawHistory.map((record) => {
  const changes = record.changes;
  const differences = getDifferences(changes.before, changes.after);
  return {
    ...record,
    differences,
  };
});



}

const grmUsers=ref([])
const getGRMUsers = async () => {
 
  const formData = {}
 
  formData.model = 'users'
 
  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []
  formData.associated_multiple_models = ['settlement']
  formData.currentUser = currentUser
  formData.county_id = FullGrievanceData.value.county_id
  formData.settlement_id = FullGrievanceData.value.settlement_id
  formData.currentUser = currentUser
  formData.limit = 10000
  
  

  //-------------------------
  console.log('gettign getGRMStaff users --->', formData)
  const res = await getGRMStaffByLocation(formData)

  console.log('After getting getGRMStaff users', res)
   

  // Assuming res.data is an array of objects with name and phone
    grmUsers.value = res.data.map(user => ({
    label: user.name  + ' (' + user.phone  + ')' ,
    value: user.id,
  }));

 
 
}
const currentUser = wsCache.get(appStore.getUserInfo)


onMounted(async () => {
  await processGrievance()
  await getGRMUsers()
  await getGrievanceHistory(route.params.id)

})


// Computed property to transform grievance object into an array for el-table
const grievanceData = computed(() => {
  return Object.keys(Grievance.value).map(key => ({
    label: formatSentence(key),
    value: formatSentence(Grievance.value[key])
  }));
});


 

const sortedGrievanceLogs = computed(() => {
  return GrievanceLogs.value
    .map(log => ({
      ...log,
      action_type: log.action_type === "Escalated"
        ? log.current_level === "county" 
          ? "Escalated to county team for resolution" 
          : log.current_level === "national" 
            ? "Escalated to National team for resolution" 
            : log.action_type
        : log.action_type === "Returned"
          ? log.current_level === "county"
            ? "Returned to county team for review"
            : log.current_level === "settlement"
              ? "Returned to settlement GRC team for review"
              : log.action_type
          : log.action_type
    }))
    .slice()
    .sort((a, b) => new Date(b.date_actioned) - new Date(a.date_actioned));
});







console.log('sortedGrievanceLogs',sortedGrievanceLogs)


 
const sortedGrievanceNotifications = computed(() => {
  return GrievanceNotifications.value.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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


const form = ref({
  grievance_id: null,
  action_type: null,
  action_by: null,
  action: null,
  reffered_to: null,
  reffered_to_officer: null,
  date_actioned: null,
  prev_status: null,
  new_status: null,
  fileList: [],
  // resolution additional apramerts 
  resolution_date: null,
  filer_present: true,
  field_verification_conducted: false,
  field_investigations: null,
  agreement_reached: false,
  agreement: null,
  point_disagreement: null,
  issues: null,
});




const dialogFormVisible = ref(false)
const handlePreview = (file) => {
  console.log('Preview:', file);
};

const handleRemove = (file, fileList) => {
  console.log('Remove:', file, fileList);
};

const beforeRemove = () => {
  return true;
};

const handleExceed = () => {
  ElMessage.warning('You can only upload up to 3 files.');
};



 






const generatePDFform = async (grievance, action) => {
  const formData = {};

  console.log('grievance', grievance)

  if (grievance.status == 'Resolved') {
    // Additional properties based on the provided JSON object
    formData.type = "resolution"

    formData.grievance_id = grievance.id
    formData.project_phone = grievance.project_phone || 'Not Available';
    formData.settlement = grievance.settlement || null;
    formData.resolution_date = formatDate(action.resolution_date) || null;
    formData.filer_present = action.filer_present || null;
    formData.field_verification_conducted = action.field_verification_conducted || null;
    formData.agreement_reached = action.agreement_reached || null;
    formData.grc_chairman = action.grc_chairman || 'Not Available';
    formData.complainant = grievance.complainant || null;
    formData.agreement = action.agreement || null;
    formData.issues = action.issues || null;
    formData.field_investigations = action.field_investigations || null;
    formData.point_disagreement = action.point_disagreement || null;
    formData.date = formatDate(Date.now())

    console.log(formData);

    await sendAcknowledgement(formData)



  }







}



function getStageDuration(status) {
    const durations = {
        "Sorting": 7, // 7 days
        "Investigation": 14, // 14 days
        "Escalated": 14 , // 3 days
        "Resolved": 21,  // 3 days
        "Closed": 42,  // 3 days
  
    };
    return (durations[status] || 0)  ; // Convert days to milliseconds
}



const dynamicFormRef = ref<FormInstance>()

const submitResolutionForm = async () => {
  const formInstance = dynamicFormRef

  formInstance.value.validate(async (valid: boolean) => {
    if (valid) {
      form.value.grievance_id = Grievance.value.id
      form.value.action_type = form.value.new_status
      form.value.action_by = userInfo.id  // remember t change 
      form.value.date_actioned = new Date();
      form.value.prev_status = Grievance.value.status
      form.value.action_level = current_user_roles[0] ? current_user_roles[0] : 'settlement'
      //form.value.action =  'testing referral'

      let msg = ''
      if (form.value.new_status == 'Escalated') {
        if (current_user_roles[0] == 'settlement') {
          form.value.current_level = 'county';
          msg = "Your grievance has been escalated to the county.";
        } else {
          form.value.current_level = 'national';
          msg = "Your grievance has been escalated to the national team.";
        }
      } 
      else if (form.value.new_status == 'Returned') {
        if (current_user_roles[0] == 'county') {
          form.value.current_level = 'settlement';
          msg = "Your grievance has been referred to the settlement Grievance Redress team for resolution.";
        } else {
          form.value.current_level = 'county';
          msg = "Your grievance has been referred to the county team for resolution.";
        }
      } 
 
      else {
        form.value.current_level = Grievance.value.current_level;
        msg = form.value.action;
      }


      
      console.log(form.value.new_status)
      console.log(form.value.current_level)
      console.log(Grievance.value.current_level)

      form.value.action = 'Referred to ' + officerLabel.value +' : ' + form.value.action;

      console.log("checking issue.............",form.value)
      // Log the action 

      const res = await logGrievanceAction(form.value)


      /// Upload fies
      await uploadFiles(res.data.id, Grievance.value.id)


      const formData = {
        code: Grievance.value.code,
        new_status: form.value.new_status,
        recipient: Grievance.value.phone,
        grievance_id: Grievance.value.id,
        action: msg,
        current_level: form.value.current_level,
        current_status_date: new Date(),
        status_expiry_date: new Date(Date.now() + getStageDuration(form.value.new_status)),
        action_by: userInfo.id,
        action_level: current_user_roles[0] ? current_user_roles[0] : 'settlement',
        reffered_to_officer: form.value.reffered_to_officer , // Extract id or set to null
      };

      console.log('Udpate GRVs',formData)
      /// udpate the status
      const updatedGrievance = await updateGrievanceStatus(formData)

      await processGrievance()

      console.log('Old Grievance.value', Grievance.value)
      console.log('New Grievance.value', updatedGrievance)
 
      await generatePDFform(Grievance.value, res.data)


      ElMessage({
        message: res.message,
        type: 'success'
      })

      dialogFormVisible.value = false
    } else {
      console.log('is Not Valid')
      ElMessage({
        message: 'Please provide all required details',
        type: 'error'
      })    // felix - show message on success request 

    }
  });


};


const uploadFiles = async (action_id, grievance_id) => {
  const formData = new FormData();

  // Assuming `fileList` is an array of file objects and `grievance_id` is defined
  for (var i = 0; i < form.value.fileList.length; i++) {
    console.log('------>file', form.value.fileList[i]);
    formData.append('files', form.value.fileList[i].raw);
    formData.append('format', form.value.fileList[i].name.split('.').pop());
    formData.append('grievance_id', grievance_id);
    formData.append('action_id', action_id);
    formData.append('protected_file', true);
    formData.append('size', (form.value.fileList[i].raw.size / 1024 / 1024).toFixed(2));
    formData.append('code', uuid.v4());
  }

  // Printing out the contents of formData
  for (let [key, value] of formData.entries()) {
    console.log(`${key}: ${value}`);
  }

  const res = await uploadGrievanceDocuments(formData)

  console.log("Docuemnts Uploaded", res)




}
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}



const viewLoading = ref(false)

const downloadFile = async (data) => {
  console.log(data);
  viewLoading.value = true;
  const formData = {};
  formData.filename = data.name;
  formData.doc_id = data.id;
  formData.responseType = 'blob';

  // Add a flag to track if the download has started


  // Attach a 'beforeunload' event listener to the window
  window.addEventListener('beforeunload', () => {
    if (viewLoading.value) {
      console.log('Download has started.');
      viewLoading.value = false;
    }
  });

  try {
    const response = await getActionFile(formData);
    console.log(response);

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', data.name);
    document.body.appendChild(link);
    link.click();
    viewLoading.value = false;
  } catch (error) {
    ElMessage.error('Failed');
    viewLoading.value = false;
  }
};


const handleDelete = async () => { 
console.log(Grievance.value)

const formData = {}
  formData.model = 'grievance'
  formData.id = Grievance.value.id

  const response = await deleteCascade(formData);

  goBack()
  console.log(response)

}

const getActionClass =   (actionType) => {
  console.log('actionType',actionType)
    if (!actionType) return '';
    if (actionType.includes('Sorting')) return 'sorting-title';
    if (actionType.includes('Resolved')) return 'resolved-title';
    if (actionType.includes('Escalated'))  return 'escalated-title';
    if (actionType.includes('Reported')) return 'reported-title';
    if (actionType.includes('Referred')) return 'referred-title';
    if (actionType.includes('Closed')) return 'closed-title';
    if (actionType.includes('Rejected')) return 'rejected-title';
    return '';
  }
  
 
const EditDialogVisible=ref(false)

const handleCloseDialog = () => {
  EditDialogVisible.value = false
}


const countiesOptions=ref([])
const settlementOptions=ref([])

const getCounties = async () => {

const formData = {}
formData.model = 'county'
await getCountyAuth({}).then((response) => {
  console.log('List of counties:', response)
  //tableDataList.value = response.data
  var cnty = response.data

  cnty.forEach(function (arrayItem) {
    var countyOpt = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.name
    //  console.log(countyOpt)
    countiesOptions.value.push(countyOpt)
  })


  // sort by value
  countiesOptions.value.sort(function (a, b) {
    return a.value - b.value;
  });

})
}


const getSettlementByCounty = async (selectCounty) => {
  // nullify selection after change 
  settlementOptions.value = []
  grmForm.value.settlement_id = null


  console.log("County:", selectCounty)

  const formData = {}
  formData.model = 'settlement'
  await getSettlementByCountyAuth({ county_id: selectCounty }).then((response) => {
    console.log('List of settlement:', response)
    //tableDataList.value = response.data
    var opt = response.data

    opt.forEach(function (arrayItem) {
      var item = {}
      item.value = arrayItem.id
      item.label = arrayItem.name
      item.county_id = arrayItem.county_id
      item.subcounty_id = arrayItem.subcounty_id
      item.ward_id = arrayItem.ward_id

      settlementOptions.value.push(item)
    })


    // sort by value
    settlementOptions.value.sort(function (a, b) {
      return a.value - b.value;
    });

  })
}

const handleSelectSettlement = async (settlementId) => {
  console.log(settlementId)
  const filteredOptions = settlementOptions.value.filter(option => option.value === settlementId);
  console.log(filteredOptions[0].subcounty_id)
  grmForm.value.subcounty_id = filteredOptions[0].subcounty_id
  grmForm.value.ward_id = filteredOptions[0].ward_id

}



const grmForm = ref({
  name: '',
  gender: '',
  age: '',
  national_id: '',
  phone: '',
  email: '',
  county_id: '',
  settlement_id: '',
  address: '',
  nature: '',
  isgbv: false,
  description: '',
  plea: '',
  isInCourt:false,
  self_reported:false,
  reporter_name : userInfo.name,
  reporter_phone:userInfo.phone,
  witness: '',
  witness_phone: '',
  witness_statement: '',
});


const clickEdit = () => {

  getCounties()
  getSettlementByCounty(FullGrievanceData.value.county_id)
console.log(FullGrievanceData.value)
  grmForm.value = {
    name: FullGrievanceData.value.name || '',
    gender: FullGrievanceData.value.gender || '',
    age: FullGrievanceData.value.age || '',
    national_id: FullGrievanceData.value.national_id || '',
    phone: FullGrievanceData.value.phone || '',
    email: FullGrievanceData.value.email || '',
    county_id: FullGrievanceData.value.county_id || '',
    settlement_id: FullGrievanceData.value.settlement_id || '',
    address: FullGrievanceData.value.address || '',
    nature: FullGrievanceData.value.nature || '',
    isgbv: FullGrievanceData.value.isgbv ?? false, // Handle boolean values safely
    description: FullGrievanceData.value.description || '',
    plea: FullGrievanceData.value.plea || '',
    isInCourt: FullGrievanceData.value.isInCourt ?? false,
    self_reported: FullGrievanceData.value.self_reported ?? false,
    reporter_name: FullGrievanceData.value.reporter_name || userInfo.name, // Use existing user info as fallback
    reporter_phone: FullGrievanceData.value.reporter_phone || userInfo.phone,
    witness: FullGrievanceData.value.witness || '',
    witness_phone: FullGrievanceData.value.witness_phone || '',
    witness_statement: FullGrievanceData.value.witness_statement || '',
   };
  EditDialogVisible.value = true

}
 


const saveGrievance = async () => {
  const formInstance = dynamicFormRef

  formInstance.value.validate(async (valid: boolean) => {
    if (valid) {
      form.value.grievance_id = Grievance.value.id
      form.value.action_type = 'Edit'
      form.value.action_by = userInfo.id  // remember t change 
      form.value.date_actioned = new Date();
      form.value.prev_status = Grievance.value.status
      form.value.action_level = current_user_roles[0] ? current_user_roles[0] : 'settlement'
      form.value.current_level = Grievance.value.current_level;
      form.value.new_status = Grievance.value.status;
 
      
      // Log the action 

    const res = await logGrievanceAction(form.value)


      /// Upload fies
      await uploadFiles(res.data.id, Grievance.value.id)

      const formData = {}
        formData.code = FullGrievanceData.value.code 
        formData.updatedData = grmForm.value  // Remove ambiguous fields


      /// udpate the status
     await updateGrievance(formData)

     await processGrievance()

     EditDialogVisible.value = false

      
     // await generatePDFform(Grievance.value, res.data)


      ElMessage({
        message: res.message,
        type: 'success'
      })

      dialogFormVisible.value = false
    } else {
      console.log('is Not Valid')
      ElMessage({
        message: 'Please provide all required details',
        type: 'error'
      })    // felix - show message on success request 

    }
  });


};


const validationRules = ({
  // Validation rules for each step
  step1: {
    name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
    gender: [{ required: true, message: 'Gender is required', trigger: 'change' }],
    age: [{ required: true, message: 'Age is required', trigger: 'change' }],
    national_id: [{ required: true, message: 'National ID is required', trigger: 'blur' }],
    phone: [{ required: true, message: 'Phone number is required', trigger: 'blur' }],

  },

  step2: {
    county_id: [{ required: true, message: 'County is required', trigger: 'change' }],
    settlement_id: [{ required: true, message: 'Settlement is required', trigger: 'change' }],
    nature: [{ required: true, message: 'Nature of complaint is required', trigger: 'change' }],
    description: [{ required: true, message: 'Description is required', trigger: 'blur' }],
    plea: [{ required: true, message: 'Plea/request is required', trigger: 'blur' }],
  },



});



const ageRanges = [
  { value: '18-25', label: '18-25' },
  { value: '26-35', label: '26-35' },
  { value: '36-45', label: '36-45' },
  { value: '46-55', label: '46-55' },
  { value: '56-65', label: '56-65' },
  { value: '65+', label: '65+' },
];




const currentStepRules = computed(() => {
  const stepRulesKey = `step${active.value + 1}`;
  console.log('stepRulesKey', stepRulesKey)
  return validationRules[stepRulesKey];
});


const active = ref(0);



const next = async () => {
  console.log(grmForm.value)
  const formInstance = dynamicFormRef
  formInstance.value.validate((valid: boolean) => {
    if (valid) {
      console.log(formInstance)
      active.value++;
    }
  });


};

const fileList = ref<UploadUserFile[]>([])



const prev = () => {
  active.value--;
};


const RevertEdits = async (data: TableSlotDefault) => {
  console.log('Reverts.....', data.row)

  const formData = {
    model: 'grievance',
    history_id: data.row.id,
  };

  const res = await revertGrievanceHistory(formData);
  console.log('Reverts success.....', res.data)
  //await getGrievanceHistory(route.params.id)


};


const rules = computed(() => ({
  action: [{ required: true, message: "Action is required", trigger: "blur" }],
  reffered_to: [{ required: true, message: "Name of organization is required", trigger: "blur" }],
  reffered_to_officer: [{ required: true, message: "The officer is required", trigger: "blur" }],


  


  new_status: [{ required: true, message: "Status is required", trigger: "blur" }],
  field_investigations: [{ required: true, message: "This is required", trigger: "blur" }],
  agreement_reached: [{ required: true, message: "This is required", trigger: "blur" }],
  field_verification_conducted: [{ required: true, message: "Status is required", trigger: "blur" }],
  filer_present: [{ required: true, message: "This is required", trigger: "blur" }],
  resolution_date: [{ required: true, message: "Resolution date is required", trigger: "blur" }],

  // fileList: [
  //   {
  //     required: form.value.new_status === "Resolved",
  //     message: "Please upload supporting documents",
  //     trigger: "change"
  //   }
  // ]
}));





const sendReminder =async (row) => {

 console.log(row)

 const formData = {}

 formData.grievance_id = row.id;
 formData.action_type = 'Reminder';
 formData.action_by = userInfo.id;
 formData.date_actioned = new Date();
 formData.prev_status = row.status;
 formData.new_status = row.status;
 formData.status = row.status;
 formData.action = "This is a reminder that grievance " + row.code + " is pending resolution and requires your attention. Kindly review and take the necessary action at your earliest convenience to ensure timely resolution.";
 
 formData.current_level = row.current_level;

      console.log("Submitting log...",formData);
     const res = await sendOverdueReminder(formData);

     
  // API Call Example:
  // axios.post("/api/reminder", { grievanceId: row.grievance_id })
};


function convertPhoneNumberX(phoneNumber: string | undefined) {

// console.log(phoneNumber)
let trimmedPhoneNumber = phoneNumber.replace(/\s+/g, '').trim();
console.log(trimmedPhoneNumber.startsWith('0'))


if (trimmedPhoneNumber.startsWith('0')) {
  trimmedPhoneNumber = '254' + trimmedPhoneNumber.slice(1);
}

console.log(trimmedPhoneNumber)
// return trimmedPhoneNumber;
formOfficer.optionPhone = trimmedPhoneNumber

}


function convertPhoneNumber(number) {
  // Remove leading plus sign (+) and any spaces
  number = number.replace(/\+/g, '').trim();

  // Check if the number starts with "254" or "+254"
  if (number.startsWith('254')) {
      // Replace "254" with "0"
      number = '0' + number.substring(3);
  }
  console.log(number)

  return number;
}


const isAdding = ref(false)

const onAddOption = () => {
  isAdding.value = true
}

 


const formOfficer = reactive({
  optionName: '',
  optionPhone: ''
});

const formRef = ref(null);

const onConfirm = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      console.log('Submit to create account');

      const formData = {
        username: formOfficer.optionPhone,
        name: formOfficer.optionName,
        phone: formOfficer.optionPhone,
        password: "User@2025",
        role: ["grm"],
        isactive:true,
        location_level: "national",
        location_id: formOfficer.optionPhone,
        location_field: "national"
      };

      signupGRM(formData).then((response) => {
        console.log(response);
        grmUsers.value.push({
          label: `${formOfficer.optionName} (${formOfficer.optionPhone})`,
          value: response.user.id,
        });
        // clear();
      });
    } else {
      console.log("Form validation failed");
    }
  });
};




const clear = () => {
//  optionName.value = ''
  isAdding.value = false
}


const officerLabel=ref()
const handleOfficerChange = (value) => {
    const selected = grmUsers.value.find(opt => opt.value === value);
    officerLabel.value = selected ? selected.label : '';
  };


  const validateKenyaPhone = (rule, value, callback) => {
        const cleaned = value.replace(/\s+/g, '');
        const pattern = /^(?:\+254|254|0)?(7\d{8}|1\d{8})$/;
        if (!value) {
          callback(new Error("Phone is required"));
        } else if (!pattern.test(cleaned)) {
          callback(new Error("Invalid Kenyan phone number"));
        } else {
          callback();
        }
      };

const OfficerRules = computed(() => ({
  optionName: [
    { required: true, message: "Name is required", trigger: "blur" }
  ],
  optionPhone: [
    { required: true, validator: validateKenyaPhone, trigger: "blur" }
  ]
}));



</script>

<template>
  <el-card>
 
    <template #header>
      <div class="card-header">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>

        {{ Grievance.code }} : {{ Grievance.complainant }}
      </div>
    </template>

    <el-tabs v-model="activeName" type="border-card" class="demo-tabs">
      <el-tab-pane label="Grievance Details" name="details">

        <el-card class="responsive-card">
          <el-table
              :data="grievanceData"
              style="width: 100%"
              size="small"
              :table-layout="'auto'"
              show-overflow-tooltip
            >
              <el-table-column prop="label" label="" width="150">
                <template #default="{ row }">
                  <span style="font-weight: bold">{{ row.label }}</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="value" label="">
                <template #default="{ row }">
                  <div style="white-space: normal; word-break: break-word;">
                    {{ row.value }}
                  </div>
                </template>
              </el-table-column>
            </el-table>


  <template #header v-if="showActionButton">
    <div class="dialog-footer">
      <el-tooltip
        content="Close the grievance if all issues have been resolved and complainant satisfied"
        placement="top"
      >
        <el-button
          :disabled="button_disabled"
          :type="button_color"
          @click="dialogFormVisible = true"
          size="small"
          class="responsive-button"
        >
          <Icon :icon="button_icon" /> {{ button_label }}
        </el-button>
      </el-tooltip>
      <el-button
        v-if="shouldShowReminder"
        type="warning"
        plain
        @click="sendReminder(FullGrievanceData)"
        size="small"
        class="responsive-button"
      >
        <Icon :icon="'icon-park-outline:remind'" style="margin-right: 10px;" /> Send Reminder
      </el-button>
    </div>
  </template>
</el-card>


      </el-tab-pane>
      <el-tab-pane label="Supporting Documentation" name="documents">
        <el-card>
          <el-table :data="GrievanceDocuments" style="width: 100%">
            <el-table-column type="index" width="50" />
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="createdAt" label="Uploaded" />
            <el-table-column fixed="right" label="">
              <template #default="scope">
                <el-button type="primary" @click="downloadFile(scope.row)">
                  <Icon icon="fa-solid:download" style="  margin-right: 5px;" />
                  Download
                </el-button>


              </template>
            </el-table-column>
          </el-table>



        </el-card>

      </el-tab-pane>
      <el-tab-pane label="Action Logs" name="timeline">

        <el-timeline style="max-width: 100%;">
          <el-timeline-item
v-for="(log, index) in sortedGrievanceLogs" :key="index" placement="top" color="green"
            :timestamp="formatDate(log.date_actioned)" timestamp-class="timestamp-class">

            <el-collapse accordion>
              <el-collapse-item :title="log.action_type" :name="log.action_type" :icon="CaretRight">
                <!-- Scoped slot for custom title -->
                <template #title>
                  <span :class="getActionClass(log.action_type)" >
                                <el-icon>
                      <CaretRight />
                    </el-icon>
 

                    {{ log.action_type }}
                  </span>
                </template>

                <el-card
class="notification-custom-card" shadow="hover" :class="log.action_type === 'Resolved' ? 'resolved-background' :
          log.action_type === 'Escalated' ? 'escalated-background' :
            log.action_type === 'Reported' ? 'reported-background' :
              log.action_type === 'Referred' ? 'referred-background' :
                log.action_type === 'Closed' ? 'closed-background' :
                  'info-background'">
                  <div class="notification-container">
                    <el-row align="middle" :gutter="10">
                      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" :gutter="10">
                        <!-- <p class="action-header">{{log.action_type}} </p> -->
                        <p class="action-body"> Comments: {{ log.action ? log.action : 'None' }}</p>
                        <p class="action-footer">By: {{ log.user ? log.user.name : 'System' }}</p>
                      </el-col>

                      <el-col v-if="log.grievance_documents.length > 0" :xs="24" :sm="24" :md="6" :lg="6" :xl="6">
                        <p class="documents-header">Documentation </p>

                        <p v-for="(doc, docIndex) in log.grievance_documents" :key="docIndex">

                          <el-button @click="downloadFile(doc)" link type="primary" size="small" :icon="Download">{{
          doc.name }}</el-button>

                        </p>
                      </el-col>
                    </el-row>
                  </div>
                </el-card>
              </el-collapse-item>
            </el-collapse>



          </el-timeline-item>


        </el-timeline>

      </el-tab-pane>


      <el-tab-pane label="Notifications" name="notifications">

        <el-timeline style="max-width: 100%;">
          <el-timeline-item
v-for="(notification, index) in sortedGrievanceNotifications" :key="index" placement="top"
            :timestamp="formatDate(notification.createdAt)" timestamp-class="timestamp-class"
            :color="notification.status == 'Success' ? 'green' : 'red'">
            <el-collapse>
              <el-collapse-item :name="notification.id" :icon="CaretRight" :title="notification.id">
                <!-- Scoped slot for custom title -->
                <template #title>
                  <span :class="notification.status === 'Success' ? 'success-title' : 'fail-title'">
                    <el-icon v-if="notification.status === 'Success'" class="success-icon" style="margin-right: 8px;">
                      <!-- Use a checkmark icon for success (Element Plus provides many options) -->
                      <Check />
                    </el-icon>

                    <el-icon v-if="notification.status != 'Success'" class="success-icon" style="margin-right: 8px;">
                      <!-- Use a checkmark icon for success (Element Plus provides many options) -->
                      <Close />
                    </el-icon>


                    {{ notification.message }}
                  </span>
                </template>

                <el-card
class="notification-custom-card" shadow="hover"
                  :class="notification.status === 'Success' ? 'success-background' : 'closed-background'">
                  <div class="notification-container">
                    <!-- Message -->
                    <p class="action-body">Message: {{ notification.message }}</p>
                    <p class="action-footer">Date: {{ notification.createdAt }}</p>
                    <p class="action-footer">Phone: {{ notification.recipient }}</p>                  
                    <p class="action-footer">Delivery Status: {{ notification.status }}</p>
                    <p class="action-footer">Sent By: {{ notification.user ? notification.user.name : 'System' }}</p>
                  </div>
                </el-card>
              </el-collapse-item>
            </el-collapse>
          </el-timeline-item>


        </el-timeline>

      </el-tab-pane>


      <el-tab-pane label="Settings" name="settings" v-if="isSuperAdmin">
 
        <div class="flex justify-end p-4">
        <el-button @click="clickEdit"  type="success" :icon="Edit"   plain>Edit</el-button>
          <el-popconfirm
width="340"
            title="Are you sure you want to delete this grievance?" 
            confirm-button-text="Yes" 
            cancel-button-text="No"
            @confirm="handleDelete"  >
            <template #reference>
              <el-button type="danger" :icon="Delete"   plain>Delete</el-button>
            </template>
          </el-popconfirm>

       </div>
       <el-table :data="editHistory" border ref="tableEditRef" >
              <el-table-column label="" type="expand" >
                <template #default="{ row }">
                  <el-table :data="row.differences" style="margin: 10px 0;" border >
                    <el-table-column prop="field" label="Field"  />
                    <el-table-column prop="before" label="Before"  class-name="italic-red" show-overflow-tooltip />
                    <el-table-column prop="after" label="After"  class-name="italic-green" show-overflow-tooltip  />
                  </el-table>
                </template>
              </el-table-column>

              <el-table-column label="Date Edited" prop="created_at" sortable class-name="td-bold">
                <template #default="scope">
                  {{ formatDate(scope.row.created_at) }}
                </template>
              </el-table-column>

              <el-table-column label="Edited By" prop="user.name" sortable  class-name="td-bold"/>
              <el-table-column fixed="right" label="Actions" width="100">
                <template #default="scope">
                  <el-tooltip content="Revert " placement="top">
                    <el-button type="warning" :icon="RefreshLeft" @click="RevertEdits(scope as TableSlotDefault)" />
                  </el-tooltip>
                </template>
              </el-table-column>
              </el-table>

      </el-tab-pane>

    </el-tabs>
  </el-card>


  <el-dialog title="Grievance Status Update" v-model="dialogFormVisible" width="60%" draggable>
    <el-form :model="form" label-width="auto" ref="dynamicFormRef" :rules="rules">

      <el-form-item label="Update Grievance Status" label-position="top" prop="new_status">
        <el-select v-model="form.new_status" placeholder="Select" style="width: 100%">
          <el-option v-for="item in StatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>


      <el-form-item label="Select Officer" label-position="top" prop="reffered_to_officer"   v-if="form.new_status == 'Referred'" >
     


        <el-select v-model="form.reffered_to_officer"  clearable filterable   placeholder="Select Officer"   @change="handleOfficerChange"  style="width: 100%">
                <el-option
                  v-for="item in grmUsers"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
                <template #footer>
                  <el-button v-if="!isAdding" text bg size="small" @click="onAddOption">
                    Add Officer
                  </el-button>
                  <template v-else>
                      <el-form :model="formOfficer" label-width="0" :rules="OfficerRules" ref="formRef">
                        <el-form-item prop="optionName" >
                          <el-input
                            v-model="formOfficer.optionName"
                            class="option-input"
                            placeholder="Name"
                            size="small"
                          />
                        </el-form-item>

                        <el-form-item prop="optionPhone">
                          <el-input
                            v-model="formOfficer.optionPhone"
                            class="option-input"
                            placeholder="Enter phone number (254.....)" 
                            size="small"
                            :onChange="convertPhoneNumberX" 
                          />
                        </el-form-item>

                        <el-form-item>
                          <el-button type="primary" size="small" @click="onConfirm">
                            Confirm
                          </el-button>
                          <el-button size="small" @click="clear">
                            Cancel
                          </el-button>
                        </el-form-item>
                      </el-form>
                    </template>

                </template>
              </el-select>


      </el-form-item>




      <el-row :gutter="2" v-if="form.new_status == 'Resolved'">
        <el-col :xs="8" :sm="8" :md="8" :lg="8" :xl="8">
          <el-form-item label="Was Filer Present? " label-position="top" prop="filer_present">
            <el-switch v-model="form.filer_present" />
          </el-form-item>
        </el-col>

        <el-col :xs="8" :sm="8" :md="8" :lg="8" :xl="8">
          <el-form-item
label="Was field verification of complaint conducted?  " label-position="top"
            prop="field_verification_conducted">
            <el-switch v-model="form.field_verification_conducted" />
          </el-form-item>
        </el-col>

        <el-col :xs="8" :sm="8" :md="8" :lg="8" :xl="8">
          <el-form-item label="Date of Resolution" label-position="top" prop="resolution_date">
            <el-date-picker v-model="form.resolution_date" type="date" placeholder="Select" />

          </el-form-item>
        </el-col>



      </el-row>

      <el-form-item
v-if="form.new_status == 'Resolved'" label="Findings of field investigation" label-position="top"
        prop="field_investigations">
        <el-input
type="textarea" :rows="2" placeholder="Provide details of the resolution  here"
          v-model="form.field_investigations" />
      </el-form-item>



      <el-row :gutter="2" v-if="form.new_status == 'Resolved'">
        <el-col :xs="8" :sm="8" :md="8" :lg="8" :xl="8">
          <el-form-item label="Was agreement reached on the issues?	" label-position="top" prop="agreement_reached">
            <el-switch v-model="form.agreement_reached" />
          </el-form-item>
        </el-col>
        <el-col :xs="16" :sm="16" :md="16" :lg="16" :xl="16">
          <el-form-item
v-if="form.agreement_reached" label="If agreement was reached, detail the agreement below:"
            label-position="top" prop="agreement">
            <el-input type="textarea" :rows="2" placeholder="Provide details of  here" v-model="form.agreement" />
          </el-form-item>

          <el-form-item
v-if="!form.agreement_reached"
            label="If agreement was not reached, specify the points of disagreement below" label-position="top"
            prop="point_disagreement">
            <el-input
type="textarea" :rows="2" placeholder="Provide details of  here"
              v-model="form.point_disagreement" />
          </el-form-item>


        </el-col>

      </el-row>




      <el-form-item v-if="form.new_status == 'Resolved'" label="Issues" label-position="top" prop="issues">
        <el-input
type="textarea" :rows="2" placeholder="Provide details of the resolution  here"
          v-model="form.issues" />
      </el-form-item>







      <el-form-item label="Describe the Action Taken" label-position="top" prop="action">
        <el-input
type="textarea" :rows="2" placeholder="Provide details of the resolution here"
          v-model="form.action" />
      </el-form-item>



      <el-form-item  v-if="form.new_status == 'ExternalReferral'"  label="Name of organization case reffered to" label-position="top" prop="reffered_to">
          <el-input
  type="textarea" :rows="2" placeholder="Name of organization "
            v-model="form.reffered_to" />
        </el-form-item> 


      <el-form-item label="Upload Documentation" label-position="top"  >
        <el-upload
class="upload-demo" action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple
          :on-preview="handlePreview" :on-remove="handleRemove" :before-remove="beforeRemove" :limit="3"
          v-model:file-list="form.fileList" :auto-upload="false" :on-exceed="handleExceed">

          <el-button type="primary" plain>
            <Icon icon="basil:file-upload-outline" width="24" /> Upload Documentation
          </el-button>
          <template #tip>
            <p>E.g Minutes, forms, e.t.c. These should be pdf/jpg/png files with a size less than 10MB.</p>
          </template>
        </el-upload>
      </el-form-item>

    </el-form>


    <div style="display: flex; justify-content: end; align-items: center; margin-top: 20px;">
      <el-button @click="dialogFormVisible = false">Cancel</el-button>
      <el-button type="primary" @click="submitResolutionForm">Submit</el-button>
    </div>
  </el-dialog>



  <el-dialog v-model="EditDialogVisible" @close="handleCloseDialog" title="Edit the Grievance" width="65%" draggable>

            <el-steps :active="active" finish-status="success">
              <el-step title="Complainant Details" />
              <el-step title="Grievance Details" />
              <el-step title="Review & Submit" />
            </el-steps>

            <el-form
            :model="grmForm" class="demo-form-inline" label-position="top" :rules="currentStepRules"
              ref="dynamicFormRef">
              <el-card shadow="hover">
                <el-row v-if="active === 0" :gutter="10">
                  <!-- Step 1: Personal Details -->
                  <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                    <el-form-item id="btn1" label="Name of Complainant" prop="name">
                      <el-input v-model="grmForm.name" placeholder="Enter name" style="width:90%" />
                    </el-form-item>

                    <el-form-item id="btn2" label="Gender" prop="gender">
                      <el-select v-model="grmForm.gender" placeholder="Select" style="width:90%">
                        <el-option label="Female" value="female" />
                        <el-option label="Male" value="male" />
                        <el-option label="Unspecified" value="unspecified" />
                      </el-select>
                    </el-form-item>

                    <el-form-item id="btn3" label="Age" prop="age">
                      <el-select v-model="grmForm.age" placeholder="Select" style="width:90%">
                        <el-option v-for="item in ageRanges" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                    </el-form-item>


                  </el-col>


                  <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                    <el-form-item id="btn4" label="National ID" prop="national_id">
                      <el-input v-model="grmForm.national_id" placeholder="Enter ID number" style="width:90%" />
                    </el-form-item>

                    <el-form-item id="btn5" label="Phone" prop="phone">
                      <el-input
            v-model="grmForm.phone" placeholder="Enter phone number" style="width:90%"
                        :onChange="convertPhoneNumber" />
                    </el-form-item>

                    <el-form-item id="btn6" label="Email" prop="email">
                      <el-input v-model="grmForm.email" placeholder="Enter Email" style="width:90%" />
                    </el-form-item>
                  </el-col>


                </el-row>



                <el-row v-if="active === 1" :gutter="10">
                  <!-- Step 2: Grievance Details -->
                  <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                    <el-form-item id="btn10" label="County" prop="county_id">
                      <el-select
            filterable v-model="grmForm.county_id" placeholder="County" @change="getSettlementByCounty"
                        style="width:90%">
                        <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                    </el-form-item>

                    <el-form-item id="btn11" label="Settlement" prop="settlement_id">
                      <el-select
            filterable v-model="grmForm.settlement_id" placeholder="Settlement"
                        @change="handleSelectSettlement" style="width:90%">
                        <el-option
            v-for="item in settlementOptions" :key="item.value" :label="item.label"
                          :value="item.value" />
                      </el-select>
                    </el-form-item>

                    <el-form-item id="btn12" label="Address" prop="address">
                      <el-input v-model="grmForm.address" placeholder="Enter address" style="width:90%" />
                    </el-form-item>



                    <el-checkbox id="btn13" v-model="grmForm.isgbv" label="Is this complaint related to Gender-Based Violence?" size="large" style="margin-bottom:5px" />




                  </el-col>
                  <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">

                    <el-checkbox id="btn13" v-model="grmForm.isInCourt" label="Is this complaint currently in court?" size="large" style="margin-bottom:5px" />
 


                    <el-form-item v-if="!grmForm.isgbv" id="btn14" label="Nature of Complaint" prop="nature">
                                  <el-select  filterable v-model="grmForm.nature" placeholder="Select category" style="width:90%">
                                    <el-option label="Land Ownership Disputes" value="land_ownership" />
                                    <el-option label="Evictions and Displacement" value="evictions" />
                                    <el-option label="Compensation Concerns" value="compensation" />
                                    <el-option label="Labour Wage Disputes" value="labour_wages" />
                                    <el-option label="Unfair Dismissal or Termination" value="unfair_dismissal" />
                                    <el-option label="Workplace Harassment" value="workplace_harassment" />
                                    <el-option label="Unsafe Working Conditions" value="unsafe_conditions" />
                                    <el-option label="Poor Road Conditions" value="poor_roads" />
                                    <el-option label="Water and Sanitation Issues" value="water_sanitation" />
                                    <el-option label="Electricity and Power Supply Concerns" value="electricity" />
                                    <el-option label="Inadequate Public Transport" value="public_transport" />
                                    <el-option label="Pollution Complaints" value="pollution" />
                                    <el-option label="Waste Management Issues" value="waste_management" />
                                    <el-option label="Public Health Hazards" value="public_health" />
                                    <el-option label="Deforestation or Land Degradation" value="deforestation" />
                                    <el-option label="Discrimination and Exclusion" value="discrimination" />
                                    <el-option label="Corruption and Mismanagement" value="corruption" />
                                    <el-option label="Others" value="others" />
                                  </el-select>
                                </el-form-item>

                                

                    <el-form-item id="btn15" label="Complaint Description" prop="description">
                      <el-input
            v-model="grmForm.description" type="textarea" rows="2" placeholder="Describe your complaint"
                        style="width:90%" />
                    </el-form-item>

                    <el-form-item id="btn16" label="Plea/Request" prop="plea">
                      <el-input
            v-model="grmForm.plea" type="textarea" rows="2" placeholder="Enter your plea/request"
                        style="width:90%" />
                    </el-form-item>
                  </el-col>


                </el-row>

                <el-row v-if="active === 2" :gutter="10">
                  <!-- Step 3: Review & Submit -->
                  <el-col :xs="12" :sm="21" :md="12" :lg="12" :xl="12">
                    <el-form-item id="btn17" label="Witness Name" prop="witness">
                      <el-input v-model="grmForm.witness" placeholder="Enter witness name" style="width:90%" />
                    </el-form-item>

                    <el-form-item id="btn18" label="Witness Phone" prop="witness_phone">
                      <el-input v-model="grmForm.witness_phone" placeholder="Enter witness phone" style="width:90%" />
                    </el-form-item>

                    <el-form-item id="btn19" label="Witness Statement" prop="witness_statement">
                      <el-input
            v-model="grmForm.witness_statement" type="textarea" placeholder="Enter witness statement"
                        style="width:90%" />
                    </el-form-item>
                  </el-col>


                  <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12">

                    <!-- <el-form-item id="btn17" label="Are you the complainant?" prop="witness">
                      <el-switch
            disabled v-model="grmForm.self_reported" class="ml-2" inline-prompt
                        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" active-text="Yes"
                        inactive-text="No" />
                    </el-form-item> -->

                    <el-form-item v-if="!grmForm.self_reported" id="btn18" label="Your Name" prop="reporter_name">
                      <el-input disabled v-model="grmForm.reporter_name" placeholder="Your Name" style="width:90%" />
                    </el-form-item>

                    <el-form-item v-if="!grmForm.self_reported" id="btn19" label="Your Phone" prop="reporter_phone">
                      <el-input
            disabled v-model="grmForm.reporter_phone" type="text" placeholder="Your Phone"
                        style="width:90%" />
                    </el-form-item>



                    <el-upload
            id="btn20" class="upload-demo"
                      action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple :on-preview="handlePreview"
                      :on-remove="handleRemove" :before-remove="beforeRemove" :limit="3" v-model:file-list="fileList"
                      :auto-upload="false" :on-exceed="handleExceed">
                      <el-button type="primary">Upload Supporting Documentation</el-button>
                      <template #tip>
                        <div class="el-upload__tip">pdf/jpg/png files with a size less than 500KB.</div>
                      </template>
                    </el-upload>





                  </el-col>

                </el-row>
              </el-card>
            </el-form>

            <template #footer>
              <div
            class="steps-navigation"
                style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                <div>
                 

                  <el-button id="btn9" v-if="active > 0" @click="prev" type="primary" :icon="ArrowLeft">Previous </el-button>
                </div>
                <div>
                  <el-button id="btn7" v-if="active < 2" type="primary" @click="next">
                    Next <el-icon class="el-icon--right">
                      <ArrowRight />
                    </el-icon>
                  </el-button>

 

                  <el-button
            id="btn2" v-if="active === 2" type="primary" @click="saveGrievance"
                    style="margin-left: 10px;">Save</el-button>
                 </div>
              </div>
            </template>
 </el-dialog>


</template>
<style scoped>
/* Custom styling for details container */
.details-container {
  margin-top: 20px;
}

/* Custom styling for each detail item */
.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  padding: 5px;
  border-bottom: 1px solid #eee;
}

/* Label styling */
.label-text {
  font-weight: bold;
  color: #333;

  width: 10%;
  /* Adjust as needed */
}

/* Value styling */
.value {
  width: 90%;
  /* Adjust as needed */

}

/* Ensure spacing between rows */
.el-row {
  margin-top: 20px;
}
 
:root {
  /* Light Mode Variables */
  --card-header-color: #333;
  --card-header-bg: #f9f9f9;
}

[data-theme="dark"] {
  /* Dark Mode Variables */
  --card-header-color: #ddd;
  --card-header-bg: #222;
}

.card-header {
  display: flex;
  font-weight: bold;
  font-size: 1.2rem;
  color: var(--card-header-color);
  background-color: var(--card-header-bg);
  padding: 10px;
  border-radius: 5px;
}

/* Custom styling for documents container */
.documents-container {
  margin-top: 20px;
}

.documents-container ul {
  list-style-type: none;
  padding: 0;
}

.documents-container li {
  margin-bottom: 10px;
}
</style>
<style scoped>
.action-col {
  padding: 10px;
}

.action-header {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1px;
  color: #333;
}

.documents-header {
  font-size: 0.95rem;
  font-weight: bold;
  margin-bottom: 1px;
  color: #837f7f;
}

.action-body {
  font-size: 1rem;
  font-weight: 200;
  color: #666;
}

.action-footer {
  font-size: 0.98rem;
  margin-top: 2px;
  font-weight: 300;
  color: #2e0dc2;
}

.success-background {
  background-color: rgba(226, 248, 231, 0.4);
  /* Light green with 80% opacity */
  color: #1bd847;
  /* Dark green text */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #c3e6cb;
  /* Border color */

}

.warning-background {
  background-color: rgba(255, 243, 205, 0.4);
  /* Light yellow with 80% opacity */
  color: #856404;
  /* Dark yellow text */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ffeeba;
  /* Border color */
}

.closed-background {
  background-color: rgba(255, 0, 0, 0.14);
  /* Red with 80% opacity */
  color: #fa0707;
  /* Darker text for contrast */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #fb050552;
  /* Lighter red border */
}

.referred-background {
  background-color: rgba(247, 155, 7, 0.2);
  /* Pink with 20% opacity */
  color: rgb(255, 192, 254);
  /* Same text color */
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #d6d6d6;
  /* Lighter pink border */
}

.success-title {
  color: rgb(25, 184, 60)
    /* Same text color */
}

.fail-title {
  color: #f21c26
    /* Same text color */

}

.resolved-title {
  color: #4CAF50;
  /* Green */
}

.sorting-title {
  color: #1b5ef0;
  /* Orange */
}


.escalated-title {
  color: #FF9800;
  /* Orange */
}

.reported-title {
  color: #e412be;
  /* Red */
}


.rejected-title {
  color: #e41212;
  /* Red */
}
.referred-title {
  color: #2196F3;
  /* Blue */
}

.resolved-background {
  background-color: rgba(220, 240, 220, 0.4);
  /* Light green with 80% opacity */
  color: #155724;
  /* Dark green text */
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #c3e6cb;
  /* Border color */
}

.escalated-background {
  background-color: rgba(255, 253, 206, 0.4);
  /* Light yellow with 80% opacity */
  color: #856404;
  /* Dark yellow text */
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #ffeeba;
  /* Border color */
}

.reported-background {
  background-color: rgba(237, 209, 242, 0.4);
  /* Light orange with 80% opacity */
  color: #7d3c98;
  /* Dark orange text */
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #e412be;
  /* Border color */
}

.referred-background {
  background-color: rgba(224, 240, 255, 0.4);
  /* Light cyan with 80% opacity */
  color: #0c5460;
  /* Dark cyan text */
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #bee5eb;
  /* Border color */
}

.closed-background {
  background-color: rgba(224, 240, 255, 0.4);
  /* Light cyan with 80% opacity */
  color: #333535;
  /* Dark cyan text */
  padding: 5px;
  border-radius: 5px;
  border: 1px dotted #333535;
  /* Border color */
}



.info-background {
  background-color: rgba(204, 229, 255, 0.4);
  /* Light blue with 80% opacity */
  color: #004085;
  /* Dark blue text */
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #b8daff;
  /* Border color */
}


.custom-card {
  padding: 5px;
  /* Reduce padding */
  margin: 5px 0;
  /* Adjust margin as needed */
  min-height: 10px;
  /* Set a minimum height if needed */
}


.notification-custom-card {
  padding: 5px;
  /* Reduce padding */
  margin: 2px 0;
  /* Adjust margin as needed */
  min-height: 5px;
  /* Set a minimum height if needed */
}


.timestamp-class {
  font-weight: bold;
  /* Example: Make it bold */
  color: #6c757d;
  /* Example: Set color */
  font-size: 14px;
  /* Example: Adjust font size */
  /* Add any additional styles as needed */
}
</style>




<style scoped>
.notification-card {
  border-radius: 12px;
  /* Rounded corners */
  padding: 20px;
  /* Internal padding */
}

.notification-container {
  display: flex;
  align-items: left;
  flex-direction: column;
  /* Ensures each <p> is on its own line */

}

.notification-icon {
  font-size: 24px;
  margin-right: 10px;
}

.success-message {
  color: #67C23A;
  /* Success color from Element Plus */
  font-weight: 500;
}

.fail-message {
  color: #f21c26;
  /* Success color from Element Plus */
  font-weight: 500;
}


.success-icon {
  font-size: 24px;
  margin-right: 10px;
}
</style>


<style scoped>
/* Apply styles to the internal collapse item header using ::v-deep */
::v-deep .el-collapse-item__header {
  background-color: #f4f4f5;
  /* Custom background color */
  border-radius: 5px;
  /* Round the corners */

}

::v-deep .el-collapse-item__header.is-active {
  border-bottom-color: transparent;
  background-color: #FFFFFF;
  border-radius: 5px;
  /* Round the corners */

}

.option-input {
  width: 100%;
  margin-bottom: 8px;
}
</style>
