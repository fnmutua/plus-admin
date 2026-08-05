<template>
  <BaseLayout>
    <div class="privacy-container">
      <div class="privacy-content">
        <nav ref="navRef" class="privacy-nav" aria-label="Terms sections">
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
          <h1 class="privacy-title">Terms of Data Use</h1>
          <p class="privacy-intro">
            These terms govern data released through the KeSMIS public data request process. By
            submitting a request or receiving data, you agree to the conditions below.
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

const ID_PREFIX = 'tdu-'
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

  // Guarantee jump even if smooth scroll is blocked
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
      <p>The Kenya Informal Settlements Improvement Project (KISIP) operates the Kenya Slum Management Information System (KeSMIS). KeSMIS holds settlement, project, monitoring, and related programme information used for planning, coordination, and public accountability.</p>
      <p>These Terms of Data Use cover:</p>
      <ol class="clause-list">
        <li><strong>i) </strong>All data, extracts, maps, documents, statistics, and derived materials released through a KeSMIS data request (the “Data”);</li>
        <li><strong>ii) </strong>Use of that Data by the requester and anyone authorised to handle it; and</li>
        <li><strong>iii) </strong>Alignment with the <a href="/#/privacy">Privacy Policy</a> and the Kenya Data Protection Act, 2019.</li>
      </ol>
    `,
  },
  {
    id: 'scope',
    label: 'Scope',
    icon: 'mdi:file-document-outline',
    content: `
      <p>These terms apply to:</p>
      <ol class="clause-list">
        <li><strong>1) </strong>Data released through the public data request form and any follow-up clarification or secure download link;</li>
        <li><strong>2) </strong>Any copy, extract, table, map, chart, or analysis derived from that Data; and</li>
        <li><strong>3) </strong>Organisations and individuals named on the request, and anyone they authorise to handle the Data.</li>
      </ol>
      <p>Also note:</p>
      <ol class="clause-list">
        <li><strong>i) </strong>Public pages already published on KeSMIS (for example the settlement or project explorers) remain subject to those pages’ own notices and applicable law;</li>
        <li><strong>ii) </strong>Confidential or restricted Data is released only where authorised and may carry additional conditions.</li>
      </ol>
    `,
  },
  {
    id: 'permitted-use',
    label: 'Permitted use',
    icon: 'mdi:check-circle-outline',
    content: `
      <p>You may use the Data only for:</p>
      <ol class="clause-list">
        <li><strong>i) </strong>The purpose stated in your approved data request; and</li>
        <li><strong>ii) </strong>Related non-commercial research, planning, academic, policy, or public-interest work that remains consistent with that purpose.</li>
      </ol>
      <p>You must:</p>
      <ol class="clause-list">
        <li><strong>1) </strong>Use the Data lawfully and in good faith;</li>
        <li><strong>2) </strong>Keep the Data accurate in context and avoid presenting it in a misleading way;</li>
        <li><strong>3) </strong>Apply appropriate technical and organisational safeguards while the Data is in your custody; and</li>
        <li><strong>4) </strong>Cooperate reasonably with KISIP / KeSMIS if clarification or an audit of use is required.</li>
      </ol>
    `,
  },
  {
    id: 'prohibited-use',
    label: 'Prohibited use',
    icon: 'mdi:cancel',
    content: `
      <p>Unless you have prior written approval from the programme authority, you must not:</p>
      <ol class="clause-list">
        <li><strong>1) </strong>Sell, rent, or commercially redistribute the Data as a product or paid service;</li>
        <li><strong>2) </strong>Use the Data to harass, discriminate against, or target individuals or communities;</li>
        <li><strong>3) </strong>Attempt to re-identify persons where Data has been anonymised or aggregated;</li>
        <li><strong>4) </strong>Present the Data as an official government endorsement of a third-party product, policy, or claim;</li>
        <li><strong>5) </strong>Remove or alter programme markings, reference codes, or attribution notices; or</li>
        <li><strong>6) </strong>Use the Data for purposes materially different from those declared in your request.</li>
      </ol>
    `,
  },
  {
    id: 'sharing',
    label: 'Sharing and redistribution',
    icon: 'mdi:share-variant-outline',
    content: `
      <p>Further sharing of released Data requires prior written approval from KISIP / KeSMIS, except where:</p>
      <ol class="clause-list">
        <li><strong>i) </strong>Sharing is limited to colleagues within the same requesting organisation who need the Data for the approved purpose; or</li>
        <li><strong>ii) </strong>You publish high-level findings, summaries, or maps that do not disclose restricted, personal, or sensitive settlement detail beyond what was authorised.</li>
      </ol>
      <p>When sharing is allowed, you must:</p>
      <ol class="clause-list">
        <li><strong>1) </strong>Inform recipients of these terms;</li>
        <li><strong>2) </strong>Ensure they are expected to comply; and</li>
        <li><strong>3) </strong>Remain responsible for how the Data is handled under your request.</li>
      </ol>
    `,
  },
  {
    id: 'attribution',
    label: 'Attribution',
    icon: 'mdi:quote-outline',
    content: `
      <p>When publishing or presenting work that uses the Data:</p>
      <ol class="clause-list">
        <li><strong>1) </strong>Acknowledge the source in a form substantially like:
          <em>Source: Kenya Slum Management Information System (KeSMIS) / Kenya Informal Settlements Improvement Project (KISIP). Data obtained under reference [your reference code], [year].</em></li>
        <li><strong>2) </strong>Where maps or spatial layers are used, retain any required legend, scale, and disclaimer text supplied with the release.</li>
      </ol>
    `,
  },
  {
    id: 'accuracy',
    label: 'Accuracy and disclaimer',
    icon: 'mdi:alert-circle-outline',
    content: `
      <p>KeSMIS Data is provided in good faith for information and decision-support. Please note:</p>
      <ol class="clause-list">
        <li><strong>i) </strong>Settlement boundaries, demographics, project status, and related figures may change as programmes advance and source records are updated;</li>
        <li><strong>ii) </strong>To the extent permitted by law, KISIP and KeSMIS do not warrant that the Data is complete, current, or fit for a particular purpose;</li>
        <li><strong>iii) </strong>KISIP and KeSMIS are not liable for decisions taken solely on the basis of the Data; and</li>
        <li><strong>iv) </strong>You should verify critical facts with the programme team where necessary.</li>
      </ol>
    `,
  },
  {
    id: 'personal-data',
    label: 'Personal data',
    icon: 'mdi:shield-account-outline',
    content: `
      <p>Where any personal data is included in a release, you must process it in accordance with the Kenya Data Protection Act, 2019, and any conditions stated in the release notice. In particular you must:</p>
      <ol class="clause-list">
        <li><strong>1) </strong>Limit access to people who need it for the approved purpose;</li>
        <li><strong>2) </strong>Not publish personal identifiers without lawful basis and authorisation; and</li>
        <li><strong>3) </strong>Notify <a href="mailto:kisip2info@gmail.com">kisip2info@gmail.com</a> promptly if you suspect unauthorised access or disclosure.</li>
      </ol>
      <p>Requester contact details submitted on the form are handled under the <a href="/#/privacy">Privacy Policy</a>.</p>
    `,
  },
  {
    id: 'security-retention',
    label: 'Security and retention',
    icon: 'mdi:lock-outline',
    content: `
      <p><strong>Security</strong> — you must:</p>
      <ol class="clause-list">
        <li><strong>i) </strong>Store the Data on systems you control;</li>
        <li><strong>ii) </strong>Restrict access to authorised users; and</li>
        <li><strong>iii) </strong>Not place restricted Data on public websites, open shared drives, or unsecured messaging channels.</li>
      </ol>
      <p><strong>Retention</strong> — you must:</p>
      <ol class="clause-list">
        <li><strong>1) </strong>Retain the Data only for as long as needed for the approved purpose (or any longer period required by law or a written condition of release);</li>
        <li><strong>2) </strong>When retention ends, securely delete or destroy copies; and</li>
        <li><strong>3) </strong>Confirm destruction if asked by the programme team.</li>
      </ol>
    `,
  },
  {
    id: 'ownership',
    label: 'Ownership',
    icon: 'mdi:bank-outline',
    content: `
      <ol class="clause-list">
        <li><strong>1) </strong>Unless otherwise stated in writing, intellectual property and database rights in KeSMIS Data remain with the Government of Kenya / KISIP;</li>
        <li><strong>2) </strong>A data release grants a limited, non-exclusive, non-transferable licence to use the Data under these terms; and</li>
        <li><strong>3) </strong>A release does not transfer ownership of the Data.</li>
      </ol>
    `,
  },
  {
    id: 'breach',
    label: 'Breach',
    icon: 'mdi:gavel',
    content: `
      <p>If you breach these terms, KISIP / KeSMIS may:</p>
      <ol class="clause-list">
        <li><strong>1) </strong>Withdraw access to the Data;</li>
        <li><strong>2) </strong>Require return or destruction of the Data;</li>
        <li><strong>3) </strong>Refuse future requests; and</li>
        <li><strong>4) </strong>Refer the matter to relevant authorities where required by law.</li>
      </ol>
      <p>You should report suspected misuse of released Data to <a href="mailto:kisip2info@gmail.com">kisip2info@gmail.com</a> without undue delay.</p>
    `,
  },
  {
    id: 'changes',
    label: 'Changes',
    icon: 'mdi:update',
    content: `
      <ol class="clause-list">
        <li><strong>i) </strong>We may update these Terms of Data Use from time to time by posting a revised version on this page;</li>
        <li><strong>ii) </strong>Continued use of Data already released remains subject to the version in force at the time of release, unless you are notified otherwise in writing.</li>
      </ol>
    `,
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: 'mdi:email-outline',
    content: `
      <p>Questions about these terms or an existing data request may be sent to <a href="mailto:kisip2info@gmail.com">kisip2info@gmail.com</a>. Include your data request reference code where available.</p>
      <p>Related pages:</p>
      <ol class="clause-list">
        <li><strong>i) </strong><a href="/#/data-request">Data request form</a></li>
        <li><strong>ii) </strong><a href="/#/privacy">Privacy Policy</a></li>
        <li><strong>iii) </strong><a href="/#/contact">Contact</a></li>
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

    // Prefer last section (document order) currently in the observer band
    let current: string | null = null
    for (const item of sections) {
      if (visible.has(item.id)) current = item.id
    }
    if (current) {
      setActive(current)
      return
    }

    // Fallback: last section whose top is above the probe
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
  // Public shell may scroll on window, documentElement, or body
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
  title: 'Terms of Data Use | KeSMIS Kenya Slum Management Information System',
  meta: [
    {
      name: 'description',
      content:
        'Terms governing use of settlement, project and programme data released through the KeSMIS data request process.',
    },
    {
      name: 'keywords',
      content: 'KeSMIS terms of data use, KISIP data request, Kenya settlement data licence',
    },
    { name: 'author', content: 'Kenya Informal Settlements Improvement Project (KISIP)' },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: 'Terms of Data Use - KeSMIS' },
    {
      property: 'og:description',
      content: 'Conditions for using data released through the KeSMIS public data request process.',
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://kesmis.go.ke/terms-of-data-use' },
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

.section-content :deep(li em) {
  display: block;
  margin-top: 0.35rem;
  font-style: italic;
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

  .nav-link:hover {
    transform: none;
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
