/** Shared inline-edit select config for facility features (map drawer). */

export type FacilitySelectOption = {
  label: string
  value: string | number | boolean
}

const YES_NO_OPTIONS: FacilitySelectOption[] = [
  { label: 'Yes', value: 'Yes' },
  { label: 'No', value: 'No' },
  { label: "I don't know", value: 'unknown' },
]

const YES_NO_PLAIN_OPTIONS: FacilitySelectOption[] = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
]

const CONDITION_FACILITY_OPTIONS: FacilitySelectOption[] = [
  { label: 'Good', value: 'Good' },
  { label: 'Fair', value: 'Fair' },
  { label: 'Poor', value: 'Poor' },
  { label: 'Critical', value: 'Critical' },
]

const OPERATIONAL_CONDITION_OPTIONS: FacilitySelectOption[] = [
  { label: 'Under construction', value: 'Under construction ' },
  { label: 'Broken/not in use', value: 'Broken/not in use' },
  { label: 'Operational', value: 'Operational ' },
  { label: 'Decommissioned', value: 'Decomissioned' },
]

const EDUCATION_CATEGORY_OPTIONS: FacilitySelectOption[] = [
  { label: 'Pre-Primary 1 and 2 (PP1 and PP2)', value: 'pre_primary' },
  { label: 'Lower Primary (Grade 1-3)', value: 'lower_primary' },
  { label: 'Upper Primary (Grade 4-6)', value: 'upper_primary' },
  { label: 'Junior School (Grade 7-9)', value: 'junior_school' },
  { label: 'Senior School (Grade 10-12)', value: 'senior_school' },
  { label: 'Technical Vocational Education and Training (TVET)', value: 'tvet' },
]

const EDUCATION_REG_OPTIONS: FacilitySelectOption[] = [
  { label: 'Unregistered', value: 'unregistred' },
  { label: 'Registered', value: 'registered' },
  { label: 'Awaiting Registration', value: 'awaiting_registration' },
]

const GENERAL_OWNERSHIP_OPTIONS: FacilitySelectOption[] = [
  { label: 'Government', value: 'government' },
  { label: 'CBO/NGO', value: 'ngo' },
  { label: 'Individual', value: 'individual' },
  { label: 'Community', value: 'community' },
]

const COMMUNITY_OWNERSHIP_OPTIONS: FacilitySelectOption[] = [
  ...GENERAL_OWNERSHIP_OPTIONS,
  { label: 'Private', value: 'private' },
]

const TENANCY_OPTIONS: FacilitySelectOption[] = [
  { label: 'Rented', value: 'rented' },
  { label: 'Owned', value: 'owned' },
]

const BOARDING_TYPE_OPTIONS: FacilitySelectOption[] = [
  { label: 'Day', value: 'day' },
  { label: 'Boarding', value: 'boarding' },
  { label: 'Both', value: 'both' },
]

const HCF_TYPE_OPTIONS: FacilitySelectOption[] = [
  { label: 'Medical Clinic', value: 'clinic' },
  { label: 'Nursing and Maternity Home', value: 'maternity' },
  { label: 'Health Centre', value: 'health_center' },
  { label: 'Hospital', value: 'hospital' },
  { label: 'Primary care hospitals', value: 'hospital' },
  { label: 'Dispensary', value: 'dispensary' },
  { label: 'VCT', value: 'VCT' },
  { label: 'Laboratory', value: 'laboratory' },
  { label: 'Chemist', value: 'chemist' },
]

const HEALTH_REG_OPTIONS: FacilitySelectOption[] = [
  { label: 'Registered', value: 'Registered' },
  { label: 'Awaiting registration', value: 'Awaiting registration' },
  { label: 'Not registered', value: 'Not registered' },
]

const HEALTH_OWNERSHIP_OPTIONS: FacilitySelectOption[] = [
  { label: 'Public', value: 'Public' },
  { label: 'Private', value: 'Private' },
  { label: 'Communal', value: 'Community' },
  { label: 'Mission', value: 'Mission' },
  { label: 'Other', value: 'Other' },
]

const PARCEL_TENURE_OPTIONS: FacilitySelectOption[] = [
  { label: 'Public', value: 'Public' },
  { label: 'Private', value: 'Private' },
  { label: 'Riparian', value: 'Riparian' },
  { label: 'Unknown', value: 'Unknown' },
]

const WATER_TYPE_OPTIONS: FacilitySelectOption[] = [
  { label: 'Water Kiosk', value: 'kiosk' },
  { label: 'Public Stand Pipe', value: 'public_stand' },
  { label: 'Borehole', value: 'borehole' },
  { label: 'Dug Well', value: 'well' },
  { label: 'Water Tank', value: 'tank' },
]

const WATER_CONDITION_OPTIONS: FacilitySelectOption[] = [
  { label: 'Functional', value: 'functional' },
  { label: 'Functional but in need of maintenance', value: 'need_maintenance' },
  { label: 'Not Functional', value: 'not_functional' },
]

const WATER_AVAILABILITY_OPTIONS: FacilitySelectOption[] = [
  { label: 'Always available', value: 'always' },
  { label: 'Intermittent', value: 'intermittent' },
  { label: 'Rarely available', value: 'rarely' },
]

