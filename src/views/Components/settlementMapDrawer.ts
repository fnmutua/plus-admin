export type DrawerItem = {
  key: string
  label: string
  displayValue: string
  valueType: 'text' | 'boolean' | 'longtext'
  rawValue: unknown
}

export type DrawerSection = {
  title: string
  items: DrawerItem[]
}

export type FeatureKind = 'settlement' | 'parcel' | 'facility' | 'neighbor' | 'generic'

export type DrawerInlineSection = {
  title: string
  schema: Array<{ field: string; label: string; span?: number }>
}

type FieldFormat =
  | 'area_ha'
  | 'distance_km'
  | 'distance_m'
  | 'length_m'
  | 'boolean'
  | 'integer'
  | 'longtext'
  | 'landuse'
  | 'profiling_status'
  | 'percent'

type SchemaField = {
  key: string
  label: string
  format?: FieldFormat
  aliases?: string[]
}

type SchemaSection = {
  title: string
  fields: SchemaField[]
}

const EXCLUDE_KEYS = new Set([
  'geom',
  'geometry',
  'createdBy',
  'created_by',
  'updatedAt',
  'createdAt',
  'county_id',
  'subcounty_id',
  'ward_id',
  'settlement_id',
  'featureType',
  'isActive',
  'photo',
  'photo_file',
  'photo_filename',
])

const BOOLEAN_KEYS = new Set([
  'electricity_availability',
  'piped_water_availability',
  'near_river',
  'on_wayleave',
  'on_road_reserve',
  'is_qualified',
])

const INTEGER_KEYS = new Set([
  'id',
  'population',
  'num_households',
  'landuse_id',
])

const LONGTEXT_KEYS = new Set([
  'description',
  'development',
  'structure_types',
  'typical_building_materials',
  'main_env_hazards',
  'challenges',
  'school_challenges',
  'additional_comments',
  'dropout_reasons',
  'retention_efforts',
  'retention_efforts_reasons',
  'services_offered',
  'common_ailments',
  'referral_destinations',
  'comments',
  'comment',
])

export const LANDUSE_LABELS: Record<number, string> = {
  0: 'Residential',
  1: 'Industrial',
  2: 'Education',
  3: 'Recreation',
  4: 'Public Purpose',
  5: 'Commercial',
  6: 'Public Utility',
  7: 'Transportation',
  8: 'Undeveloped',
  9: 'Agricultural',
}

const SETTLEMENT_SCHEMAS: SchemaSection[] = [
  {
    title: 'Summary',
    fields: [
      { key: 'name', label: 'Name' },
      { key: 'code', label: 'Code' },
      { key: 'settlement_type', label: 'Type' },
      { key: 'density_typology', label: 'Density typology' },
      { key: 'population', label: 'Population', format: 'integer' },
      { key: 'area', label: 'Area', format: 'area_ha' },
      { key: 'pop_density', label: 'Population density' },
      { key: 'num_households', label: 'Number of households', format: 'integer' },
      { key: 'avg_household_size', label: 'Average household size' },
      { key: 'description', label: 'Description', format: 'longtext' },
    ],
  },
  {
    title: 'Location',
    fields: [
      { key: 'county', label: 'County' },
      { key: 'subcounty', label: 'Sub-county' },
      { key: 'ward', label: 'Ward' },
      { key: 'general_location', label: 'General location', format: 'longtext' },
    ],
  },
  {
    title: 'Land & tenure',
    fields: [
      { key: 'parcel_no', label: 'Parcel no.' },
      { key: 'parcel_owner', label: 'Parcel owner' },
      { key: 'parcel_owner_type', label: 'Parcel owner type' },
      { key: 'land_status', label: 'Land status' },
      { key: 'landuse', label: 'Land use' },
      { key: 'surveyed', label: 'Surveyed' },
      { key: 'rim_no', label: 'RIM no.' },
    ],
  },
  {
    title: 'Built environment',
    fields: [
      { key: 'development', label: 'Development', format: 'longtext' },
      { key: 'structure_types', label: 'Structure types', format: 'longtext' },
      { key: 'typical_building_materials', label: 'Typical building materials', format: 'longtext' },
      { key: 'avg_dist_between', label: 'Avg. distance between structures' },
      { key: 'avg_rent', label: 'Average rent' },
      { key: 'dist_town', label: 'Distance to town', format: 'distance_km' },
      { key: 'dist_trunk', label: 'Distance to trunk road', format: 'distance_km' },
      { key: 'main_env_hazards', label: 'Main environmental hazards', format: 'longtext' },
    ],
  },
  {
    title: 'Utilities & hazards',
    fields: [
      { key: 'electricity_availability', label: 'Electricity available', format: 'boolean' },
      { key: 'piped_water_availability', label: 'Piped water available', format: 'boolean' },
      { key: 'median_household_income', label: 'Median household income' },
      { key: 'on_wayleave', label: 'On wayleave', format: 'boolean' },
      { key: 'on_road_reserve', label: 'On road reserve', format: 'boolean' },
      { key: 'near_river', label: 'Near river', format: 'boolean' },
      { key: 'encumbrance', label: 'Encumbrance' },
    ],
  },
  {
    title: 'Vulnerability',
    fields: [
      { key: 'climate_region', label: 'Climate region' },
      { key: 'soil_type', label: 'Soil type' },
      { key: 'land_cover', label: 'Land cover' },
      { key: 'altitude_range', label: 'Altitude range' },
      { key: 'proximity_to_river', label: 'Proximity to river' },
      { key: 'proximity_to_flood_plain', label: 'Proximity to flood plain' },
      { key: 'vulnerability_total_score_display', label: 'Vulnerability total score' },
      { key: 'vulnerability_rating', label: 'Vulnerability rating' },
    ],
  },
  {
    title: 'Status',
    fields: [
      { key: 'isApproved', label: 'Approval status' },
      { key: 'profiling_status', label: 'Profiling status', format: 'profiling_status' },
      { key: 'is_qualified', label: 'Qualified (slum/informal threshold)', format: 'boolean' },
    ],
  },
]

