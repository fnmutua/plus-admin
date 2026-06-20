import { defineStore } from 'pinia'
import { adminRoutes, constantRouterMap  } from '@/router'
import { flatMultiLevelRoutes } from '@/utils/routerHelper'
import { store } from '../index'
import { cloneDeep } from 'lodash-es'
import { Layout } from '@/utils/routerHelper'
import { ref } from 'vue'
import { getRoutesList } from '@/api/settlements'
// import { useAppStore} from '@/store/modules/app' // Removed unused import
import { useCache } from '@/hooks/web/useCache'

// Define proper types for the API responses
interface RouteRequestData {
  limit: number
  page: number
  curUser: number
  model: string
  searchField: string
  searchKeyword: string
  associated_multiple_models?: string[]
  filters?: string[]
  filterValues?: any[][]
}

interface RouteItem {
  id: number
  title: string
  acronym: string
  icon?: string
  parentId?: number
  programme_id?: number
  children?: RouteItem[]
}

// interface RouteResponse { // Removed unused interface
//   data: RouteItem[]
//   message: string
//   code: string
//   results: RouteItem[]
// }

interface ComponentMeta {
  title: string
  hidden: boolean
  component_id: number
  icon: string
  role: string[]
  locationLevel: string[]
  programme_id: number
}

interface RouteComponent {
  id: number
  title: string
  acronym: string
  icon?: string
  programme_id: number
  meta: ComponentMeta
  name: string
  path: string
  component: any
}

// interface DashboardItem { // Removed unused interface
//   id: number
//   title: string
//   icon?: string
//   main_dashboard?: boolean
//   public?: boolean
//   createdBy?: number
// }

interface DashboardComponent {
  component: any
  path: string
  name: string
  meta: {
    title: string
    hidden: boolean
    icon?: string
    dashboard_id: number
  }
}


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
// Don't read userInfo at module load - it may not be available yet
// const userInfo = wsCache.get(appStore.getUserInfo)




 

const programmeComponentOptions = ref<RouteItem[]>([])
const dynamicDashbaordOptions = ref<DashboardComponent[]>([])
const components = ref<RouteComponent[]>([])
const dashboardsLoaded = ref(false)
const routesLoadedAt = ref(0)
const ROUTES_TTL_MS = 5 * 60 * 1000 // 5 minutes

// Load dashboards immediately and cache them
const loadDashboardsImmediately = async () => {
  if (dashboardsLoaded.value) return; // Already loaded
  
  try {
    console.log('Loading dashboards immediately...');
    
    // Clear existing dashboards to prevent duplicates
    dynamicDashbaordOptions.value = [];
    
    // Clear existing dashboard routes to prevent duplicates
    if (adminRoutes[0]?.children) {
      adminRoutes[0].children = adminRoutes[0].children.filter(route => 
        !route.path?.startsWith('status_')
      );
    }
    
    await Promise.all([
      getDynamicDashboards(),
      getPublicDynamicDashboards()
    ]);
    
    // Add dashboards to routes only once after all are loaded
    adminRoutes[0]?.children?.push(...dynamicDashbaordOptions.value);
    
    dashboardsLoaded.value = true;
    console.log('Dashboards loaded immediately');
  } catch (error) {
    console.error('Error loading dashboards immediately:', error);
  }
};

// Dashboard loading will be started after functions are declared

const getProgrameComponents = async (): Promise<RouteItem[]> => {
  const formData: RouteRequestData = {
    limit: 100,
    page: 1,
    curUser: 1,
    model: 'programme',
    searchField: 'title',
    searchKeyword: '',
    associated_multiple_models: ['component']
  };

  try {
    const res = await getRoutesList(formData as any) as any;

    if (!res?.data || !Array.isArray(res.data)) {
      console.error('Invalid data structure received:', res?.data);
      return [];
    }

    console.log('programme routes ', res.data);

    // Step 1: Create a map of items by id
    const itemMap = new Map();
    res.data.forEach(item => {
      item.children = []; // initialize children array
      itemMap.set(item.id, item);
    });

    // Step 2: Nest items by parentId
    const rootItems: RouteItem[] = [];
    res.data.forEach(item => {
      if (item.parentId && itemMap.has(Number(item.parentId))) {
        const parent = itemMap.get(Number(item.parentId));
        if (parent) {
        parent.children.push(item);
        }
      } else {
        rootItems.push(item);
      }
    });

    // Step 3: Recursively transform into route format
    const buildHierarchy = (items: RouteItem[], parentPath = ''): RouteItem[] => {
      return items.map(item => {
        const fullPath = parentPath
          ? `${parentPath}/${item.acronym.toLowerCase()}`
          : item.acronym.toLowerCase();

        return {
          ...item,
          path: fullPath.split('/').pop() || '',
          name: `programme_${item.id}`,
          meta: {
            title: item.title,
            hidden: false,
            icon: item.icon,
            programme_id: item.id,
            role: ['admin', 'super_admin']
          },
          children: buildHierarchy(item.children || [], fullPath)
        };
      });
    };

    return buildHierarchy(rootItems);
  } catch (error) {
    console.error('Error fetching program components:', error);
    throw error;
  }
};

