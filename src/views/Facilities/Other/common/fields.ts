import { reactive, unref, ref } from "vue";
import { ref, reactive, computed, Ref } from "vue";

import {
  countyOptions,
  settlementOptionsV2,
  subcountyOptions,
  wardOptions,
  cascadedAdminOptions,
} from "./index.ts";
import { wasteOptions,FacilityConditionOptions,cascadeOptions ,  frequencyOptions, phase_options,} from "../../common/index.js";

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
  relatives: Array<any>;
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
 
  
const formFields: Field[][] =reactive( [
  // Fields for 1 Profile
  //id, name, school_number, category, level, reg_status, ownership_type, owner, catchment, male_enrollment, female_enrollment, number_teachers, number_other_staff, number_classrooms, number_male_toilets, number_female_toilets, avg_fees_term, number_handwashing_stns, mhm, parcel_tenure, tenancy, settlement_id, county_id, subcounty_id, ward_id, 
  

  [
   
    { name: "county_id", label: "County", type: "select", relatives:['all', ],multiselect: 'false', adminUnit: true, options: countyOptions.value },
    { name: "subcounty_id", label: "Constituency", type: "select", relatives:['all', ],multiselect: 'false', adminUnit: true, options: [] },
    { name: "ward_id", label: "Ward", type: "select", relatives:['all', ],multiselect: 'false', adminUnit: true, options: [] },
    { name: "settlement_id", label: "Settlement", type: "select", relatives:['all', ],multiselect: 'false', adminUnit: true, options: [] },
    
  
    {
      name: "type",
      label: "Type",
      type: "cascade",show:'true', 
      multiselect: 'false',
      relatives:'all',
      options: cascadeOptions,
    },  

    { name: "name", label: "Name", type: "text",  relatives:'all',multiselect: 'false',show:'true',  options: [] },
      
  
    {
      name: "ownership_type", label: "Ownership", type: "select",  relatives:['all', ],multiselect: 'false', show:'true', 
        options: [
          { label: 'Public', value: 'Public' },
          { label: 'Private', value: 'Private' },
          { label: 'Communal', value: 'Community' },
          { label: 'Mission', value: 'Mission' },
          { label: 'Other', value: 'Other' },
        ]  
    },
  
  
    { name: "owner", label: "Owner", type: "text",  relatives:['all', ],multiselect: 'false',show:'true',  options:[]},
  
    {
      name: "parcel_tenure", label: "Tenure", type: "select", relatives:['all', ], multiselect: 'false',   show:'true',
        options: [
          { label: 'Public', value: 'Public' },
          { label: 'Private', value: 'Private' },
          { label: 'Riparian', value: 'Riparian' },
          { label: 'Unknown', value: 'Unknown' }
        
        ]
    },



    {
      name: "condition", label: "Condition", type: "select", relatives:['all', ],show:'true', multiselect: 'false',
      options: FacilityConditionOptions  },
     
      { name: "challenges", label: "Challenges/Issues", type: "text", relatives:['all', ],multiselect: 'false',show:'true',  options:[]},

   
    { name: "rating", label: "Rating", type: "text",  show:'false', relatives:['floodlight','secondary_substation','primary_substation','powerline'], multiselect: 'false', options: [] },
     {
      name: "number_phases", label: "Phase", type: "select", relatives:['floodlight','secondary_substation','primary_substation','powerline'],multiselect: 'false',   show:'false', options:phase_options
    },
    { name: "height", label: "Height", min:"0",  type: "number", relatives:['floodlight','secondary_substation','primary_substation'],show:'false', multiselect: 'false', options: [] },

{
   name: "type_waste", label: "Type of Waste", type: "select", relatives:['waste', ],multiselect: 'false',   show:'false',
        options:wasteOptions
    },
{ name: "date_install", label: "Installation Date",   show:'false', relatives:['Toilet', 'Shower','handwashing'], type: "date", multiselect: 'false', options: [] },


  { name: "number_stances", label: "Number of Stances", min:"0",  show:'false', relatives:['Toilet', 'Shower','handwashing'], type: "number", multiselect: 'false', options: [] },
  { name: "cost_per_use", label: "Cost Per Single Use", min:"0",   show:'false', relatives:['Toilet', 'Shower','handwashing'],type: "number", multiselect: 'false', options: [] },
  { name: "size_reserve", label: "Reserve", min:"0",  type: "number",  show:'false',  relatives:['powerline', ],multiselect: 'false', options: [] },
  { name: "number_vehicles", label: "Number of Vehicles", min:"0",  show:'false', relatives:['police_stn', 'police_post','chiefs_camp'],type: "number", multiselect: 'false', options: [] },
  { name: "number_staff", label: "Number of Staff", min:"0",  show:'false', relatives:['police_stn', 'police_post','chiefs_camp'],type: "number", multiselect: 'false', options: [] },
 


  {
    name: "frequency", label: "Frequency", type: "select", multiselect: 'false',  relatives:['hazard'],show:'false',  
      options:frequencyOptions
  },

  {
    name: "hazard", label: "Hazard", type: "select", multiselect: 'false',  relatives:['hazard', ], show:'false',
      options: [
        { label: 'Conflicts', value: 'Conflicts' },
        { label: 'Drought', value: 'Drought' },
        { label: 'Disease outbreaks', value: 'Disease outbreaks' },
        { label: 'Flooding', value: 'Flooding' },
        { label: 'Fires', value: 'Fires' },
        { label: 'Rock falling', value: 'Rock falling' },
        { label: 'Landslide', value: 'Landslide' }
      
      ]
  },


  



 
 



   
 
  
  ],






  [
  //  // This is left empty for the  map 
  //   {
  //     name: "location_option", label: "Location Option", type: "select", multiselect: 'false',show:'true', 
  //     options: [
  //       { label: 'Digitize', value: 'digitize' },
  //       { label: 'Upload', value: 'upload' },
  //     ]
  //   },
  //   {
  //     name: "upload", label: "", type: "upload", visible: 'false',show:'true', 
  //     options: [ ]
  //   },
  ],
   
]);

const formData: FormData = reactive({});
const formRules: FormRules = reactive({
  // Validation rules for each step
  step1: {
    type: [
        { required: true, message: 'Type is required', trigger: 'blur' }
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
