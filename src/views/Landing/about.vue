<template>
  <BaseLayout>
    <div class="privacy-container">
      <div class="privacy-content">
        <nav ref="navRef" class="privacy-nav" aria-label="About sections">
          <ul class="nav-list">
            <li v-for="section in sections" :key="section.id">
              <a
                class="nav-link"
                :class="{ 'is-active': activeSection === section.id }"
                :href="'#' + domId(section.id)"
                :aria-current="activeSection === section.id ? 'true' : undefined"
                @click.prevent.stop="onNavClick(section.id)"
              >
                {{ section.label }}
              </a>
            </li>
          </ul>
        </nav>

        <div class="privacy-main">
          <h1 class="privacy-title">About KeSMIS</h1>
          <p class="privacy-intro">
            KeSMIS is Kenya’s national information system for informal settlements — supporting data,
            grievance redress, and programme monitoring under KISIP.
          </p>

          <div class="privacy-sections">
            <section
              v-for="section in sections"
              :id="domId(section.id)"
              :key="section.id"
              :ref="(el) => setSectionRef(section.id, el)"
              class="privacy-section"
              :data-section-id="section.id"
            >
              <div class="section-card">
                <h2 class="section-title">
                  <Icon :icon="section.icon" class="section-icon" />
                  {{ section.label }}
                </h2>
                <div class="section-content" v-html="section.content"></div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, type ComponentPublicInstance } from 'vue'
import BaseLayout from './BaseLayout.vue'
import { useHead } from '@unhead/vue'
import { Icon } from '@iconify/vue'

const ID_PREFIX = 'about-'
const domId = (id: string) => `${ID_PREFIX}${id}`

const isMobile = ref(false)
const activeSection = ref('introduction')
const navRef = ref<HTMLElement | null>(null)
const sectionEls = new Map<string, HTMLElement>()
let observer: IntersectionObserver | null = null
let clickLockUntil = 0

const setSectionRef = (id: string, el: Element | ComponentPublicInstance | null) => {
  if (el instanceof HTMLElement) {
    sectionEls.set(id, el)
  } else {
    sectionEls.delete(id)
  }
}

const getSectionEl = (id: string) =>
  document.getElementById(domId(id)) || sectionEls.get(id) || null

const checkMobile = () => {
  isMobile.value = window.innerWidth < 900
}

const scrollActiveChip = () => {
  if (!isMobile.value || !navRef.value) return
  const btn = navRef.value.querySelector('.nav-link.is-active') as HTMLElement | null
  if (!btn) return
  const navRect = navRef.value.getBoundingClientRect()
  const btnRect = btn.getBoundingClientRect()
  const delta = btnRect.left + btnRect.width / 2 - (navRect.left + navRect.width / 2)
  if (Math.abs(delta) > 12) {
    navRef.value.scrollBy({ left: delta, behavior: 'smooth' })
  }
}

const setActive = (id: string) => {
  if (activeSection.value === id) return
  activeSection.value = id
  nextTick(scrollActiveChip)
}

const scrollRootTop = () =>
  window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0

const scrollRootTo = (top: number) => {
  const y = Math.max(0, top)
  const root = (document.scrollingElement || document.documentElement) as HTMLElement
  try {
    root.scrollTo({ top: y, behavior: 'smooth' })
  } catch {
    root.scrollTop = y
  }
  try {
    window.scrollTo({ top: y, behavior: 'smooth' })
  } catch {
    /* ignore */
  }
  document.body.scrollTop = y
}

const onNavClick = (id: string) => {
  const el = getSectionEl(id)
  if (!el) return

  clickLockUntil = Date.now() + 1000
  setActive(id)

  const header =
    document.querySelector('.gok-header')?.getBoundingClientRect().height || 104
  const extra = isMobile.value ? 72 : 20
  const top = el.getBoundingClientRect().top + scrollRootTop() - header - extra
  scrollRootTo(top)

  window.setTimeout(() => {
    const stillFar = Math.abs(el.getBoundingClientRect().top - (header + extra)) > 40
    if (stillFar) {
      const retryTop = el.getBoundingClientRect().top + scrollRootTop() - header - extra
      const root = (document.scrollingElement || document.documentElement) as HTMLElement
      root.scrollTop = Math.max(0, retryTop)
      window.scrollTo(0, Math.max(0, retryTop))
    }
  }, 50)
}