// Add retry mechanism and better error handling
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
};

const loadProgrammeComponents = async () => {
  try {
    const result = await retryWithBackoff(() => getProgrameComponents());
    programmeComponentOptions.value = result;
    console.log("Final programmeComponentOptions", programmeComponentOptions.value);
  } catch (error) {
    console.error("Failed to load programme components after retries:", error);
    programmeComponentOptions.value = [];
  }
};

// Isolated wrapper so a transient failure of the component API doesn't reject
// Promise.all and leave the /subprogrammes branch unregistered (see initializeRoutes).
const loadComponents = async () => {
  try {
    await retryWithBackoff(() => getComponents());
  } catch (error) {
    console.error("Failed to load components after retries:", error);
  }
};

// Idempotently insert the /subprogrammes parent route into adminRoutes.
// Done unconditionally so deep links like /subprogrammes/<programme>/<component>
// at least resolve to the parent layout (or fall through to the wildcard 404)
// rather than producing a blank <router-view/> when the dynamic API fails.
const ensureSubprogrammesRoute = () => {
  subprograms.value[0].children = (programmeComponentOptions.value as any) || []
  const existingIndex = adminRoutes.findIndex(route => route.path === '/subprogrammes')
  if (existingIndex >= 0) {
    adminRoutes[existingIndex] = subprograms.value[0]
  } else {
    adminRoutes.splice(2, 0, ...subprograms.value)
  }
}

