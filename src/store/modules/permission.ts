import { defineStore } from 'pinia'
import { adminRoutes, constantRouterMap  } from '@/router'
import { flatMultiLevelRoutes } from '@/utils/routerHelper'
import { store } from '../index'
import { cloneDeep } from 'lodash-es'
import { Layout } from '@/utils/routerHelper'
import { ref } from 'vue'
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

const { wsCache } = useCache()

const appStore = useAppStore()

const userInfo = wsCache.get(appStore.getUserInfo)
 
  
 

const programmeComponentOptions = ref([])
const dynamicDashbaordOptions = ref([])

const getProgrameComponents = async () => {
  const formData = {}
  formData.limit = 100
  formData.page = 1
  formData.curUser = 1 // Id for logged in user
  formData.model = 'programme'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

 
  // - multiple filters -------------------------------------
  formData.associated_multiple_models = ['component']

  //-------------------------
  //console.log(formData)
  const res = await getRoutesList(formData)

   
  res.data.forEach(function (arrayItem) {
    const prog = {}
    prog.path = arrayItem.acronym.toLowerCase()
    //prog.component = () => import('@/views/programmes/interventions.vue') // This is a template to hold info on interventions
    prog.component =  Layout
    prog.name = toTitleCase(arrayItem.title)  

    const meta = {}
    meta.title = arrayItem.title 
    meta.hidden = false
    meta.icon = arrayItem.icon
    meta.role= ['admin', 'super_admin'] 

    prog.meta = meta

    const children_components = []
      arrayItem.components.forEach(function (compon) {
        const compont = {}
        compont.path = compon.acronym.toLowerCase()
        compont.component = () => import('@/views/programmes/interventions.vue') // This is a template to hold info on interventions
        compont.name = toTitleCase(compon.title + arrayItem.acronym)  

        // meta 
        const child_meta_d = {}
        child_meta_d.title = compon.title 
        child_meta_d.hidden = false
        child_meta_d.component_id = compon.id 
        child_meta_d.icon = compon.icon
        child_meta_d.role= ['admin', 'super_admin'] 
        child_meta_d.locationLevel= ['national' ] 

        compont.meta = child_meta_d    
        children_components.push(compont)
      })
     
      prog.children = children_components
      programmeComponentOptions.value.push(prog)

console.log("programmeComponentOptions", programmeComponentOptions.value)
  })


}
getProgrameComponents()

 
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
  
          dynamicDashbaordOptions.value.push(prog)
    
        console.log("dynamo", dynamicDashbaordOptions.value)
  

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

 
 

const subprograms = [
  {
    path: '/subprogrammes',
    component: Layout,
    //redirect: '/settings',
    name: 'Slum_Programmes',
    meta: {
      title: 'Projects',
      icon: 'icon-park-solid:love-and-help',
      alwaysShow: true,
      role: ['admin', 'super_admin'] 

    },
    children:programmeComponentOptions.value

    }
  ]
 
  //push the subprograms to 3rd in row 
    adminRoutes.splice(2, 0, ...subprograms);
 
 
 
 
console.log('routesX', adminRoutes)


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