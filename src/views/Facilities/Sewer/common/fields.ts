import { reactive, unref, ref } from "vue";
import { ref, reactive, computed, Ref } from "vue";

import {
  countyOptions,
  settlementOptionsV2,
  subcountyOptions,
  wardOptions,
  cascadedAdminOptions,
} from "./index.ts";
import { FacilityConditionOptions,generalOwnership , pipeOptions,  drainageTypeOtions} from "../../common/index.js";

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
  adminUnit: boolean;
  multiselect: string; // Use boolean type instead of string
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
const direction = [
  { label: "One Way", value: "One Way" },
  { label: "Two Way", value: "Two Way" },
  ];
 
  const traffic = [
    { label: "Busy", value: "Busy" },
    { label: "Light", value: "Light" },
    ];
  
const formFields: Field[][] =reactive( [
  // Fields for 1 Profile
  //id, name, type, pipe_type, pipe_size, provider, provider_category,
 //  length, number_connections, settlement_id, county_id, subcounty_id, \"isApproved\
  [
    { name: "county_id", label: "County", type: "select", multiselect: 'false', adminUnit: true, options: countyOptions.value },
    { name: "subcounty_id", label: "Constituency", type: "select", multiselect: 'false', adminUnit: true, options: [] },
    { name: "ward_id", label: "Ward", type: "select", multiselect: 'false', adminUnit: true, options: [] },
    { name: "settlement_id", label: "Settlement", type: "select", multiselect: 'false', adminUnit: true, options: [] },
    

   
  
    { name: "name", label: "Name", type: "text", multiselect: 'false',show:'true',  options: [] },
         {
      name: "pipe_type", label: "Pipe", type: "select", multiselect: 'false',  
        options: pipeOptions  },

      {name: "provider_category", label: "Provider", type: "select", multiselect: 'false', options: generalOwnership  },

    { name: "provider", label: "Service Provider", type: "text", multiselect: 'false', show: 'true', options: [] },
      
      { name: "number_connections", label: "Width(m)", min:"0",  type: "number",  multiselect: 'false', options: [] },

 
  
  
  ],






  [
   // This is left empty for the  map 
    {
      name: "location_option", label: "Location Option", type: "select", multiselect: 'false',show:'true', 
      options: [
        { label: 'Digitize', value: 'digitize' },
        { label: 'Upload', value: 'upload' },
      ]
    },
    {
      name: "upload", label: "", type: "upload", visible: 'false',show:'true', 
      options: [ ]
    },
  ],
   
]);

const formData: FormData = reactive({});
const formRules: FormRules = reactive({
  // Validation rules for each step
  step1: {
    name: [
        { required: true, message: 'Road Name is required', trigger: 'blur' }
    ],     

    // // age: [
    //     { required: true, message: 'Age is required', trigger: 'blur' },
    //     { type: 'number', message: 'Age must be a number', trigger: 'blur' }
    // ],
    county_id: [
      { required: true, message: 'County is required', trigger: 'blur' },
       
    ],
    
    subcounty_id: [
      { required: true, message: 'Constituency is required', trigger: 'blur' },
       
    ],

    ward_id: [
      { required: true, message: 'Ward is required', trigger: 'blur' },
       
    ],
    settlement_id: [
      { required: true, message: 'Settlement is required', trigger: 'blur' },
       
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
