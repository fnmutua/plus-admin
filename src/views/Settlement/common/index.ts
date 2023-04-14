
import { getCountyListApi,getListWithoutGeo } from '@/api/counties'
import { Form, FormExpose } from '@/components/Form'
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { reactive, unref, ref } from 'vue'

const settlementOptionsV2 = ref([])

 
const getSettlements = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'settlement',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    const ret = response.data

 
    ret.forEach(function (arrayItem: { id: string; type: string }) {
      const parentOpt = {}
      parentOpt.value = arrayItem.id
      parentOpt.county_id = arrayItem.county_id
      parentOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      settlementOptionsV2.value.push(parentOpt)
    })
  })
}
const countyOptions = ref([])
const countyRefList = ref()

const getCounties = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'county',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    const ret = response.data
    countyRefList.value = ret
    ret.forEach(function (arrayItem: { id: string; type: string }) {
      const county = {}
      county.value = arrayItem.id
      county.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      countyOptions.value.push(county)
    })
  })
}

const roadOptions = ref([])

const getRoads = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'county',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    const ret = response.data
     ret.forEach(function (arrayItem: { id: string; type: string }) {
      const opt = {}
      opt.value = arrayItem.id
      opt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      roadOptions.value.push(county)
    })
  })
}
 
const subcountyOptions = ref([])
const subcounties = ref([])
const getSubCounties = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'subcounty',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    //console.log('Received response:', response)
    //tableDataList.value = response.data
    const ret = response.data
    subcounties.value = ret
 
    ret.forEach(function (arrayItem: { id: string; type: string }) {
      const parentOpt = {}
      parentOpt.value = arrayItem.id
      parentOpt.county_id = arrayItem.county_id
      parentOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      subcountyOptions.value.push(parentOpt)
    })
  })
}


const regOptions = [
  {
    value: 'Registered',
    label: 'Registered'
  },
  {
    value: 'Not Registered',
    label: 'Not Registered'
  }
]


const HCFTypeOptions = [
  {
    label: 'Medical Clinic',
    value: 'clinic'
  },
 
  {
    label: 'Nursing and Maternity Home',
    value: 'maternity'
  },

  {
    label: 'Health Centre',
    value: 'health_center'
  },


  {
    label: 'Hospital',
    value: 'hospital'
  },
  {
    label: 'Primary care hospitals',
    value: 'hospital'
  },


  {
    label: 'Dispensary',
    value: 'dispensary'
  },

  {
    label: 'VCT',
    value: 'VCT'
  },
  {
    label: 'Laboratory',
    value: 'laboratory'
  },
  {
    label: 'Chemist',
    value: 'chemist'
  },
   
]


const LevelOptions = [
  {
    value: 'Level 1',
    label: 'Level 1'
  },
  {
    value: 'Level 2',
    label: 'Level 2'
  },
  {
    value: 'Level 3',
    label: 'Level 3'
  },
  {
    value: 'Level 4',
    label: 'Level 4'
  }
]

const SchoolLevelOptions = [
  {
    value: 'ecd',
    label: 'Nursery school / ECD'
  },
  {
    value: 'primary',
    label: ' Primary school'
  }, {
    value: 'secondary',
    label: 'Secondary school'
  },
  {
    value: 'polytechnic',
    label: 'Village Polytechnique'
  },
  {
    value: 'adult_school',
    label: 'Adult Education School'
  },
  {
    value: 'school_for_disabled',
    label: 'School for physically challenged '
  },
  {
    value: 'school_for_deaf',
    label: 'School for deaf'
  },

  {
    value: 'school_for_blind',
    label: 'School for blind'
  },
  
  {
    value: 'other',
    label: 'Other'
  }

]

const ownsershipOptions = [
  {
    value: 'Private Practice',
    label: 'Private Practice'
  },
  {
    value: 'Ministry of Health',
    label: 'Ministry of Health'
  },
  {
    value: 'Faith Based Organization',
    label: 'Faith Based Organization'
  },
  {
    value: 'Non - Governmental Organizations',
    label: 'Non - Governmental Organizations'
  }
]
const generalOwnership = [
  {
    value: 'private',
    label: 'Private'
  },
  {
    value: 'public',
    label: 'Public'
  },
  {
    value: 'FBO',
    label: 'Faith Based Organization'
  },
  {
    value: 'NGO',
    label: 'Non - Governmental Organizations'
  }
]

