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
   { title: "Composition" },
  { title: "Structures" },
  { title: "Waste" },
  { title: "Services" },
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

const use =ref([
    { label: 'Residential', value: 'residential' },
    { label: 'Industrial', value: 'industrial' },
]) 
    
const formFields: Field[][] = [
  // Fields for 1 Profile

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
      name: "national_id",
      label: "National ID",
      type: "text",
      multiselect: 'false',
      options: [],
    },

    {
      name: "gender",
      label: "Gender",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
      ],
    },
    {
      name: "owner_tenant",
      label: "Ownership",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Plot Owner", value: "plot_owner" },
        { label: "Structure owner", value: "structure_owner" },
        { label: "Tenant/Occupier", value: "tenant" },
      ],
    },

    {
      name: "owner_type",
      label: "Owner Type",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Person ", value: "person" },
        { label: "Organization", value: "organization" },
      ],
    },
    {
      name: "mode_acquisition",
      label: "Acquisition",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Self-Acquired", value: "self_acquired" },
        { label: "Allocation", value: "allocation" },
        { label: "Inherited", value: "inherited" },
        { label: "Purchased", value: "purchased" },
        { label: "Other", value: "other" },
      ],
    },
    {
      name: "ownership_doc",
      label: "Documentation",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Title deed", value: "title_deed" },
        { label: "Allotment letter", value: "allotment" },
        {
          label: "Temporary Occupancy License",
          value: "temporary_occupancy_license",
        },
        { label: "No document", value: "no_document" },
        { label: "Another document", value: "other" },
      ],
    },

    {
      name: "number_male_owners",
      label: "#Male owners",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      name: "number_female_owners",
      label: "#FeMale owners",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      name: "age",
      label: "Owner Age",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "0-18", value: "0-18" },
        { label: "18-25", value: "18-25" },
        { label: "26-35", value: "26-35" },
        { label: "46-55", value: "46-55" },
        { label: "56-65", value: "6-65" },
        { label: "≥70", value: "≥70" },
      ],
    },
    {
      name: "nationality",
      label: "Nationality",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Kenyan Citizen", value: "citizen" },
        { label: "Refugee", value: "refugee" },
      ],
    },
    {
      name: "marital_status",
      label: "Marital Status",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Single", value: "single" },
        { label: "Married", value: "married" },
        { label: "Separated", value: "separated" },
        { label: "Widowed", value: "widowed" },
        { label: "Cohabiting", value: "cohabiting" },
      ],
    },

    {
      name: "disability",
      label: "Disability",
      type: "select",
       multiselect: 'false',
      options: [
        { label: "Visual", value: "visual" },
        { label: "Hearing", value: "hearing" },
        { label: "Speech", value: "speech" },
        { label: "Physical", value: "physical" },
        { label: "Mental", value: "mental" },
        { label: "Self-care difficulties", value: "selfcare_difficulties" },
        { label: "Others", value: "other" },
      ],
    },

    {
      name: "education_level",
      label: "Education Level",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "College/University", value: "college_university" },
        { label: "Secondary", value: "secondary" },
        { label: "Adult Education", value: "adult" },
        { label: "None", value: "none" },
      ],
        },
        {
            name: "tenancy_agreement",
            label: "Tenancy",
            type: "select",
            multiselect: 'false',
            options: [
              { label: "Written Agreement", value: "written" },
              { label: "Verbal Agreement", value: "verbal" },
            ],
          },
      
          {
            name: "migration_reason",
            label: "Reason for Moving",
            type: "select",
            multiselect: 'true',
            options: [
              { label: "Domestic reasons", value: "domestic_reasons" },
              { label: "Economic reasons", value: "economic_reasons" },
              { label: "Eviction", value: "eviction" },
              { label: "Skirmishes", value: "skirmishes" },
              { label: "Other", value: "other_reason" },
              { label: "N/A", value: "not_applicable" },
            ],
          },
      
          {
            name: "occupation",
            label: "Occupation",
            type: "select",
             multiselect: 'false',
            options: [
              { label: "Civil Servant", value: "civil_servant" },
              { label: "In private sector", value: "private_sector" },
              { label: "Casual Laborer", value: "casual_laborer" },
              { label: " Self-employed", value: "self_employed" },
              { label: "Unemployed", value: "unemployed" },
              { label: "Student", value: "student" },
              { label: "Other", value: "other" },
              { label: "N/A", value: "not_applicable" },
            ],
          },
          {
            name: "years",
            label: "Years Lived in Settlement",
            type: "number",
            multiselect: 'false',
            options: [],
          },
      
          {
            name: "prev_residence",
            label: "Previous Residence",
            type: "select",
            multiselect: 'false',
            options: [
              { label: "In this village", value: "within_village" },
              { label: "Inside this settlement", value: "inside_settlement" },
              { label: "Outside this settlement", value: "outside_settlement" },
              { label: "Not sure where he/she stays", value: "not_sure" },
            ],
          },
  ],
  // Fields for 3. Composition
  [
    {
      label: "Number of Girls (0-4)yrs",
      name: "age_00_04f",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Boys (0-4)yrs",
      name: "00_04m",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Girls (5-9)yrs",
      name: "05_09f",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Boys (5-9)yrs",
      name: "05_09m",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Girls (10-14)yrs",
      name: "10_14f",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Boys (10-14)yrs",
      name: "10_14m",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Females (15-19)yrs",
      name: "15_19f",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Males (15-19)yrs",
      name: "15_19m",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Females (20-14)yrs",
      name: "20_24f",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Males (20-14)yrs",
      name: "20_24m",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Females (25-29)yrs",
      name: "25_29f",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Males (25-29)yrs",
      name: "25_29m",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Females (30-34)yrs",
      name: "30_34f",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Males (30-34)yrs",
      name: "30_34m",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Females (35-39)yrs",
      name: "35_39f",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Males (35-39)yrs",
      name: "35_39m",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Females (40-44)yrs",
      name: "40_44f",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Males (40-44)yrs",
      name: "40_44m",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Females (45-49)yrs",
      name: "45_49f",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Males (45-49)yrs",
      name: "45_49m",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Females (50-54)yrs",
      name: "50_54f",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Males (50-54)yrs",
      name: "50_54m",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Females (55-59)yrs",
      name: "55_59f",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Males (55-59)yrs",
      name: "55_59m",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Females (60-64)yrs",
      name: "60_64f",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Males (60-64)yrs",
      name: "60_64m",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Females (65-69)yrs",
      name: "65_69f",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Males (65-69)yrs",
      name: "65_69m",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Females (70+)yrs",
      name: "gt_70f",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      label: "Number of Males (70+)yrs",
      name: "gt_70m",
      type: "number",
      multiselect: 'false',
      options: [],
    },
  ],

   

     [

         {
             name: 'structure_use', label: 'Structure Use', type: 'select', multiselect: 'false', options: use.value   },
          {
              name: 'structure_nature', label: 'Structure Type', type: 'select',  multiselect: 'false',
              options: [
                  { label: 'Permanent', value: 'permanent' },
                  { label: 'Semi-permanent ', value: 'semi_permanent' },
                  { label: 'Temporary', value: 'temporary' }]
              },
          { name: 'floor', label: 'StructureFloorMaterial', type: 'select',  multiselect: 'false', options: [{ label: 'Cement', value: 'cement' }, { label: 'Earth ', value: 'earth' }, { label: 'Tiled', value: 'tiled' }] },
          { name: 'material', label: 'Wall Material', type: 'select', multiselect: 'false', options: material },
          { name: 'roof', label: 'Roof Material', type: 'select', multiselect: 'false', options: material },
          { name: 'structure_width', label: 'Structure Width(m)', type: 'number',multiselect: 'false', options: [] },
          { name: 'structure_length', label: 'Structure Length(m)', type: 'number',multiselect: 'false', options: [] },
          { name: 'water', label: 'Mains Water', type: 'select', multiselect: 'false', options: water },
          { name: 'water_cost_20l', label: 'Average cost of water for 20L', type: 'number',multiselect: 'false', options: [] },
          {
              name: 'water_usage_day', label: 'Water used per day in liters', type: 'select',  multiselect: 'false',
              options: [
                  { label: '0-10L', value:  '0_10' },
                  { label: '11-20L', value: '11_20' },
                  { label: '21-30L', value: '21_30' },
                  { label: '31-40L', value: '31_40' },
                  { label: '41-50L', value: '41_50' },
                  { label: 'Above 50L', value: 'gt_50' },
               ]
          },
          { name: 'bathroom', label: 'Average cost Bathroom',type: 'select', multiselect: 'false', options: bathroom  },
          { name: 'toilet', label: 'Average to Toilet',type: 'select', multiselect: 'false', options: toilet  },
          { name: 'toilet_fee_use', label: 'Cost for Paid Toilets per use', type: 'number',multiselect: 'false', options: [] },

          {
              name: 'access_handwashing', label: 'Handwashing facility', type: 'select',  multiselect: 'false',
              options: [
                  { label: 'Yes, with soap and water ', value:  'soap_water' },
                  { label: 'Yes, Water only', value: 'water_only' },
                  { label: 'None', value: 'none' },
               ]
           },
      ],

  //     // Fields for 4. Composition
  //     // 5: Solid Waste
  [
    {
      name: "wdisposal",
      label: "Waste Disposal",
      type: "select",
      multiselect: 'false',
      options: disposal,
    },

    {
      name: "solid_waste_type",
      label: "Major types of Solid Waste  ",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Plastics", value: "Plastics" },
        { label: "Paper", value: "Paper" },
        { label: "Metal", value: "Metal" },
        { label: "Organic", value: "Organic" },
        { label: "Glass", value: "Glass" },
        { label: "Electronic", value: "Electronic" },
        { label: "Other", value: "Other" },
      ],
    },

    {
      name: "type_solid_waste_sorted",
      label: "Type Solid Waste Sorted",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Plastics", value: "Plastics" },
        { label: "Paper", value: "Paper" },
        { label: "Metal", value: "Metal" },
        { label: "Organic", value: "Organic" },
        { label: "Glass", value: "Glass" },
        { label: "Electronic", value: "Electronic" },
        { label: "Other", value: "Other" },
      ],
    },

    {
      name: "type_sorted_waste_reused",
      label: "Type of Solid Waste Reused",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Plastics", value: "Plastics" },
        { label: "Paper", value: "Paper" },
        { label: "Metal", value: "Metal" },
        { label: "Organic", value: "Organic" },
        { label: "Glass", value: "Glass" },
        { label: "Electronic", value: "Electronic" },
        { label: "Other", value: "Other" },
      ],
    },

    {
      name: "solid_waste_storage",
      label: "Solid Waste Storage",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Don't store", value: "Don't store" },
        { label: "Polythene bags", value: "Polythene bags" },
        { label: "Cardboard boxes", value: "Cardboard boxes" },
        { label: "Waste bins", value: "Waste bins" },
        {
          label: "At one point within the structure/plot",
          value: "At one point within the structure/plot",
        },
      ],
    },

    {
      name: "solid_waste_disposal",
      label: "Solid Waste Disposal",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Composting", value: "Composting" },
        {
          label: "Indiscriminate dumping (open drains)",
          value: "Indiscriminate dumping (open drains)",
        },
        { label: "Burning", value: "Burning" },
        { label: "Private collectors", value: "Private collectors" },
        { label: "County receptacles", value: "County receptacles" },
        { label: "Open ground", value: "Open ground" },
        { label: "Pit latrine", value: "Pit latrine" },
        { label: "No means", value: "No means" },
        { label: "Other", value: "other" },
      ],
    },
    {
      name: "distance_receptacles",
      label: "Distance to Receptacles",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "<=50m", value: "<=50m" },
        { label: "51-100m", value: "51-100m" },
        { label: "101-200m", value: "101-200m" },
        { label: "201-500m", value: "201-500m" },
        { label: "Above 500m", value: "Above 500m" },
      ],
    },
    {
      name: "freq_receptacles_emptying",
      label: "Receptacles Emptying",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Daily", value: "Daily" },
        { label: "Weekly", value: "Weekly" },
        { label: "Twice a week", value: "Twice a week" },
        { label: "Three times a week", value: "Three times a week" },
        { label: "Monthly", value: "Monthly" },
      ],
    },

    {
      name: "type_waste_collector",
      label: "Type of Waste Collector",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Private", value: "Private" },
        { label: "Public (Government)", value: "Public (Government)" },
        {
          label: "Self-help/Community group",
          value: "Self-help/Community group",
        },
        { label: "Other", value: "Other" },
      ],
    },

    {
      name: "freq_receptacles_emptying_private",
      label: "Receptacles Emptying (Priv.)",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Daily", value: "Daily" },
        { label: "Weekly", value: "Weekly" },
        { label: "Twice a week", value: "Twice a week" },
        { label: "Three times a week", value: "Three times a week" },
        { label: "Monthly", value: "Monthly" },
      ],
    },

    {
      name: "waste_to_collection",
      label: "Transport Mode to collection",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Truck", value: "Truck" },
        { label: "Mkokoteni/wheelbarrow", value: "Mkokoteni/wheelbarrow" },
        {
          label: "Other means, please specify",
          value: "Other means, please specify",
        },
      ],
    },

    {
      name: "waste_destination",
      label: "Waste Destination",
      type: "select",
      multiselect: 'false',
      options: [
        {
          label: "Dumpsite within the settlement",
          value: "Dumpsite within the settlement",
        },
        {
          label: "Dumpsite outside the settlement",
          value: "Dumpsite outside the settlement",
        },
        {
          label: "Another site, please specify",
          value: "Another site, please specify",
        },
      ],
    },
    {
      name: "waste_cost_payer",
      label: "Who pays",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Tenant", value: "Tenant" },
        { label: "Landlord", value: "Landlord" },
        { label: "Both", value: "Both" },
      ],
    },

    {
      name: "waste_cost_per_month",
      label: "Waste Collection CostMonth",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "I dispose my own waste", value: "0" },
        { label: "1-50", value: "1-50" },
        { label: "51-100", value: "51-100" },
        { label: "101-150", value: "101-150" },
        { label: "151-200", value: "151-200" },
        { label: "Above 200", value: "Above 200" },
      ],
    },
    {
      name: "ability_to_pay_waste",
      label: "Ability to Pay",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Not able", value: "Not able" },
        { label: "Struggling to pay", value: "Struggling to pay" },
        { label: "Comfortable paying", value: "Comfortable paying" },
      ],
    },

    {
      name: "desirable_waste_cost_per_month",
      label: "Amount Willing to Pay",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "I dispose my own waste", value: "0" },
        { label: "1-50", value: "1-50" },
        { label: "51-100", value: "51-100" },
        { label: "101-150", value: "101-150" },
        { label: "151-200", value: "151-200" },
        { label: "Above 200", value: "Above 200" },
      ],
    },
    {
      name: "num_waste_bags",
      label: "Number of Waste BinsBags",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "None", value: "None" },
        { label: "1", value: "1" },
        { label: "2", value: "2" },
        { label: "3", value: "3" },
        { label: "4", value: "4" },
        { label: ">4", value: ">4" },
      ],
    },
    {
      name: "rate_waste_management",
      label: "Waste management Rating",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Very Good", value: "Very Good" },
        { label: "Good", value: "Good" },
        { label: "Fair", value: "Fair" },
        { label: "Poor", value: "Poor" },
      ],
    },
  ],
  [
    {
      name: "cost_electricity_permon",
      label: "Cost of Electricity Per Month",
      type: "number",
      multiselect: 'false',
      options: [],
    },
    {
      name: 'energy_lighting',
      label: 'Lighting',
      type: 'select',
      multiselect: 'false',
      options: [
        { label: 'Electricity', value: 'Electricity' },
        { label: 'Gas', value: 'Gas' },
        { label: 'Biomass', value: 'Biomass' },
        { label: 'Kerosene', value: 'Kerosene' },
        { label: 'Charcoal', value: 'Charcoal' },
        { label: 'Firewood', value: 'Firewood' },
        { label: 'Soil balls', value: 'Soil balls' },
      ],
    },

    {
      name: "energy_prov",
      label: "provider",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "solar", value: "Electricity" },
        { label: "kenya power", value: "Gas" },
        { label: "other", value: "Biomass" },
      ],
    },

    {
      name: "source_cooking_energy",
      label: "Source of Cooking Energy",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Electricity", value: "Electricity" },
        { label: "Gas", value: "Gas" },
        { label: "Biomass", value: "Biomass" },
        { label: "Kerosene", value: "Kerosene" },
        { label: "Charcoal", value: "Charcoal" },
        { label: "Firewood", value: "Firewood" },
        { label: "Soil balls", value: "Soil balls" },
        { label: "Other. Specify", value: "Other. Specify" },
      ],
    },

    {
      name: "transport",
      label: "Transport",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Train", value: "Train" },
        { label: "Matatu", value: "Matatu" },
        { label: "Motor Cycle", value: "Motor Cycle" },
        { label: "Bicyle", value: "Bicyle" },
        { label: "Foot", value: "Foot" },
        { label: "Other", value: "Other" },
      ],
    },

     

    {
      name: "communication_mode",
      label: "Mode of Communication",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Letters", value: "Letters" },
        { label: "Landline", value: "Landline" },
        { label: "Pay phone", value: "Pay phone" },
        { label: "Mobile phone", value: "Mobile phone" },
        { label: "Parcels", value: "Parcels" },
        { label: "E-mail", value: "E-mail" },
        { label: "Physical contact", value: "Physical contact" },
      ],
    },
    {
      name: "access_health",
      label: "Health Care Facilities",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Public hospital", value: "Public hospital" },
        { label: "Private hospital", value: "Private hospital" },
        { label: "Mission / NGO hospital", value: "Mission / NGO hospital" },
        { label: "Traditional Healer", value: "Traditional Healer" },
        { label: "Chemist", value: "Chemist" },
        { label: "Shop", value: "Shop" },
        { label: "Spiritual Healer", value: "Spiritual Healer" },
      ],
    },
    { name: "main_health_facility", label: "Main HCF accessed", type: "text",multiselect: 'false',options:[] },
    {
      name: "main_health_fac_loc",
      label: "Where is this HCF?",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "In this village", value: "In this village" },
        { label: "Inside this settlement", value: "Inside this settlement" },
        { label: "Outside this settlement", value: "Outside this settlement" },
      ],
    },

    {
      name: "common_ailments",
      label: "Common Ailments",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Malaria", value: "Malaria" },
        { label: "TB", value: "TB" },
        { label: "Diarrhea", value: "Diarrhea" },
        { label: "Pneumonia", value: "Pneumonia" },
        { label: "Common cold", value: "Common cold" },
        { label: "Amoeba / Typhoid", value: "Amoeba / Typhoid" },
        { label: "Hypertension", value: "Hypertension" },
        { label: "Diabetes", value: "Diabetes" },
        {
          label: "Other ailments. Please explain",
          value: "Other ailments. Please explain",
        },
      ],
    },

    {
      name: "dist_main_health_fac",
      label: "Distance to the Facility(km)",
      type: "number",multiselect: 'false',options:[]
    },

    {
      name: "access_public_sch",
      label: "Access to Public School",
      type: "select",
      multiselect: 'false',
      options: yes_no,
    },

    {
      name: "dist_school",
      label: "Distance to the School(km)",
      type: "number",multiselect: 'false',options:[]
    },
    {
      name: "upgrade_priority",
      label: "Upgrading Priorities",
      type: "select",
      multiselect: 'false',
      options: [
        { label: "Security", value: "Security" },
        { label: "Health", value: "Health" },
        { label: "Education", value: "Education" },
        { label: "Water", value: "Water" },
        { label: "Electricity", value: "Electricity" },
        { label: "Roads", value: "Roads" },
        { label: "Housing", value: "Housing" },
        { label: "Employment", value: "Employment" },
        { label: "Sanitation", value: "Sanitation" },
        { label: "Other issues. If any other, please state", value: "other" },
      ],
    },
  ],
];

const formData: FormData = reactive({});
const formRules: FormRules = reactive({
  // Validation rules for each step
  step1: {
    // name: [
    //     { required: true, message: 'Name is required', trigger: 'blur' }
    // ],
    // // age: [
    //     { required: true, message: 'Age is required', trigger: 'blur' },
    //     { type: 'number', message: 'Age must be a number', trigger: 'blur' }
    // ],
    // location: [
    //     { required: true, message: 'Location is required', trigger: 'blur' }
    // ],
    // gender: [
    //     { required: true, message: 'Gender is required', trigger: 'blur' }
    // ],
    // national_id: [
    //     { required: true, message: 'ID is required', trigger: 'blur' }
    // ],
    // owner_tenant: [
    //     { required: true, message: 'Tenancy is required', trigger: 'blur' }
    // ],
    // owner_type: [
    //     { required: true, message: 'This is required', trigger: 'blur' }
    // ],
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
