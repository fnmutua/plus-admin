<template>
  <BaseLayout>
    <div class="privacy-container">
      <div class="privacy-content">
        <nav ref="navRef" class="privacy-nav" aria-label="Privacy sections">
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
          <h1 class="privacy-title">Privacy Policy</h1>
          <p class="privacy-intro">
            This Privacy Policy explains how KeSMIS and SlumMapper collect, use, and protect personal
            information. By using the System or App, you agree to the practices described below.
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

const ID_PREFIX = 'pp-'
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
      <p>The Kenya Informal Settlements Improvement Project (KISIP) operates the Kenya Slum Management Information System (KeSMIS) (the “System”) and the SlumMapper (the “App”). This page informs you of our policies regarding the collection, use, and disclosure of personal information we receive from users of the App.</p>
      <p>This Privacy Policy covers:</p>
      <ol class="clause-list">
        <li><strong>i) </strong>Personal information collected through the System and App;</li>
        <li><strong>ii) </strong>How that information is used and protected; and</li>
        <li><strong>iii) </strong>Your rights, including erasure, and how to contact us.</li>
      </ol>
    `,
  },
  {
    id: 'personal-information',
    label: 'Personal Information',
    icon: 'mdi:account-outline',
    content: `
      <p>We may ask you to provide certain personally identifiable information that can be used to contact or identify you (“Personal Information”). This may include, but is not limited to:</p>
      <ol class="clause-list">
        <li><strong>1) </strong>Your name;</li>
        <li><strong>2) </strong>Email address; and</li>
        <li><strong>3) </strong>Phone number.</li>
      </ol>
    `,
  },
  {
    id: 'usage-data',
    label: 'Usage Data',
    icon: 'mdi:chart-line',
    content: `
      <p>We may also collect information that your mobile device sends whenever you use our App (“Usage Data”). This Usage Data may include:</p>
      <ol class="clause-list">
        <li><strong>1) </strong>Your device’s Internet Protocol (“IP”) address;</li>
        <li><strong>2) </strong>Device type and operating system version;</li>
        <li><strong>3) </strong>The pages of our App that you visit, the time and date of your visit, and the time spent on those pages; and</li>
        <li><strong>4) </strong>Other related statistics.</li>
      </ol>
      <p>We do not plan to access IMEI or any other device-identifiable information beyond what is described above.</p>
    `,
  },
  {
    id: 'use-of-information',
    label: 'Use of Information',
    icon: 'mdi:shield-check-outline',
    content: `
      <p>By using the App, you agree to the collection and use of information in accordance with this policy. We may use your Personal Information and Usage Data to:</p>
      <ol class="clause-list">
        <li><strong>1) </strong>Provide and improve the App;</li>
        <li><strong>2) </strong>Monitor usage of the App;</li>
        <li><strong>3) </strong>Troubleshoot technical issues; and</li>
        <li><strong>4) </strong>Improve the overall user experience.</li>
      </ol>
    `,
  },
  {
    id: 'disclosure',
    label: 'Disclosure of Information',
    icon: 'mdi:lock-outline',
    content: `
      <p>We may only disclose your Personal Information:</p>
      <ol class="clause-list">
        <li><strong>i) </strong>If required to do so by law; or</li>
        <li><strong>ii) </strong>In response to valid requests by public authorities (for example, a court or a government agency).</li>
      </ol>
    `,
  },
  {
    id: 'security',
    label: 'Security',
    icon: 'mdi:security',
    content: `
      <p>The security of your Personal Information is important to us. We strive to:</p>
      <ol class="clause-list">
        <li><strong>1) </strong>Implement and maintain reasonable security measures; and</li>
        <li><strong>2) </strong>Protect against unauthorised access, alteration, disclosure, or destruction of your Personal Information.</li>
      </ol>
    `,
  },
  {
    id: 'links',
    label: 'Links to Other Websites',
    icon: 'mdi:link-variant',
    content: `
      <p>Our App may contain links to other websites that are not operated by us. Please note:</p>
      <ol class="clause-list">
        <li><strong>i) </strong>If you click on a third-party link, you will be directed to that third party’s site; and</li>
        <li><strong>ii) </strong>We strongly advise you to review the Privacy Policy of every site you visit.</li>
      </ol>
    `,
  },
  {
    id: 'children',
    label: "Children's Privacy",
    icon: 'mdi:account-child-outline',
    content: `
      <p>Our App does not address anyone under the age of 13 (“Children”). In particular:</p>
      <ol class="clause-list">
        <li><strong>1) </strong>We do not knowingly collect personally identifiable information from Children;</li>
        <li><strong>2) </strong>If you are a parent or guardian and you are aware that your Child has provided us with Personal Information, please contact us; and</li>
        <li><strong>3) </strong>If we become aware that we have collected Personal Information from a Child without verification of parental consent, we will take steps to remove that information from our servers.</li>
      </ol>
    `,
  },
  {
    id: 'erasure',
    label: 'Right to Erasure',
    icon: 'mdi:delete-outline',
    content: `
      <p>The user reserves the right to erasure from the system at any given time through
      <a href="https://kesmis.go.ke/#/delete">https://kesmis.go.ke/#/delete</a>.</p>
    `,
  },
  {
    id: 'changes',
    label: 'Changes to This Privacy Policy',
    icon: 'mdi:update',
    content: `
      <ol class="clause-list">
        <li><strong>i) </strong>We may update our Privacy Policy from time to time by posting a revised version on this page;</li>
        <li><strong>ii) </strong>You are advised to review this Privacy Policy periodically for any changes.</li>
      </ol>
    `,
  },
  {
    id: 'contact',
    label: 'Contact Us',
    icon: 'mdi:email-outline',
    content: `
      <p>If you have any questions about this Privacy Policy, please contact us at:</p>
      <ol class="clause-list">
        <li><strong>i) </strong><a href="mailto:kisip2info@gmail.com">kisip2info@gmail.com</a></li>
        <li><strong>ii) </strong><a href="/#/terms-of-data-use">Terms of data use</a></li>
        <li><strong>iii) </strong><a href="/#/contact">Contact page</a></li>
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
  title: 'Privacy Policy | KeSMIS Kenya Slum Management Information System',
  meta: [
    {
      name: 'description',
      content:
        'Privacy Policy for KeSMIS (Kenya Slum Management Information System) and SlumMapper app. Learn how we collect, use, and protect your personal information.',
    },
    {
      name: 'keywords',
      content:
        'KeSMIS privacy policy, SlumMapper privacy, data protection Kenya, KISIP privacy, personal information policy',
    },
    { name: 'author', content: 'Kenya Informal Settlements Improvement Project (KISIP)' },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: 'Privacy Policy - KeSMIS Kenya Slum Management Information System' },
    {
      property: 'og:description',
      content:
        'Privacy Policy for KeSMIS and SlumMapper app. Learn how we collect, use, and protect your personal information.',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://kesmis.go.ke/privacy' },
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
