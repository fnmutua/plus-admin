
import { reactive, unref, ref } from 'vue'
import { ref, reactive, computed, Ref } from 'vue';
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { ElCard } from 'element-plus'
 
import { countyOptions,settlementOptionsV2, subcountyOptions,wardOptions,cascadedAdminOptions } from './index.ts' 

 
 

const steps = [
    { title: 'Profile' },
    { title: 'Income' },
    { title: 'Composition' },
    { title: 'Structures' },
    { title: 'Solid Waste' },
    { title: 'Services' }
 
    // Add more steps as needed
];


interface Field {
    name: string;
    label: string;
    type: string;
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
const yes_no = [{ label: 'Yes', value: 'yes'  }, { label: 'No', value: 'no' }]
const residence = [
    { label: 'In this village', value: 'within_village'  },
    { label: 'Inside this settlement', value: 'inside_settlement' },
    { label: 'Outside this settlement', value: 'outside_settlement' },
    { label: 'Not sure where he/she stays', value: 'not_sure' }
    
]
 
const moneyRange = [
    { label: '0-5000', value: '0-5000'  },
    { label: '5,001- 10,000 ', value: '5,001- 10,000' },   
    { label: '10,001- 15,000 ', value: '10,001- 15,000' },   
    { label: '15,001- 20,000', value: '15,001- 20,000' },  
    { label: '20,001-30,000 ', value: '20,001-30,000' },
    { label: '30,001-50,000', value: '30,001-50,000' },
    { label: 'Above 50,000', value: 'Above 50,000' }
]
const material = [
    { label: 'Stone', value: 'stone'  },
    { label: 'Iron sheets', value: 'iron_sheets'  },
    { label: 'Wooden', value: 'wooden'  },
    { label: 'Polythene/Carton', value: 'polythene'  },
    { label: 'Earth', value: 'earth'  },
     
]
 





const formFields: Field[][] = [
    // Fields for 1Profile
    [
        { name: 'location', label: 'Location', type: 'cascade', multiple: false, options:cascadedAdminOptions.value },
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'national_id', label: 'National ID', type: 'text' },

        { name: 'gender', label: 'Gender', type: 'select', multiple: false,   options: [
                { label: 'Male', value: 'male', },
                { label: 'Female', value: 'female' } 
        ]
        } ,
        {
            name: 'owner_tenant', label: 'Ownership', type: 'select', multiple: false, options: [
                    { label: 'Plot Owner', value: 'plot_owner', },
                    { label: 'Structure owner', value: 'structure_owner' },
                    { label: 'Tenant/Occupier', value: 'tenant' }, 
                ]
            },
         
            {
                name: 'owner_type', label: 'Owner Type', type: 'select', multiple: false, options: [
                        { label: 'Person ', value: 'person', },
                        { label: 'Organization', value: 'organization' },
                     ]
            },
            {
                name: 'mode_acquisition', label: 'Acquisition', type: 'select', multiple: false, options: [
                        { label: 'Self-Acquired', value: 'self_acquired'  },
                        { label: 'Allocation', value: 'allocation' },
                        { label: 'Inherited', value: 'inherited' },
                        { label: 'Purchased', value: 'purchased' },
                        { label: 'Other', value: 'other' },
                       
                     ]
            }, 
            {
                name: 'ownership_doc', label: 'Documentation', type: 'select', multiple: false, options: [
                        { label: 'Title deed', value: 'title_deed'  },
                        { label: 'Allotment letter', value: 'allotment' },
                        { label: 'Temporary Occupancy License', value: 'temporary_occupancy_license' },
                        { label: 'No document', value: 'no_document' },
                        { label: 'Another document', value: 'other' },
                       
                     ]
            }, 
     
            { name: 'number_male_owners', label: '#Male owners', type: 'number' },
            { name: 'number_female_owners', label: '#FeMale owners', type: 'number' },
            {
                name: 'age', label: 'Owner Age', type: 'select', multiple: false, options: [
                        { label: '0-18', value: '0-18'  },
                        { label: '18-25', value: '18-25' },
                        { label: '26-35', value: '26-35' },
                        { label: '46-55', value: '46-55' },
                        { label: '56-65', value: '6-65' },
                        { label: '≥70', value: '≥70' },
                     ]
            },  
            {
                name: 'nationality', label: 'Nationality', type: 'select', multiple: false, options: [
                        { label: 'Kenyan Citizen', value: 'citizen'  },
                        { label: 'Refugee', value: 'refugee' },
                       
                     ]
            },  
            {
                name: 'marital_status', label: 'Marital Status', type: 'select', multiple: false, options: [
                        { label: 'Single', value: 'single'  },
                        { label: 'Married', value: 'married' },
                        { label: 'Separated', value: 'separated' },
                        { label: 'Widowed', value: 'widowed' },
                        { label: 'Cohabiting', value: 'cohabiting' },
                       
                     ]
            },  
            
    
            {
                name: 'residence', label: 'Residence', type: 'select', multiple: false, options: residence
            },  
        
     
            {
                name: 'with_disability', label: 'With Disability', type: 'select', multiple: false, options:  yes_no
            },  
            
            {
                name: 'disability', label: 'Disability', type: 'select', multiple: true, options: [
                        { label: 'Visual', value: 'visual'  },
                        { label: 'Hearing', value: 'hearing' },
                        { label: 'Speech', value: 'speech' },
                        { label: 'Physical', value: 'physical' },
                        { label: 'Mental', value: 'mental' },
                        { label: 'Self-care difficulties', value: 'selfcare_difficulties' },
                        { label: 'Others', value: 'other' },
                       
                     ]
            },  
            
            {
                name: 'education_level', label: 'Education Level', type: 'select', multiple: false, options: [
                        { label: 'College/University', value: 'college_university'  },
                        { label: 'Secondary', value: 'secondary' },
                        { label: 'Adult Education', value: 'adult' },
                        { label: 'None', value: 'none' },
                       
                     ]
            },  
            
     
 
      
    ],
    // Fields for 2,Income
    [      
         
        {
            name: 'tenancy_agreement', label: 'Tenancy', type: 'select', multiple: false,
            options: [
                    { label: 'Written Agreement', value: 'written'  },
                    { label: 'Verbal Agreement', value: 'verbal' },  ]
        },

        
         {
            name: 'migration_reason', label: 'Reason for Moving', type: 'select', multiple: true, options: [
                { label: 'Domestic reasons', value: 'domestic_reasons'  },
                { label: 'Economic reasons', value: 'economic_reasons' },
                { label: 'Eviction', value: 'eviction' },
                { label: 'Skirmishes', value: 'skirmishes' },
                 { label: 'Other', value: 'other_reason' },
                { label: 'N/A', value: 'not_applicable' },
            
            ]
    }, 
     
    {
        name: 'occupation', label: 'Occupation', type: 'select', multiple: true, options: [
            { label: 'Civil Servant', value: 'civil_servant'  },
            { label: 'In private sector', value: 'private_sector' },
            { label: 'Casual Laborer', value: 'casual_laborer' },
            { label: ' Self-employed', value: 'self_employed' },
            { label: 'Unemployed', value: 'unemployed' },
            { label: 'Student', value: 'student' },
            { label: 'Other', value: 'other' },
            { label: 'N/A', value: 'not_applicable' },
        
        ]
},
{ name: 'years', label: 'Years Lived in Settlement', type: 'number' },
   
{
    name: 'place_work', label: 'Place of Work', type: 'select', multiple: false,
    options:residence
}, 
{
    name: 'income_monthly', label: 'Monthly Income', type: 'select', multiple: false,
    options:moneyRange
        },

        {
            name: 'monthly_rent', label: 'Rent', type: 'select', multiple: false,
            options:moneyRange
        },
{
    name: 'food_expenses', label: 'Monthly Expenses(Food)', type: 'select', multiple: false,
    options:moneyRange
},
{
    name: 'clothing_expenses', label: 'Monthly Expenses(Clothes)', type: 'select', multiple: false,
    options:moneyRange
  },
        {
            name: 'prev_residence', label: 'Previous Residence', type: 'select', multiple: false, options: [  { label: 'In this village', value: 'within_village'  },
            { label: 'Inside this settlement', value: 'inside_settlement' },
            { label: 'Outside this settlement', value: 'outside_settlement' },
            { label: 'Not sure where he/she stays', value: 'not_sure' }
            ]
        }, 


    ],
    // Fields for 3. Composition
    [
        { label: 'Number of Girls (0-4)yrs', name: 'age_00_04f', type: 'number' },
        { label: 'Number of Boys (0-4)yrs', name: '00_04m', type: 'number' },
        { label: 'Number of Girls (5-9)yrs', name: '05_09f', type: 'number' },
        { label: 'Number of Boys (5-9)yrs', name: '05_09m', type: 'number' },
        { label: 'Number of Girls (10-14)yrs', name: '10_14f', type: 'number' },
        { label: 'Number of Boys (10-14)yrs', name: '10_14m', type: 'number' },
        { label: 'Number of Females (15-19)yrs', name: '15_19f', type: 'number' },
        { label: 'Number of Males (15-19)yrs', name: '15_19m', type: 'number' },
        { label: 'Number of Females (20-14)yrs', name: '20_24f', type: 'number' },
        { label: 'Number of Males (20-14)yrs', name: '20_24m', type: 'number' },
        { label: 'Number of Females (25-29)yrs', name: '25_29f', type: 'number' },
        { label: 'Number of Males (25-29)yrs', name: '25_29m', type: 'number' },
        { label: 'Number of Females (30-34)yrs', name: '30_34f', type: 'number' },
        { label: 'Number of Males (30-34)yrs', name: '30_34m', type: 'number' },
        { label: 'Number of Females (35-39)yrs', name: '35_39f', type: 'number' },
        { label: 'Number of Males (35-39)yrs', name: '35_39m', type: 'number' },
        { label: 'Number of Females (40-44)yrs', name: '40_44f', type: 'number' },
        { label: 'Number of Males (40-44)yrs', name: '40_44m', type: 'number' },
        { label: 'Number of Females (45-49)yrs', name: '45_49f', type: 'number' },
        { label: 'Number of Males (45-49)yrs', name: '45_49m', type: 'number' },
        { label: 'Number of Females (50-54)yrs', name: '50_54f', type: 'number' },
        { label: 'Number of Males (50-54)yrs', name: '50_54m', type: 'number' },
        { label: 'Number of Females (55-59)yrs', name: '55_59f', type: 'number' },
        { label: 'Number of Males (55-59)yrs', name: '55_59m', type: 'number' },
        { label: 'Number of Females (60-64)yrs', name: '60_64f', type: 'number' },
        { label: 'Number of Males (60-64)yrs', name: '60_64m', type: 'number' },
        { label: 'Number of Females (65-69)yrs', name: '65-69f', type: 'number' },
        { label: 'Number of Males (65-69)yrs', name: '65-69m', type: 'number' },
        { label: 'Number of Females (70+)yrs', name: '>70f', type: 'number' },
        { label: 'Number of Males (70+)yrs', name: '>70m', type: 'number' },
     ],
    // 4: Structures
    [
        {
            name: 'structure_use', label: ' Structure/Room use', type: 'select', multiple: true,
            options: [
                { label: 'Residential', value: 'residential' },
                { label: 'Industrial', value: 'industrial' },
                { label: 'Educational', value: 'educational' },
            { label: 'Recreational', value: 'recreational' },
            { label: 'Sports/Gym', value: 'sports' },
            { label: ' Music', value: 'music' },
            { label: 'Theatre', value: 'theatre' },
            { label: 'Disco/Night club', value: 'disco' },
            { label: 'Commercial', value: 'commercial' },
            { label: 'Transport', value: 'transport' },
            { label: 'Urban Agriculture', value: 'urban_agric' },
            { label: 'Public purpose', value: 'public_purpose' },
            { label: 'Public Utility', value: 'public_use' },
            { label: 'Other', value: 'other' },
            ]
        }, 
            {
            name: 'structure_nature', label: ' Structure Type', type: 'select', multiple: true,
            options: [
                { label: 'Permanent', value: 'permanent' },
                { label: 'Semi-permanent ', value: 'semi_permanent' },
                { label: 'Temporary', value: 'temporary' }, ]

            },
        
            {
                name: 'structure_wall_material', label: ' Structure Wall Material', type: 'select', multiple: true,
                options:  material
             },
            
         
        
             {
                name: 'structure_floor_material', label: ' Structure Floor Material', type: 'select', multiple: true,
                options: [
                    { label: 'Cement', value: 'cement' },
                    { label: 'Earth ', value: 'earth' },
                    { label: 'Tiled', value: 'tiled' }, ]
     
             },
            
             {
                name: 'structure_roof_material', label: ' Structure Roof Material', type: 'select', multiple: true,
                options: [
                    { label: 'Tiles', value: 'tiles' },
                    { label: 'Iron Sheets ', value: 'iron_sheets' },
                    { label: 'Wooden', value: 'wooden' }, 
                    { label: 'Grass', value: 'grass_thatched' }, ]
     
             },
            
             { name: 'structure_width', label: 'Structure Width(m)', type: 'number' },
             { name: 'structure_length', label: 'Structure Length(m)', type: 'number' },
             {
                name: 'main_src_water', label: 'Main Source of Water', type: 'select', multiple: true,
                options: [
                    { label: 'No water', value: 'none' },
                    { label: 'Piped water', value: 'piped_water' },
                    { label: 'Shallow well', value: 'shallow_well' }, 
                    { label: 'Rainwater', value: 'rain' },  
                    { label: 'River/stream', value: 'river' },  
                    { label: 'Mobile vendors', value: 'mobile_vendors' },
                    { label: 'Other', value: 'other' },
                ]
        },
            
        { name: 'water_cost_20l', label: 'Average cost of water for 20L', type: 'number' },
        {
            name: 'water_usage_day', label: 'Water used per day in liters', type: 'select', multiple: true,
            options: [
                { label: '0-10L', value:  '0_10' },
                { label: '11-20L', value: '11_20' },
                { label: '21-30L', value: '21_30' }, 
                { label: '31-40L', value: '31_40' },  
                { label: '41-50L', value: '41_50' },  
                { label: 'Above 50L', value: 'gt_50' },
             ]
         },
     
    
         {
            name: 'access_bathroom', label: 'Access to a Bathroom', type: 'select', multiple: true,
            options: [
                { label: 'No bathroom', value:  'no_bathroom' },
                { label: 'Bathroom in the structure', value: 'bathroom_within_structure' },
                { label: 'Bathroom outside the structure', value: 'bathroom_outside_structure' }, 
               
             ]
         },
     
         {
            name: 'access_toilet', label: 'Toilet facility', type: 'select', multiple: true,
            options: [
                { label: 'No Toilet', value:  'no_toilet' },
                { label: 'Latrine', value: 'pit_latrine' },
                { label: 'VIP latrine', value: 'vip_latrine' }, 
                { label: 'WC/Sewer', value: 'flush_toilet' }, 
                { label: 'Septic Tank', value: 'septic_tank' }, 
                { label: 'Other', value: 'other' }, 
               
             ]
         },
   
         { name: 'toilet_fee_use', label: 'Cost for Paid Toilets per use', type: 'number' },

    
         {
            name: 'access_handwashing', label: 'Handwashing facility', type: 'select', multiple: true,
            options: [
                { label: 'Yes, with soap and water ', value:  'soap_water' },
                { label: 'Yes, Water only', value: 'water_only' },
                { label: 'None', value: 'none' }, 
             ]
         },
    ],
  // 5: Solid Waste
    [
        {
            name: 'solid_waste_disposal', label: 'Solid Waste Disposal', type: 'select', multiple: true,
            options: [
                { label: 'Private service provider', value: 'Private service provider' },
                { label: 'Dump site', value: 'Dump site' },
                { label: 'Bins', value: 'Bins' },
                { label: 'Road', value: 'Road' },
                { label: 'River', value: 'River' },
                { label: 'Outside the structure', value: 'Outside the structure' },
                { label: 'Open sewer', value: 'Open sewer' },
                { label: 'Other. Specify', value: 'Other. Specify' }
               
             ]
         },

 
         {
            name: 'solid_waste_type', label: 'Major types of Solid Waste  ', type: 'select', multiple: false,
            options: [
                { label: 'Plastics', value: 'Plastics' },
                { label: 'Paper', value: 'Paper' },
                { label: 'Metal', value: 'Metal' },
                { label: 'Organic', value: 'Organic' },
                { label: 'Glass', value: 'Glass' },
                { label: 'Electronic', value: 'Electronic' },
                { label: 'Other', value: 'Other' }
              ]
         },

    
         {
            name: 'solid_waste_sort', label: 'Solid Waste Sorted?', type: 'select', multiple: false,
            options: yes_no 
              
         },
         {
            name: 'type_solid_waste_sorted', label: 'Type Solid Waste Sorted', type: 'select', multiple: false,
            options:  [
                { label: 'Plastics', value: 'Plastics' },
                { label: 'Paper', value: 'Paper' },
                { label: 'Metal', value: 'Metal' },
                { label: 'Organic', value: 'Organic' },
                { label: 'Glass', value: 'Glass' },
                { label: 'Electronic', value: 'Electronic' },
                { label: 'Other', value: 'Other' }
              ]
        },
        {
            name: 'solid_waste_sold', label: 'Solid Waste Sold?', type: 'select', multiple: false,
            options: yes_no 
              
         },

         {
            name: 'sorted_waste_reused', label: 'Solid Waste Reused?', type: 'select', multiple: false,
            options: yes_no 
              
        },
         
        {
            name: 'type_sorted_waste_reused', label: 'Type of Solid Waste Reused?', type: 'select', multiple: false,
            options:   [
                { label: 'Plastics', value: 'Plastics' },
                { label: 'Paper', value: 'Paper' },
                { label: 'Metal', value: 'Metal' },
                { label: 'Organic', value: 'Organic' },
                { label: 'Glass', value: 'Glass' },
                { label: 'Electronic', value: 'Electronic' },
                { label: 'Other', value: 'Other' }
              ] 
              
         },
 
         {
            name: 'sorted_waste_composited', label: 'Solid Waste Composited?', type: 'select', multiple: false,
            options: yes_no 
              
        },
         
        {
            name: 'solid_waste_storage', label: 'Solid Waste Storage', type: 'select', multiple: false,
            options:   [
                { label: "Don't store", value: "Don't store" },
                { label: 'Polythene bags', value: 'Polythene bags' },
                { label: 'Cardboard boxes', value: 'Cardboard boxes' },
                { label: 'Waste bins', value: 'Waste bins' },
                {
                  label: 'At one point within the structure/plot',
                  value: 'At one point within the structure/plot'
                }
              ]
              
        },
         
        {
            name: 'solid_waste_disposal', label: 'Solid Waste Disposal', type: 'select', multiple: false,
            options:   [
                { label: 'Composting', value: 'Composting' },
                { label: 'Indiscriminate dumping (open drains)', value: 'Indiscriminate dumping (open drains)' },
                { label: 'Burning', value: 'Burning' },
                { label: 'Private collectors', value: 'Private collectors' },
                { label: 'County receptacles', value: 'County receptacles' },
                { label: 'Open ground', value: 'Open ground' },
                { label: 'Pit latrine', value: 'Pit latrine' },
                { label: 'No means', value: 'No means' },
                { label: 'Other', value: 'other' }
              ]
              
              
        },
        {
            name: 'distance_receptacles', label: 'Distance to Receptacles', type: 'select', multiple: false,
            options:   [
                { label: '<=50m', value: '<=50m' },
                { label: '51-100m', value: '51-100m' },
                { label: '101-200m', value: '101-200m' },
                { label: '201-500m', value: '201-500m' },
                { label: 'Above 500m', value: 'Above 500m' }
              ] 
        },
        {
            name: 'freq_receptacles_emptying', label: 'Receptacles Emptying', type: 'select', multiple: false,
            options:  [
                { label: 'Daily', value: 'Daily' },
                { label: 'Weekly', value: 'Weekly' },
                { label: 'Twice a week', value: 'Twice a week' },
                { label: 'Three times a week', value: 'Three times a week' },
                { label: 'Monthly', value: 'Monthly' }
              ]
              
        },

        {
            name: 'type_waste_collector', label: 'Type of Waste Collector', type: 'select', multiple: false,
            options: [
                { label: 'Private', value: 'Private' },
                { label: 'Public (Government)', value: 'Public (Government)' },
                { label: 'Self-help/Community group', value: 'Self-help/Community group' },
                { label: 'Other', value: 'Other' }
              ]
              
              
        },

        {
            name: 'freq_receptacles_emptying_private', label: 'Receptacles Emptying (Priv.)', type: 'select', multiple: false,
            options:  [
                { label: 'Daily', value: 'Daily' },
                { label: 'Weekly', value: 'Weekly' },
                { label: 'Twice a week', value: 'Twice a week' },
                { label: 'Three times a week', value: 'Three times a week' },
                { label: 'Monthly', value: 'Monthly' }
              ]
              
        },

        {
            name: 'waste_to_collection', label: 'Transport Mode to collection', type: 'select', multiple: false,
            options:  [
                { label: 'Truck', value: 'Truck' },
                { label: 'Mkokoteni/wheelbarrow', value: 'Mkokoteni/wheelbarrow' },
                { label: 'Other means, please specify', value: 'Other means, please specify' }
              ]             
        },

        {
            name: 'waste_destination', label: 'Waste Destination', type: 'select', multiple: false,
            options:  [
                { label: 'Dumpsite within the settlement', value: 'Dumpsite within the settlement' },
                { label: 'Dumpsite outside the settlement', value: 'Dumpsite outside the settlement' },
                { label: 'Another site, please specify', value: 'Another site, please specify' }
              ]
                         
        },
        {
            name: 'waste_cost_payer', label: 'Who pays?', type: 'select', multiple: false,
            options:  [
                { label: 'Tenant', value: 'Tenant' },
                { label: 'Landlord', value: 'Landlord' },
                { label: 'Both', value: 'Both' }
              ] 
        },

        {
            name: 'waste_cost_per_month', label: 'Waste Collection Cost/Month?', type: 'select', multiple: false,
            options:  [
                { label: 'I dispose my own waste', value: '0' },
                { label: '1-50', value: '1-50' },
                { label: '51-100', value: '51-100' },
                { label: '101-150', value: '101-150' },
                { label: '151-200', value: '151-200' },
                { label: 'Above 200', value: 'Above 200' },
               ]             
        },
        {
            name: 'ability_to_pay_waste', label: 'Ability to Pay', type: 'select', multiple: false,
            options:  [
                { label: 'Not able', value: 'Not able' },
                { label: 'Struggling to pay', value: 'Struggling to pay' },
                { label: 'Comfortable paying', value: 'Comfortable paying' }
              ]
                   
        },
        {
            name: 'willing_to_pay_waste', label: 'Willing to Pay?', type: 'select', multiple: false,
            options: yes_no   
        },

        {
            name: 'desirable_waste_cost_per_month', label: 'Amount Willing to Pay', type: 'select', multiple: false,
            options:  [
                { label: 'I dispose my own waste', value: '0' },
                { label: '1-50', value: '1-50' },
                { label: '51-100', value: '51-100' },
                { label: '101-150', value: '101-150' },
                { label: '151-200', value: '151-200' },
                { label: 'Above 200', value: 'Above 200' },
               ]             
        },
        {
            name: 'num_waste_bags', label: 'Number of Waste Bins/Bags', type: 'select', multiple: false,
            options:  [
                { label: 'None', value: 'None' },
                { label: '1', value: '1' },
                { label: '2', value: '2' },
                { label: '3', value: '3' },
                { label: '4', value: '4' },
                { label: '>4', value: '>4' }
              ]
                          
        },
        {
            name: 'rate_waste_management', label: 'Waste management Rating', type: 'select', multiple: false,
            options:  [
                { label: 'Very Good', value: 'Very Good' },
                { label: 'Good', value: 'Good' },
                { label: 'Fair', value: 'Fair' },
                { label: 'Poor', value: 'Poor' }
              ]
              
                          
        },

    ],
    // 6. Services
    [
        {
            name: 'energy_lighting', label: 'Lighting', type: 'select', multiple: true,
            options:[
                { label: 'Electricity', value: 'Electricity' },
                { label: 'Gas', value: 'Gas' },
                { label: 'Biomass', value: 'Biomass' },
                { label: 'Kerosene', value: 'Kerosene' },
                { label: 'Charcoal', value: 'Charcoal' },
                { label: 'Firewood', value: 'Firewood' },
                { label: 'Soil balls', value: 'Soil balls' }
              ] 
        },
        
        {
            name: 'energy_provider', label: 'Electricity Provider', type: 'select', multiple: true,
            options:[
                { label: 'Solar (personal)', value: 'Solar (personal)' },
                { label: 'Solar (Other provider)', value: 'Solar (Other provider)' },
                { label: 'Kenya Power', value: 'Kenya Power' },
                { label: 'Local provider', value: 'Local provider' },
                { label: 'Other. Specify', value: 'Other. Specify' }
              ]
              
         },

   
         {
            name: 'electricity_users', label: 'Electricity Uses', type: 'select', multiple: true,
            options:[
                { label: 'Lighting', value: 'Lighting' },
                { label: 'Cooking', value: 'Cooking' },
                { label: 'Charging electronics', value: 'Charging electronics' },
                { label: 'Radio/TV', value: 'Radio/TV' }
              ]
              
              
         },

         { name: 'cost_electricity_permon', label: 'Cost of Electricity Per Month', type: 'number' },

         {
            name: 'source_cooking_energy', label: 'Source of Cooking Energy', type: 'select', multiple: true,
            options:[
                { label: 'Electricity', value: 'Electricity' },
                { label: 'Gas', value: 'Gas' },
                { label: 'Biomass', value: 'Biomass' },
                { label: 'Kerosene', value: 'Kerosene' },
                { label: 'Charcoal', value: 'Charcoal' },
                { label: 'Firewood', value: 'Firewood' },
                { label: 'Soil balls', value: 'Soil balls' },
                { label: 'Other. Specify', value: 'Other. Specify' }
              ]
         },
         {
            name: 'transport_mode', label: 'Mode of Transport', type: 'select', multiple: true,
            options:[
                { label: 'Private car', value: 'Private car' },
                { label: 'Train', value: 'Train' },
                { label: 'Bus/ Matatu', value: 'Bus/ Matatu' },
                { label: 'Motorcycle', value: 'Motorcycle' },
                { label: 'Bicycle', value: 'Bicycle' },
                { label: 'On foot', value: 'On foot' },
                { label: 'N/A', value: 'N/A' },
                { label: 'Other mode of transport.', value: 'Other' }
              ]
              
        },
        {
            name: 'communication_mode', label: 'Mode of Communication', type: 'select', multiple: true,
            options:[
                { label: 'Letters', value: 'Letters' },
                { label: 'Land line telephone', value: 'Land line telephone' },
                { label: 'Pay phone', value: 'Pay phone' },
                { label: 'Mobile phone', value: 'Mobile phone' },
                { label: 'Parcels', value: 'Parcels' },
                { label: 'E-mail', value: 'E-mail' },
                { label: 'Physical contact', value: 'Physical contact' }
              ]
        },
        {
            name: 'access_health', label: 'Health Care Facilities', type: 'select', multiple: true,
            options:[
                { label: 'Public hospital', value: 'Public hospital' },
                { label: 'Private hospital', value: 'Private hospital' },
                { label: 'Mission / NGO hospital', value: 'Mission / NGO hospital' },
                { label: 'Traditional Healer', value: 'Traditional Healer' },
                { label: 'Chemist', value: 'Chemist' },
                { label: 'Shop', value: 'Shop' },
                { label: 'Spiritual Healer', value: 'Spiritual Healer' }
              ]             
              
        },
        { name: 'main_health_facility', label: 'Main HCF accessed', type: 'text' },
        {
            name: 'main_health_fac_loc', label: 'Where is this HCF?', type: 'select', multiple: true,
            options:[
                { label: 'In this village', value: 'In this village' },
                { label: 'Inside this settlement', value: 'Inside this settlement' },
                { label: 'Outside this settlement', value: 'Outside this settlement' }
              ] 
        },

        {
            name: 'common_ailments', label: 'Common Ailments', type: 'select', multiple: true,
            options:[
                { label: 'Malaria', value: 'Malaria' },
                { label: 'TB', value: 'TB' },
                { label: 'Diarrhea', value: 'Diarrhea' },
                { label: 'Pneumonia', value: 'Pneumonia' },
                { label: 'Common cold', value: 'Common cold' },
                { label: 'Amoeba / Typhoid', value: 'Amoeba / Typhoid' },
                { label: 'Hypertension', value: 'Hypertension' },
                { label: 'Diabetes', value: 'Diabetes' },
                { label: 'Other ailments. Please explain', value: 'Other ailments. Please explain' }
              ]              
        },

        { name: 'dist_main_health_fac', label: 'Distance to the Facility(km)', type: 'number' },


        {
            name: 'access_public_sch', label: 'Access to Public School', type: 'select', multiple: true,
            options: yes_no
        },

        { name: 'dist_school', label: 'Distance to the School(km)', type: 'number' },
        {
            name: 'upgrade_priority', label: 'Upgrading Priorities', type: 'select', multiple: true,
            options:[
                { label: 'Security', value: 'Security' },
                { label: 'Health', value: 'Health' },
                { label: 'Education', value: 'Education' },
                { label: 'Water', value: 'Water' },
                { label: 'Electricity', value: 'Electricity' },
                { label: 'Roads', value: 'Roads' },
                { label: 'Housing', value: 'Housing' },
                { label: 'Employment', value: 'Employment' },
                { label: 'Sanitation', value: 'Sanitation' },
                { label: 'Other issues. If any other, please state', value: 'other' }
              ]
                          
        },

        {
            name: 'common_disaster', label: 'Common Disasters here', type: 'select', multiple: true,
            options: [
                { label: 'Conflicts', value: 'Conflicts' },
                { label: 'Drought', value: 'Drought' },
                { label: 'Disease outbreaks', value: 'Disease outbreaks' },
                { label: 'Flooding', value: 'Flooding' },
                { label: 'Fires', value: 'Fires' },
                { label: 'Landslide', value: 'Landslide' },
                { label: 'Rock falling', value: 'Rock falling' },
                { label: 'Other (specify)', value: 'Other' }
              ]
              
        },

    ],
     
];

