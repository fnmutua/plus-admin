
import { getListWithoutGeo } from '@/api/counties'
import { ref } from 'vue'
import { getRoutesList, getOneSettlement } from '@/api/settlements'

type ProgrammeRow = { id: number; title?: string; acronym?: string; parentId?: number | string | null }
type ImplementationOption = {
  value: number
  label: string
  acronym?: string
  title?: string
}

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
      parentOpt.label = arrayItem.name  
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
      county.label = arrayItem.name  
      //  console.log(countyOpt)
      countyOptions.value.push(county)
    })
  })
}

 
 
const implementationOptions = ref<ImplementationOption[]>([])
const allImplementationOptions = ref<ImplementationOption[]>([])
let implementationOptionsLoadPromise: Promise<void> | null = null

function normalizeToken(value: unknown): string {
  return String(value ?? '').trim().toLowerCase()
}

async function loadAllImplementationOptions(): Promise<void> {
  if (allImplementationOptions.value.length > 0) {
    return
  }
  if (implementationOptionsLoadPromise) {
    return implementationOptionsLoadPromise
  }

  if (!implementationOptionsLoadPromise) {
    implementationOptionsLoadPromise = getListWithoutGeo({
      params: {
        pageIndex: 1,
        limit: 100,
        curUser: 1,
        model: 'programme_implementation',
        searchField: 'title',
        searchKeyword: '',
        sort: 'ASC',
      },
    })
      .then((response: { data: any }) => {
        const ret = response.data ?? []
        allImplementationOptions.value = ret.map(
          (arrayItem: { id: number; acronym: string; title: string }) => ({
            value: arrayItem.id,
            label: arrayItem.acronym,
            acronym: arrayItem.acronym,
            title: arrayItem.title,
          })
        )
      })
      .catch((error) => {
        implementationOptionsLoadPromise = null
        throw error
      })
  }

  return implementationOptionsLoadPromise
}

export async function ensureImplementationOptionsLoaded(): Promise<void> {
  await loadAllImplementationOptions()
}

function implementationMatchesProgrammeChain(
  impl: ImplementationOption,
  programmes: ProgrammeRow[],
  componentMeta?: { acronym?: string; title?: string }
): boolean {
  const implAcronym = normalizeToken(impl.acronym || impl.label)
  const implTitle = normalizeToken(impl.title)

  if (componentMeta) {
    const componentAcronym = normalizeToken(componentMeta.acronym)
    if (componentAcronym && componentAcronym === implAcronym) {
      return true
    }
  }

  return programmes.some((programme) => {
    const acr = normalizeToken(programme.acronym)
    const title = normalizeToken(programme.title)
    if (!implAcronym && !implTitle) return false
    if (implAcronym && (implAcronym === acr || implAcronym === title)) return true
    if (acr && (acr.includes(implAcronym) || implAcronym.includes(acr))) return true
    if (title && (title.includes(implAcronym) || implAcronym.includes(title))) return true
    if (implTitle && (implTitle.includes(acr) || implTitle.includes(title))) return true
    return false
  })
}

async function resolveProgrammeChain(programmeId: number | string): Promise<ProgrammeRow[]> {
  const chain: ProgrammeRow[] = []
  const visited = new Set<number>()
  let currentId = Number(programmeId)

  while (!Number.isNaN(currentId) && currentId > 0 && !visited.has(currentId)) {
    visited.add(currentId)
    const res = await getOneSettlement({ model: 'programme', id: currentId } as any)
    const programme = res?.data as ProgrammeRow | undefined
    if (!programme?.id) break
    chain.push(programme)
    const parentRaw = programme.parentId
    currentId = parentRaw != null && parentRaw !== '' ? Number(parentRaw) : NaN
  }

  return chain
}