const CATCHMENT_OPTIONS: FacilitySelectOption[] = [
  { label: 'Within this settlement', value: 'within_settlement' },
  { label: 'Outside this settlement', value: 'outside_settlement' },
  { label: 'Within and Outside this settlement', value: 'within_and_outside_settlement' },
]

const RD_CLASS_OPTIONS: FacilitySelectOption[] = [
  { label: 'Class A', value: 'A' },
  { label: 'Class B', value: 'B' },
  { label: 'Class C', value: 'C' },
  { label: 'Class D', value: 'D' },
  { label: 'County Road', value: 'county' },
  { label: 'Unclassified', value: 'unknown' },
]

const SURFACE_TYPE_OPTIONS: FacilitySelectOption[] = [
  { label: 'Asphalt', value: 'asphalt' },
  { label: 'Surface Dressing', value: 'surface_dressing' },
  { label: 'Gravel', value: 'gravel' },
  { label: 'Earth', value: 'earth' },
  { label: 'Cabro', value: 'cabro' },
  { label: 'Track', value: 'track' },
]

const DRAINAGE_LOCATION_OPTIONS: FacilitySelectOption[] = [
  { label: 'Left Side', value: 'left' },
  { label: 'Right Side', value: 'right' },
  { label: 'Both Sides', value: 'both' },
  { label: 'None', value: 'none' },
]

const TRAFFIC_OPTIONS: FacilitySelectOption[] = [
  { label: 'Busy', value: 'busy' },
  { label: 'Used', value: 'used' },
  { label: 'Rare', value: 'rare' },
]

const DIRECTION_OPTIONS: FacilitySelectOption[] = [
  { label: 'One Way', value: 'One Way' },
  { label: 'Two Way', value: 'Two Way' },
]

const PIPE_TYPE_OPTIONS: FacilitySelectOption[] = [
  { label: 'Plastic', value: 'plastic' },
  { label: 'Concrete', value: 'concrete' },
  { label: 'Cast-Iron', value: 'cast_iron' },
]

const POWERLINE_PHASE_OPTIONS: FacilitySelectOption[] = [
  { label: 'Single phase', value: 'single' },
  { label: '3-Phase', value: '3-phase' },
]

const POWERLINE_SUPPLY_OPTIONS: FacilitySelectOption[] = [
  { label: 'High Voltage', value: 'hv' },
  { label: 'Medium Voltage', value: 'mv' },
  { label: 'Low Voltage', value: 'lv' },
]

const POLICE_TYPE_OPTIONS: FacilitySelectOption[] = [
  { label: 'Police Post', value: 'police_post' },
  { label: 'Police Station', value: 'police_station' },
  { label: 'Chiefs Camp', value: 'chief_camp' },
]

const CRIME_TYPE_OPTIONS: FacilitySelectOption[] = [
  { label: 'Theft', value: 'theft' },
  { label: 'Burglary', value: 'burglary' },
  { label: 'Mugging', value: 'mugging' },
  { label: 'Murder', value: 'murder' },
  { label: 'Assault', value: 'assault' },
  { label: 'Rape', value: 'rape' },
  { label: 'Child Abduction', value: 'child_abduction' },
  { label: 'Child Abuse', value: 'child_abuse' },
  { label: 'Terrorism', value: 'terrorism' },
  { label: 'Armed Robbery', value: 'armed_robbery' },
]

const FREQUENCY_OPTIONS: FacilitySelectOption[] = [
  { label: 'Always', value: 'Always' },
  { label: 'Very Often', value: 'Very_Often' },
  { label: 'Sometimes', value: 'Sometimes' },
  { label: 'Rarely', value: 'Rarely' },
]

const CRIME_TARGET_OPTIONS: FacilitySelectOption[] = [
  { label: 'Men', value: 'men' },
  { label: 'Women', value: 'women' },
  { label: 'Youth', value: 'youth' },
  { label: 'Children', value: 'children' },
  { label: 'People with Disability', value: 'pwd' },
  { label: 'The Elderly', value: 'elderly' },
]

const TIME_OF_DAY_OPTIONS: FacilitySelectOption[] = [
  { label: 'Morning', value: 'morning' },
  { label: 'During the Day', value: 'during_Day' },
  { label: 'Evening/Afternoon', value: 'evening' },
  { label: 'Late Night', value: 'late_night' },
]

const DUMPING_SITE_TYPE_OPTIONS: FacilitySelectOption[] = [
  { label: 'Official', value: 'official' },
  { label: 'Unofficial', value: 'unofficial' },
  { label: 'Temporary', value: 'temporary' },
]

const WASTE_TYPE_OPTIONS: FacilitySelectOption[] = [
  { label: 'Domestic', value: 'domestic' },
  { label: 'Industrial', value: 'industrial' },
  { label: 'Medical', value: 'medical' },
  { label: 'Mixture of Wastes', value: 'mix' },
]

const HAZARD_NATURE_OPTIONS: FacilitySelectOption[] = [
  { label: 'Past/Current', value: 'Past' },
  { label: 'Potential', value: 'Potential' },
]