const formData: FormData = reactive({});
const formRules: FormRules = reactive({
    // Validation rules for each step
    Profile: {
        name: [
            { required: true, message: 'Name is required', trigger: 'blur' }
        ],
        age: [
            { required: true, message: 'Age is required', trigger: 'blur' },
            { type: 'number', message: 'Age must be a number', trigger: 'blur' }
        ],
        location: [
            { required: true, message: 'Location is required', trigger: 'blur' }
        ],
        gender: [
            { required: true, message: 'Gender is required', trigger: 'blur' }
        ],
        national_id: [
            { required: true, message: 'ID is required', trigger: 'blur' }
        ],
        owner_tenant: [
            { required: true, message: 'Tenancy is required', trigger: 'blur' }
        ],
        owner_type: [
            { required: true, message: 'This is required', trigger: 'blur' }
        ],
        


    },
 
    Income: {
        tenancy_agreement: [
            { required: true, message: 'Date of Birth is required', trigger: 'change' }
        ]
    },

    Composition: {
        age_00_04f: [
            { required: true, message: 'Address is required', trigger: 'blur' }
        ]
    },
     Structures: {
        age_00_04f: [
            { required: true, message: 'Address is required', trigger: 'blur' }
        ]
    },
    SolidWaste: {
        age_00_04f: [
            { required: true, message: 'Address is required', trigger: 'blur' }
        ]
    },
    Services: {
        age_00_04f: [
            { required: true, message: 'Address is required', trigger: 'blur' }
        ]
    }
    // Add more validation rules for each step as needed
});




export {formFields,countyOptions, formData,steps,formRules}