import { defineStore } from 'pinia'
import { store } from '../index'
import { useCache } from '@/hooks/web/useCache'
import { appModules } from '@/config/app'
import type { AppState, LayoutType, ThemeTypes } from '@/config/app'
import { setCssVar, humpToUnderline } from '@/utils'
import { ElMessage } from 'element-plus'
import { useCssVar } from '@vueuse/core'
const { wsCache } = useCache()

export const useAppStore = defineStore({
  id: 'app',
  //state: (): AppState => appModules,

  state: (): AppState => ({
    ...appModules,
 
  }),

  persist: {
    enabled: true
  },
  getters: {
    getBreadcrumb(): boolean {
      return this.breadcrumb
    },
    getBreadcrumbIcon(): boolean {
      return this.breadcrumbIcon
    },
    getCollapse(): boolean {
      return this.collapse
    },
    getUniqueOpened(): boolean {
      return this.uniqueOpened
    },
    getHamburger(): boolean {
      return this.hamburger
    },
    getScreenfull(): boolean {
      return this.screenfull
    },
    getSize(): boolean {
      return this.size
    },
    getLocale(): boolean {
      return this.locale
    },
    getTagsView(): boolean {
      return this.tagsView
    },
    getTagsViewIcon(): boolean {
      return this.tagsViewIcon
    },
    getLogo(): boolean {
      return this.logo
    },
    getFixedHeader(): boolean {
      return this.fixedHeader
    },
    getGreyMode(): boolean {
      return this.greyMode
    },
    getDynamicRouter(): boolean {
      return this.dynamicRouter
    },
    getPageLoading(): boolean {
      return this.pageLoading
    },
    getLayout(): LayoutType {
      return this.layout
    },
    getTitle(): string {
      return this.title
    },
    getUserInfo(): string {
      return this.userInfo
    },
    
    getIsDark(): boolean {
      return this.isDark
    },
    getCurrentSize(): ElememtPlusSize {
      return this.currentSize
    },
    getSizeMap(): ElememtPlusSize[] {
      return this.sizeMap
    },
    getMobile(): boolean {
      return this.mobile
    },
    getTheme(): ThemeTypes {
      return this.theme
    },
    getFooter(): boolean {
      return this.footer
    },
    getAdmin(): boolean {
      return this.isAdmin
    },
    getStaff(): boolean {
      return this.isStaff
    },

    getAdminButtons(): boolean {
      return this.showAdminButtons
    },

    getEditButtons(): boolean {
      return this.showEditButtons
    }



  },
  actions: {
    setBreadcrumb(breadcrumb: boolean) {
      this.breadcrumb = breadcrumb
    },
    setBreadcrumbIcon(breadcrumbIcon: boolean) {
      this.breadcrumbIcon = breadcrumbIcon
    },
    setCollapse(collapse: boolean) {
      this.collapse = collapse
    },
    setUniqueOpened(uniqueOpened: boolean) {
      this.uniqueOpened = uniqueOpened
    },
    setHamburger(hamburger: boolean) {
      this.hamburger = hamburger
    },
    setScreenfull(screenfull: boolean) {
      this.screenfull = screenfull
    },
    setSize(size: boolean) {
      this.size = size
    },
    setLocale(locale: boolean) {
      this.locale = locale
    },
    setTagsView(tagsView: boolean) {
      this.tagsView = tagsView
    },
    setTagsViewIcon(tagsViewIcon: boolean) {
      this.tagsViewIcon = tagsViewIcon
    },
    setLogo(logo: boolean) {
      this.logo = logo
    },
    setFixedHeader(fixedHeader: boolean) {
      this.fixedHeader = fixedHeader
    },
    setGreyMode(greyMode: boolean) {
      this.greyMode = greyMode
    },
    setDynamicRouter(dynamicRouter: boolean) {
      wsCache.set('dynamicRouter', dynamicRouter)
      this.dynamicRouter = dynamicRouter
    },
    setPageLoading(pageLoading: boolean) {
      this.pageLoading = pageLoading
    },
    setLayout(layout: LayoutType) {
      if (this.mobile && layout !== 'classic') {
        ElMessage.warning('移动端模式下不支持切换其他布局')
        return
      }
      this.layout = layout
      wsCache.set('layout', this.layout)
    },
    setTitle(title: string) {
      this.title = title
    },
    setIsDark(isDark: boolean) {

 
      console.log("Setting Dark mode",isDark ) 

      this.isDark = isDark
       


      

  // Apply dark mode settings
  if (this.isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');

     // Store the original light mode values temporarily
        const originalLightColors = {
          '--left-menu-bg-color': getComputedStyle(document.documentElement).getPropertyValue('--left-menu-bg-color'),
          '--left-menu-bg-light-color': getComputedStyle(document.documentElement).getPropertyValue('--left-menu-bg-light-color'),
          '--left-menu-text-color': getComputedStyle(document.documentElement).getPropertyValue('--left-menu-text-color'),
          '--left-menu-text-active-color': getComputedStyle(document.documentElement).getPropertyValue('--left-menu-text-active-color'),
        };

      // Store the dark mode state in a cache (e.g., localStorage)
      
        localStorage.setItem('originalLightColors', JSON.stringify(originalLightColors));

        // Force set the left menu background color for dark mode
        document.documentElement.style.setProperty('--left-menu-bg-color', "#080808");
        document.documentElement.style.setProperty('--left-menu-bg-light-color', "#080808");
        document.documentElement.style.setProperty('--left-menu-text-color', "#bfcbd9");
        document.documentElement.style.setProperty('--left-menu-text-active-color', "#fff");
  } 
  else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');

    const savedColors = JSON.parse(localStorage.getItem('originalLightColors'));
    console.log(savedColors)

    // Restore the original light mode colors
    // document.documentElement.style.setProperty('--left-menu-bg-color', originalLightColors['--left-menu-bg-color']);
    // document.documentElement.style.setProperty('--left-menu-bg-light-color', originalLightColors['--left-menu-bg-light-color']);
    // document.documentElement.style.setProperty('--left-menu-text-color', originalLightColors['--left-menu-text-color']);
    // document.documentElement.style.setProperty('--left-menu-text-active-color', originalLightColors['--left-menu-text-active-color']);


       // Apply the saved colors to the root element
       if(savedColors){
        Object.keys(savedColors).forEach((key) => {
          document.documentElement.style.setProperty(key, savedColors[key]);
        });
       }
     
  


  }

 
            
      wsCache.set('isDark', this.isDark)
    },
    setCurrentSize(currentSize: ElememtPlusSize) {
      this.currentSize = currentSize
      wsCache.set('currentSize', this.currentSize)
    },
    setMobile(mobile: boolean) {
      this.mobile = mobile
    },
    setTheme(theme: ThemeTypes) {
      this.theme = Object.assign(this.theme, theme)
      wsCache.set('theme', this.theme)
    },
    setCssVarTheme() {
      for (const key in this.theme) {
        setCssVar(`--${humpToUnderline(key)}`, this.theme[key])
      }
    },
    setFooter(footer: boolean) {
      this.footer = footer
    },
 
    setStaff(isStaff: boolean) {
      this.isStaff = isStaff
    },
    setAdmin(isAdmin: boolean) {
      this.isAdmin = isAdmin
    },

    setAdminButtons(showAdminButtons: boolean) {
      this.showAdminButtons = showAdminButtons
    },

    setEditButtons(showEditButtons: boolean) {
      this.showEditButtons = showEditButtons
    },
 
     

  }
})

export const useAppStoreWithOut = () => {
  return useAppStore(store)
}