const PARCEL_SCHEMAS: SchemaSection[] = [
  {
    title: 'Parcel',
    fields: [
      { key: 'parcel_no', label: 'Parcel no.' },
      { key: 'code', label: 'Code' },
      { key: 'area_ha', label: 'Area', format: 'area_ha' },
      { key: 'landuse_id', label: 'Land use', format: 'landuse' },
      { key: 'lpdp_no', label: 'LPDP no.' },
      { key: 'description', label: 'Description', format: 'longtext' },
    ],
  },
]

const FACILITY_LOCATION_SECTION: SchemaSection = {
  title: 'Location',
  fields: [
    { key: 'county_name', label: 'County' },
    { key: 'settlement_name', label: 'Settlement' },
    { key: 'settlement_code', label: 'Settlement code' },
  ],
}

const FACILITY_STATUS_SECTION: SchemaSection = {
  title: 'Status',
  fields: [{ key: 'isApproved', label: 'Approval status' }],
}

export const FACILITY_TYPE_LABELS: Record<string, string> = {
  education_facility: 'School',
  health_facility: 'Health facility',
  water_point: 'Water point',
  road: 'Road',
  sewer: 'Sewer',
  piped_water: 'Piped water',
  powerline: 'Powerline',
  streetlight: 'Streetlight',
  community_hall: 'Community hall',
  community_project: 'Community project',
  police_station: 'Police station',
  crime_hotspot: 'Crime hotspot',
  mast: 'Mast / tower',
  dumping_site: 'Dumping site',
  hazard_zone: 'Hazard zone',
}

export const FACILITY_HEADER_ICONS: Record<string, string> = {
  education_facility: 'mdi:school-outline',
  health_facility: 'mdi:hospital-box-outline',
  water_point: 'mdi:water-pump',
  road: 'mdi:road-variant',
  sewer: 'mdi:pipe',
  piped_water: 'mdi:water-sync',
  powerline: 'mdi:transmission-tower',
  streetlight: 'mdi:street-light-outline',
  community_hall: 'mdi:home-group',
  community_project: 'mdi:hand-heart-outline',
  police_station: 'mdi:police-badge-outline',
  crime_hotspot: 'mdi:shield-alert-outline',
  mast: 'mdi:cellphone-wireless',
  dumping_site: 'mdi:delete-variant',
  hazard_zone: 'mdi:alert-octagon-outline',
}

const FACILITY_NAME_KEYS: Record<string, string> = {
  education_facility: 'name',
  health_facility: 'name',
  water_point: 'name',
  road: 'name',
  sewer: 'name',
  piped_water: 'name',
  powerline: 'PL_Name',
  streetlight: 'road_name',
  community_hall: 'community_hall_name',
  community_project: 'project_name',
  police_station: 'PC_Name',
  crime_hotspot: 'CH_Name',
  mast: 'TC_Name',
  dumping_site: 'DS_Name',
  hazard_zone: 'place_name',
}

export const FACILITY_DETAIL_ROUTES: Record<string, string> = {
  education_facility: 'EducationFacilityDetails',
  health_facility: 'HealthFacilityDetails',
  water_point: 'WaterDetails',
  road: 'RoadsDetails',
  sewer: 'SewerFacilityDetails',
  piped_water: 'PipedWaterFacilityDetails',
  community_hall: 'CommunityHallDetails',
  community_project: 'CommunityProjectDetails',
  police_station: 'PoliceDetails',
}

