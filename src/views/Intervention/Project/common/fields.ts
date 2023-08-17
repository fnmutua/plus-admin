import { reactive, unref, ref } from "vue";
import { ref, reactive, computed, Ref } from "vue";

import {
  countyOptions,
  
   activityOptions,
  cascadedAdminOptions,
  implementationOptions,
  contractorOptions,
} from "./index.ts";
 
const steps = [
  { title: "Profile" },
  { title: "Location" },
 
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
 

 



const catchment = [
  { label: "Within this settlement", value: "within_settlement" },
  { label: "Outside this settlement", value: "outside_settlement" },
  { label: "Within and Outside this settlement", value: "within_and_outside_settlement" },
 ];
 
 
  
const statusOptions = [
    { label: 'Planned', value: 'Planned' },
    { label: 'Ongoing', value: 'Ongoing' },
    { label: 'Suspended', value: 'Suspended' },
    { label: 'Completed', value: 'Completed' },
]  





    
const formFields: Field[][] = [
  [
   
  
    { name: "county_id", label: "County", type: "select", multiselect: 'false', adminUnit: true, options: countyOptions.value },
    { name: "subcounty_id", label: "Constituency", type: "select", multiselect: 'false', adminUnit: true, options: [] },
    { name: "ward_id", label: "Ward", type: "select", multiselect: 'false', adminUnit: true, options: [] },
    { name: "settlement_id", label: "Settlement", type: "select", multiselect: 'false', adminUnit: true, options: [] },
    


     { name: "title", label: "Title", type: "textarea", multiselect: 'false', adminUnit: false,     options: [] },
    { name: "project_code", label: "Project Code", type: "text", multiselect: 'false', adminUnit: false,      options: [] },
    {
      name: "status", label: "Status", type: "select", multiselect: 'false', adminUnit: false,       options: statusOptions
    },

    {name: "implementation_id", label: "Delivery Unit", type: "select", multiselect: 'false', adminUnit: false,       options: implementationOptions.value },

    { name: "start_date", label: "Commencement Date", type: "date", multiselect: 'false', adminUnit: false,      options: [] },
    { name: "end_date", label: "Completion Date", type: "date", multiselect: 'false',adminUnit: false,     options: [] },
    { name: "cost", label: "Total Project Cost", min: "0", type: "number", multiselect: 'false',adminUnit: false,  options: [] },
    {name: "sourceFunding", label: "Source of Funding", type: "select", multiselect: 'true', adminUnit: false, options: sourceFundingOptions },
    { name: "male_beneficiaries", label: "Male Beneficiaries",  min:"0", type: "number", multiselect: 'false',adminUnit: false,     options: [] },
    { name: "female_beneficiaries", label: "Female Beneficiaries",  min:"0", type: "number", multiselect: 'false',  adminUnit: false,     options: [] },
    { name: "contractor", label: "Contractor/Implementer", type: "select", multiselect: 'false', adminUnit: false,options: contractorOptions.value },

    
   
   
    { name: "activities", label: "Project Activities", type: "select", multiselect: 'true', adminUnit: false,  options: activityOptions.value },
 
  
   
  
  ],

 


  [
   // This is left empty for the  map 
    {
      name: "location_option", label: "Location Option", type: "select", multiselect: 'false',adminUnit: false, 
      options: [
        { label: 'Digitize', value: 'digitize' },
        { label: 'Upload', value: 'upload' },
      ]
    },
    {
      name: "upload", label: "", type: "upload", visible: 'false',
      options: [ ]
    },
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
    // tenancy_agreement: [
    //     { required: true, message: 'Date of Birth is required', trigger: 'change' }
    // ]
  },
  step3: {
    // tenancy_agreement: [
    //     { required: true, message: 'Date of Birth is required', trigger: 'change' }
    // ]
  },

  step4: {
    // tenancy_agreement: [
    //     { required: true, message: 'Date of Birth is required', trigger: 'change' }
    // ]
  },

  step5: {
    // tenancy_agreement: [
    //     { required: true, message: 'Date of Birth is required', trigger: 'change' }
    // ]
  },
   
});

export { formFields, countyOptions, formData, steps, formRules };
