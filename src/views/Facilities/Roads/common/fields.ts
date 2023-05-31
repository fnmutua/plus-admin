import { reactive, unref, ref } from "vue";
import { ref, reactive, computed, Ref } from "vue";

import {
  countyOptions,
  settlementOptionsV2,
  subcountyOptions,
  wardOptions,
  cascadedAdminOptions,
} from "./index.ts";
import { FacilityConditionOptions,SurfaceTypeOtions , RdClassOptions,  drainageTypeOtions} from "../../common/index.js";

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
 
  const traffic = [
    { label: "Busy", value: "Busy" },
    { label: "Light", value: "Light" },
    ];
  
const formFields: Field[][] =reactive( [
  // Fields for 1 Profile
  //id, name, school_number, category, level, reg_status, ownership_type, owner, catchment, male_enrollment, female_enrollment, number_teachers, number_other_staff, number_classrooms, number_male_toilets, number_female_toilets, avg_fees_term, number_handwashing_stns, mhm, parcel_tenure, tenancy, settlement_id, county_id, subcounty_id, ward_id, 
  //id, name,    ,  , settlement_id, county_id, subcounty_id,

  // \\copy public.road(id, name, \"rdNum\", \"rdClass\", width, \"rdReserve\", \"surfaceType\", \"surfaceCondition\", traffic, direction,
//  drainage, \"drainageCondition\", settlement_id, county_id, subcounty_id, \"createdBy\",
//   \"isApproved\", length, code, geom, \"createdAt\", \"updatedAt\", ward_id
  [
    {
      name: "location",
      label: "Location",
      type: "cascade",
      multiselect: 'false',show:'true', 
      options: cascadedAdminOptions.value,
    },
    { name: "name", label: "Name", type: "text", multiselect: 'false',show:'true',  options: [] },
    
    { name: "rdNum", label: "Road Number", type: "text", multiselect: 'false',  options:[]},
    {
      name: "rdClass", label: "Class", type: "select", multiselect: 'false',  
        options: RdClassOptions  },

    {name: "surfaceCondition", label: "Condition", type: "select", multiselect: 'false', options: FacilityConditionOptions  },
    {name: "surfaceType", label: "Surface", type: "select", multiselect: 'false', options: SurfaceTypeOtions  },

    {name: "drainage", label: "Drainage", type: "select", multiselect: 'false', options: drainageTypeOtions  },
    
    {name: "traffic", label: "Traffic", type: "select", multiselect: 'false', options: traffic  },
    {name: "direction", label: "Direction", type: "select", multiselect: 'false', options: direction  },


      { name: "width", label: "Width(m)", min:"0",  type: "number",  multiselect: 'false', options: [] },
      { name: "rdReserve", label: "Road Reserve(m)", min:"0",  type: "number",   multiselect: 'false', options: [] },
      { name: "challenges", label: "Challenges/Issues", type: "text", multiselect: 'false',   options:[]},

  
  
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