const FACILITY_SCHEMAS: Record<string, SchemaSection[]> = {
  education_facility: [
    {
      title: 'General',
      fields: [
        { key: 'name', label: 'School name', aliases: ['school_name'] },
        { key: 'id', label: 'School ID', format: 'integer' },
        { key: 'code', label: 'Code' },
        { key: 'education_category', label: 'Category' },
        { key: 'registration_status', label: 'Registration status' },
        { key: 'registration_number', label: 'Registration number' },
        { key: 'ownership_type', label: 'Ownership type' },
        { key: 'ownership_details', label: 'Ownership details' },
        { key: 'boarding_type', label: 'Boarding type' },
        { key: 'distance_in_meters', label: 'Distance to settlement', format: 'distance_m' },
      ],
    },
    {
      title: 'Land',
      fields: [
        { key: 'land_ownership_status', label: 'Land ownership status' },
        { key: 'parcel_has_title', label: 'Parcel has title' },
        { key: 'parcel_size_hectares', label: 'Parcel size', format: 'area_ha' },
        { key: 'compound_fence_status', label: 'Compound fence status' },
      ],
    },
    {
      title: 'Students',
      fields: [
        { key: 'enrolled_boys_count', label: 'Enrolled boys', format: 'integer' },
        { key: 'enrolled_girls_count', label: 'Enrolled girls', format: 'integer' },
        { key: 'student_source', label: 'Student source' },
        { key: 'dropout_count', label: 'Dropout count', format: 'integer' },
        { key: 'dropout_reasons', label: 'Dropout reasons', format: 'longtext' },
        { key: 'retention_efforts', label: 'Retention efforts', format: 'longtext' },
        { key: 'retention_efforts_reasons', label: 'Retention effort reasons', format: 'longtext' },
      ],
    },
    {
      title: 'Staff',
      fields: [
        { key: 'male_teachers_count', label: 'Male teachers', format: 'integer' },
        { key: 'female_teachers_count', label: 'Female teachers', format: 'integer' },
        { key: 'bom_teachers_count', label: 'BOM teachers', format: 'integer' },
      ],
    },
    {
      title: 'Infrastructure',
      fields: [
        { key: 'classroom_count', label: 'Classrooms', format: 'integer' },
        { key: 'permanent_classrooms_count', label: 'Permanent classrooms', format: 'integer' },
        { key: 'classroom_condition', label: 'Classroom condition' },
        { key: 'boys_toilets_count', label: 'Boys toilets', format: 'integer' },
        { key: 'girls_toilets_count', label: 'Girls toilets', format: 'integer' },
        { key: 'toilet_condition', label: 'Toilet condition' },
        { key: 'handwashing_stations_count', label: 'Handwashing stations', format: 'integer' },
        { key: 'boreholes_count', label: 'Boreholes', format: 'integer' },
        { key: 'water_tanks_count', label: 'Water tanks', format: 'integer' },
        { key: 'teaching_aids_available', label: 'Teaching aids available' },
      ],
    },
    {
      title: 'Welfare & fees',
      fields: [
        { key: 'fees_paid_by_students', label: 'Fees paid by students' },
        { key: 'term_1_fees_amount', label: 'Term 1 fees' },
        { key: 'term_2_fees_amount', label: 'Term 2 fees' },
        { key: 'term_3_fees_amount', label: 'Term 3 fees' },
        { key: 'sanitary_pads_provision', label: 'Sanitary pads provision' },
        { key: 'sanitary_pads_provider', label: 'Sanitary pads provider' },
        { key: 'sanitary_pads_bins', label: 'Sanitary pads bins' },
      ],
    },
    {
      title: 'Other',
      fields: [
        { key: 'school_challenges', label: 'Challenges / issues', format: 'longtext' },
        { key: 'efforts_for_student_retention', label: 'Student retention efforts', format: 'longtext' },
        { key: 'additional_comments', label: 'Additional comments', format: 'longtext' },
      ],
    },
    {
      title: 'Contact',
      fields: [
        { key: 'respondent_name', label: 'Respondent name' },
        { key: 'respondent_phone', label: 'Respondent phone' },
      ],
    },
    FACILITY_STATUS_SECTION,
  ],
  health_facility: [
    {
      title: 'General',
      fields: [
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Facility code' },
        { key: 'facility_number', label: 'Facility number' },
        { key: 'level', label: 'Level' },
        { key: 'registration_status', label: 'Registration status' },
        { key: 'condition', label: 'Condition' },
        { key: 'ownership_type', label: 'Ownership type' },
        { key: 'owner', label: 'Owner' },
        { key: 'distance_meters', label: 'Distance to settlement', format: 'distance_m' },
      ],
    },
    {
      title: 'Land',
      fields: [
        { key: 'land_ownership', label: 'Land ownership' },
        { key: 'land_title_available', label: 'Land title available' },
        { key: 'land_parcel_size', label: 'Land parcel size', format: 'area_ha' },
      ],
    },
    {
      title: 'Staffing',
      fields: [
        { key: 'number_doctors', label: 'Doctors', format: 'integer' },
        { key: 'number_clinical_officers', label: 'Clinical officers', format: 'integer' },
        { key: 'number_nurses', label: 'Nurses', format: 'integer' },
        { key: 'number_pharmacists', label: 'Pharmacists', format: 'integer' },
        { key: 'number_midwives', label: 'Midwives', format: 'integer' },
        { key: 'number_other_staff', label: 'Other staff', format: 'integer' },
      ],
    },
    {
      title: 'Capacity & services',
      fields: [
        { key: 'outpatient_visits_per_day', label: 'Outpatient visits / day', format: 'integer' },
        { key: 'num_inpatient', label: 'Inpatients', format: 'integer' },
        { key: 'maternity_deliveries_per_day', label: 'Maternity deliveries / day', format: 'integer' },
        { key: 'antenatal_immunizations_per_day', label: 'Antenatal immunizations / day', format: 'integer' },
        { key: 'general_beds', label: 'General beds', format: 'integer' },
        { key: 'maternity_beds', label: 'Maternity beds', format: 'integer' },
        { key: 'pediatric_beds', label: 'Pediatric beds', format: 'integer' },
        { key: 'total_beds', label: 'Total beds', format: 'integer' },
        { key: 'occupancy_rate', label: 'Occupancy rate', format: 'percent' },
        { key: 'has_ambulance', label: 'Has ambulance' },
        { key: 'services_offered', label: 'Services offered', format: 'longtext' },
      ],
    },
    {
      title: 'Outreach & challenges',
      fields: [
        { key: 'referral_destinations', label: 'Referral destinations', format: 'longtext' },
        { key: 'referral_distance_km', label: 'Referral distance', format: 'distance_km' },
        { key: 'referrals_per_day', label: 'Referrals / day', format: 'integer' },
        { key: 'source_of_drugs', label: 'Source of drugs' },
        { key: 'common_ailments', label: 'Common ailments', format: 'longtext' },
        { key: 'source_of_patients', label: 'Source of patients' },
        { key: 'challenges', label: 'Challenges / issues', format: 'longtext' },
      ],
    },
    {
      title: 'Contact',
      fields: [
        { key: 'respondent_name', label: 'Respondent name' },
        { key: 'respondent_phone', label: 'Respondent phone' },
      ],
    },
    {
      title: 'Location',
      fields: [{ key: 'settlement_name', label: 'Settlement' }],
    },
    FACILITY_STATUS_SECTION,
  ],
  water_point: [
    {
      title: 'General',
      fields: [
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'type', label: 'Type' },
        { key: 'ownership_type', label: 'Ownership type' },
        { key: 'owner', label: 'Owner' },
        { key: 'name_of_provider', label: 'Provider' },
        { key: 'catchment', label: 'Catchment' },
      ],
    },
    {
      title: 'Supply details',
      fields: [
        { key: 'capacity', label: 'Capacity (m³/day)' },
        { key: 'depth', label: 'Depth (m)' },
        { key: 'price', label: 'Cost for 20L' },
        { key: 'cost_of_20_litre_jerrican', label: 'Cost of 20L jerrican' },
        { key: 'condition', label: 'Condition' },
        { key: 'availability', label: 'Availability' },
      ],
    },
    FACILITY_STATUS_SECTION,
  ],
  road: [
    {
      title: 'General',
      fields: [
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'rd_num', label: 'Road number' },
        { key: 'rd_class', label: 'Class' },
        { key: 'length', label: 'Length', format: 'length_m' },
      ],
    },
    {
      title: 'Surface & traffic',
      fields: [
        { key: 'surface_type', label: 'Surface type' },
        { key: 'surface_condition', label: 'Surface condition' },
        { key: 'rd_traffic', label: 'Traffic' },
        { key: 'rd_direction', label: 'Direction' },
        { key: 'rd_width_m', label: 'Width (m)' },
        { key: 'rd_reserve_encroachment', label: 'Road reserve encroachment' },
      ],
    },
    {
      title: 'Drainage',
      fields: [
        { key: 'rd_drainage_location', label: 'Drainage location' },
        { key: 'rd_drainage_condition', label: 'Drainage condition' },
      ],
    },
    FACILITY_STATUS_SECTION,
  ],
  sewer: [
    {
      title: 'General',
      fields: [
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'condition', label: 'Condition' },
        { key: 'ownership', label: 'Ownership' },
        { key: 'length', label: 'Length', format: 'length_m' },
      ],
    },
    {
      title: 'Pipe & provider',
      fields: [
        { key: 'pipe_type', label: 'Pipe type' },
        { key: 'pipe_size', label: 'Pipe size' },
        { key: 'provider', label: 'Provider' },
        { key: 'provider_category', label: 'Provider category' },
      ],
    },
    {
      title: 'Coverage',
      fields: [
        { key: 'number_of_connections', label: 'Connections', format: 'integer' },
        { key: 'number_of_persons_served', label: 'Persons served', format: 'integer' },
      ],
    },
    FACILITY_LOCATION_SECTION,
    FACILITY_STATUS_SECTION,
  ],
  piped_water: [
    {
      title: 'General',
      fields: [
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'condition', label: 'Condition' },
        { key: 'ownership_type', label: 'Ownership type' },
        { key: 'owner', label: 'Owner' },
        { key: 'name_of_provider', label: 'Provider' },
        { key: 'length', label: 'Length', format: 'length_m' },
      ],
    },
    {
      title: 'Coverage',
      fields: [
        { key: 'number_connections', label: 'Connections', format: 'integer' },
        { key: 'number_persons_served', label: 'Persons served', format: 'integer' },
      ],
    },
    FACILITY_STATUS_SECTION,
  ],
  powerline: [
    {
      title: 'General',
      fields: [
        { key: 'PL_Name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'PL_Phases', label: 'Phases' },
        { key: 'PL_Type_of_Supply', label: 'Type of supply' },
      ],
    },
    FACILITY_STATUS_SECTION,
  ],
  streetlight: [
    {
      title: 'General',
      fields: [
        { key: 'road_name', label: 'Road name' },
        { key: 'code', label: 'Code' },
        { key: 'type', label: 'Type' },
        { key: 'condition', label: 'Condition' },
      ],
    },
    FACILITY_STATUS_SECTION,
  ],
  community_hall: [
    {
      title: 'General',
      fields: [
        { key: 'community_hall_name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'use', label: 'Use' },
        { key: 'condition', label: 'Condition' },
        { key: 'ownership', label: 'Ownership' },
        { key: 'owner', label: 'Owner' },
        { key: 'usage_fee', label: 'Usage fee' },
        { key: 'reference_name', label: 'Reference name' },
      ],
    },
    FACILITY_STATUS_SECTION,
  ],
  community_project: [
    {
      title: 'General',
      fields: [
        { key: 'project_name', label: 'Project name' },
        { key: 'code', label: 'Code' },
        { key: 'project_type', label: 'Project type' },
        { key: 'condition', label: 'Condition' },
        { key: 'ownership', label: 'Ownership' },
        { key: 'owner', label: 'Owner' },
        { key: 'usage_fee', label: 'Usage fee' },
      ],
    },
    {
      title: 'Impact',
      fields: [
        { key: 'number_of_persons_served', label: 'Persons served', format: 'integer' },
        { key: 'number_of_staff', label: 'Staff', format: 'integer' },
        { key: 'comments', label: 'Comments', format: 'longtext' },
      ],
    },
    FACILITY_STATUS_SECTION,
  ],
  police_station: [
    {
      title: 'General',
      fields: [
        { key: 'PC_Name', label: 'Name' },
        { key: 'Code', label: 'Code' },
        { key: 'PC_Type', label: 'Type' },
        { key: 'PC_Condition', label: 'Condition' },
        { key: 'settlement_name', label: 'Settlement' },
      ],
    },
    {
      title: 'Resources',
      fields: [
        { key: 'PC_Number_of_Officers', label: 'Officers', format: 'integer' },
        { key: 'PC_Number_of_Vehicles', label: 'Vehicles' },
      ],
    },
    FACILITY_STATUS_SECTION,
  ],
  crime_hotspot: [
    {
      title: 'General',
      fields: [
        { key: 'CH_Name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'CH_Crime_Type', label: 'Crime type' },
        { key: 'CH_Frequency', label: 'Frequency' },
        { key: 'CH_Time_of_Day', label: 'Time of day' },
      ],
    },
    {
      title: 'Details',
      fields: [
        { key: 'CH_Crime_Target', label: 'Crime target' },
        { key: 'CH_Offender_Type', label: 'Offender type' },
        { key: 'CH_num_victims', label: 'Number of victims', format: 'integer' },
      ],
    },
    FACILITY_STATUS_SECTION,
  ],
  mast: [
    {
      title: 'General',
      fields: [
        { key: 'TC_Name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'TC_Type', label: 'Type' },
        { key: 'TC_Condition', label: 'Condition' },
      ],
    },
    FACILITY_STATUS_SECTION,
  ],
  dumping_site: [
    {
      title: 'General',
      fields: [
        { key: 'DS_Name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'DS_Type', label: 'Type' },
        { key: 'DS_Status', label: 'Status' },
        { key: 'settlement_name', label: 'Settlement' },
      ],
    },
    {
      title: 'Details',
      fields: [
        { key: 'DS_Type_of_Waste', label: 'Type of waste' },
        { key: 'DS_Year_Established', label: 'Year established' },
      ],
    },
    FACILITY_STATUS_SECTION,
  ],
  hazard_zone: [
    {
      title: 'General',
      fields: [
        { key: 'place_name', label: 'Place name' },
        { key: 'code', label: 'Code' },
        { key: 'hazard_type', label: 'Hazard type' },
        { key: 'nature', label: 'Nature' },
        { key: 'frequency_of_occurrence', label: 'Frequency of occurrence' },
      ],
    },
    {
      title: 'Impact',
      fields: [
        { key: 'number_of_affected_persons', label: 'Affected persons', format: 'integer' },
        { key: 'damage_cost', label: 'Approximate damage cost' },
        { key: 'comment', label: 'Comment', format: 'longtext' },
      ],
    },
    FACILITY_STATUS_SECTION,
  ],
}

const humanize = (key: string): string =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

/** Map legacy / form field names to actual Sequelize column names per model */
const FACILITY_FIELD_ALIASES: Record<string, Record<string, string>> = {
  education_facility: {
    school_name: 'name',
    male_enrollment: 'enrolled_boys_count',
    female_enrollment: 'enrolled_girls_count',
    reg_status: 'registration_status',
    level: 'education_category',
    challenges: 'school_challenges',
    number_teachers: 'male_teachers_count',
    number_classrooms: 'classroom_count',
    number_male_toilets: 'boys_toilets_count',
    number_female_toilets: 'girls_toilets_count',
    number_handwashing_stns: 'handwashing_stations_count',
    avg_fees_term: 'term_1_fees_amount',
  },
  health_facility: {
    patients_per_day: 'outpatient_visits_per_day',
    number_beds: 'total_beds',
    number_doctors: 'number_doctors',
    number_pharmac: 'number_pharmacists',
    inpatient: 'num_inpatient',
    occupancy: 'occupancy_rate',
    referrals: 'referral_destinations',
    services: 'services_offered',
  },
  road: {
    rdNum: 'rd_num',
    rdClass: 'rd_class',
    surfaceCondition: 'surface_condition',
    surfaceType: 'surface_type',
    width: 'rd_width_m',
    traffic: 'rd_traffic',
    direction: 'rd_direction',
    drainage: 'rd_drainage_location',
    challenges: 'rd_reserve_encroachment',
  },
  water_point: {
    cost_for_20l: 'cost_of_20_litre_jerrican',
  },
}

export const normalizeFacilityProperties = (
  featureType: string,
  raw: Record<string, unknown> = {}
): Record<string, unknown> => {
  const normalized: Record<string, unknown> = { ...raw }

  const aliasMap = FACILITY_FIELD_ALIASES[featureType]
  if (aliasMap) {
    for (const [legacyKey, canonicalKey] of Object.entries(aliasMap)) {
      const legacyValue = normalized[legacyKey]
      if (
        legacyValue != null &&
        legacyValue !== '' &&
        (normalized[canonicalKey] == null || normalized[canonicalKey] === '')
      ) {
        normalized[canonicalKey] = legacyValue
      }
    }
  }

  return normalized
}

const findPropertyKey = (
  properties: Record<string, unknown>,
  key: string,
  aliases: string[] = []
): string | null => {
  const candidates = [key, ...aliases]

  for (const candidate of candidates) {
    if (candidate in properties) return candidate

    const caseMatch = Object.keys(properties).find(
      (propertyKey) => propertyKey.toLowerCase() === candidate.toLowerCase()
    )
    if (caseMatch) return caseMatch
  }

  return null
}

const getSchemaFieldValue = (
  properties: Record<string, unknown>,
  field: SchemaField
): { key: string; value: unknown } | null => {
  const propertyKey = findPropertyKey(properties, field.key, field.aliases)
  if (!propertyKey) return null

  const value = properties[propertyKey]
  if (shouldExcludeKey(field.key, value)) return null

  return { key: field.key, value }
}

const isEmptyValue = (value: unknown): boolean =>
  value === null || value === undefined || value === ''

const shouldExcludeKey = (key: string, value: unknown): boolean => {
  if (isEmptyValue(value)) return true
  if (EXCLUDE_KEYS.has(key)) return true

  const lowerKey = key.toLowerCase()
  if (lowerKey === 'geom' || lowerKey === 'geometry' || lowerKey.includes('geometry')) {
    return true
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  ) {
    if ('type' in value && 'coordinates' in value) {
      return true
    }
  }

  return false
}

const getValueType = (key: string, value: unknown, format?: FieldFormat): DrawerItem['valueType'] => {
  if (format === 'boolean' || format === 'longtext') return format
  if (typeof value === 'boolean' || BOOLEAN_KEYS.has(key)) return 'boolean'
  if (LONGTEXT_KEYS.has(key)) return 'longtext'
  return 'text'
}

const formatDisplayValue = (key: string, value: unknown, format?: FieldFormat): string => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (format === 'landuse') {
    const landuseId = Number(value)
    if (!Number.isNaN(landuseId)) {
      return LANDUSE_LABELS[landuseId] ?? String(value)
    }
  }

  if (format === 'area_ha' || key === 'area' || key === 'area_ha') {
    const num = Number(value)
    if (!Number.isNaN(num)) return `${num.toFixed(2)} Ha`
  }

  if (format === 'distance_km' || key.startsWith('dist_') || key === 'referral_distance_km') {
    const num = Number(value)
    if (!Number.isNaN(num)) return `${num.toFixed(2)} km`
  }

  if (format === 'distance_m' || key === 'distance_in_meters' || key === 'distance_meters') {
    const num = Number(value)
    if (!Number.isNaN(num)) return `${num.toFixed(0)} m`
  }

  if (format === 'length_m') {
    const num = Number(value)
    if (!Number.isNaN(num)) return `${num.toFixed(2)} m`
  }

  if (format === 'percent' || key === 'occupancy_rate') {
    const num = Number(value)
    if (!Number.isNaN(num)) return `${num.toFixed(1)}%`
  }

  if (format === 'profiling_status' || key === 'profiling_status') {
    return String(value).replace(/_/g, ' ')
  }

  const num = Number(value)
  if (!Number.isNaN(num) && typeof value !== 'string') {
    if (format === 'integer' || INTEGER_KEYS.has(key)) {
      return Number.isInteger(num) ? num.toString() : num.toFixed(2)
    }
    return Number.isInteger(num) ? num.toString() : num.toFixed(2)
  }

  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value)
  }

  return String(value)
}

const toDrawerItem = (
  key: string,
  value: unknown,
  label?: string,
  format?: FieldFormat
): DrawerItem => ({
  key,
  label: label ?? humanize(key),
  displayValue: formatDisplayValue(key, value, format),
  valueType: getValueType(key, value, format),
  rawValue: value,
})

const buildSectionsFromSchema = (
  properties: Record<string, unknown>,
  schemas: SchemaSection[]
): DrawerSection[] => {
  const sections: DrawerSection[] = []
  const usedKeys = new Set<string>()

  for (const schema of schemas) {
    const items: DrawerItem[] = []

    for (const field of schema.fields) {
      const resolved = getSchemaFieldValue(properties, field)
      if (!resolved) continue

      usedKeys.add(resolved.key)
      usedKeys.add(findPropertyKey(properties, field.key, field.aliases) || resolved.key)
      items.push(toDrawerItem(resolved.key, resolved.value, field.label, field.format))
    }

    if (items.length > 0) {
      sections.push({ title: schema.title, items })
    }
  }

  const otherItems = Object.entries(properties)
    .filter(([key, value]) => {
      const canonical = key.toLowerCase()
      const alreadyUsed = [...usedKeys].some(
        (usedKey) => usedKey.toLowerCase() === canonical
      )
      return !alreadyUsed && !shouldExcludeKey(key, value)
    })
    .sort(([a], [b]) => humanize(a).localeCompare(humanize(b)))
    .map(([key, value]) => toDrawerItem(key, value))

  if (otherItems.length > 0) {
    sections.push({ title: 'Other', items: otherItems })
  }

  return sections
}

export const getDrawerSchemaSections = (
  kind: FeatureKind,
  featureType?: string
): SchemaSection[] => {
  if (kind === 'neighbor') {
    return [
      {
        title: 'Neighboring settlement',
        fields: [
          { key: 'id', label: 'Settlement ID', format: 'integer' },
          { key: 'name', label: 'Name' },
        ],
      },
    ]
  }

  if (kind === 'settlement') return SETTLEMENT_SCHEMAS
  if (kind === 'parcel') return PARCEL_SCHEMAS

  if (kind === 'facility' && featureType) {
    return FACILITY_SCHEMAS[featureType] || []
  }

  return []
}

const formatInlineRecordValue = (
  key: string,
  value: unknown,
  format?: FieldFormat
): unknown => {
  if (typeof value === 'boolean' || format === 'boolean' || BOOLEAN_KEYS.has(key)) {
    if (value === true || value === 'true' || value === 1 || value === '1') return 'Yes'
    if (value === false || value === 'false' || value === 0 || value === '0') return 'No'
    if (value === null || value === undefined || value === '') return '\u2014'
    return String(value)
  }

  const numericFormats: FieldFormat[] = [
    'integer',
    'area_ha',
    'distance_km',
    'distance_m',
    'length_m',
    'percent',
  ]
  if (numericFormats.includes(format as FieldFormat) || INTEGER_KEYS.has(key)) {
    const num = Number(value)
    return Number.isFinite(num) ? num : value
  }

  if (value === null || value === undefined || value === '') return '\u2014'
  return value
}

export const prepareDrawerRecordData = (
  properties: Record<string, unknown> = {},
  kind: FeatureKind,
  featureType?: string
): Record<string, unknown> => {
  const data: Record<string, unknown> = {}
  const schemas = getDrawerSchemaSections(kind, featureType)

  for (const schema of schemas) {
    for (const field of schema.fields) {
      const resolved = getSchemaFieldValue(properties, field)
      if (!resolved) continue
      data[resolved.key] = formatInlineRecordValue(
        resolved.key,
        resolved.value,
        field.format
      )
    }
  }

  if (properties.id != null && data.id == null) {
    data.id = properties.id
  }

  return data
}

export const buildDrawerInlineSections = (
  properties: Record<string, unknown> = {},
  kind: FeatureKind,
  featureType?: string
): DrawerInlineSection[] => {
  const schemas = getDrawerSchemaSections(kind, featureType)
  const sections: DrawerInlineSection[] = []
  const usedKeys = new Set<string>()

  for (const schema of schemas) {
    const fields: DrawerInlineSection['schema'] = []

    for (const field of schema.fields) {
      const resolved = getSchemaFieldValue(properties, field)
      if (!resolved) continue

      usedKeys.add(resolved.key)
      fields.push({
        field: resolved.key,
        label: field.label,
        span: field.format === 'longtext' ? 2 : 1,
      })
    }

    if (fields.length > 0) {
      sections.push({ title: schema.title, schema: fields })
    }
  }

  const otherFields = Object.entries(properties)
    .filter(([key, value]) => {
      const canonical = key.toLowerCase()
      const alreadyUsed = [...usedKeys].some(
        (usedKey) => usedKey.toLowerCase() === canonical
      )
      return !alreadyUsed && !shouldExcludeKey(key, value)
    })
    .sort(([a], [b]) => humanize(a).localeCompare(humanize(b)))
    .map(([key]) => ({
      field: key,
      label: humanize(key),
      span: LONGTEXT_KEYS.has(key) ? 2 : 1,
    }))

  if (otherFields.length > 0) {
    sections.push({ title: 'Other', schema: otherFields })
  }

  return sections
}

export const collectDrawerFieldTypes = (
  kind: FeatureKind,
  featureType?: string
): { numberFields: string[]; booleanFields: string[]; textareaFields: string[] } => {
  const numberFields = new Set<string>()
  const booleanFields = new Set<string>()
  const textareaFields = new Set<string>()

  const facilityNumericPatterns = [
    /_count$/i,
    /_amount$/i,
    /_meters$/i,
    /_km$/i,
    /_ha$/i,
    /_rate$/i,
    /_beds$/i,
    /^length$/i,
    /^depth$/i,
    /^capacity$/i,
    /^price$/i,
    /^rd_width/i,
    /^occupancy/i,
    /^referral/i,
    /^number_/i,
    /^num_/i,
    /^enrolled_/i,
    /^male_/i,
    /^female_/i,
    /^bom_/i,
    /^boys_/i,
    /^girls_/i,
    /^handwashing_/i,
    /^boreholes_/i,
    /^water_tanks_/i,
    /^classroom/i,
    /^permanent_/i,
    /^dropout_/i,
    /^outpatient_/i,
    /^maternity_/i,
    /^antenatal_/i,
    /^referrals_/i,
    /^parcel_size/i,
    /^land_parcel_size/i,
    /^cost_/i,
  ]

  for (const schema of getDrawerSchemaSections(kind, featureType)) {
    for (const field of schema.fields) {
      const key = field.key
      if (field.format === 'boolean' || BOOLEAN_KEYS.has(key)) {
        booleanFields.add(key)
      } else if (field.format === 'longtext' || LONGTEXT_KEYS.has(key)) {
        textareaFields.add(key)
      } else if (
        field.format === 'integer' ||
        field.format === 'area_ha' ||
        field.format === 'distance_km' ||
        field.format === 'distance_m' ||
        field.format === 'length_m' ||
        field.format === 'percent' ||
        INTEGER_KEYS.has(key) ||
        (kind === 'facility' && facilityNumericPatterns.some((pattern) => pattern.test(key)))
      ) {
        numberFields.add(key)
      }
    }
  }

  return {
    numberFields: [...numberFields],
    booleanFields: [...booleanFields],
    textareaFields: [...textareaFields],
  }
}

export const getDrawerUpdateModel = (
  kind: FeatureKind,
  featureType?: string
): string | null => {
  if (kind === 'settlement' || kind === 'neighbor') return 'settlement'
  if (kind === 'parcel') return 'parcel'
  if (kind === 'facility' && featureType) return featureType
  return null
}

export const buildDrawerSections = (
  properties: Record<string, unknown> = {},
  kind: FeatureKind,
  featureType?: string
): DrawerSection[] => {
  if (kind === 'neighbor') {
    const items: DrawerItem[] = []
    if (properties.id != null) items.push(toDrawerItem('id', properties.id, 'Settlement ID', 'integer'))
    if (properties.name != null) items.push(toDrawerItem('name', properties.name, 'Name'))
    return items.length > 0 ? [{ title: 'Neighboring settlement', items }] : []
  }

  if (kind === 'settlement') {
    return buildSectionsFromSchema(properties, SETTLEMENT_SCHEMAS)
  }

  if (kind === 'parcel') {
    return buildSectionsFromSchema(properties, PARCEL_SCHEMAS)
  }

  if (kind === 'facility' && featureType) {
    const schemas = FACILITY_SCHEMAS[featureType]
    if (schemas?.length) {
      return buildSectionsFromSchema(properties, schemas)
    }
  }

  const items = Object.entries(properties)
    .filter(([key, value]) => !shouldExcludeKey(key, value))
    .sort(([a], [b]) => humanize(a).localeCompare(humanize(b)))
    .map(([key, value]) => toDrawerItem(key, value))

  return items.length > 0 ? [{ title: 'Details', items }] : []
}

export const getDrawerTitle = (
  properties: Record<string, unknown> = {},
  kind: FeatureKind,
  featureType?: string,
  rawProperties?: Record<string, unknown>
): string => {
  const mergedProperties = { ...rawProperties, ...properties }
  if (kind === 'settlement') {
    return String(properties.name || 'Settlement')
  }

  if (kind === 'parcel') {
    const parcelNo = properties.parcel_no || properties.code
    return parcelNo ? `Parcel ${parcelNo}` : 'Parcel'
  }

  if (kind === 'neighbor') {
    return String(properties.name || 'Neighboring settlement')
  }

  if (kind === 'facility' && featureType) {
    const name = getFacilityDisplayName(mergedProperties, featureType)
    if (name) return name
    return FACILITY_TYPE_LABELS[featureType] || humanize(featureType)
  }

  return 'Feature details'
}

export const getDrawerSubtitle = (
  properties: Record<string, unknown> = {},
  kind: FeatureKind,
  _featureType?: string
): string => {
  if (kind === 'settlement') {
    const parts = [properties.code, properties.settlement_type].filter(Boolean)
    return parts.join(' · ')
  }

  if (kind === 'neighbor') {
    return 'Neighboring settlement'
  }

  if (kind === 'parcel' && properties.code) {
    return String(properties.code)
  }

  if (kind === 'facility') {
    const parts = [
      properties.code || properties.Code,
      properties.type || properties.level || properties.education_category,
      properties.condition || properties.registration_status,
    ].filter((value) => value != null && value !== '')
    return parts.map(String).join(' · ')
  }

  return ''
}

export const getDrawerSettlementId = (
  properties: Record<string, unknown> = {},
  kind: FeatureKind
): string | null => {
  if ((kind === 'settlement' || kind === 'neighbor') && properties.id != null) {
    return String(properties.id)
  }
  return null
}

export const getDrawerFacilityId = (
  properties: Record<string, unknown> = {},
  featureType?: string
): string | null => {
  if (properties.id == null || !featureType) return null
  return String(properties.id)
}

export const getFacilityDetailRouteName = (featureType?: string): string | null => {
  if (!featureType) return null
  return FACILITY_DETAIL_ROUTES[featureType] || null
}

export const filterFeatureProperties = (
  properties: Record<string, unknown> = {}
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => !shouldExcludeKey(key, value))
  )

