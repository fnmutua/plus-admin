import { reactive, unref, ref } from "vue";
import { ref, reactive, computed, Ref } from "vue";

import {
  countyOptions,
  settlementOptionsV2,
  subcountyOptions,
  wardOptions,
  cascadedAdminOptions,
} from "./index.ts";
import { mhmOptions,HCFTypeOptions,tenancyOptions } from "../../common/index.js";

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
const catchment = [
  { label: "Within this settlement", value: "within_settlement" },
  { label: "Outside this settlement", value: "outside_settlement" },
  { label: "Within and Outside this settlement", value: "within_and_outside_settlement" },
 ];
 
 
  
const parcel_ownership =ref([
    { label: 'Public', value: 'public' },
    { label: 'Private', value: 'private' },
]) 
    
const formFields: Field[][] = [
  // Fields for 1 Profile
  //id, name, school_number, category, level, reg_status, ownership_type, owner, catchment, male_enrollment, female_enrollment, number_teachers, number_other_staff, number_classrooms, number_male_toilets, number_female_toilets, avg_fees_term, number_handwashing_stns, mhm, parcel_tenure, tenancy, settlement_id, county_id, subcounty_id, ward_id, 
  [
 
    { name: "county_id", label: "County", type: "select", multiselect: 'false', adminUnit: true, options: countyOptions.value },
    { name: "subcounty_id", label: "Constituency", type: "select", multiselect: 'false', adminUnit: true, options: [] },
    { name: "ward_id", label: "Ward", type: "select", multiselect: 'false', adminUnit: true, options: [] },
    { name: "settlement_id", label: "Settlement", type: "select", multiselect: 'false', adminUnit: true, options: [] },
    


    { name: "name", label: "Name", type: "text", multiselect: 'false',  adminUnit: false, options: [] },
   
      {
      name: "level", label: "Level", type: "select", multiselect: 'false',  adminUnit: false,  
        options:  HCFTypeOptions
    },

   
    {
      name: "reg_status", label: "Registration", type: "select", multiselect: 'false',   adminUnit: false, 
        options: [
          { label: 'Registered', value: 'Registered' },
          { label: 'Awaiting registration', value: 'Awaiting registration' },
          { label: 'Not registered', value: 'Not registered' }]
    },
    
       
    {
      name: "services", label: "Services", type: "select", multiselect: 'true',   adminUnit: false, 
        options: [
          { label: 'Out-patient', value: 'Out-patient' },
          { label: 'In-patient', value: 'In-patient' },
          { label: 'Pharmacy', value: 'Pharmacy' },
          { label: 'Laboratory', value: 'Laboratory' },
          { label: 'Other', value: 'Other' },
          
        ]
    },

    
     
    
    {
      name: "ownership_type", label: "Ownership", type: "select", multiselect: 'false',   adminUnit: false, 
        options: [
          { label: 'Public', value: 'Public' },
          { label: 'Private', value: 'Private' },
          { label: 'Communal', value: 'Community' },
          { label: 'Mission', value: 'Mission' },
          { label: 'Other', value: 'Other' },
        ]
  

    },
    { name: "owner", label: "Owner", type: "text", multiselect: 'false', adminUnit: false,  options:[]},

    {
      name: "catchment", label: "Catchment", type: "select", multiselect: 'false',  adminUnit: false,  
        options: catchment
    },
  
     
  
    {
      name: "parcel_tenure", label: "Tenure", type: "select", multiselect: 'false', adminUnit: false,   
        options: [
          { label: 'Public', value: 'Public' },
          { label: 'Private', value: 'Private' },
          { label: 'Riparian', value: 'Riparian' },
          { label: 'Unknown', value: 'Unknown' }
        
        ]
    },

    {
      name: "common_ailments", label: "Common Ailments", type: "select", multiselect: 'true',   adminUnit: false, 
        options: [
          { label: 'Malaria', value: 'Malaria' },
          { label: 'TB', value: 'TB' },
          { label: 'Diarrhoea', value: 'Diarrhoea' },
          { label: 'Pneumonia', value: 'Pneumonia' },
          { label: 'STD', value: 'STD' },
          { label: 'Common cold', value: 'Common cold' },
          { label: 'Amoeba/Typhoid', value: 'Amoeba/Typhoid' },
          { label: 'Hypertension', value: 'Hypertension' },
          { label: 'Diabetes', value: 'Diabetes' },
          { label: 'Other', value: 'Other' },
        
        ]
    },
  
    {
      name: "inpatient", label: "Has Inpatient", type: "select", multiselect: 'false',  adminUnit: false,  
        options: yes_no
    },
 

    { name: "patients_per_day", label: "Avg. patients/day", min:"0",  type: "number", multiselect: 'false', options: [] },
    { name: "number_beds", label: "Bed Capacity", type: "number", min:"0", multiselect: 'false', options:[]},
    { name: "occupancy", label: "Occupancy Rate(%)", type: "number", min:"0", multiselect: 'false', options:[]},
    { name: "number_doctors", label: "Number of Doctors", type: "number", min:"0", multiselect: 'false', options:[]},
    { name: "number_clinical_officers", label: "Number of Clincial Officers", type: "number",  min:"0",multiselect: 'false', options:[]},
    { name: "number_pharm", label: "Number of Pharmacists", type: "number",  min:"0",multiselect: 'false', options:[]},
    { name: "number_nurses", label: "Number of Nurses", type: "number", min:"0", multiselect: 'false', options:[]},
    
    { name: "referrals", label: "Referrals To:", type: "text", multiselect: 'false',  adminUnit: false,  options:[]},

     { name: "challenges", label: "Challenges/Issues", type: "text", multiselect: 'false',  adminUnit: false,  options:[]},
  
  
  
  ],






  [
   // This is left empty for the  map 
    {
      name: "location_option", label: "Location Option", type: "select", multiselect: 'false', adminUnit: false, 
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
    name: [
        { required: true, message: 'Name is required', trigger: 'blur' }
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
