import { reactive, unref, ref } from "vue";
import { ref, reactive, computed, Ref } from "vue";

import {
  countyOptions,
  settlementOptionsV2,
  subcountyOptions,
  wardOptions,
  cascadedAdminOptions,
} from "./index.ts";

const steps = [
  { title: "Profile" },
  { title: "Location" },
 
];

interface Field {
  name: string;
  label: string;
  type: string;
  multiselect: string; // Use boolean type instead of string
  options: Array<any>; // Specify the array type of options
  adminUnit: boolean;
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
const residence = [
  { label: "In this village", value: "within_village" },
  { label: "Inside this settlement", value: "inside_settlement" },
  { label: "Outside this settlement", value: "outside_settlement" },
  { label: "Not sure where he/she stays", value: "not_sure" },
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
    { label: 'Community', value: 'community' },
]) 


const yesNoUnknown =ref([
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
  { label: 'Unknown', value: 'Unknown' },
]) 

const yesNo =ref([
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
]) 

const levelDevt =ref([
  { label: 'Single Storey', value: 'singleStorey' },
  { label: 'Multi Storey', value: 'multiStorey' },
]) 
  
const structureTypes =ref([
  { label: 'Temporary', value: 'temporary' },
  { label: 'Semi Permanent', value: 'semi_permanent' },
  { label: 'Permanent', value: 'permanent' },
]) 

const buildingMaterials =ref([
  { label: 'Mud', value: 'mud' },
  { label: 'Timber', value: 'timber' },
  { label: 'Iron Sheet', value: 'iron_sheet' },
  { label: 'Blocks/Stone', value: 'blocks_stone' },
]) 
 


 
    
const formFields: Field[][] = [
  // Fields for 1 Profile

  [
    // {
    //   name: "location",
    //   label: "Location",
    //   type: "cascade",
    //   multiselect: 'false',
    //   options: cascadedAdminOptions.value,
    // },


    { name: "county_id", label: "County", type: "select", multiselect: 'false', adminUnit: true, options: countyOptions.value },
    { name: "subcounty_id", label: "Constituency", type: "select", multiselect: 'false', adminUnit: true, options: [] },
    { name: "ward_id", label: "Ward", type: "select", multiselect: 'false', adminUnit: true, options: [] },
  

    { name: "name", label: "Name", type: "text", multiselect: 'false',  adminUnit: false, options: [] },
    {
      name: "settlement_type", label: "Type", type: "select", multiselect: 'false',  adminUnit: false,
        options: [
          { label: 'Slum', value: "1" },
          { label: 'Informal', value: "2" }]},

    { name: "parcel_number", label: "Parcel No.", type: "text", multiselect: 'false', adminUnit: false, options: []},
    { name: "parcel_ownership", label: "Parcel Ownership", type: "select", multiselect: 'false',adminUnit: false, options:[{ label: 'Public', value: 'public'},
    { label: 'Private', value: 'private' }]},
    { name: "map_number", label: "RIM/Survey Plan", type: "text", multiselect: 'false',adminUnit: false, options:[]},
    { name: "area", label: "Area (Ha)", type: "number", multiselect: 'false',adminUnit: false, options: []},
    { name: "population", label: "Population", type: "number", multiselect: 'false',adminUnit: false, options: []},
    { name: "surveyed", label: "Is parcel Surveyed?", type: "select", multiselect: 'false',adminUnit: false, options: yesNoUnknown.value},
    { name: "landuse", label: "Pre-Dorminant Landuse", type: "text", multiselect: 'false',adminUnit: false, options: []},
    { name: "near_river", label: "Near River?", type: "select", multiselect: 'false',adminUnit: false, options: yesNo.value},
    { name: "on_wayleave", label: "On a utility way-leave?", type: "select", multiselect: 'false',adminUnit: false, options: yesNo.value},
    { name: "on_road_reserve", label: "On a road reserve?", type: "select", multiselect: 'false',adminUnit: false, options: yesNo.value},
     { name: "structure_types", label: "Types of Structures", type: "select", multiselect: 'true',adminUnit: false, options: structureTypes.value},
    { name: "development", label: "Level of Development", type: "select", multiselect: 'true',adminUnit: false, options: levelDevt.value},
    
    
    { name: "typical_building_materials", label: "Typical Building Materials", type: "select", multiselect: 'true', adminUnit: false, options: buildingMaterials.value },
    { name: "avg_dist_between", label: "Dist. between structures (M)", type: "number", multiselect: 'true',adminUnit: false, options:[]},
    
 
    { name: "dist_town", label: "Distance to Urban Center", type: "number", adminUnit: false, multiselect: 'false', options: [] },
    { name: "dist_trunk", label: "Distance to Trunk Road", type: "number",adminUnit: false, multiselect: 'false', options: []},
    { name: "encumbrance", label: "Any court cases/claims?", type: "select", multiselect: 'false',adminUnit: false, options:yesNoUnknown.value},

    {
      name: "isActive", label: "Status", type: "select", multiselect: 'false',adminUnit: false,
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Decommisioned' },
      ]
    },
    { name: "comments", label: "Comments/Remarks", type: "textarea", multiselect: 'false', adminUnit: false, options: []},

  ],


  [
   // This is left empty for the  map 
    // {
    //   name: "location_option", label: "Location Option", type: "select", multiselect: 'false',aadminUnit: false,
    //   options: [
    //     { label: 'Digitize', value: 'digitize' },
    //     { label: 'Upload', value: 'upload' },
    //   ]
    // },
    // {
    //   name: "upload", label: "", type: "upload", visible: 'false',
    //   options: [ ]
    // },
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
    // location: [
    //   { required: true, message: 'Location is required', trigger: 'blur' },
    //   {
    //     validator: (rule, value, callback) => {
    //       if (Array.isArray(value) && value.length === 3) {
    //         callback();
    //       } else {
    //         callback(new Error('Location must include Ward'));
    //       }
    //     }, 
    //     trigger: 'blur'
    //   }
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