const mhmOptions = [
  {
    value: 'none',
    label: 'None'
  },
  {
    value: '100',
    label: 'Free pads'
  },
 
  {
    value: '200',
    label: 'Disposal bins'
  },
  {
    value: '300',
    label: 'Information, Education and Communication(IEC)'
  }
]


const tenancyOptions = [
  {
    value: '100',
    label: 'Rented'
  },
  {
    value: '200',
    label: 'Owned'
  }
]


const RdClassOptions = [
  {
    value: 'A',
    label: 'Class A'
  },
  {
    value: 'B',
    label: 'Class B'
  }, {
    value: 'C',
    label: 'Class C'
  }, {
    value: 'D',
    label: 'Class d'
  }, {
    value: 'county',
    label: 'County Road'
  },
  {
    value: 'unknown',
    label: 'Unclassified'
  },
]

const SurfaceTypeOtions = [
  {
    value: 'asphalt',
    label: 'Asphalt'
  },
  {
    value: 'surface_dressing',
    label: ' Surface Dressing'
  },
  {
    value: 'gravel',
    label: 'Gravel'
  },
  {
    value: 'earth',
    label: 'Earth'
  },
  {
    value: 'cabro',
    label: 'Cabro'
  },
  {
    value: 'track',
    label: 'Track'
  },
]

const drainageTypeOtions = [
  {
    value: 'left',
    label: 'Left Side'
  },
  {
    value: 'right',
    label: 'Right Side'
  },
  {
    value: 'both',
    label: 'Both Sides'
  },
  {
    value: 'none',
    label: 'None'
  },

]


const AssetTypeOptions = [
  {
    value: 'footpath',
    label: 'Footpath'
  },
  {
    value: 'cycling_lane',
    label: 'Cycling Lane'
  }, {
    value: 'streetlight',
    label: 'Streetlights'
  }, {
    value: 'culvert',
    label: 'Culvert'
  }, {
    value: 'bridge',
    label: 'Bridge'
  },
  {
    value: 'drift',
    label: 'Drift'
  },
  {
    value: 'parking',
    label: 'Parking'
  },

]

const AssetConditionOptions = [
  {
    value: 'Excellent',
    label: 'Excellent'
  },
  {
    value: 'good',
    label: 'Good'
  },
  {
    value: 'fair',
    label: 'Fair'
  },
  {
    value: 'poor',
    label: 'Poor'
  },
  {
    value: 'very_poor',
    label: 'Very Poor'
  },
  {
    value: 'under_construction',
    label: 'Under Construction'
  },
]


const WaterFacilitytypeOptions = [
  {
    value: 'borehole',
    label: 'Borehole'
  },
  {
    value: 'public_stand',
    label: 'Public stand'
  }, {
    value: 'kiosk',
    label: 'Kiosk'
  }, {
    value: 'well',
    label: 'Well'
  }, {
    value: 'tank',
    label: 'Tank'
  },

]






const FacilityConditionOptions = [
  {
    value: '100',
    label: 'Excellent'
  },
  {
    value: '200',
    label: 'Good'
  },
  {
    value: '300',
    label: 'Fair'
  },
  {
    value: '400',
    label: 'Poor'
  },
  {
    value: '500',
    label: 'Very Poor'
  },
  {
    value: '600',
    label: 'Under Construction'
  },
]


