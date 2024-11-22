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
  

     { id: "btn4", name: "title", label: "Article Title", type: "text", multiselect: 'false', adminUnit: false, options: [] },
    { id: "btn4", name: "description", label: "Description", type: "text", multiselect: 'false', adminUnit: false, options: [] },
    { id: "btn4", name: "url", label: "Link", type: "text", multiselect: 'false', adminUnit: false, options: [] },
       

  ],

 
   
];

const formData: FormData = reactive({});
const formRules: FormRules = reactive({
  // Validation rules for each step
  step1: {
    title: [
        { required: true, message: 'Article Title is required', trigger: 'blur' }
    ], 
    description: [
      { required: true, message: 'Description is required', trigger: 'blur' },
    ],
  },

 
});

export { formFields, countyOptions, formData, steps, formRules };
