import { reactive } from "vue";

import {
  countyOptions,
  implementationOptions,
} from "./index.ts";

const steps = [
  { title: "Identity", description: "Name and reference" },
  { title: "Implementation", description: "Status and delivery" },
  { title: "Schedule & Budget", description: "Dates and funding" },
  { title: "Location", description: "Search and select" },
];

/** Edit-only step index (after Location); handled in AddX.vue, not in formFields */
export const PROGRAMME_COMPONENT_STEP = {
  title: "Programme & Component",
  description: "Optional reassignment",
};

interface Field {
  name: string;
  label: string;
  type: string;
  id: string;
  multiselect: string;
  adminUnit: boolean;
  options: Array<any>;
  placeholder?: string;
  min?: string | number;
  max?: number;
}

interface FormRules {
  [key: string]: {
    [key: string]: {
      required?: boolean;
      type?: string;
      message?: string;
      trigger?: string;
      validator?: (rule: any, value: any, callback: (error?: Error) => void) => void;
    }[];
  };
}

interface FormData {
  [key: string]: any;
}

const scope = [
  { label: "National", value: "national" },
  { label: "County", value: "county" },
  { label: "Subcounty", value: "subcounty" },
  { label: "Ward", value: "ward" },
  { label: "Settlement", value: "settlement" },
];

const sourceFundingOptions = [
  { label: "Gok", value: 1 },
  { label: "IDA", value: 2 },
  { label: "AFD", value: 3 },
];

const statusOptions = [
  { label: "Planned", value: "Planned" },
  { label: "Ongoing", value: "Ongoing" },
  { label: "Suspended", value: "Suspended" },
  { label: "Completed", value: "Completed" },
];

const formFields = reactive([
  [
    {
      name: "title",
      label: "Title",
      id: "btn1",
      type: "textarea",
      multiselect: "false",
      adminUnit: false,
      options: [],
      placeholder: "Full project name as shown on reports and listings",
    },
    {
      name: "project_code",
      label: "Contract No.",
      id: "btn2",
      type: "text",
      multiselect: "false",
      adminUnit: false,
      options: [],
      placeholder: "Unique contract or reference number, e.g. KISIP/SUD/2024/001",
    },
    {
      name: "description",
      label: "Description",
      id: "btn1d",
      type: "textarea",
      multiselect: "false",
      adminUnit: false,
      options: [],
      placeholder: "Optional summary of objectives, beneficiaries, or scope of works",
    },
  ],
  [
    {
      name: "status",
      label: "Status",
      id: "btn3",
      type: "select",
      multiselect: "false",
      adminUnit: false,
      options: statusOptions,
      placeholder: "Planned, Ongoing, Suspended, or Completed",
    },
    {
      name: "implementation_id",
      label: "Delivery Unit",
      id: "btn4",
      type: "select",
      multiselect: "false",
      adminUnit: false,
      options: implementationOptions.value,
      placeholder: "Unit responsible for implementing this project",
    },
    {
      name: "implementation_scope",
      label: "Implementation Level",
      id: "btn41",
      type: "select",
      multiselect: "false",
      adminUnit: false,
      options: scope,
      placeholder: "Lowest level covered — National to Settlement",
    },
  ],
  [
    {
      name: "start_date",
      label: "Commencement Date",
      id: "btn5",
      type: "date",
      multiselect: "false",
      adminUnit: false,
      options: [],
      placeholder: "When implementation starts",
    },
    {
      name: "end_date",
      label: "Completion Date",
      id: "btn6",
      type: "date",
      multiselect: "false",
      adminUnit: false,
      options: [],
      placeholder: "Expected or actual completion date",
    },
    {
      name: "cost",
      label: "Total Project Cost (KSh)",
      id: "btn7",
      min: 0,
      max: 9007199254740991,
      type: "number",
      multiselect: "false",
      adminUnit: false,
      options: [],
      placeholder: "e.g. 5,000,000,000",
    },
    {
      name: "sourceFunding",
      label: "Source of Funding",
      id: "btn8",
      type: "select",
      multiselect: "true",
      adminUnit: false,
      options: sourceFundingOptions,
      placeholder: "GoK, IDA, AFD — select all that apply",
    },
  ],
  [],
]);

const formData: FormData = reactive({});

const formRules: FormRules = reactive({
  step1: {
    title: [{ required: true, message: "Project title is required", trigger: "blur" }],
    project_code: [{ required: true, message: "Contract number is required", trigger: "blur" }],
  },
  step2: {
    status: [{ required: true, message: "Status is required", trigger: "change" }],
    implementation_id: [{ required: true, message: "Delivery unit is required", trigger: "change" }],
    implementation_scope: [{ required: true, message: "Implementation level is required", trigger: "change" }],
  },
  step3: {
    start_date: [{ required: true, message: "Commencement date is required", trigger: "change" }],
    end_date: [
      { required: true, message: "Completion date is required", trigger: "change" },
      {
        validator: (_rule, value, callback) => {
          const startDate = formData.start_date;
          if (startDate && value && new Date(startDate) > new Date(value)) {
            callback(new Error("Completion date must be after commencement date"));
          } else {
            callback();
          }
        },
        trigger: "change",
      },
    ],
    sourceFunding: [{ required: true, message: "Source of funding is required", trigger: "change" }],
    cost: [
      {
        validator: (_rule, value, callback) => {
          if (value == null || value === "") {
            callback();
            return;
          }
          const parsed = typeof value === "number" ? value : Number(String(value).replace(/[,\s]/g, ""));
          if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
            callback(new Error("Enter a valid whole-number cost in KSh"));
            return;
          }
          callback();
        },
        trigger: "change",
      },
    ],
  },
  step4: {},
  step5: {},
});

export { formFields, countyOptions, formData, steps, formRules };