const cascadeOptions = [
  {
    value: 'electric',
    label: 'Electricity',
    children: [
      {
        value: 'powerline',
        label: 'Powerline',
      },
      {
        value: 'power_asset',
        label: 'Power Assets',
        children: [
          {
            value: 'primary_substation',
            label: 'Primary Substation',
          },
          {
            value: 'secondary_substation',
            label: ' Secondary substation(transformer) ',
          },
          {
            value: 'floodlight',
            label: 'Floodlights',
          },
        ],
      },
    ],
  },
  {
    value: 'security',
    label: 'Security and Safety',
    children: [

      {
        value: 'police_stn',
        label: 'Police Station',
      },
      {
        value: 'police_post',
        label: 'Police Post',
      },
      {
        value: 'chiefs_camp',
        label: 'Chiefs Camp',
      },
      {
        value: 'crime_spot',
        label: 'Crime Hotspot',
      }

    ],
  },

  {
    value: 'Sanitation_hygiene',
    label: 'Sanitation and Hygiene',
    children: [

      {
        value: 'toilet',
        label: 'Toilet',
      },
      {
        value: 'shower',
        label: 'Showers',
      },
      {
        value: 'handwashing',
        label: 'HandWashing',
      }

    ],
  },
  {
    value: 'waste',
    label: 'Waste Management',
    children: [

      {
        value: 'dumping',
        label: 'Dumping Sites',
        children: [
          {
            value: 'illegal_dumping_site',
            label: 'Illegal',
          },
          {
            value: 'llegal_dumping_site',
            label: 'Legal',
          },
        ]

      },
      {
        value: 'treatment_center',
        label: 'Treatment/Recycling centre',
      },
      {
        value: 'collection_point',
        label: 'Collection point ',
      },
      {
        value: 'waste_mgmt_project',
        label: 'Waste Management Projects',
      },
      {
        value: 'other_waste_mgmt',
        label: 'Others e.g Biodigesters',
      },
    ],
  },




  {
    value: 'utility',
    label: 'Public utilities',
    children: [


      {
        value: 'playground',
        label: 'Playground',
      },
      {
        value: 'stadium',
        label: 'Stadium',
      },
      {
        value: 'chiefs_camp',
        label: 'Community Hall',
      },
      {
        value: 'open_space',
        label: 'Open space',
      }

    ],
  },


  {
    value: 'environment',
    label: 'Environment',
    children: [
      {
        value: 'river',
        label: 'River',
      },
      {
        value: 'wetland',
        label: 'Swamp/Wetland',
      },
      {
        value: 'forest',
        label: 'Forest',
      },

      {
        value: 'qurry_pit',
        label: 'Quarry / Open Pits',
      },
      {
        value: 'other_environment_areas',
        label: 'Other Environmentally sensitive areas ',
      },
      {
        value: 'hazard',
        label: 'Hazards',
        children: [
          {
            value: 'flooding',
            label: 'Flooding',
          },
          {
            value: 'fire',
            label: 'Fire',
          },
          {
            value: 'landslide',
            label: 'Landslide',
          },

          {
            value: 'other_hazard',
            label: 'Other',
          },




        ]
      },

    ],
  },
]

const phase_options = [{
  value: 'single',
  label: 'Single-Phase',
},
{
  value: '3_phase',
  label: 'Three-Phase',
}]




const frequencyOptions = [{
  value: 'rare',
  label: 'Rare',
},
{
  value: 'often',
  label: 'Often',
},
{
  value: 'very_often',
  label: 'Very Often',
}

]


 

const wasteOptions = [
  {
    value: 'Domestic',
    label: 'Domestic'
  },
  {
    value: 'Industrial',
    label: 'Industrial'
  },
  {
    value: 'Medical',
    label: 'Medical'
  },
  {
    value: 'Environmental',
    label: 'Environmental'
  }
]


const pipeOptions = [
  {
    value: 'plastic',
    label: 'Plastic'
  },
  {
    value: 'concrete',
    label: 'Concrete'
  },
  {
    value: 'cast_iron',
    label: 'Cast-Iron'
  },
  
]

const sewerTypes = [
  {
    value: 'domestic',
    label: 'Domestic'
  },
  {
    value: 'industrial',
    label: 'Industrial'
  },
  {
    value: 'storm',
    label: 'Storm'
  },
  
]
getSettlements()
getCounties()
getSubCounties()
 



export {
  countyOptions, settlementOptionsV2, subcountyOptions, regOptions,WaterFacilitytypeOptions,cascadeOptions,phase_options,frequencyOptions,wasteOptions,FacilityConditionOptions,
  SchoolLevelOptions, HCFTypeOptions, LevelOptions, generalOwnership, roadOptions,AssetConditionOptions,AssetTypeOptions,
  ownsershipOptions, mhmOptions, tenancyOptions, drainageTypeOtions, SurfaceTypeOtions, RdClassOptions,pipeOptions,sewerTypes
};
