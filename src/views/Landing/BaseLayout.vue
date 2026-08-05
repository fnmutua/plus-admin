<template>
  <div
    class="gok-portal base-layout"
    :class="{ 'dark-mode': isDark, 'gok-portal--compact-header': isScrolled }"
  >
    <a class="gok-skip" href="#main-content">Skip to main content</a>

    <header class="gok-header" :class="{ 'gok-header--compact': isScrolled }" role="banner">
      <div class="gok-header__inner">
        <router-link to="/landing" class="gok-header__brand" aria-label="KeSMIS home">
          <img
            :src="headerLogoSrc"
            alt="KeSMIS"
            class="gok-header__logo"
            width="340"
            height="68"
          />
        </router-link>

        <nav v-if="!isCompactScreen" class="gok-header__nav" aria-label="Main">
          <ul>
            <li v-for="item in MAIN_NAV" :key="item.id">
              <button
                type="button"
                class="gok-header__nav-link"
                :class="{ 'is-active': activeIndex === item.id }"
                @click="onNav(item)"
              >
                {{ item.label }}
              </button>
            </li>
          </ul>
        </nav>

        <div class="gok-header__actions">
          <div v-if="!isCompactScreen" class="gok-header__search-wrap">
            <form
              class="gok-header__search"
              role="search"
              @submit.prevent="onHeaderSearch"
            >
              <label class="sr-only" for="gok-header-search">Search site</label>
              <input
                id="gok-header-search"
                v-model="searchQuery"
                type="search"
                placeholder="Search site…"
                autocomplete="off"
                aria-autocomplete="list"
                aria-controls="gok-header-search-results"
                :aria-expanded="searchOpen && searchHits.length > 0"
                @focus="searchOpen = true"
                @input="searchOpen = true"
                @keydown.escape="closeSearch"
              />
            </form>
            <ul
              v-if="searchOpen && searchQuery.trim() && searchHits.length"
              id="gok-header-search-results"
              class="gok-header__search-results"
              role="listbox"
            >
              <li v-for="hit in searchHits" :key="hit.id" role="option">
                <button
                  type="button"
                  @mousedown.prevent="goSearchHit(hit)"
                >
                  <span class="gok-header__search-kind">{{ hit.kind }}</span>
                  <span class="gok-header__search-title">{{ hit.title }}</span>
                  <span class="gok-header__search-blurb">{{ hit.blurb }}</span>
                </button>
              </li>
            </ul>
            <p
              v-else-if="searchOpen && searchQuery.trim().length >= 2 && !searchHits.length"
              class="gok-header__search-empty"
              role="status"
            >
              No matching pages or services
            </p>
          </div>

          <button
            type="button"
            class="gok-header__theme"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleDark"
          >
            <Icon :icon="isDark ? 'carbon:moon' : 'carbon:sun'" width="18" height="18" />
          </button>

          <button
            type="button"
            class="gok-header__portal"
            :class="{ 'gok-header__portal--icon': isCompactScreen }"
            :aria-label="isLoggedIn ? 'Sign out' : 'Portal login'"
            @click="handleLoginOrLogout"
          >
            <Icon
              v-if="isCompactScreen"
              :icon="isLoggedIn ? 'mdi:logout' : 'mdi:login'"
              width="20"
              height="20"
            />
            <span v-else>{{ isLoggedIn ? 'Sign out' : 'Portal login' }}</span>
          </button>

          <button
            v-if="isCompactScreen"
            type="button"
            class="gok-header__menu-btn"
            :aria-expanded="menuOpen"
            aria-controls="gok-mobile-nav"
            aria-label="Open menu"
            @click="menuOpen = !menuOpen"
          >
            <Icon :icon="menuOpen ? 'mdi:close' : 'mdi:menu'" width="22" height="22" />
          </button>
        </div>
      </div>

      <div
        v-if="isCompactScreen && menuOpen"
        id="gok-mobile-nav"
        class="gok-mobile-nav"
        role="dialog"
        aria-label="Mobile navigation"
      >
        <ul>
          <li v-for="item in MAIN_NAV" :key="item.id">
            <button type="button" @click="onNav(item)">{{ item.label }}</button>
          </li>
          <li>
            <button type="button" @click="handleLoginOrLogout">
              {{ isLoggedIn ? 'Sign out' : 'Portal login' }}
            </button>
          </li>
        </ul>
      </div>
    </header>

    <main id="main-content" class="gok-main">
      <slot></slot>
    </main>

    <GovernmentFooter @section="scrollToSection" @portal="onFooterPortal" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useDictStoreWithOut } from '@/store/modules/dict'
