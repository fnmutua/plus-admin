import { reactive, unref, ref } from "vue";
 
import {
  countyOptions,
  
   activityOptions,
  cascadedAdminOptions,
  implementationOptions,
  contractorOptions,
} from "./index.ts";
 
const steps = [
  { title: "Profile" },
  { title: "Details" },
 
 
];

interface Field {
  name: string;
  label: string;
  type: string;
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

const yes_no = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

const sourceFundingOptions = [
  { label: "Gok", value: 1 },
  { label: "Donor", value: 2 },
];
 

 



 
 
  
const statusOptions = [
    { label: 'Planned', value: 'Planned' },
    { label: 'Ongoing', value: 'Ongoing' },
    { label: 'Suspended', value: 'Suspended' },
    { label: 'Completed', value: 'Completed' },
]  





    
const formFields: Field[][] = [
  [
     { name: "title", label: "Title", type: "textarea", multiselect: 'false', adminUnit: false,     options: [] },
    { name: "project_code", label: "Project Code", type: "text", multiselect: 'false', adminUnit: false,      options: [] },
    {
      name: "status", label: "Status", type: "select", multiselect: 'false', adminUnit: false,       options: statusOptions
    },

    {name: "implementation_id", label: "Delivery Unit", type: "select", multiselect: 'false', adminUnit: false,options: implementationOptions.value },

    { name: "start_date", label: "Commencement Date", type: "date", multiselect: 'false', adminUnit: false,      options: [] },
    { name: "end_date", label: "Completion Date", type: "date", multiselect: 'false',adminUnit: false,     options: [] },
    { name: "cost", label: "Total Project Cost", min: "0", type: "number", multiselect: 'false',adminUnit: false,  options: [] },
    {name: "sourceFunding", label: "Source of Funding", type: "select", multiselect: 'true', adminUnit: false, options: sourceFundingOptions },
    { name: "contractor", label: "Contractor/Implementer", type: "select_add", multiselect: 'false', adminUnit: false,options: contractorOptions.value, source_model:'SettingsContractor' }, 
  
  ],

 [
  { name: "activities", label: "Project Activities", type: "select", multiselect: 'true', adminUnit: false,  options: activityOptions.value },

  { name: "Location", label: "Location", type: "select_remote", multiselect: 'false', adminUnit: false, options:cascadedAdminOptions.value },

 ],


 
   
];

const formData: FormData = reactive({});
const formRules: FormRules = reactive({
  // Validation rules for each step
  step1: {
    title: [
        { required: true, message: 'Name is required', trigger: 'blur' }
    ],

    status: [
      { required: true, message: 'Status is required', trigger: 'blur' }
    ],

    activities: [
      { required: true, message: 'Activities are required', trigger: 'blur' }
    ],

    start_date: [
      { required: true, message: 'Start date is required', trigger: 'blur' }
    ],
    

    implementation_id: [
      { required: true, message: 'Delivery Unit required', trigger: 'blur' }
    ],

         
    sourceFunding: [
      { required: true, message: 'Source of Funding is required', trigger: 'blur' }
    ],
    
    end_date: [
      {
        required: true,
        message: 'End Date is required',
        trigger: 'blur'
      },
      {
        validator: (rule, value, callback) => {
          const startDate = formData.start_date; // Access the start_date property from formData
          if (startDate && value && startDate > value) {
            callback(new Error('End Date must be after Start Date'));
          } else {
            callback();
          }
        },
        trigger: 'blur'
      }
    ],
 
    
    county_id: [
      { required: true, message: 'County is required', trigger: 'blur' },
       
    ],
    
    subcounty_id: [
      { required: true, message: 'Constituency is required', trigger: 'blur' },
       
    ],

    ward_id: [
      { required: true, message: 'Ward is required', trigger: 'blur' },
       
    ],

  },

  step2: {
    Location: [
      { required: true, message: 'Location is Required', trigger: 'change' }
   ],
   activities: [
    { required: true, message: 'At least one Project activity is Required', trigger: 'change' }
 ]
  },
  step3: {
   
  },

  
   
});

export { formFields, countyOptions, formData, steps, formRules };
