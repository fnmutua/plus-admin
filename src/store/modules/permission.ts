import { defineStore } from 'pinia'
import { adminRoutes, constantRouterMap  } from '@/router'
import { flatMultiLevelRoutes } from '@/utils/routerHelper'
import { store } from '../index'
import { cloneDeep } from 'lodash-es'
import { Layout } from '@/utils/routerHelper'
import { ref ,watch} from 'vue'
import { getRoutesList } from '@/api/settlements'
import { useAppStore} from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'


function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

// const { wsCache } = useCache()

// const appStore = useAppStore()

// const userInfo = wsCache.get(appStore.getUserInfo)
 
  
import { useAppStoreWithOut } from '@/store/modules/app'



const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)




 

const programmeComponentOptions = ref([])
const dynamicDashbaordOptions = ref([])

 


 // 1. First, properly handle the async function
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

    console.log('programme routes ', res.data);

    // Track all paths and their nesting levels
    const pathRegistry = new Map();

    // Synchronous path collection
    const collectPaths = (items, parentPath = '') => {
      items.forEach(item => {
        const fullPath = parentPath 
          ? `${parentPath}/${item.acronym.toLowerCase()}` 
          : item.acronym.toLowerCase();
        pathRegistry.set(fullPath, { item, parentPath });
        
        if (Array.isArray(item.children)) {
          collectPaths(item.children, fullPath);
        }
      });
    };

    collectPaths(res.data);

    // Synchronous hierarchy building
    const buildHierarchy = (items, parentPath = '') => {
      return items
        .filter(item => {
          const fullPath = parentPath 
            ? `${parentPath}/${item.acronym.toLowerCase()}` 
            : item.acronym.toLowerCase();
          return !Array.from(pathRegistry.keys()).some(
            p => p !== fullPath && p.endsWith(`/${fullPath.split('/').pop()}`)
          );
        })
        .map(item => {
          const fullPath = parentPath 
            ? `${parentPath}/${item.acronym.toLowerCase()}` 
            : item.acronym.toLowerCase();
          
          return {
            path: fullPath.split('/').pop(),
            name: toTitleCase(item.title),
            meta: {
              title: item.title,
              hidden: false,
              icon: item.icon,
              programme_id: item.id,
              role: ['admin', 'super_admin']
            },
            children: Array.isArray(item.children) 
              ? buildHierarchy(item.children, fullPath)
              : []
          };
        });
    };

    return buildHierarchy(res.data);
  } catch (error) {
    console.error('Error fetching program components:', error);
    throw error;
  }
};

// 2. Proper usage with async/await
const loadProgrammeComponents = async () => {
  try {
    const result = await getProgrameComponents();
    programmeComponentOptions.value = result;
    console.log("Final programmeComponentOptions", programmeComponentOptions.value);
  } catch (error) {
    console.error("Failed to load components:", error);
    programmeComponentOptions.value = [];
  }
};

// 3. Call the loader function
loadProgrammeComponents();