import { useLocaleStoreWithOut } from '@/store/modules/locale'
import { loginOutApi } from '@/api/login'
import GovernmentFooter from './components/GovernmentFooter.vue'
import { INSTITUTION, MAIN_NAV, type NavItem } from './config/landing.config'
import { goToPortalPath } from './utils/portalNav'
import { searchLandingContent, type SiteSearchHit } from './utils/siteSearch'
import {
  setPendingLandingSection,
  scrollLandingSectionWhenReady,
} from './utils/landingScroll'
import './styles/gok-portal.css'

onMounted(() => {
  document.body.classList.add('landing-page-active')
  document.documentElement.classList.add('landing-page-active')
  document.getElementById('app')?.classList.add('landing-page-active')
})

onBeforeUnmount(() => {
  document.body.classList.remove('landing-page-active')
  document.documentElement.classList.remove('landing-page-active')
  document.getElementById('app')?.classList.remove('landing-page-active')
})

const router = useRouter()
const route = useRoute()
const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const dictStore = useDictStoreWithOut()
const localeStore = useLocaleStoreWithOut()

const COMPACT_BREAKPOINT = 960
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1600)
const isCompactScreen = computed(() => windowWidth.value <= COMPACT_BREAKPOINT)
const menuOpen = ref(false)
const isDark = computed(() => appStore.getIsDark)
const headerLogoSrc = computed(() => (isDark.value ? INSTITUTION.logoSrcWhite : INSTITUTION.logoSrc))
const isScrolled = ref(false)
const activeIndex = ref('home')
const searchQuery = ref('')
const searchOpen = ref(false)
const isLoggedIn = computed(() => !!wsCache.get(appStore.getUserInfo))
const searchHits = computed(() => searchLandingContent(searchQuery.value, 8))

function syncActiveFromRoute(path = route.path) {
  const p = path || '/landing'
  if (p === '/' || p === '/landing') {
    activeIndex.value = 'home'
    return
  }
  let best: { id: string; len: number } | null = null
  for (const item of MAIN_NAV) {
    if (!item.to || item.to === '/' || item.to === '/landing') continue
    if (p === item.to || p.startsWith(`${item.to}/`)) {
      const len = item.to.length
      if (!best || len > best.len) best = { id: item.id, len }
    }
  }
  if (best) {
    activeIndex.value = best.id
    return
  }
  if (
    p.startsWith('/docs') ||
    p.startsWith('/faqs') ||
    p.startsWith('/privacy') ||
    p.startsWith('/about')
  ) {
    activeIndex.value = ''
  }
}

function closeSearch() {
  searchOpen.value = false
}

const prefersDarkQuery =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

const handleSystemThemeChange = (event: MediaQueryListEvent) => {
  if (!localStorage.getItem('theme')) {
    appStore.setIsDark(event.matches)
  }
}

const handleDocumentClick = (e: MouseEvent) => {
  const target = e.target as Node
  const searchWrap = document.querySelector('.gok-header__search-wrap')
  if (searchWrap && !searchWrap.contains(target)) {
    searchOpen.value = false
  }
  if (isCompactScreen.value && menuOpen.value) {
    const header = document.querySelector('.gok-header')
    if (header && !header.contains(target)) {
      menuOpen.value = false
    }
  }
}

const checkDarkMode = () => {
  const savedTheme = localStorage.getItem('theme')
  // Institutional default: light government portal
  if (!savedTheme) localStorage.setItem('theme', 'light')
  appStore.setIsDark(savedTheme === 'dark')
}

const toggleDark = () => {
  const next = !appStore.getIsDark
  localStorage.setItem('theme', next ? 'dark' : 'light')
  appStore.setIsDark(next)
}

let ticking = false
const handleScroll = () => {
  if (ticking) return
  window.requestAnimationFrame(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    isScrolled.value = scrollTop > 16
    ticking = false
  })
  ticking = true
}

