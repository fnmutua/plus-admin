
import { getListWithoutGeo } from '@/api/counties'
import { ref } from 'vue'

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
      parentOpt.subcounty_id = arrayItem.subcounty_id
      parentOpt.ward_id = arrayItem.ward_id
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

 
 
const implementationOptions = ref([])
 const getImplementationSponsors = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'programme_implementation',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    //console.log('Received response:', response)
    //tableDataList.value = response.data
    const ret = response.data
  
    ret.forEach(function (arrayItem: { id: string; type: string }) {
      const parentOpt = {}
      parentOpt.value = arrayItem.id
       parentOpt.label = arrayItem.acronym
      //  console.log(countyOpt)
      implementationOptions.value.push(parentOpt)
    })
  })
}
 

const contractorOptions = ref([])
 const getContractors = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'contractor',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    //console.log('Received response:', response)
    //tableDataList.value = response.data
    const ret = response.data
  
    ret.forEach(function (arrayItem: { id: string; type: string }) {
      const parentOpt = {}
      parentOpt.value = arrayItem.id
       parentOpt.label = arrayItem.name
      //  console.log(countyOpt)
      contractorOptions.value.push(parentOpt)
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

const wardOptions = ref([])
 const getWards = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'ward',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    //console.log('Received response:', response)
    //tableDataList.value = response.data
    const ret = response.data
  
    ret.forEach(function (arrayItem: { id: string; type: string }) {
      const parentOpt = {}
      parentOpt.value = arrayItem.id
      parentOpt.county_id = arrayItem.county_id
      parentOpt.subcounty_id = arrayItem.subcounty_id
       parentOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      wardOptions.value.push(parentOpt)
    })
  })
}

const cascadedAdminOptions = ref([])

const getCountySubcountySep = async () => {
  cascadedAdminOptions.value = []; // Initialize every time it's called
  const nested = ['subcounty', 'ward', 'settlement'];
  
  const res = await getListWithoutGeo({
    params: {
      curUser: 1, // Id for logged in user
      model: 'county',
      assocModel: 'subcounty',
      searchField: 'name',
      nested_models: nested,
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received cascaded response:', response);
    const ret = response.data;

    ret.forEach((data) => {
      const coption = {
        value: data.id,
        label: data.name + ' county',
        level: 'county',
        nodeKey: 'county' + data.id,
        children: []
      };

      data.subcounties.forEach((subc) => {
        const soption = {
          value: subc.id,
          label: subc.name + ' constituency',
          county_id: data.id,
          level: 'subcounty',
          nodeKey: 'subcounty' + subc.id,
          children: []
        };

        subc.wards.forEach((ward) => {
          const woption = {
            value: ward.id,
            label: ward.name + ' ward',
            subcounty_id: ward.subcounty_id,
            county_id: ward.county_id,
            level: 'ward',
            nodeKey: 'ward' + ward.id,
            children: []
          };

          ward.settlements.forEach((settlement) => {
            if (settlement.id) { // Check if settlement exists
              const sett_option = {
                value: settlement.id,
                label: settlement.name + ' settlement',
                subcounty_id: settlement.subcounty_id,
                county_id: settlement.county_id,
                ward_id: settlement.ward_id,
                level: 'settlement',
                nodeKey: 'settlement' + settlement.id
              };

              woption.children.push(sett_option);
            }
          });

          // Only add woption if it has children (settlements)
          if (woption.children.length > 0) {
            soption.children.push(woption);
          }
        });

        // Only add soption if it has children (wards with settlements)
        if (soption.children.length > 0) {
          coption.children.push(soption);
        }
      });

      // Only add coption if it has children (subcounties with wards having settlements)
      if (coption.children.length > 0) {
        cascadedAdminOptions.value.push(coption);
      }
    });

    console.log('Received cascaded cascadedAdminOptions:', cascadedAdminOptions.value);
  });
};

getCountySubcountySep()
getImplementationSponsors()

 

const activityOptions = ref([])

 
const getActivities = async () => {
  const res = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'activity',
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
      opt.label = arrayItem.title  
      //  console.log(countyOpt)
      activityOptions.value.push(opt)
    })
  })
}


getActivities()
 
  
 
  

getSettlements()
getCounties()
getSubCounties()
 
getWards()
getContractors()



export {
  countyOptions, settlementOptionsV2,contractorOptions,
  activityOptions, subcountyOptions, implementationOptions,  wardOptions, cascadedAdminOptions
};
