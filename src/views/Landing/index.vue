<template>
  <BaseLayout>
    <div class="gok-home">
      <HeroSection @action="handleAction" @search="onHeroSearch" />

      <NationalStatistics
        :settlements="NumSettlements"
        :population="Population"
        :projects="TotalProjs"
        :counties="NumCounties"
        :loading="statsLoading"
      />

      <ProgrammeCards @select="onProgrammeSelect" />

      <CitizenEngagementCallout @action="(to) => go(to)" />
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useHead } from '@unhead/vue'
import BaseLayout from './BaseLayout.vue'
import HeroSection from './components/HeroSection.vue'
import NationalStatistics from './components/NationalStatistics.vue'
import ProgrammeCards from './components/ProgrammeCards.vue'
import CitizenEngagementCallout from './components/CitizenEngagementCallout.vue'
import { getPublicLandingStats } from '@/api/register-public'
import { INSTITUTION } from './config/landing.config'
import { goToPortalPath } from './utils/portalNav'

useHead({
  title: `${INSTITUTION.systemName} | ${INSTITUTION.fullName}`,
  meta: [
    {
      name: 'description',
      content:
        'Kenya Slum Management Information System (KeSMIS) — national geodatabase, maps, programme information and digital services for informal settlements across Kenya.',
    },
  ],
})

const router = useRouter()
const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const isLoggedIn = computed(() => !!wsCache.get(appStore.getUserInfo))

const NumSettlements = ref('0')
const Population = ref('0')
const TotalProjs = ref('0')
const NumCounties = ref('0')
const statsLoading = ref(true)

const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
  return String(num)
}

const loadLandingStats = async () => {
  statsLoading.value = true
  try {
    const response = await getPublicLandingStats()
    const data = response?.data
    if (!data) return
    NumSettlements.value = formatNumber(data.settlements)
    Population.value = formatNumber(data.population)
    TotalProjs.value = formatNumber(data.projects)
    NumCounties.value = formatNumber(data.counties ?? 0)
  } catch (error) {
    console.error('Error fetching landing stats:', error)
  } finally {
    statsLoading.value = false
  }
}

function goPortal(path: string) {
  goToPortalPath(path, {
    isLoggedIn: isLoggedIn.value,
    push: (loc) => router.push(loc as any),
  })
}

function go(to: string | null | undefined) {
  if (!to) return
  if (to.startsWith('http')) {
    window.open(to, '_blank', 'noopener')
    return
  }
  router.push(to)
}

function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.pageYOffset - 96
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
}

function handleAction(action: string) {
  if (action.startsWith('route:')) {
    go(action.slice(6))
    return
  }
  if (action.startsWith('portal:')) {
    goPortal(action.slice(7))
    return
  }
  if (action.startsWith('scroll:')) {
    scrollToSection(action.slice(7))
    return
  }
  if (action === 'login') {
    goPortal('/dashboard/national')
    return
  }
  go(action)
}

function onHeroSearch(query: string, target: 'settlements' | 'projects' = 'settlements') {
  const path = target === 'projects' ? '/projects' : '/settlements'
  if (query) sessionStorage.setItem('kesmis_landing_search', query)
  router.push({ path, query: query ? { q: query } : {} })
}

function onProgrammeSelect(item: {
  to?: string | null
  href?: string | null
  section?: string
  portalPath?: string
}) {
  if (item.href) {
    window.open(item.href, '_blank', 'noopener,noreferrer')
    return
  }
  if (item.portalPath) {
    goPortal(item.portalPath)
    return
  }
  if (item.to) go(item.to)
  else if (item.section) scrollToSection(item.section)
}

onMounted(() => {
  loadLandingStats()
})
</script>

<style scoped>
.gok-home {
  background: var(--gok-grey);
}
</style>