function handleResize() {
  windowWidth.value = window.innerWidth
  if (windowWidth.value > COMPACT_BREAKPOINT && menuOpen.value) menuOpen.value = false
}

watch(
  () => route.path,
  (path) => {
    syncActiveFromRoute(path)
  },
  { immediate: true }
)

onMounted(() => {
  windowWidth.value = window.innerWidth
  checkDarkMode()
  syncActiveFromRoute(route.path)
  prefersDarkQuery?.addEventListener('change', handleSystemThemeChange)
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleScroll, { passive: true })
  document.addEventListener('click', handleDocumentClick)
  handleScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleScroll)
  prefersDarkQuery?.removeEventListener('change', handleSystemThemeChange)
  document.removeEventListener('click', handleDocumentClick)
})

const scrollToSection = async (sectionId: string) => {
  menuOpen.value = false
  const onLanding =
    router.currentRoute.value.path === '/landing' || router.currentRoute.value.path === '/'
  const headerOffset = isCompactScreen.value ? 96 : 112

  if (!onLanding) {
    setPendingLandingSection(sectionId)
    await router.push('/landing')
    // Fallback if scrollBehavior missed the element
    await scrollLandingSectionWhenReady(sectionId, headerOffset)
    return
  }

  await nextTick()
  await scrollLandingSectionWhenReady(sectionId, headerOffset)
}

function goSearchHit(hit: SiteSearchHit) {
  searchOpen.value = false
  const q = searchQuery.value
  searchQuery.value = ''
  if (hit.section) {
    scrollToSection(hit.section)
    return
  }
  if (hit.to) {
    router.push(hit.to)
    return
  }
  // restore query if nothing to navigate
  searchQuery.value = q
}

const onNav = (item: NavItem) => {
  menuOpen.value = false
  activeIndex.value = item.id
  if (item.portalPath) {
    goToPortalPath(item.portalPath, {
      isLoggedIn: isLoggedIn.value,
      push: (loc) => router.push(loc as any),
    })
    return
  }
  if (item.section) {
    scrollToSection(item.section)
    return
  }
  if (item.to) {
    if (item.to === '/landing' || item.to === '/') {
      if (router.currentRoute.value.path === '/landing' || router.currentRoute.value.path === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        router.push('/landing')
      }
      return
    }
    router.push(item.to)
  }
}

const onHeaderSearch = () => {
  const q = searchQuery.value.trim()
  if (!q) return
  const hits = searchLandingContent(q, 1)
  if (hits[0]) {
    goSearchHit(hits[0])
    return
  }
  searchOpen.value = true
}

const onFooterPortal = (path: string) => {
  goToPortalPath(path, {
    isLoggedIn: isLoggedIn.value,
    push: (loc) => router.push(loc as any),
  })
}

const handleLoginOrLogout = async () => {
  menuOpen.value = false
  if (isLoggedIn.value) {
    try {
      const userInfo = wsCache.get(appStore.getUserInfo)
      if (userInfo) {
        const userId = userInfo?.id ?? null
        await loginOutApi({ userId })
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    }
    wsCache.clear()
    localStorage.clear()
    sessionStorage.clear()
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((name) => caches.delete(name)))
    }
    appStore.$reset()
    dictStore.$reset()
    localeStore.$reset()
    window.location.replace(`${window.location.pathname}${window.location.search}#/login`)
    window.location.reload()
  } else {
    router.push('/login')
  }
}

defineExpose({ scrollToSection })
</script>

<style scoped>
.gok-skip {
  position: absolute;
  left: -999px;
  top: 0;
  background: #fff;
  color: var(--gok-green-dark);
  padding: 0.5rem 0.75rem;
  z-index: 10000;
}

.gok-skip:focus {
  left: 0.5rem;
  top: 0.5rem;
}

.base-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.gok-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--gok-white);
  border-bottom: 1px solid var(--gok-border);
  transition: box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.gok-header--compact {
  box-shadow: var(--gok-shadow);
}

.gok-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  width: 100%;
  height: var(--gok-header-h);
  min-height: var(--gok-header-h);
  padding: 0 clamp(1rem, 2.5vw, 2rem);
  box-sizing: border-box;
}

