import { reactive, unref, ref } from "vue";
import { ref, reactive, computed, Ref } from "vue";

import {
  countyOptions,
  settlementOptionsV2,
  subcountyOptions,
  wardOptions,
  cascadedAdminOptions,
} from "./index.ts";
import { mhmOptions,SchoolLevelOptions,tenancyOptions } from "../../common/index.js";

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
const catchment = [
  { label: "Within this settlement", value: "within_settlement" },
  { label: "Outside this settlement", value: "outside_settlement" },
  { label: "Within and Outside this settlement", value: "within_and_outside_settlement" },
 ];

const moneyRange = [
  { label: "0-5000", value: "0-5000" },
  { label: "5,001- 10,000 ", value: "5,001- 10,000" },
  { label: "10,001- 15,000 ", value: "10,001- 15,000" },
  { label: "15,001- 20,000", value: "15,001- 20,000" },
  { label: "20,001-30,000 ", value: "20,001-30,000" },
  { label: "30,001-50,000", value: "30,001-50,000" },
  { label: "Above 50,000", value: "Above 50,000" },
];
const material = [
  { label: "Stone", value: "stone" },
  { label: "Iron sheets", value: "ironsheets" },
  { label: "Wooden", value: "wooden" },
  { label: "PolytheneCarton", value: "polythene" },
  { label: "Earth", value: "earth" },
];
const water = [
  { label: "No water", value: "none" },
  { label: "Piped water", value: "piped_water" },
  { label: "Shallow well", value: "shallow_well" },
  { label: "Rainwater", value: "rain" },
  { label: "River/stream", value: "river" },
  { label: "Mobile vendors", value: "mobile_vendors" },
  { label: "Other", value: "other" },
];

const bathroom = [
  { label: "No bathroom", value: "no_bathroom" },
  { label: "Bathroom in the structure", value: "bathroom_within_structure" },
  {
    label: "Bathroom outside the structure",
    value: "bathroom_outside_structure",
  },
];

const toilet = [
  { label: "No Toilet", value: "no_toilet" },
  { label: "Latrine", value: "pit_latrine" },
  { label: "VIP latrine", value: "vip_latrine" },
  { label: "WC/Sewer", value: "flush_toilet" },
  { label: "Septic Tank", value: "septic_tank" },
  { label: "Other", value: "other" },
];

const disposal = [
  { label: "private", value: "private" },
  { label: "dump", value: "dumpsite" },
  { label: "bins", value: "bins" },
  { label: "road", value: "road" },
  { label: "river", value: "river" },
  { label: "Outside", value: "outside" },
  { label: "Open", value: "open_sewer" },
  { label: "Other ", value: "other" },
];

const parcel_ownership =ref([
    { label: 'Public', value: 'public' },
    { label: 'Private', value: 'private' },
]) 
    
const formFields: Field[][] = [
  // Fields for 1 Profile
  //id, name, school_number, category, level, reg_status, ownership_type, owner, catchment, male_enrollment, female_enrollment, number_teachers, number_other_staff, number_classrooms, number_male_toilets, number_female_toilets, avg_fees_term, number_handwashing_stns, mhm, parcel_tenure, tenancy, settlement_id, county_id, subcounty_id, ward_id, 
  [
    {
      name: "location",
      label: "Location",
      type: "cascade",
      multiselect: 'false',
      options: cascadedAdminOptions.value,
    },
    { name: "name", label: "Name", type: "text", multiselect: 'false', options: [] },

     
      {
      name: "level", label: "Level", type: "select", multiselect: 'false',  
        options:  SchoolLevelOptions
    },
    {
      name: "reg_status", label: "Registration", type: "select", multiselect: 'false',  
        options: [
          { label: 'Registered', value: 'Registered' },
          { label: 'Awaiting registration', value: 'Awaiting registration' },
          { label: 'Not registered', value: 'Not registered' }]
    },
    
    {
      name: "ownership_type", label: "Ownership", type: "select", multiselect: 'false',  
        options: [
          { label: 'Public School', value: 'Public' },
          { label: 'Private School', value: 'Private' },
          { label: 'Communal School', value: 'Community' },
          { label: 'Mission School', value: 'Mission' },
          { label: 'Other', value: 'Other' },
        ]
  

    },
    { name: "owner", label: "Owner", type: "text", multiselect: 'false', options:[]},

    {
      name: "catchment", label: "Catchment", type: "select", multiselect: 'false',  
        options: catchment
    },
  
    

  
    {
      name: "parcel_tenure", label: "Tenure", type: "select", multiselect: 'false',  
        options: [
          { label: 'Public', value: 'Public' },
          { label: 'Private', value: 'Private' },
          { label: 'Riparian', value: 'Riparian' },
          { label: 'Unknown', value: 'Unknown' }
        
        ]
    },

    {
      name: "tenancy", label: "Tenancy", type: "select", multiselect: 'false',  
        options: tenancyOptions
    },
    { name: "avg_fees_term", label: "Avg. Fees/Term", min:"0",  type: "number", multiselect: 'false', options: [] },

    { name: "male_enrollment", label: "Male Enrollment", type: "number", min:"0", multiselect: 'false', options:[]},
    { name: "female_enrollment", label: "Female Enrollment", type: "number", min:"0", multiselect: 'false', options:[]},
    { name: "number_teachers", label: "Number of Teachers", type: "number", min:"0", multiselect: 'false', options:[]},
    { name: "number_other_staff", label: "Number of Staff(other)", type: "number",  min:"0",multiselect: 'false', options:[]},
    { name: "number_classrooms", label: "Number of Classrooms", type: "number",  min:"0",multiselect: 'false', options:[]},
    { name: "number_male_toilets", label: "Number of Toilets(Male)", type: "number", min:"0", multiselect: 'false', options:[]},
    { name: "number_female_toilets", label: "Number of Toilets(Female)", type: "number",  min:"0",multiselect: 'false', options:[]},
   
    {
      name: "mhm", label: "Menstrual Hygiene", type: "select", multiselect: 'true',  
        options: mhmOptions
    },

    { name: "number_handwashing_stns", label: "Number of Handwashing Stns.", type: "number", min:"0", multiselect: 'false', options:[]},
    { name: "challenges", label: "Challenges/Issues", type: "text", multiselect: 'false', options:[]},
  
  
  
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
    name: [
        { required: true, message: 'Name is required', trigger: 'blur' }
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
