
import { getCountyListApi,getListWithoutGeo } from '@/api/counties'
import { Form, FormExpose } from '@/components/Form'
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { reactive, unref, ref } from 'vue'

const settlementOptionsV2 = ref([])

const settlementfilteredOptions = ref([])

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
    value: 'Medical Clinic',
    label: 'Medical Clinic'
  },
  {
    value: 'Medical Center',
    label: 'Medical Center'
  },
  {
    value: 'Nursing and Maternity Home',
    label: 'Nursing and Maternity Home'
  },

  {
    value: 'Basic Health Centre',
    label: 'Basic Health Centre'
  },


  {
    value: 'Primary care hospitals',
    label: 'Primary care hospitals'
  },


  {
    value: 'Dispensary',
    label: 'Dispensary'
  },

  {
    value: 'VCT',
    label: 'VCT'
  },

  {
    value: 'Comprehensive health Centre',
    label: 'Comprehensive health Centre'
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


getSettlements()
getCounties()
getSubCounties()



export { countyOptions, settlementOptionsV2, subcountyOptions, regOptions,HCFTypeOptions,LevelOptions,ownsershipOptions};