.gok-header--compact .gok-header__inner {
  height: 88px;
  min-height: 88px;
}

.gok-header__brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  text-decoration: none;
  color: inherit;
  flex-shrink: 0;
  min-width: 0;
  height: 100%;
  margin-right: auto;
}

.gok-header__logo {
  height: 68px;
  width: auto;
  max-width: min(340px, 58vw);
  object-fit: contain;
  object-position: left center;
  flex-shrink: 0;
  display: block;
  background: transparent;
}

.gok-header--compact .gok-header__logo {
  height: 56px;
  max-width: min(280px, 52vw);
}

.gok-header__nav {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  justify-content: center;
}

.gok-header__nav ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-evenly;
  gap: 0.15rem 0.35rem;
  width: 100%;
  max-width: 52rem;
}

.gok-header__nav-link {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--gok-nav, #333333);
  font: inherit;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  padding: 0.5rem 0.7rem;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s ease, background 0.15s ease;
}

.gok-header__nav-link:hover,
.gok-header__nav-link.is-active {
  color: var(--gok-green);
  background: transparent;
  box-shadow: inset 0 -2px 0 var(--gok-green);
}

.gok-header__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.55rem;
  flex-shrink: 0;
  margin-left: auto;
}

.gok-header__search-wrap {
  position: relative;
}

.gok-header__search input {
  width: 12.5rem;
  border: 1px solid var(--gok-border);
  border-radius: 6px;
  padding: 0.45rem 0.7rem;
  font: inherit;
  font-size: 0.95rem;
  background: var(--gok-grey);
  color: var(--gok-nav, #333333);
}

.gok-header__search input::placeholder {
  color: var(--gok-muted);
}

.gok-header__search-results,
.gok-header__search-empty {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  z-index: 1100;
  width: min(22rem, 70vw);
  margin: 0;
  padding: 0.35rem;
  list-style: none;
  background: var(--gok-panel, #fff);
  border: 1px solid var(--gok-border);
  border-radius: 8px;
  box-shadow: var(--gok-shadow, 0 10px 28px rgba(0, 0, 0, 0.12));
}

.gok-header__search-empty {
  padding: 0.75rem 0.9rem;
  font-size: 0.85rem;
  color: var(--gok-muted);
}

.gok-header__search-results button {
  width: 100%;
  appearance: none;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 0.55rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;
  display: grid;
  gap: 0.1rem;
  color: var(--gok-charcoal, #212121);
  font: inherit;
}

.gok-header__search-results button:hover {
  background: var(--gok-green-soft, #e8f5ee);
}

.gok-header__search-kind {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--gok-green);
}

.gok-header__search-title {
  font-size: 0.9rem;
  font-weight: 700;
}

.gok-header__search-blurb {
  font-size: 0.78rem;
  color: var(--gok-muted);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.gok-header__theme,
.gok-header__menu-btn {
  appearance: none;
  border: 1px solid var(--gok-border);
  background: var(--gok-white);
  color: var(--gok-nav, #333333);
  border-radius: 4px;
  width: 2.15rem;
  height: 2.15rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.gok-header__portal {
  appearance: none;
  border: 0;
  background: var(--gok-green);
  color: #fff;
  border-radius: var(--gok-radius);
  padding: 0.55rem 1.05rem;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.gok-header__portal--icon {
  width: 2.15rem;
  height: 2.15rem;
  padding: 0;
  border-radius: 4px;
}

.gok-header__portal:hover {
  background: var(--gok-green-dark);
}

.gok-mobile-nav {
  border-top: 1px solid var(--gok-border);
  background: var(--gok-white);
  padding: 0.5rem clamp(1rem, 2.5vw, 2rem) 1rem;
}

.gok-mobile-nav ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.gok-mobile-nav button {
  width: 100%;
  text-align: left;
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--gok-nav, #333333);
  font: inherit;
  font-size: 1.05rem;
  font-weight: 600;
  padding: 0.85rem 0.35rem;
  cursor: pointer;
  border-bottom: 1px solid var(--gok-border);
}

.gok-mobile-nav button:hover {
  color: var(--gok-green);
}

.gok-main {
  flex: 1;
  width: 100%;
  padding: 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 1100px) {
  .gok-header__desc {
    display: none;
  }
}
</style>