const getComponents = async (): Promise<void> => {
  const formData: RouteRequestData = {
    limit: 100,
    page: 1,
    curUser: 1,
    model: 'component',
    searchField: 'title',
    searchKeyword: '',
    associated_multiple_models: []
  };

  try {
    components.value = []; // Clear before re-populating to prevent duplicates on reload
    const res = await getRoutesList(formData as any) as any;
    console.log('Components routes ', res.data);




    if (res.data && Array.isArray(res.data)) {
     

      res.data.forEach((child_component: any) => {
        const child_meta_d: ComponentMeta = {
          title: child_component.title,
          hidden: false,
          component_id: child_component.id,
          icon: child_component.icon || 'default-icon',
          role: ['admin', 'super_admin'],
          locationLevel: ['national'],
          programme_id: child_component.programme_id
        };

        const routeComponent: RouteComponent = {
          id: child_component.id,
          title: child_component.title,
          acronym: child_component.acronym,
          icon: child_component.icon,
          programme_id: child_component.programme_id,
          meta: child_meta_d,
          name: child_component.title,
          path: child_component.acronym.toLowerCase(),
          component: () => import('@/views/programmes/interventions.vue')
        };

        components.value.push(routeComponent);

       
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
                      name: `component_${component.id}`,
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
      return; // Return void if invalid data
    }



  } catch (error) {
    console.error('Error fetching components:', error);
    throw error; // Re-throw or return empty array
  }
};


 

 // Wrap your code in an async function
 
  const getDynamicDashboards = async (): Promise<void> => {
    // Get userInfo dynamically when called, not at module load
    const currentUserInfo = wsCache.get(appStore.getUserInfo)
    if (!currentUserInfo || !currentUserInfo.id) {
      console.warn('Cannot load dynamic dashboards: user not logged in');
      return;
    }

    const PRIVILEGED_ROLES = ['root_admin', 'super_admin']
    const userRoleNames: string[] = (currentUserInfo.roles || []).map((r: any) => r.name)
    const isPrivileged = userRoleNames.some(r => PRIVILEGED_ROLES.includes(r))

    // Privileged users see all dashboards; others only see their own
    const formData: RouteRequestData = isPrivileged
      ? {
          limit: 100,
          page: 1,
          curUser: 1,
          model: 'dashboard',
          searchField: 'title',
          searchKeyword: '',
          filters: [],
          filterValues: [],
          associated_multiple_models: []
        }
      : {
          limit: 100,
          page: 1,
          curUser: 1,
          model: 'dashboard',
          searchField: 'title',
          searchKeyword: '',
          filters: ['createdBy'],
          filterValues: [[currentUserInfo.id]],
          associated_multiple_models: []
        };
  
    //-------------------------
    //console.log(formData)
    const res = await getRoutesList(formData as any) as any;
  //  console.log("dynamo",res)
  
     
    res.data.forEach((arrayItem: any) => {
      if (!arrayItem.main_dashboard) { //Include only the other dashbaprds. The main dashbaord has been loaded elsewher)
        const prog: DashboardComponent = {
          component: () => import('@/views/Dashboard/DynamicState.vue'), // This is a template to hold info on interventions
          path: 'status_' + arrayItem.title.toLowerCase(),
          name: arrayItem.title,
          meta: {
            title: arrayItem.title,
            hidden: false,
            icon: arrayItem.icon,
            dashboard_id: arrayItem.id
          }
        };
  
        // Check for duplicates before adding
        const isDuplicate = dynamicDashbaordOptions.value.some(option => option.meta.dashboard_id === prog.meta.dashboard_id);
        if (!isDuplicate) {
          dynamicDashbaordOptions.value.push(prog);
        }
    
       // console.log("dynamo", dynamicDashbaordOptions.value)
  

      }
     // adminRoutes[0].children.push(...dynamicDashbaordOptions.value);

  
      
    });
    
   // adminRoutes[0].children.push(...dynamicDashbaordOptions.value);

  
  }

  const getPublicDynamicDashboards = async (): Promise<void> => {
    const formData: RouteRequestData = {
      limit: 100,
      page: 1,
      curUser: 1, // Id for logged in user
      model: 'dashboard',
      searchField: 'title',
      searchKeyword: '',
      filters: ['public'],
      filterValues: [[true]],
      associated_multiple_models: []
    };
  
    //-------------------------
    //console.log(formData)
    const res = await getRoutesList(formData as any) as any;
    console.log("dynamo",res)
  
     
    res.data.forEach((arrayItem: any) => {
      console.log('arrayItem',arrayItem)
  
      if (!arrayItem.main_dashboard) { //Include only the other dashbaprds. The main dashbaord has been loaded elsewher)
        const prog: DashboardComponent = {
          component: () => import('@/views/Dashboard/DynamicState.vue'), // This is a template to hold info on interventions
          path: 'status_' + arrayItem.title.toLowerCase(),
          name: arrayItem.title,
          meta: {
            title: arrayItem.title,
            hidden: false,
            icon: arrayItem.icon,
            dashboard_id: arrayItem.id
          }
        };
  
        const isDuplicate = dynamicDashbaordOptions.value.some(option => option.meta.dashboard_id === prog.meta.dashboard_id);

            if (!isDuplicate) {
              dynamicDashbaordOptions.value.push(prog);
            }
  

      }
 
  
      
    });
    
    // Routes will be added in loadDashboardsImmediately() to prevent duplicates

  
}

// Initialize loading with proper sequencing
const initializeRoutes = async () => {
  try {
    const currentUserInfo = wsCache.get(appStore.getUserInfo)
    if (!currentUserInfo) {
      console.log('User not logged in, skipping route initialization');
      return;
    }

    // Always register the /subprogrammes parent first, regardless of API outcome.
    // This guarantees deep links route into a known layout instead of producing
    // a blank <router-view/> when the programme/component API is flaky.
    ensureSubprogrammesRoute();

    if (!dashboardsLoaded.value) {
      await loadDashboardsImmediately();
    }

    // allSettled so a transient failure of one loader doesn't poison the other.
    // Both loaders catch their own errors internally and never reject.
    await Promise.allSettled([loadProgrammeComponents(), loadComponents()]);

    // Re-attach children now that programmes/components have loaded (or stayed empty).
    ensureSubprogrammesRoute();

    console.log('All routes loaded successfully');
  } catch (error) {
    console.error('Error initializing routes:', error);
  }
};

// Don't start initialization immediately - wait for login
// initializeRoutes();
 
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
    children: [

      
    ] // Initialize empty
  }
]);

// adminRoutes is updated synchronously inside initializeRoutes() after data loads.