const components = ref([])

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




    if (res.data && Array.isArray(res.data)) {
     

      res.data.forEach(child_component => {


        const child_meta_d = {}

        
        


        child_meta_d.title = child_component.title 
        child_meta_d.hidden = false
        child_meta_d.component_id = child_component.id 
        child_meta_d.icon = child_component.icon
        child_meta_d.role= ['admin', 'super_admin'] 
        child_meta_d.locationLevel= ['national' ] 
        child_meta_d.programme_id= child_component.programme_id
        child_component.meta = child_meta_d    
        child_component.name = child_component.title     
        child_component.path = child_component.acronym.toLowerCase()     
        child_component.component = () => import('@/views/programmes/interventions.vue') // This is a template to hold info on interventions

        
        components.value.push(child_component)

       
      });
 
      console.log("programme opions", programmeComponentOptions.value );
      console.log("component options", components.value);

      
      const findProgramById = (programs, programmeId) => {

        for (const program of programs) {
         
          if (program.meta.programme_id == programmeId) {
            console.log('program......',program)
            return program;
          }
          if (Array.isArray(program.children) && program.children.length > 0) {
            
            const found = findProgramById(program.children, programmeId);
            console.log()
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
          if (!Array.isArray(programmeComponentOptions.value) || !Array.isArray(components.value)) {
            console.error('Invalid data structures: programmeComponentOptions and components must be arrays.');
            return;
          }

          // Iterate through each component
          components.value.forEach(component => {
            
          //  console.log('component',component.programme_id)
            // Find the program that matches the component's programme_id
           // const program = programmeComponentOptions.value.find(p => p.programme_id == component.programme_id);
            const program = findProgramById(programmeComponentOptions.value, component.programme_id);

            if (program) {
              // Create a new path for the component
             // const componentPath = `${program.path}/${component.acronym.toLowerCase()}`;
            
              // Add the component's path to the component object
           //   component.path = componentPath;
            
              // Add the entire component object to the program's children array

               // Create a new component object with a plain structure
                    const newComponent = {
                      path: component.path,
                      name:  component.title,
                      component : () => import('@/views/programmes/interventions.vue') ,// This is a template to hold info on interventions
                      meta: {
                        title: component.title,
                        component_id: component.id,
                        hidden: false,
                        icon: component.icon || 'default-icon',
                        role: ['admin', 'super_admin']
                      }
                    };

                    // Add the new component to the program's children array
                    program.children.push({ ...newComponent });


              //program.children.push(component);
            }
             else {
              console.warn(`Program with programme_id ${component.programme_id} not found.`);
            }
          });

          console.log('Updated programmeComponentOptions:', programmeComponentOptions.value);
        };

        // Call the function to update the programmeComponentOptions
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


 

 // Wrap your code in an async function
 
  const getDynamicDashboards = async () => {
    const formData = {}
    formData.limit = 100
    formData.page = 1
    formData.curUser = 1 // Id for logged in user
    formData.model = 'dashboard'
    //-Search field--------------------------------------------
    formData.searchField = 'title'
    formData.searchKeyword = ''

    formData.filters = ['createdBy']
    formData.filterValues = [[userInfo.id]]
    //--Single Filter -----------------------------------------
  
   
    // - multiple filters -------------------------------------
    formData.associated_multiple_models = []
  
    //-------------------------
    //console.log(formData)
    const res = await getRoutesList(formData)
  //  console.log("dynamo",res)
  
     
    res.data.forEach(function (arrayItem, index) {
  
    //  console.log('arrayItem',index,"|",arrayItem)
  
      if (!arrayItem.main_dashboard) { //Include only the other dashbaprds. The main dashbaord has been loaded elsewher)
        
  
        const prog = {}
        // if (arrayItem.type==='intervention') {
        //   prog.component = () => import('@/views/Dashboard/DynamicIntervention.vue') // This is a template to hold info on interventions
        //   prog.path = 'intervention_' + arrayItem.title.toLowerCase()
        //   prog.name = arrayItem.title 
    
        // }
        // else {
        //   prog.component = () => import('@/views/Dashboard/DynamicState.vue') // This is a template to hold info on interventions
        //   prog.path = 'status_' + arrayItem.title.toLowerCase()
        //   prog.name =  arrayItem.title 
        // }

        prog.component = () => import('@/views/Dashboard/DynamicState.vue') // This is a template to hold info on interventions
        prog.path = 'status_' + arrayItem.title.toLowerCase()
        prog.name =  arrayItem.title 

        
      //  prog.component =  Layout
    
        const meta = {}
        meta.title = arrayItem.title 
        meta.hidden = false
        meta.icon = arrayItem.icon
        meta.dashboard_id = arrayItem.id
   
        prog.meta = meta
  
          dynamicDashbaordOptions.value.push(prog)
    
       // console.log("dynamo", dynamicDashbaordOptions.value)
  

      }
     // adminRoutes[0].children.push(...dynamicDashbaordOptions.value);

  
      
    });
    
   // adminRoutes[0].children.push(...dynamicDashbaordOptions.value);

  
  }

  const getPublicDynamicDashboards = async () => {
    const formData = {}
    formData.limit = 100
    formData.page = 1
    formData.curUser = 1 // Id for logged in user
    formData.model = 'dashboard'
    //-Search field--------------------------------------------
    formData.searchField = 'title'
    formData.searchKeyword = ''

    formData.filters = ['public']
    formData.filterValues = [[true]]
    //--Single Filter -----------------------------------------
  
   
    // - multiple filters -------------------------------------
    formData.associated_multiple_models = []
  
    //-------------------------
    //console.log(formData)
    const res = await getRoutesList(formData)
    console.log("dynamo",res)
  
     
    res.data.forEach(function (arrayItem, index) {
  
      console.log('arrayItem',index,"|",arrayItem)
  
      if (!arrayItem.main_dashboard) { //Include only the other dashbaprds. The main dashbaord has been loaded elsewher)
        
  
        const prog = {}
        // if (arrayItem.type==='intervention') {
        //   prog.component = () => import('@/views/Dashboard/DynamicIntervention.vue') // This is a template to hold info on interventions
        //   prog.path = 'intervention_' + arrayItem.title.toLowerCase()
        //   prog.name = arrayItem.title 
    
        // }
        // else {
        //   prog.component = () => import('@/views/Dashboard/DynamicState.vue') // This is a template to hold info on interventions
        //   prog.path = 'status_' + arrayItem.title.toLowerCase()
        //   prog.name =  arrayItem.title 
        // }


        prog.component = () => import('@/views/Dashboard/DynamicState.vue') // This is a template to hold info on interventions
        prog.path = 'status_' + arrayItem.title.toLowerCase()
        prog.name =  arrayItem.title 
        
      //  prog.component =  Layout
    
        const meta = {}
        meta.title = arrayItem.title 
        meta.hidden = false
        meta.icon = arrayItem.icon
        meta.dashboard_id = arrayItem.id
   
        prog.meta = meta
  
       // dynamicDashbaordOptions.value.push(prog)
       const isDuplicate = dynamicDashbaordOptions.value.some(option => option.meta.dashboard_id === meta.dashboard_id);

            if (!isDuplicate) {
              dynamicDashbaordOptions.value.push(prog);
            }
  

      }
 
  
      
    });
    
    adminRoutes[0].children.push(...dynamicDashbaordOptions.value);

  
}
  
    getDynamicDashboards();
    getPublicDynamicDashboards();

 
 
 // 1. Define subprograms as a reactive reference
const subprograms = ref([
  {
    path: '/subprogrammes',
    component: Layout,
    name: 'Slum_Programmes',
    meta: {
      title: 'Projects',
      icon: 'icon-park-solid:love-and-help',
      alwaysShow: true,
      role: ['admin', 'super_admin']
    },
    children: [] // Initialize empty
  }
]);

// 2. Create a watcher to update when programmeComponentOptions changes
watch(programmeComponentOptions, (newVal) => {
  if (newVal.length > 0) {
    // Update the children array
    subprograms.value[0].children = [...newVal];
    
    // Find index if it already exists
    const existingIndex = adminRoutes.findIndex(
      route => route.path === '/subprogrammes'
    );
    
    // Update or add the route
    if (existingIndex >= 0) {
      adminRoutes[existingIndex] = subprograms.value[0];
    } else {
      adminRoutes.splice(2, 0, ...subprograms.value);
    }
  }
}, { immediate: true, deep: true });

// 3. Load data function
const loadProgrammeData = async () => {
  try {
    const data = await getProgrameComponents();
    programmeComponentOptions.value = data;
  } catch (error) {
    console.error("Error loading programme data:", error);
    programmeComponentOptions.value = [];
  }
};

// 4. Call the loader
loadProgrammeData();
 
console.log('routesX', adminRoutes)

getComponents()

export interface PermissionState {
  routers: AppRouteRecordRaw[]
  addRouters: AppRouteRecordRaw[]
  isAddRouters: boolean
  menuTabRouters: AppRouteRecordRaw[]
}

 


export const usePermissionStore = defineStore('permission', {
  state: () => ({
    routers: [],
    addRouters: [],
    isAddRouters: false,
    menuTabRouters: []
  }),
  getters: {
    getRouters() {
      return this.routers;
    },
    getAddRouters() {
      return flatMultiLevelRoutes(cloneDeep(this.addRouters));
    },
    getIsAddRouters() {
      return this.isAddRouters;
    },
    getMenuTabRouters() {
      return this.menuTabRouters;
    }
  },
  actions: {
    generateRoutes(type, locationLevel) {
      return new Promise<void>((resolve) => {
        // Function to recursively filter routes and their children based on 'type' and 'locationLevel'
        const filterRoutes = (routes) => {
          const filteredRoutes = routes.filter((route) => {
            // Check if route has 'meta' and if the 'role' and 'locationLevel' match
            if (!route.meta || (!route.meta.role && !route.meta.locationLevel)) return true;
            
            const matchesRole = route.meta.role ? route.meta.role.includes(type) : true;
            const matchesLocation = route.meta.locationLevel ? route.meta.locationLevel.includes(locationLevel) : true;
  
            return matchesRole && matchesLocation;
          });
  
          // Recursively filter the children of each route
          filteredRoutes.forEach((route) => {
            if (route.children) {
              route.children = filterRoutes(route.children);
            }
          });
  
          return filteredRoutes;
        };
  
        // Filter routes based on role and location level
        const filteredRoutes = filterRoutes(adminRoutes);
  
        // Clone the filtered routes to avoid modifying the original routes
        const newRouterMap = cloneDeep(filteredRoutes);
  
        console.log("Newly Filtered Routes: ", newRouterMap);
  
        // Check if this.addRouters is empty (first call) or if it contains already added routes
        if (this.addRouters && this.addRouters.length > 0) {
          // If addRouters already contains routes, merge the new filtered routes with the existing ones
          this.addRouters = [...this.addRouters, ...newRouterMap].filter(
            (value, index, self) => index === self.findIndex((t) => t.path === value.path)
          );
        } else {
          // If no routes have been added yet, initialize addRouters with new filtered routes
          this.addRouters = newRouterMap;
        }
  
        // Combine constantRouterMap with the updated set of added routes
        this.routers = cloneDeep(constantRouterMap).concat(this.addRouters);
  
        console.log("Combined RouterMap Routes: ", this.routers);
  
        resolve();
      });
    },
  
    setIsAddRouters(state) {
      this.isAddRouters = state;
    },
  
    setMenuTabRouters(routers) {
      this.menuTabRouters = routers;
    }
  }
  
});
export const usePermissionStoreWithOut = () => {
  return usePermissionStore(store)
}