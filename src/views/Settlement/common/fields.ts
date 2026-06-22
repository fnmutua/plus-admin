import { reactive, unref, ref } from "vue";

import {
  countyOptions,
  settlementOptionsV2,
  subcountyOptions,
  wardOptions,
  cascadedAdminOptions,
} from "./index.ts";

const steps = [
  { title: "Basic Information" },
  { title: "Physical & Structural" },
  { title: "Socio-Economic & Environmental" },
  { title: "Geolocation" },
];

interface Field {
  name: string;
  label: string;
  type: string;
  multiselect: string;
  options: Array<any>;
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

const yes_no = ref([
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
]);

const yesNoUnknown = ref([
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
  { label: "Unknown", value: "Unknown" },
]);

const parcel_ownership = ref([
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
  { label: "Community", value: "community" },
]);

const structureTypes = ref([
  { label: "Permanent", value: "Permanent" },
  { label: "Semi-permanent", value: "Semi-permanent" },
  { label: "Temporary", value: "Temporary" },
]);

const levelDevt = ref([
  { label: "Single Storey", value: "singleStorey" },
  { label: "Multi Storey", value: "multiStorey" },
]);

const buildingMaterials = ref([
  { label: "Mud", value: "mud" },
  { label: "Timber", value: "timber" },
  { label: "Iron Sheet", value: "iron_sheet" },
  { label: "Blocks/Stone", value: "blocks_stone" },
]);

const landStatusOptions = ref([
  { label: "Planned", value: "Planned" },
  { label: "Unplanned", value: "Unplanned" },
]);

const surveyStatusOptions = ref([
  { label: "Surveyed", value: "Surveyed" },
  { label: "Unsurveyed", value: "Unsurveyed" },
]);

const parcelOwnerTypeOptions = ref([
  { label: 'Private', value: 'Private' },
  { label: 'Public', value: 'Public' },
  { label: 'Community', value: 'Community' },
  { label: 'Communal', value: 'Communal' },
  { label: 'Mixed', value: 'Mixed' },
  { label: 'Unknown', value: 'Unknown' },
]);

const approvalStatusOptions = ref([
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
]);

const profilingStatusOptions = ref([
  { label: "Not Profiled", value: "NOT_PROFILED" },
  { label: "Partially Profiled", value: "PARTIALLY_PROFILED" },
  { label: "Profiled", value: "PROFILED" },
]);

const formFields: Field[][] = [
  // Step 1: Basic Information
  [
    { id: "btn1", name: "county_id", label: "County", type: "select", multiselect: "false", adminUnit: true, options: countyOptions.value },
    { id: "btn2", name: "subcounty_id", label: "Constituency", type: "select", multiselect: "false", adminUnit: true, options: [] },
    { id: "btn3", name: "ward_id", label: "Ward", type: "select", multiselect: "false", adminUnit: true, options: [] },
    { id: "btn4", name: "name", label: "Name", type: "text", multiselect: "false", adminUnit: false, options: [] },
    {
      id: "btn5",
      name: "settlement_type",
      label: "Type",
      type: "select",
      multiselect: "false",
      adminUnit: false,
      options: [
        { label: "Slum", value: "slum" },
        { label: "Informal Settlement", value: "Informal Settlement" },
      ],
    },
    { id: "btn6", name: "parcel_no", label: "Parcel No.", type: "text", multiselect: "false", adminUnit: false, options: [] },
    {
      id: "btn7",
      name: "parcel_owner",
      label: "Parcel Ownership",
      type: "select",
      multiselect: "false",
      adminUnit: false,
      options: parcel_ownership.value,
    },
    { id: "btn8", name: "rim_no", label: "RIM/Survey Plan", type: "text", multiselect: "false", adminUnit: false, options: [] },
    {
      id: "btn10",
      name: "planning_status",
      label: "Planning Status",
      type: "select",
      multiselect: "false",
      adminUnit: false,
      options: landStatusOptions.value,
    },
    {
      id: "btn11",
      name: "survey_status",
      label: "Survey Status",
      type: "select",
      multiselect: "false",
      adminUnit: false,
      options: surveyStatusOptions.value,
    },
    {
      id: "btn12",
      name: "parcel_owner_type",
      label: "Parcel Owner Type",
      type: "select",
      multiselect: "false",
      adminUnit: false,
      options: parcelOwnerTypeOptions.value,
    },
  ],
  // Step 2: Physical & Structural Characteristics
  [
    { id: "btn13", name: "area", label: "Area (Ha)", type: "number", multiselect: "false", adminUnit: false, options: [] },
    { id: "btn14", name: "population", label: "Population", type: "number", multiselect: "false", adminUnit: false, options: [] },
    { id: "btn14a", name: "pop_male", label: "Male population", type: "number", multiselect: "false", adminUnit: false, options: [] },
    { id: "btn14b", name: "pop_female", label: "Female population", type: "number", multiselect: "false", adminUnit: false, options: [] },
    { id: "btn15", name: "pop_density", label: "Population Density", type: "number", multiselect: "false", adminUnit: false, options: [] },
    { id: "btn16", name: "landuse", label: "Pre-Dominant Landuse", type: "text", multiselect: "false", adminUnit: false, options: [] },
    { id: "btn17", name: "near_river", label: "Near River?", type: "select", multiselect: "false", adminUnit: false, options: yes_no.value },
    { id: "btn18", name: "on_wayleave", label: "On a Utility Way-leave?", type: "select", multiselect: "false", adminUnit: false, options: yes_no.value },
    { id: "btn19", name: "on_road_reserve", label: "On a Road Reserve?", type: "select", multiselect: "false", adminUnit: false, options: yes_no.value },
    { id: "btn20", name: "structure_types", label: "Types of Structures", type: "text", multiselect: "true", adminUnit: false, options: structureTypes.value },
    { id: "btn21", name: "development", label: "Level of Development", type: "text", multiselect: "true", adminUnit: false, options: levelDevt.value },
    { id: "btn22", name: "typical_building_materials", label: "Typical Building Materials", type: "text", multiselect: "true", adminUnit: false, options: buildingMaterials.value },
    { id: "btn23", name: "avg_dist_between", label: "Dist. Between Structures (M)", type: "number", multiselect: "false", adminUnit: false, options: [] },
    { id: "btn24", name: "dist_town", label: "Distance to Urban Center (Km)", type: "number", multiselect: "false", adminUnit: false, options: [] },
    { id: "btn25", name: "dist_trunk", label: "Distance to Trunk Road (Km)", type: "number", multiselect: "false", adminUnit: false, options: [] },
    { id: "btn26", name: "electricity_availability", label: "Electricity Availability", type: "select", multiselect: "false", adminUnit: false, options: yes_no.value },
    { id: "btn27", name: "piped_water_availability", label: "Piped Water Availability", type: "select", multiselect: "false", adminUnit: false, options: yes_no.value },
  ],
  // Step 3: Socio-Economic & Environmental Details
  [
    { id: "btn28", name: "encumbrance", label: "Are There Any Court Cases/Claims?", type: "select", multiselect: "false", adminUnit: false, options: yesNoUnknown.value },
    {
      id: "btn29",
      name: "isActive",
      label: "Status",
      type: "select",
      multiselect: "false",
      adminUnit: false,
      options: [
        { value: "true", label: "Active" },
        { value: "false", label: "Decommissioned" },
      ],
    },
    {
      id: "btn30",
      name: "isApproved",
      label: "Approval Status",
      type: "select",
      multiselect: "false",
      adminUnit: false,
      options: approvalStatusOptions.value,
    },
    { id: "btn31", name: "num_households", label: "Number of Households", type: "number", multiselect: "false", adminUnit: false, options: [] },
    { id: "btn32", name: "avg_household_size", label: "Average Household Size", type: "number", multiselect: "false", adminUnit: false, options: [] },
    { id: "btn33", name: "median_household_income", label: "Median Household Income", type: "number", multiselect: "false", adminUnit: false, options: [] },
    { id: "btn34", name: "plot_ownership_ratio", label: "Plot Ownership Ratio", type: "number", multiselect: "false", adminUnit: false, options: [] },
    { id: "btn35", name: "plot_tenant_ratio", label: "Plot Tenant Ratio", type: "number", multiselect: "false", adminUnit: false, options: [] },
    { id: "btn36", name: "avg_rent", label: "Average Rent", type: "number", multiselect: "false", adminUnit: false, options: [] },
    { id: "btn37", name: "main_env_hazards", label: "Main Environmental Hazards", type: "textarea", multiselect: "false", adminUnit: false, options: [] },
    { id: "btn38", name: "general_location", label: "General Location", type: "text", multiselect: "false", adminUnit: false, options: [] },
    {
      id: "btn39",
      name: "profiling_status",
      label: "Profiling Status",
      type: "select",
      multiselect: "false",
      adminUnit: false,
      options: profilingStatusOptions.value,
    },
    {
      id: "btn40",
      name: "is_qualified",
      label: "Qualified (score ≥ threshold)",
      type: "select",
      multiselect: "false",
      adminUnit: false,
      options: yes_no.value,
    },
    { id: "btn41", name: "description", label: "Description", type: "textarea", multiselect: "false", adminUnit: false, options: [] },
    { id: "btn42", name: "comments", label: "Comments/Remarks", type: "textarea", multiselect: "false", adminUnit: false, options: [] },
  ],
  // Step 4: Geolocation
  [
     
  ],
];

const formData: FormData = reactive({});

const formRules: FormRules = reactive({
  step1: {
    name: [{ required: true, message: "Name is required", trigger: "blur" }],
    county_id: [{ required: true, message: "County is required", trigger: "blur" }],
    subcounty_id: [{ required: true, message: "Constituency is required", trigger: "blur" }],
    ward_id: [{ required: true, message: "Ward is required", trigger: "blur" }],
    settlement_type: [{ required: true, message: "Type is required", trigger: "blur" }],
  },
  step2: {
    area: [{ required: false, message: "Area is recommended", trigger: "blur" }],
    population: [{ required: false, message: "Population is recommended", trigger: "blur" }],
  },
  step3: {
    num_households: [{ required: false, message: "Number of households is recommended", trigger: "blur" }],
  },
  step4: {},
});

export { formFields, countyOptions, formData, steps, formRules };