// Remove old calls - now handled by initializeRoutes()

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
      return this.routers;
    },
    getAddRouters(): AppRouteRecordRaw[] {
      return flatMultiLevelRoutes(cloneDeep(this.addRouters));
    },
    getIsAddRouters(): boolean {
      return this.isAddRouters;
    },
    getMenuTabRouters(): AppRouteRecordRaw[] {
      return this.menuTabRouters;
    },
    getDashboardsLoaded(): boolean {
      return dashboardsLoaded.value;
    },
    getDynamicDashboards(): DashboardComponent[] {
      return dynamicDashbaordOptions.value;
    }
  },
  actions: {
    async generateRoutes(_type: string, _locationLevel: string, userPermissions: string[] = []) {
      return new Promise<void>(async (resolve) => {
        // Initialize dynamic routes first if not already loaded
        const hasRoutes = dashboardsLoaded.value && programmeComponentOptions.value.length > 0
        const age = Date.now() - routesLoadedAt.value

        if (!hasRoutes) {
          // First load — must await
          console.log('Initializing dynamic routes before generating filtered routes...');
          await initializeRoutes();
          routesLoadedAt.value = Date.now()
        } else if (age > ROUTES_TTL_MS) {
          // Stale: serve cached routes now, revalidate in background
          console.log('Routes stale, revalidating in background...');
          initializeRoutes().then(() => { routesLoadedAt.value = Date.now() })
        }

        // Filter routes by granular permissions only. Routes with no permissions declared are visible to all authenticated users.
        // Operate on a deep clone so the module-level adminRoutes is never mutated between calls.
        const filterRoutes = (routes) => {
          return routes
            .filter((route) => {
              if (!route.meta?.permissions?.length) return true;
              return route.meta.permissions.some((p: string) => userPermissions.includes(p));
            })
            .map((route) => {
              if (route.children?.length) {
                return { ...route, children: filterRoutes(route.children) };
              }
              return route;
            });
        };
        const filteredRoutes = filterRoutes(cloneDeep(adminRoutes));
        // Clone the filtered routes to avoid modifying the original routes
        const newRouterMap = cloneDeep(filteredRoutes);
        // Always replace — adminRoutes is the source of truth and was freshly cloned above.
        // Merging kept the first (stale) entry when called more than once, hiding updated children.
        this.addRouters = newRouterMap;
        // Combine constantRouterMap with the updated set of added routes
        this.routers = cloneDeep(constantRouterMap).concat(this.addRouters);
        resolve();
      });
    },
  
    setIsAddRouters(state: boolean) {
      this.isAddRouters = state;
    },
  
    setMenuTabRouters(routers: AppRouteRecordRaw[]) {
      this.menuTabRouters = routers;
    },
    
    // Add method to manually refresh routes
    async refreshRoutes() {
      try {
        console.log('Manually refreshing routes...');
        // Reset loaded flags to force reload
        dashboardsLoaded.value = false;
        programmeComponentOptions.value = [];
        components.value = [];
        dynamicDashbaordOptions.value = [];
        routesLoadedAt.value = 0;
        await initializeRoutes();
        routesLoadedAt.value = Date.now();
        console.log('Routes refreshed successfully');
      } catch (error) {
        console.error('Error refreshing routes:', error);
      }
    },
    
    // Add method to ensure dashboards are loaded
    async ensureDashboardsLoaded() {
      if (!dashboardsLoaded.value) {
        await loadDashboardsImmediately();
      }
      return dashboardsLoaded.value;
    },
    
    // Clear all dynamic routes and reset to initial state
    clearDynamicRoutes() {
      console.log('Clearing all dynamic routes...');
      
      // Clear all dynamic route data
      programmeComponentOptions.value = [];
      dynamicDashbaordOptions.value = [];
      components.value = [];
      dashboardsLoaded.value = false;
      
      // Clear subprograms
      subprograms.value[0].children = [];
      
      // Remove dynamic dashboards from adminRoutes[0].children (Dashboard route)
      if (adminRoutes[0]?.children) {
        adminRoutes[0].children = adminRoutes[0].children.filter(route => 
          !route.path?.startsWith('status_')
        );
      }
      
      // Remove subprogrammes route from adminRoutes
      const subprogrammesIndex = adminRoutes.findIndex(
        route => route.path === '/subprogrammes'
      );
      if (subprogrammesIndex >= 0) {
        adminRoutes.splice(subprogrammesIndex, 1);
      }
      
      // Clear store state
      this.addRouters = [];
      this.routers = [];
      this.menuTabRouters = [];
      this.isAddRouters = false;
      
      console.log('All dynamic routes cleared');
    }
  }
  
});
export const usePermissionStoreWithOut = () => {
  return usePermissionStore(store)
}