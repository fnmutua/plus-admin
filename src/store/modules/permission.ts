import { defineStore } from 'pinia'
import { asyncRouterMap, adminRoutes, constantRouterMap,publicRoutes,countyAdminRoutes,staffRoutes, countyUserRoutes} from '@/router'
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

   
  res.data.forEach(function (arrayItem) {
    const prog = {}
    if (arrayItem.type==='intervention') {
      prog.component = () => import('@/views/Dashboard/Dynamic.vue') // This is a template to hold info on interventions
      prog.path = 'intervention_' + arrayItem.title.toLowerCase()

    }
    else {
      prog.component = () => import('@/views/Dashboard/DynamicState.vue') // This is a template to hold info on interventions
      prog.path = 'status_' + arrayItem.title.toLowerCase()

    }
    
  //  prog.component =  Layout
    prog.name = 'Dynamic'+toTitleCase(arrayItem.title)  

    const meta = {}
    meta.title = arrayItem.title 
    meta.hidden = false
    meta.icon = arrayItem.icon
    meta.dashboard_id = arrayItem.id
    prog.meta = meta
 
      dynamicDashbaordOptions.value.push(prog)

    console.log("dynamo", dynamicDashbaordOptions.value)
  })


}
 await getDynamicDashboards()



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
      type: 'admin' | 'county_admin' |'county_user'| 'staff'|'public' |'super_admin',
      routers?: AppCustomRouteRecordRaw[] | string[]
    ): Promise<unknown> {
      return new Promise<void>((resolve) => {
        let routerMap: AppRouteRecordRaw[] = []
        const dynamicMap: AppRouteRecordRaw[] = []

        console.log('Tyoe---->--', type)
        console.log('0001')

        if (type === 'admin' || type === 'super_admin') {
          console.log("generating routes.....admin")
          // 模拟后端过滤菜单
         // routerMap = generateRoutesFn2(routers as AppCustomRouteRecordRaw[])
          
       routerMap = cloneDeep(adminRoutes)

    
        //   routerMap= cloneDeep(adminRoutes).concat(routerMap)

       
          console.log('routerMap--',routerMap)
        } else if (type === 'county_admin') {
          console.log("generating routes.....county_admin")
         //routerMap = generateRoutesFn1(cloneDeep(asyncRouterMap), routers as string[])  // felix to edit
         // routerMap = generateRoutesFn2(routers as AppCustomRouteRecordRaw[])
          routerMap = cloneDeep(countyAdminRoutes)
          console.log('routerMap-county_admin-',routerMap)
        }
        else if (type === 'county_user') {
          console.log("generating routes.....county_user")
          routerMap = cloneDeep(countyUserRoutes)
          console.log('routerMap-county_user-',routerMap)
        }
        else if (type === 'staff') {
          console.log("generating routes.....staffRoutes")
          routerMap = cloneDeep(staffRoutes)
          console.log('routerMap-staffRoutes-',routerMap)

        }       
        
        else {
          // 直接读取静态路由表
          //routerMap = cloneDeep(asyncRouterMap)
          console.log('Public Routes......')
          routerMap = cloneDeep(publicRoutes)

        }
        // 动态路由，404一定要放到最后面
        // this.addRouters = routerMap.concat([
          // {
          //   path: '/:path(.*)*',
          //   redirect: '/404',
          //   name: '404Page',
          //   meta: {
          //     hidden: false,
          //     breadcrumb: false
          //   }
          // },
        
        // ])

 
        this.addRouters = routerMap          
  
        
        const subprograms = [
        

        {
          path: '/subprogrammes',
          component: Layout,
          //redirect: '/settings',
          name: 'Slum_Programmes',
          meta: {
            title: 'Programmes',
            icon: 'icon-park-solid:love-and-help',
            alwaysShow: true
          },
          children:programmeComponentOptions.value

          }
        ]
 
          this.addRouters.splice(2, 0, ...subprograms );  // Push the routes to position no.4 after settlements

        // Add the dynamic Dashboards......
     this.addRouters[0].children.push(...dynamicDashbaordOptions.value);

    // this.addRouters.splice(0, 0, ...dashbaodAdd );  // Push the routes to position no.4 after settlements

     console.log('routerMap',routerMap)



        
        
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