const sections = [
  {
    id: 'introduction',
    label: 'Introduction',
    icon: 'mdi:information-outline',
    content: `
      <p>The Kenya Slum Management Information System (KeSMIS) is the national geodatabase and information management system for slums and informal settlements across Kenya. Implemented under the Kenya Informal Settlements Improvement Project (KISIP), KeSMIS facilitates:</p>
      <ol class="clause-list">
        <li><strong>i) </strong>Comprehensive data collection;</li>
        <li><strong>ii) </strong>Grievance management; and</li>
        <li><strong>iii) </strong>Project monitoring to support evidence-based decision-making in urban development.</li>
      </ol>
    `,
  },
  {
    id: 'mission',
    label: 'Our Mission',
    icon: 'mdi:target',
    content: `
      <p>KeSMIS aims to provide government agencies, development partners, and communities with reliable data and analytical tools necessary for:</p>
      <ol class="clause-list">
        <li><strong>1) </strong>Effective slum management;</li>
        <li><strong>2) </strong>Urban planning; and</li>
        <li><strong>3) </strong>Evidence-based policy formulation.</li>
      </ol>
      <p>The system supports the transformation of informal settlements into sustainable and livable environments through comprehensive information management.</p>
    `,
  },
  {
    id: 'background',
    label: 'Project Background',
    icon: 'mdi:office-building-outline',
    content: `
      <p>KeSMIS is a key component of the Kenya Informal Settlements Improvement Project (KISIP), a government initiative aimed at improving living conditions in informal settlements across Kenya. The system supports KISIP’s objectives by providing a centralized platform for:</p>
      <ol class="clause-list">
        <li><strong>i) </strong>Data collection and management;</li>
        <li><strong>ii) </strong>Analysis related to informal settlements and infrastructure; and</li>
        <li><strong>iii) </strong>Community services coordination.</li>
      </ol>
    `,
  },
  {
    id: 'features',
    label: 'Key Features',
    icon: 'mdi:chart-box-outline',
    content: `
      <p>KeSMIS provides the following core capabilities:</p>
      <ol class="clause-list">
        <li><strong>1) </strong>National geodatabase for slums and informal settlements;</li>
        <li><strong>2) </strong>Electronic Grievance Redress Mechanism (e-GRM);</li>
        <li><strong>3) </strong>Project monitoring and reporting capabilities;</li>
        <li><strong>4) </strong>Real-time data collection and synchronization;</li>
        <li><strong>5) </strong>Climate risk assessment; and</li>
        <li><strong>6) </strong>Multi-level access control and user management.</li>
      </ol>
    `,
  },
]

const setupObserver = () => {
  observer?.disconnect()
  const visible = new Set<string>()

  const header =
    document.querySelector('.gok-header')?.getBoundingClientRect().height || 104
  const mobileNav = isMobile.value ? 56 : 0
  const topBand = Math.round(header + mobileNav + 8)

  const pickActive = () => {
    if (Date.now() < clickLockUntil) return

    let current: string | null = null
    for (const item of sections) {
      if (visible.has(item.id)) current = item.id
    }
    if (current) {
      setActive(current)
      return
    }

    current = sections[0].id
    for (const item of sections) {
      const el = getSectionEl(item.id)
      if (el && el.getBoundingClientRect().top <= topBand) current = item.id
    }
    setActive(current)
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.sectionId
        if (!id) continue
        if (entry.isIntersecting) visible.add(id)
        else visible.delete(id)
      }
      pickActive()
    },
    {
      root: null,
      rootMargin: `-${topBand}px 0px -40% 0px`,
      threshold: [0, 0.1, 0.25, 0.5],
    }
  )

  for (const item of sections) {
    const el = getSectionEl(item.id)
    if (el) observer.observe(el)
  }

  pickActive()
}

let scrollTicking = false
const onScroll = () => {
  if (scrollTicking) return
  scrollTicking = true
  requestAnimationFrame(() => {
    scrollTicking = false
    if (Date.now() < clickLockUntil) return
    const header =
      document.querySelector('.gok-header')?.getBoundingClientRect().height || 104
    const probe = header + (isMobile.value ? 64 : 24)
    let current = sections[0].id
    for (const item of sections) {
      const el = getSectionEl(item.id)
      if (el && el.getBoundingClientRect().top <= probe) current = item.id
    }
    setActive(current)
  })
}

const onResize = () => {
  checkMobile()
  setupObserver()
}

onMounted(async () => {
  checkMobile()
  await nextTick()
  setupObserver()
  window.addEventListener('resize', onResize)
  window.addEventListener('scroll', onScroll, { passive: true })
  document.documentElement.addEventListener('scroll', onScroll, { passive: true })
  document.body.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', onScroll)
  document.documentElement.removeEventListener('scroll', onScroll)
  document.body.removeEventListener('scroll', onScroll)
  observer?.disconnect()
  observer = null
  sectionEls.clear()
})

useHead({
  title: 'About KeSMIS | Kenya Slum Management Information System',
  meta: [
    {
      name: 'description',
      content:
        'Learn about KeSMIS (Kenya Slum Management Information System) - the national geodatabase and information management system for slums and informal settlements across Kenya, implemented under KISIP.',
    },
    {
      name: 'keywords',
      content:
        'about KeSMIS, Kenya slum management, intervention projects, urban development Kenya, slum improvement, informal settlements Kenya, data collection platform',
    },
    { name: 'author', content: 'Kenya Informal Settlements Improvement Project (KISIP)' },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: 'About KeSMIS - Kenya Slum Management Information System' },
    {
      property: 'og:description',
      content:
        'Learn about KeSMIS - the national geodatabase and information management system for slums and informal settlements across Kenya.',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://kesmis.go.ke/about' },
    { property: 'og:image', content: 'https://kesmis.go.ke/logo.png' },
    { property: 'og:site_name', content: 'KeSMIS' },
    { property: 'og:locale', content: 'en_KE' },
  ],
})
</script>