export const resolveFeatureType = (
  rawProperties: Record<string, unknown> = {},
  featureId?: string,
  source?: 'settlement' | 'parcel' | 'point'
): string => {
  if (rawProperties.featureType != null && rawProperties.featureType !== '') {
    return String(rawProperties.featureType)
  }

  const id = String(featureId || '')
  const pointMatch = id.match(/^op-([a-z_]+)-/i)
  if (pointMatch?.[1]) return pointMatch[1]

  if (id.startsWith('road-')) return 'road'

  const lineMatch = id.match(/^line-([a-z_]+)-/i)
  if (lineMatch?.[1]) return lineMatch[1]

  if (source === 'parcel') return 'parcel'

  return ''
}

const getFacilityDisplayName = (
  properties: Record<string, unknown>,
  featureType: string
): string | null => {
  const candidateKeys = [
    FACILITY_NAME_KEYS[featureType],
    ...(featureType === 'education_facility' ? ['school_name'] : []),
    'name',
    'community_hall_name',
    'project_name',
    'place_name',
    'PL_Name',
    'PC_Name',
    'CH_Name',
    'TC_Name',
    'DS_Name',
    'road_name',
  ].filter((key): key is string => Boolean(key))

  for (const key of candidateKeys) {
    const value = properties[key]
    if (value != null && value !== '') {
      return String(value)
    }
  }

  return null
}

export const detectFeatureKind = (
  properties: Record<string, unknown> = {},
  source: 'settlement' | 'parcel' | 'point',
  featureType?: string
): FeatureKind => {
  const resolvedFeatureType = featureType || resolveFeatureType(properties)

  if (resolvedFeatureType === 'neighboring_settlement') return 'neighbor'
  if (source === 'parcel') return 'parcel'
  if (source === 'settlement') return 'settlement'
  if (source === 'point' && resolvedFeatureType && resolvedFeatureType !== 'parcel') {
    return 'facility'
  }
  return 'generic'
}
