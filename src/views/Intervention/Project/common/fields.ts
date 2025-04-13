import { reactive, unref, ref,onMounted } from "vue";
 
import {
  countyOptions,
  
   activityOptions,
  cascadedAdminOptions,
  implementationOptions,
  contractorOptions,prog_components  
} from "./index.ts";
 

 










const steps = [
  { title: "Identification" },
  { title: "Details" },
  // { title: "Geolocation" },
 
];

interface Field {
  name: string;
  label: string;
  type: string;
  id: string;
  // min: number;
  // max: number;
  multiselect: string; // Use boolean type instead of string
  adminUnit: boolean;
  options: Array<any>; // Specify the array type of options
}

interface FormRules {
  [key: string]: {
    [key: string]: {
      required?: boolean;
      type?: string;
      message?: string;
      trigger?: string;
    }[];
  };
}

interface FormData {
  [key: string]: any;
}

 


const scope = [
  { label: "National", value: "national" },
  { label: "County", value: "county" },
  { label: "Subcounty", value: "subcounty" },
  { label: "Ward", value: "ward" },
  { label: "Settlement", value: "settlement" },
];
const sourceFundingOptions = [
  { label: "Gok", value: 1 },
  { label: "IDA", value: 2 },
  { label: "AFD", value: 3 },
];
  
const YesNo = [
  { label: "Yes", value: 'Yes' },
  { label: "No", value: 'No' },
 
];
  
const statusOptions = [
    { label: 'Planned', value: 'Planned' },
    { label: 'Ongoing', value: 'Ongoing' },
    { label: 'Suspended', value: 'Suspended' },
    { label: 'Completed', value: 'Completed' },
]  

 
console.log('prog_components.value',prog_components.value)
console.log('implementationOptions.value',implementationOptions.value)
    
const formFields = reactive([
  [
    { name: "component_id", label: "Category", id: "btn1x1", type: "tree", multiselect: 'false', adminUnit: false, options: prog_components.value, tooltip: "Select the project category or component." },
    { name: "title", label: "Title", id: "btn1", type: "textarea", multiselect: 'false', adminUnit: false, options: [], tooltip: "Enter the project title or name." },
    { name: "project_code", label: "Contract No.", id: "btn2", type: "text", multiselect: 'false', adminUnit: false, options: [], tooltip: "Enter the unique contract number for this project." },
    { name: "status", label: "Status", id: "btn3", type: "select", multiselect: 'false', adminUnit: false, options: statusOptions, tooltip: "Select the current status of the project." },
    { name: "implementation_id", label: "Delivery Unit", id: "btn4", type: "select", multiselect: 'false', adminUnit: false, options: implementationOptions.value, tooltip: "Select the unit responsible for project delivery." },
    { name: "implementation_scope", label: "Scope", id: "btn41", type: "select", multiselect: 'false', adminUnit: false, options: scope, tooltip: "Select the scope of the project implementation." }
  ],
  
  [
    { name: "cost", label: "Total Project Cost", id: "btn7", min: "0", type: "money", multiselect: 'false', adminUnit: false, options: [], tooltip: "Enter the total cost for the project." },
    { name: "start_date", label: "Commencement Date", id: "btn5", type: "date", multiselect: 'false', adminUnit: false, options: [], tooltip: "Select the date when the project will commence." },
    { name: "end_date", label: "Completion Date", id: "btn6", type: "date", multiselect: 'false', adminUnit: false, options: [], tooltip: "Select the date when the project is expected to complete." },
    { name: "sourceFunding", label: "Source of Funding", id: "btn8", type: "select", multiselect: 'true', adminUnit: false, options: sourceFundingOptions, tooltip: "Select the funding sources for the project." }
  ],
  
  [
    { name: "Location", label: "Location", id: "btn11", type: "select_remote", multiselect: 'false', adminUnit: false, options: cascadedAdminOptions.value, tooltip: "Select the specific location for the project." }
  ]
]);


const formData: FormData = reactive({});
const formRules: FormRules = reactive({
  // Validation rules for each step
  // step1: {
  //   title: [
  //       { required: true, message: 'Name is required', trigger: 'blur' }
  //   ],

  //   implementation_scope: [
  //     { required: true, message: 'Scope is required', trigger: 'blur' }
  // ],

    
  //   status: [
  //     { required: true, message: 'Status is required', trigger: 'blur' }
  //   ],

  //   activities: [
  //     { required: true, message: 'Activities are required', trigger: 'blur' }
  //   ],

  //   start_date: [
  //     { required: true, message: 'Start date is required', trigger: 'blur' }
  //   ],
    

  //   implementation_id: [
  //     { required: true, message: 'Delivery Unit required', trigger: 'blur' }
  //   ],

         
  //   sourceFunding: [
  //     { required: true, message: 'Source of Funding is required', trigger: 'blur' }
  //   ],
    
  //   end_date: [
  //     {
  //       required: true,
  //       message: 'End Date is required',
  //       trigger: 'blur'
  //     },
  //     {
  //       validator: (rule, value, callback) => {
  //         const startDate = formData.start_date; // Access the start_date property from formData
  //         if (startDate && value && startDate > value) {
  //           callback(new Error('End Date must be after Start Date'));
  //         } else {
  //           callback();
  //         }
  //       },
  //       trigger: 'blur'
  //     }
  //   ],
 
    
  //   county_id: [
  //     { required: true, message: 'County is required', trigger: 'blur' },
       
  //   ],
    
  //   subcounty_id: [
  //     { required: true, message: 'Constituency is required', trigger: 'blur' },
       
  //   ],

  //   ward_id: [
  //     { required: true, message: 'Ward is required', trigger: 'blur' },
       
  //   ],

  // },

  step2: {
    // Location: [       { required: true, message: 'Location is Required', trigger: 'change' }  ],
   activities: [
    { required: true, message: 'At least one Project activity is Required', trigger: 'change' }
 ]
   },
  step3: {
   
  },

  
   
});

export { formFields, countyOptions, formData, steps, formRules,  };
