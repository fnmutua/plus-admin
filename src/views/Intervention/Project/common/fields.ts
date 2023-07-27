import { reactive, unref, ref } from "vue";
import { ref, reactive, computed, Ref } from "vue";

import {
  countyOptions,
   activityOptions,
  cascadedAdminOptions,
  implementationOptions,
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
  { label: "WorldBank", value: 2 },
 ];

 const contractorOptions = [
  { label: "ABC Contractors Limited", value: 1 },
  { label: "Slum Upgrading Department", value: 2 },
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
  // Fields for 1 Profile
  //id, name, school_number, category, level, reg_status, ownership_type, owner, catchment, male_enrollment, female_enrollment, number_teachers, number_other_staff, number_classrooms, number_male_toilets, number_female_toilets, avg_fees_term, number_handwashing_stns, mhm, parcel_tenure, tenancy, settlement_id, county_id, subcounty_id, ward_id, 
  [
  
 
  // title: '',
  // type: '',
  // component_id: component_id.value,
 
  // start_date: '',
  // end_date: '',
  // cost: 0,
  // male_beneficiaries: 0,
  // female_beneficiaries: 0,
  // description: '',
  // activities: [],


    {
      name: "location",
      label: "Location",
      type: "cascade",
      multiselect: 'false',
      options: cascadedAdminOptions.value,
    },
    { name: "title", label: "Title", type: "text", multiselect: 'false', options: [] },
   
    {
      name: "status", label: "Status", type: "select", multiselect: 'false',    options: statusOptions
    },

    {name: "implementation_id", label: "Delivery Unit", type: "select", multiselect: 'false',    options: implementationOptions.value },

    { name: "start_date", label: "Start Date", type: "date", multiselect: 'false',    options: [] },
    { name: "end_date", label: "End Date", type: "date", multiselect: 'false',    options: [] },
    { name: "cost", label: "Project Budget/Cost", min: "0", type: "number", multiselect: 'false', options: [] },
    {name: "sourceFunding", label: "Source of Funding", type: "select", multiselect: 'true',    options: sourceFundingOptions },
    { name: "male_beneficiaries", label: "Male Beneficiaries",  min:"0", type: "number", multiselect: 'false',    options: [] },
    { name: "female_beneficiaries", label: "Female Beneficiaries",  min:"0", type: "number", multiselect: 'false',    options: [] },
    { name: "contractor", label: "Contractor/Implementer", type: "select", multiselect: 'true',    options: contractorOptions },

    
   
   
    { name: "activities", label: "Project Activities", type: "select", multiselect: 'true', options: activityOptions.value },
 
  
   
  
  ],






  [
   // This is left empty for the  map 
    {
      name: "location_option", label: "Location Option", type: "select", multiselect: 'false',
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

    // // age: [
    //     { required: true, message: 'Age is required', trigger: 'blur' },
    //     { type: 'number', message: 'Age must be a number', trigger: 'blur' }
    // ],
    location: [
      { required: true, message: 'Location is required', trigger: 'blur' },
      {
        validator: (rule, value, callback) => {
          if (Array.isArray(value) && value.length >=3) {
            callback();
          } else {
            callback(new Error('Location must be at least  a ward/Settlement level'));
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
