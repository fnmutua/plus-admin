import { defineStore } from 'pinia'
import { adminRoutes, constantRouterMap  } from '@/router'
import { generateRoutesFn1, generateRoutesFn2, flatMultiLevelRoutes } from '@/utils/routerHelper'
import { store } from '../index'
import { cloneDeep } from 'lodash-es'
import { Layout, getParentLayout } from '@/utils/routerHelper'
import { getCountyListApi } from '@/api/counties'
import { ref, reactive } from 'vue'
import { getRoutesList, getSettlementListByCounty } from '@/api/settlements'


function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}


 

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

        compont.meta = child_meta_d    
        children_components.push(compont)
      })
     
      prog.children = children_components
      programmeComponentOptions.value.push(prog)

console.log("programmeComponentOptions", programmeComponentOptions.value)
  })


}
getProgrameComponents()


const activity = {
  path: 'activity',
   component: () => import('@/views/Indicators/Activity.vue'),
  name: 'ProgrammeActivity',
  meta: {
    title: 'Activities',
    icon:'icon-park-outline:activity-source',
    
  }
}

programmeComponentOptions.value.push(activity)


 

const getDynamicDashboards = async () => {
  const formData = {}
  formData.limit = 100
  formData.page = 1
  formData.curUser = 1 // Id for logged in user
  formData.model = 'dashboard'
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = ''
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
      if (arrayItem.type==='intervention') {
        prog.component = () => import('@/views/Dashboard/Dynamic.vue') // This is a template to hold info on interventions
        prog.path = 'intervention_' + arrayItem.title.toLowerCase()
        prog.name = arrayItem.title 
  
      }
      else {
        prog.component = () => import('@/views/Dashboard/DynamicState.vue') // This is a template to hold info on interventions
        prog.path = 'status_' + arrayItem.title.toLowerCase()
        prog.name =  arrayItem.title 
      }
      
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


    
  });
  


}
await getDynamicDashboards()

  
const subprograms = [
  {
    path: '/subprogrammes',
    component: Layout,
    //redirect: '/settings',
    name: 'Slum_Programmes',
    meta: {
      title: 'Programmes',
      icon: 'icon-park-solid:love-and-help',
      alwaysShow: true,
      role: ['admin', 'super_admin'] 

    },
    children:programmeComponentOptions.value

    }
  ]
 
  //push the subprograms to 3rd in row 
    adminRoutes.splice(2, 0, ...subprograms);

// Push the 'dynamicDashbaordOptions' to the 'children' of the first route in 'adminRoutes'
adminRoutes[0].children.push(...dynamicDashbaordOptions.value);

 
 
 
console.log('routesX', adminRoutes)


export interface PermissionState {
  routers: AppRouteRecordRaw[]
  addRouters: AppRouteRecordRaw[]
  isAddRouters: boolean
  menuTabRouters: AppRouteRecordRaw[]
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    routers: [],
    addRouters: [],
    isAddRouters: false,
    menuTabRouters: []
  }),
  getters: {
    getRouters(): AppRouteRecordRaw[] {
      return this.routers
    },
    getAddRouters(): AppRouteRecordRaw[] {
      return flatMultiLevelRoutes(cloneDeep(this.addRouters))
    },
    getIsAddRouters(): boolean {
      return this.isAddRouters
    },
    getMenuTabRouters(): AppRouteRecordRaw[] {
      return this.menuTabRouters
    }
  },
  actions: {
    generateRoutes(
      type: 'admin' | 'county_admin' | 'county_staff' | 'county_mon' | 'staff' | 'public' | 'super_admin',
      routers?: AppCustomRouteRecordRaw[] | string[]
    ): Promise<unknown> {
      return new Promise<void>((resolve) => {
        // Function to recursively filter routes and their children based on 'type'
        const filterRoutes = (routes) => {
        
          const filteredRoutes = routes.filter((route) => {
            console.log('route---->', type)
            if (!route.meta || !route.meta.role) return true; // Include routes without 'meta' or 'role' property
            return route.meta.role.includes(type);
          });
  
          // Recursively filter the children of each route
          filteredRoutes.forEach((route) => {
            if (route.children) {
              route.children = filterRoutes(route.children);
            }
          });
  
          return filteredRoutes;
        };
  
        const filteredRoutes = filterRoutes(adminRoutes);
  
        // Clone the filtered routes to avoid modifying the original routes
        const routerMap: AppRouteRecordRaw[] = cloneDeep(filteredRoutes);
  
        // Further processing if needed...
        // Add additional routes, modify route properties, etc.
  
        this.addRouters = routerMap;     
  

     console.log('routerMap2',routerMap)



        
        
        // merge the programmes to the outer root. Will be reconsidered wheer to
        this.routers = cloneDeep(constantRouterMap).concat(this.addRouters)
 
    
        resolve()
      })
    },
    setIsAddRouters(state: boolean): void {
      this.isAddRouters = state
    },
    setMenuTabRouters(routers: AppRouteRecordRaw[]): void {
      this.menuTabRouters = routers
    }
  }
})

export const usePermissionStoreWithOut = () => {
  return usePermissionStore(store)
}