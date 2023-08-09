import { reactive, unref, ref } from "vue";
import { ref, reactive, computed, Ref } from "vue";

import {
  countyOptions,
  EvaluationTypeOptions,
  projectOptions,
  subcountyOptions,
  wardOptions,
  cascadedAdminOptions,
} from "./index.ts";

const steps = [
  { title: "Project Data" },
  { title: "Performance" },
  { title: "Effectiveness" },
  { title: "Efficiency" },
  { title: "Sustainability(1)" },
  { title: "Sustainability(2)" },
 
];

interface Field {
  name: string;
  label: string;
  type: string;
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
 
 
    
const formFields: Field[][] = [
  // Fields for 1 Profile

  [
    {
      name: "project_id",
      label: "Project",
      type: "select",
      multiselect: 'false',
      options: projectOptions.value,
    },
    { name: "evaluation_type_id", label: "Type of Evaluation", type: "select", multiselect: 'false', options: EvaluationTypeOptions.value },

    { name: "evaluation_title", label: "Evaluation title", type: "text", multiselect: 'false', options: [] },
 
    { name: "start_date", label: "Evaluation Start Date", type: "date", multiselect: 'false', options: [] },
    { name: "end_date", label: "Evaluation Closure Date", type: "date", multiselect: 'false', options: [] },
    { name: "evaluators", label: "Responsible staff (Evaluators)", type: "list", multiselect: 'false', options: [] },
  
  ],
  
  [
     
    { name: "dev_objective_rating", label: "Relevance of Project Objective", type: "rating", multiselect: 'false', options: [] },
    { name: "dev_objective_assessment", label: "Objective Assessment", type: "textarea", multiselect: 'false', options: [] },

    { name: "dev_design_rating", label: "Relevance of Project Design", type: "rating", multiselect: 'false', options: [] },
    { name: "dev_design_assessment", label: "Design Assessment  ", type: "textarea", multiselect: 'false', options: [] },
    { name: "lessons_relevance", label: "Lessons on Relevance ", type: "list", multiselect: 'false', options: [] },

  ],
   
  [

  //  Progress towards the project’s development objective (project purpose) 
    { name: "output_rating", label: "Output Rating", type: "rating", multiselect: 'false', options: [] },
    { name: "output_evaluation", label: "Output Assessment", type: "textarea", multiselect: 'false', options: [] },

    { name: "outcome_rating", label: "Outcome Rating", type: "rating", multiselect: 'false', options: [] },
    { name: "outcome_evaluation", label: "Outcome Assessment", type: "textarea", multiselect: 'false', options: [] },
    { name: "do_rating", label: "Development Objective Rating", type: "rating", multiselect: 'false', options: [] },

    { name: "progress_project_purpose", label: "Progress on Dev. objective", type: "textarea", multiselect: 'false', options: [] },
    
    { name: "planned_beneficiairies", label: "Beneficiaries (Planned)", type: "number", multiselect: 'false', options: [] },
    { name: "actual_beneficiairies", label: "Beneficiaries (Actual)", type: "number", multiselect: 'false', options: [] },
    { name: "prop_women_beneficiaries", label: "Women Beneficiaries (%)", type: "number",  max:100, multiselect: 'false', options: [] },
  
    { name: "beneficiary_categories", label: "Beneficiary Categories", type: "textarea", multiselect: 'false', options: [] },

    


    { name: "equality_performance", label: "Equality Performance", type: "textarea", multiselect: 'false', options: [] },
    { name: "additional_outcomes", label: "Unanticipated Outcomes", type: "list", multiselect: 'false', options: [] },
    { name: "lessons_effectiveness", label: "Lessons on Effectiveness", type: "list", multiselect: 'false', options: [] },
  
  ],
  [
    { name: "planned_duration", label: "Planned Duration (Months)", type: "number", multiselect: 'false', options: [] },
    { name: "actual_duration", label: "Actual Duration (Months)", type: "number", multiselect: 'false', options: [] },
    { name: "timeliness_rating", label: "Timeliness", type: "rating", multiselect: 'false', options: [] },
    { name: "timeliness_assessment", label: "Timeliness Assessment", type: "textarea", multiselect: 'false', options: [] },
    { name: "ip_rating", label: "Implementation Progress (IP)", type: "rating", multiselect: 'false', options: [] },
    { name: "lessons_efficiency", label: "Lessons on Efficiency", type: "list", multiselect: 'false', options: [] },
  ], 

  [

    { name: "fs_rating", label: "Financial Sustainability", type: "rating", multiselect: 'false', options: [] },
    { name: "fs_rating_comment", label: "Financial Sustainability Assessment", type: "textarea", multiselect: 'false', options: [] },
 
    { name: "inst_sustainability_rating", label: "Institutional sustainability ", type: "rating", multiselect: 'false', options: [] },
    { name: "inst_sustainability_comment", label: "Institutional sustainability Assessment", type: "textarea", multiselect: 'false', options: [] },
 

  ],
  
  [
    { name: "ownership_sustainability_rating", label: "Sustainability of Partnerships/Ownership ", type: "rating", multiselect: 'false', options: [] },
    { name: "ownership_sustainability_comment", label: "Partnerships/Ownership  sustainability Assessment", type: "textarea", multiselect: 'false', options: [] },
   	
    { name: "environmental_rating", label: "Environmental and social sustainability", type: "rating", multiselect: 'false', options: [] },
    { name: "environmental_rating_comment", label: "Environmental Sustainability Assessment", type: "textarea", multiselect: 'false', options: [] },
  ],

  [
     { name: "lessons_sustainability", label: "Lessons on sustainability", type: "list", multiselect: 'false', options: [] },
   	
    { name: "progress_impact_rating", label: "Progress towards achievement of Impact", type: "rating", multiselect: 'false', options: [] },
    { name: "progress_impact_comment", label: "Impact progress Assessment", type: "textarea", multiselect: 'false', options: [] },
    { name: "lessons_impact", label: "Lessons related to Impacts", type: "list", multiselect: 'false', options: [] },
 
 
  
 
  ]
 
    
];

const formData: FormData = reactive({});
const formRules: FormRules = reactive({
  // Validation rules for each step
  step1: {
    evaluation_title: [
        { required: true, message: 'Title is required', trigger: 'blur' }
    ],
    
 
    evaluation_type_id: [
      { required: true, message: 'Type is required', trigger: 'blur' }
  ],
    project_id: [
        { required: true, message: 'Project is required', trigger: 'blur' }
    ],

    start_date: [
        { required: true, message: 'Commencement data is required', trigger: 'blur' }
    ],
    end_date: [
        { required: true, message: 'Closure date is required', trigger: 'blur' }
    ],
    evaluators: [
        { required: true, message: 'Evaluators are required', trigger: 'blur' }
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
