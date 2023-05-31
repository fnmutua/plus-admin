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
 
  const TypeOptions = [
    { label: "Borehole", value: "Borehole" },
    { label: "Public Tapstand", value: "Public Tapstand" },
    { label: "Kiosk", value: "Kiosk" },
    { label: "Well", value: "Well" },
    { label: "Tank", value: "Tank" },
    { label: "Other", value: "Other" },
];
    

const catchment = [
  { label: "Within this settlement", value: "within_settlement" },
  { label: "Outside this settlement", value: "outside_settlement" },
  { label: "Within and Outside this settlement", value: "within_and_outside_settlement" },
 ];
 



 

  
const formFields: Field[][] =reactive( [
 

   
  [
    {
      name: "location",
      label: "Location",
      type: "cascade",
      multiselect: 'false',show:'true', 
      options: cascadedAdminOptions.value,
    },
    {name: "type", label: "Type", type: "select", multiselect: 'false', options: TypeOptions  },

    { name: "name", label: "Name", type: "text", multiselect: 'false',show:'true',  options: [] },
        {name: "catchment", label: "Catchment", type: "select", multiselect: 'false', options: catchment  },
        {name: "ownership_type", label: "Provider", type: "select", multiselect: 'false', options: generalOwnership  },
        {name: "owner", label: "Name of Provider ", type: "text", multiselect: 'false', options: []  },
    
    { name: "capacity", label: "Capacity(M3/day)", min:"0",  type: "number",  multiselect: 'false', options: [] },
    { name: "depth", label: "Depth", min:"0",  type: "number",  multiselect: 'false', options: [] },
    { name: "price", label: "Cost for 20L ", min:"0",  type: "number",  multiselect: 'false', options: [] },

 

    
  
  
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
        { required: true, message: 'Name is required', trigger: 'blur' }
    ],
  
    type: [
      { required: true, message: 'Type is required', trigger: 'blur' }
  ],
    // // age: [
    //     { required: true, message: 'Age is required', trigger: 'blur' },
    //     { type: 'number', message: 'Age must be a number', trigger: 'blur' }
    // ],
    location: [
      { required: true, message: 'Location is required', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          if (Array.isArray(value) && value.length === 4) {
            callback();
          } else {
            callback(new Error('Location must include Settlement'));
          }
        }, 
        trigger: 'blur'
      }
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