<style scoped>
.privacy-container {
  min-height: 100vh;
  color: var(--text-primary);
  transition: all 0.3s ease;
  padding: 2rem 2rem 4rem;
}

.privacy-content {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 1.25rem 1.75rem;
  align-items: start;
}

.privacy-nav {
  position: sticky;
  top: calc(var(--gok-header-h, 104px) + 0.75rem);
  max-height: calc(100vh - var(--gok-header-h, 104px) - 1.25rem);
  overflow-y: auto;
  z-index: 40;
  padding: 0.15rem 0.15rem 0.5rem;
  pointer-events: auto;
  isolation: isolate;
}

.privacy-main {
  min-width: 0;
  position: relative;
  z-index: 1;
}

.privacy-title {
  margin: 0 0 0.75rem;
  color: var(--text-primary);
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.privacy-intro {
  max-width: none;
  width: 100%;
  margin: 0 0 1.75rem;
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 1.05rem;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  pointer-events: auto;
}

.nav-list > li {
  pointer-events: auto;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.65rem;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1.25;
  cursor: pointer;
  background: transparent;
  width: 100%;
  text-align: left;
  font-family: inherit;
  pointer-events: auto;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}

.nav-link:hover {
  color: #00dc82;
  background: rgba(0, 220, 130, 0.05);
  border-color: rgba(0, 220, 130, 0.2);
}

.nav-link.is-active {
  color: #00843d;
  background: rgba(0, 132, 61, 0.12);
  border-color: #00843d;
  font-weight: 700;
  box-shadow: inset 3px 0 0 #00843d;
}

.privacy-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.privacy-section {
  scroll-margin-top: calc(var(--gok-header-h, 104px) + 1.5rem);
}

.section-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 2.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-card:hover {
  box-shadow: 0 8px 24px rgba(0, 220, 130, 0.1);
  border-color: rgba(0, 220, 130, 0.3);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(0, 220, 130, 0.2);
}

.section-icon {
  font-size: 1.75rem;
  color: #00dc82;
  flex-shrink: 0;
}

.section-content {
  color: var(--text-secondary);
  line-height: 1.8;
  font-size: 1rem;
}

.section-content :deep(p) {
  margin-bottom: 1rem;
}

.section-content :deep(ul),
.section-content :deep(ol) {
  margin: 0 0 1rem;
  padding-left: 0.15rem;
  list-style: none;
}

.section-content :deep(ol.clause-list > li) {
  position: relative;
  margin-bottom: 0.5rem;
  padding-left: 0.15rem;
  line-height: 1.55;
}

.section-content :deep(ol.clause-list > li > strong:first-child) {
  color: inherit;
  font-weight: inherit;
  font-style: inherit;
  font-family: inherit;
  margin-right: 0.2rem;
}

.section-content :deep(a) {
  color: #00dc82;
  text-decoration: none;
  transition: color 0.3s ease;
  font-weight: 500;
}

.section-content :deep(a:hover) {
  color: #00b86b;
  text-decoration: underline;
}

.privacy-nav::-webkit-scrollbar {
  width: 4px;
}

.privacy-nav::-webkit-scrollbar-track {
  background: transparent;
}

.privacy-nav::-webkit-scrollbar-thumb {
  background: rgba(0, 220, 130, 0.3);
  border-radius: 2px;
}

@media (max-width: 900px) {
  .privacy-content {
    grid-template-columns: 1fr;
  }

  .privacy-nav {
    position: sticky;
    top: var(--gok-header-h, 104px);
    max-height: none;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    background: var(--bg-primary, var(--gok-panel, #fff));
    border-bottom: 1px solid var(--border-color, var(--gok-border));
    padding: 0.65rem 0.25rem;
    z-index: 20;
    margin: 0 -0.5rem;
  }

  .nav-list {
    flex-direction: row;
    gap: 0.5rem;
    min-width: max-content;
    padding: 0 0.5rem 0.25rem;
  }

  .nav-link {
    white-space: nowrap;
    padding: 0.45rem 0.75rem;
    font-size: 0.78rem;
  }

  .privacy-section {
    scroll-margin-top: calc(var(--gok-header-h, 104px) + 4.75rem);
  }
}

@media (max-width: 768px) {
  .privacy-container {
    padding: 1.25rem 1rem 2rem;
  }

  .privacy-title {
    font-size: 2rem;
    margin: 0 0 0.5rem;
  }

  .privacy-intro {
    margin: 0 0 1.25rem;
    font-size: 0.95rem;
  }

  .section-card {
    padding: 2rem 1.5rem;
  }

  .section-title {
    font-size: 1.25rem;
    gap: 0.75rem;
  }

  .privacy-sections {
    gap: 1.5rem;
  }
}

@media (max-width: 480px) {
  .privacy-container {
    padding: 1rem 0.85rem 1.75rem;
  }

  .privacy-title {
    font-size: 1.75rem;
  }

  .section-card {
    padding: 1.5rem 1rem;
  }

  .section-title {
    font-size: 1.125rem;
    flex-wrap: wrap;
  }
}
</style>