export async function setImplementationOptionsForProgramme(
  programmeId?: number | string | null,
  componentMeta?: { acronym?: string; title?: string },
  keepImplementationId?: number | string | null
) {
  await loadAllImplementationOptions()

  const all = allImplementationOptions.value
  if (all.length === 0) {
    implementationOptions.value = []
    return
  }

  let filtered: ImplementationOption[] = []

  if (programmeId != null && programmeId !== '') {
    const chain = await resolveProgrammeChain(programmeId)
    filtered = all.filter((impl) =>
      implementationMatchesProgrammeChain(impl, chain, componentMeta)
    )
  }

  if (filtered.length === 0 && componentMeta?.acronym) {
    const componentAcronym = normalizeToken(componentMeta.acronym)
    filtered = all.filter(
      (impl) => normalizeToken(impl.acronym || impl.label) === componentAcronym
    )
  }

  const keepId =
    keepImplementationId != null && keepImplementationId !== ''
      ? Number(keepImplementationId)
      : null
  if (
    keepId != null &&
    !Number.isNaN(keepId) &&
    !filtered.some((opt) => opt.value === keepId)
  ) {
    const existing = all.find((opt) => opt.value === keepId)
    if (existing) {
      filtered = [...filtered, existing]
    }
  }

  implementationOptions.value = filtered
}

 const getImplementationSponsors = async () => {
  await loadAllImplementationOptions()
  return allImplementationOptions.value
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
      parentOpt.label = arrayItem.name  
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
       parentOpt.label = arrayItem.name  
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
        value: 'county_'+data.id,
        label: data.name + ' county',
        level: 'county',
        nodeKey: 'county' + data.id,
        children: []
      };

      data.subcounties.forEach((subc) => {
        const soption = {
          value: 'subcounty_'+subc.id,
          label: subc.name + ' constituency',
          county_id: data.id,
          level: 'subcounty',
          nodeKey: 'subcounty' + subc.id,
          children: []
        };

        subc.wards.forEach((ward) => {
          const woption = {
            value: 'ward_'+ward.id,
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
                value: 'settlement_'+settlement.id,
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

//getCountySubcountySep()
void loadAllImplementationOptions()

 

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


const prog_components =ref([])
const getProgrameComponents = async () => {
  const formData = {
    limit: 100,
    page: 1,
    curUser: 1,
    model: 'programme',
    searchField: 'title',
    searchKeyword: '',
    associated_multiple_models: ['component']
  };

  try {
    const res = await getRoutesList(formData);
    
    if (!res?.data || !Array.isArray(res.data)) {
      console.error('Invalid data structure received:', res?.data);
      return [];
    }

    // Filter items where parentId is null
     const filteredData = res.data
          .filter(item => item.parentId === null)
          .map(item => ({
            ...item,
            label: item.title,
            value: item.id
          }));
     console.log('Filtered programme routes:', filteredData);
    
    filteredData.forEach(item => {
      prog_components.value.push(item)
    });
    
    
  } catch (error) {
    console.error('Error fetching program components:', error);
    throw error;
  }
};




 

const getComponents = async () => {
  const formData = {
    limit: 100,
    page: 1,
    curUser: 1,
    model: 'component',
    searchField: 'title',
    searchKeyword: '',
    associated_multiple_models: []
  };

  try {
    const res = await getRoutesList(formData);
    console.log('Components routes ', res.data);
    //components.value=res.data



    if (res.data && Array.isArray(res.data)) {
      
 
      console.log("programme opions", prog_components.value );

      
      const findProgramById = (programs, programmeId) => {

        for (const program of programs) {
         
          if (program.id == programmeId) {
            console.log('program......',program)
            return program;
          }
          if (Array.isArray(program.children) && program.children.length > 0) {
            
            const found = findProgramById(program.children, programmeId);
    
            if (found) {
              return found;
            }
          }
        }
        return null; // Return null if no program is found
      };
      


              // Function to add components to their respective programs
        const addComponentsToPrograms = () => {
          // Ensure both arrays are defined
          if (!Array.isArray(prog_components.value) || !Array.isArray(res.data)) {
            console.error('Invalid data structures: prog_components and components must be arrays.');
            return;
          }

          // Iterate through each component
          res.data.forEach(component => {
            
              
            const program = findProgramById(prog_components.value, component.programme_id);
            console.log('Getting program', program)

            if (program) {

              program.value=program.id
              program.label=program.title
         
              const newComponent = {

                value: component.id,
                label:  component.title,
               }

               console.log('newComponent',newComponent, 'program', program)

                    // Add the new component to the program's children array
                  // Ensure program.children exists
                    if (!program.children) {
                      program.children = [];
                    }

                    // Add the new component to the children array
                    program.children.push({ ...newComponent });

 
            }
             else {
              console.warn(`Program with programme_id ${component.programme_id} not found.`);
            }
          });

          console.log('Updated ---- prog_components:', prog_components.value);
        };

        // Call the function to update the prog_components
        addComponentsToPrograms();





     } else {
      console.error('Invalid data structure received:', res.data);
      return []; // Return empty array if invalid data
    }



  } catch (error) {
    console.error('Error fetching components:', error);
    throw error; // Re-throw or return empty array
  }
};


export function formatProgrammeSelectLabel(p: {
  id?: number | string | null
  title?: string | null
  acronym?: string | null
}): string {
  const title = p.title?.trim()
  const acronym = p.acronym?.trim()
  if (title && acronym && title.toLowerCase() !== acronym.toLowerCase()) {
    return `${title} (${acronym})`
  }
  return title || acronym || `Programme ${p.id}`
}

export function formatComponentSelectLabel(c: {
  id?: number | string | null
  title?: string | null
  acronym?: string | null
}): string {
  return c.title?.trim() || c.acronym?.trim() || `Component ${c.id}`
}

export function formatProgrammeComponentSelectLabel(
  programmePath: string[] | string,
  componentLabel: string
): string {
  const segments = Array.isArray(programmePath) ? programmePath : [programmePath]
  return [...segments, componentLabel].join(' >> ')
}


getActivities()
 
  
getProgrameComponents()
getComponents()
  

//getSettlements()
getCounties()
getSubCounties()
 
getWards()
getContractors()



export {
  countyOptions, settlementOptionsV2,contractorOptions,getProgrameComponents,
  activityOptions, subcountyOptions, implementationOptions,
  wardOptions, cascadedAdminOptions,prog_components,
};