const FACILITY_SELECT_OPTIONS_BY_TYPE: Record<
  string,
  Record<string, FacilitySelectOption[]>
> = {
  education_facility: {
    education_category: EDUCATION_CATEGORY_OPTIONS,
    registration_status: EDUCATION_REG_OPTIONS,
    ownership_type: GENERAL_OWNERSHIP_OPTIONS,
    boarding_type: BOARDING_TYPE_OPTIONS,
    land_ownership_status: TENANCY_OPTIONS,
    parcel_has_title: YES_NO_OPTIONS,
    compound_fence_status: YES_NO_OPTIONS,
    classroom_condition: CONDITION_FACILITY_OPTIONS,
    toilet_condition: CONDITION_FACILITY_OPTIONS,
    teaching_aids_available: YES_NO_PLAIN_OPTIONS,
    fees_paid_by_students: YES_NO_PLAIN_OPTIONS,
    sanitary_pads_provision: YES_NO_PLAIN_OPTIONS,
    sanitary_pads_bins: YES_NO_PLAIN_OPTIONS,
  },
  health_facility: {
    level: HCF_TYPE_OPTIONS,
    registration_status: HEALTH_REG_OPTIONS,
    condition: CONDITION_FACILITY_OPTIONS,
    ownership_type: HEALTH_OWNERSHIP_OPTIONS,
    land_ownership: PARCEL_TENURE_OPTIONS,
    land_title_available: YES_NO_OPTIONS,
    has_ambulance: YES_NO_OPTIONS,
  },
  water_point: {
    type: WATER_TYPE_OPTIONS,
    ownership_type: HEALTH_OWNERSHIP_OPTIONS,
    catchment: CATCHMENT_OPTIONS,
    condition: WATER_CONDITION_OPTIONS,
    availability: WATER_AVAILABILITY_OPTIONS,
  },
  road: {
    rd_class: RD_CLASS_OPTIONS,
    surface_type: SURFACE_TYPE_OPTIONS,
    surface_condition: OPERATIONAL_CONDITION_OPTIONS,
    rd_traffic: TRAFFIC_OPTIONS,
    rd_direction: DIRECTION_OPTIONS,
    rd_drainage_location: DRAINAGE_LOCATION_OPTIONS,
    rd_drainage_condition: OPERATIONAL_CONDITION_OPTIONS,
  },
  sewer: {
    condition: OPERATIONAL_CONDITION_OPTIONS,
    ownership: GENERAL_OWNERSHIP_OPTIONS,
    pipe_type: PIPE_TYPE_OPTIONS,
    provider_category: GENERAL_OWNERSHIP_OPTIONS,
  },
  piped_water: {
    condition: OPERATIONAL_CONDITION_OPTIONS,
    ownership_type: GENERAL_OWNERSHIP_OPTIONS,
  },
  powerline: {
    PL_Phases: POWERLINE_PHASE_OPTIONS,
    PL_Type_of_Supply: POWERLINE_SUPPLY_OPTIONS,
  },
  streetlight: {
    condition: CONDITION_FACILITY_OPTIONS,
  },
  community_hall: {
    condition: CONDITION_FACILITY_OPTIONS,
    ownership: COMMUNITY_OWNERSHIP_OPTIONS,
  },
  community_project: {
    condition: OPERATIONAL_CONDITION_OPTIONS,
    ownership: COMMUNITY_OWNERSHIP_OPTIONS,
  },
  police_station: {
    PC_Type: POLICE_TYPE_OPTIONS,
    PC_Condition: CONDITION_FACILITY_OPTIONS,
  },
  crime_hotspot: {
    CH_Crime_Type: CRIME_TYPE_OPTIONS,
    CH_Frequency: FREQUENCY_OPTIONS,
    CH_Time_of_Day: TIME_OF_DAY_OPTIONS,
    CH_Crime_Target: CRIME_TARGET_OPTIONS,
  },
  mast: {
    TC_Condition: CONDITION_FACILITY_OPTIONS,
  },
  dumping_site: {
    DS_Type: DUMPING_SITE_TYPE_OPTIONS,
    DS_Status: CONDITION_FACILITY_OPTIONS,
    DS_Type_of_Waste: WASTE_TYPE_OPTIONS,
  },
  hazard_zone: {
    nature: HAZARD_NATURE_OPTIONS,
    frequency_of_occurrence: FREQUENCY_OPTIONS,
  },
}

const FACILITY_MULTISELECT_BY_TYPE: Record<string, string[]> = {
  education_facility: ['education_category'],
}

export function buildFacilitySelectOptions(
  featureType: string
): Record<string, FacilitySelectOption[]> {
  return { ...(FACILITY_SELECT_OPTIONS_BY_TYPE[featureType] || {}) }
}

export function getFacilitySelectFields(featureType: string): string[] {
  return Object.keys(buildFacilitySelectOptions(featureType))
}

export function getFacilityMultiselectFields(featureType: string): string[] {
  return FACILITY_MULTISELECT_BY_TYPE[featureType] || []
}
