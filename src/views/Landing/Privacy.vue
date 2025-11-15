<template>
  <BaseLayout>
    <div class="privacy-container">
      <div class="privacy-content">
        <h1 class="privacy-title">Privacy Policy</h1>
        
        <!-- Navigation Menu -->
        <nav class="privacy-nav" :class="{ 'sticky': !isMobile }">
          <ul class="nav-list">
            <li v-for="section in sections" :key="section.id">
              <button
                @click="(e) => scrollToSection(section.id, e)"
                :class="{ 'active': activeSection === section.id }"
                class="nav-link"
                type="button"
              >
                {{ section.label }}
              </button>
            </li>
          </ul>
        </nav>

        <!-- Content Sections -->
        <div class="privacy-sections">
          <section 
            v-for="section in sections" 
            :key="section.id" 
            :id="section.id"
            class="privacy-section"
            ref="sectionRefs"
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
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import BaseLayout from './BaseLayout.vue';
import { useHead } from '@unhead/vue';
import { Icon } from '@iconify/vue';

const isMobile = ref(false);
const activeSection = ref('introduction');

const sections = [
  {
    id: 'introduction',
    label: 'Introduction',
    icon: 'mdi:information-outline',
    content: '<p>The Kenya Informal Settlements Improvement Project (KISIP) operates the Kenya Slum Management Information System (KeSMIS) (the "System") and the SlumMapper (the "App"). This page informs you of our policies regarding the collection, use, and disclosure of personal information we receive from users of the App.</p>'
  },
  {
    id: 'personal-information',
    label: 'Personal Information',
    icon: 'mdi:account-outline',
    content: '<p>We may ask you to provide certain personally identifiable information that can be used to contact or identify you. Personally identifiable information may include, but is not limited to, your name, email, and phone number ("Personal Information").</p>'
  },
  {
    id: 'usage-data',
    label: 'Usage Data',
    icon: 'mdi:chart-line',
    content: '<p>We may also collect information that your mobile device sends whenever you use our App ("Usage Data"). This Usage Data may include information such as your device\'s Internet Protocol ("IP") address, device type, operating system version, the pages of our App that you visit, the time and date of your visit, the time spent on those pages, and other statistics. We do not plan to access IMEI or any other device identifiable information.</p>'
  },
  {
    id: 'use-of-information',
    label: 'Use of Information',
    icon: 'mdi:shield-check-outline',
    content: '<p>We may use your Personal Information and Usage Data to provide and improve the App. By using the App, you agree to the collection and use of information in accordance with this policy. We may collect and analyze Usage Data to monitor the usage of the App, troubleshoot technical issues, and improve the overall user experience.</p>'
  },
  {
    id: 'disclosure',
    label: 'Disclosure of Information',
    icon: 'mdi:lock-outline',
    content: '<p>We may only disclose your Personal Information if required to do so by law or in response to valid requests by public authorities (e.g., a court or a government agency).</p>'
  },
  {
    id: 'security',
    label: 'Security',
    icon: 'mdi:security',
    content: '<p>The security of your Personal Information is important to us. We strive to implement and maintain reasonable security measures to protect against unauthorized access, alteration, disclosure, or destruction of your Personal Information.</p>'
  },
  {
    id: 'links',
    label: 'Links to Other Websites',
    icon: 'mdi:link-variant',
    content: '<p>Our App may contain links to other websites that are not operated by us. If you click on a third-party link, you will be directed to that third party\'s site. We strongly advise you to review the Privacy Policy of every site you visit.</p>'
  },
  {
    id: 'children',
    label: 'Children\'s Privacy',
    icon: 'mdi:account-child-outline',
    content: '<p>Our App does not address anyone under the age of 13 ("Children"). We do not knowingly collect personally identifiable information from Children. If you are a parent or guardian and you are aware that your Child has provided us with Personal Information, please contact us. If we become aware that we have collected Personal Information from a Child without verification of parental consent, we will take steps to remove that information from our servers.</p>'
  },
  {
    id: 'erasure',
    label: 'Right to Erasure',
    icon: 'mdi:delete-outline',
    content: '<p>The user reserves the right to erasure from the system at any given time through <a href="https://kesmis.go.ke/#/delete">https://kesmis.go.ke/#/delete</a></p>'
  },
  {
    id: 'changes',
    label: 'Changes to This Privacy Policy',
    icon: 'mdi:update',
    content: '<p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>'
  },
  {
    id: 'contact',
    label: 'Contact Us',
    icon: 'mdi:email-outline',
    content: '<p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:kisip2info@gmail.com">kisip2info@gmail.com</a>.</p>'
  }
];

const sectionRefs = ref<HTMLElement[]>([]);

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

const scrollToSection = (sectionId: string, event?: Event) => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  const element = document.getElementById(sectionId);
  if (element) {
    // Calculate offset to account for sticky header and navigation
    const headerOffset = isMobile.value ? 100 : 140;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    // Scroll to section without affecting navigation position
    window.scrollTo({
      top: Math.max(0, offsetPosition),
      behavior: 'smooth'
    });
    
    // Update active section immediately
    activeSection.value = sectionId;
  }
};

const updateActiveSection = () => {
  const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  const headerOffset = isMobile.value ? 100 : 120;

  for (let i = sections.length - 1; i >= 0; i--) {
    const section = document.getElementById(sections[i].id);
    if (section) {
      const sectionTop = section.offsetTop - headerOffset;
      if (scrollPosition >= sectionTop - 50) {
        activeSection.value = sections[i].id;
        break;
      }
    }
  }
};

let ticking = false;
const handleScroll = () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      updateActiveSection();
      ticking = false;
    });
    ticking = true;
  }
};

onMounted(() => {
  checkMobile();
  updateActiveSection();
  window.addEventListener('resize', checkMobile);
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile);
  window.removeEventListener('scroll', handleScroll);
});

useHead({
  title: 'Privacy Policy | KeSMIS Kenya Slum Management Information System',
  meta: [
    { name: 'description', content: 'Privacy Policy for KeSMIS (Kenya Slum Management Information System) and SlumMapper app. Learn how we collect, use, and protect your personal information.' },
    { name: 'keywords', content: 'KeSMIS privacy policy, SlumMapper privacy, data protection Kenya, KISIP privacy, personal information policy' },
    { name: 'author', content: 'Kenya Informal Settlements Improvement Project (KISIP)' },
    { name: 'robots', content: 'index, follow' },
    
    // Open Graph tags (for WhatsApp, Facebook, LinkedIn)
    { property: 'og:title', content: 'Privacy Policy - KeSMIS Kenya Slum Management Information System' },
    { property: 'og:description', content: 'Privacy Policy for KeSMIS and SlumMapper app. Learn how we collect, use, and protect your personal information.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://kesmis.go.ke/privacy' },
    { property: 'og:image', content: 'https://kesmis.go.ke/logo.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: 'KeSMIS Logo - Kenya Slum Management Information System' },
    { property: 'og:site_name', content: 'KeSMIS' },
    { property: 'og:locale', content: 'en_KE' },
    
    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Privacy Policy - KeSMIS Kenya Slum Management Information System' },
    { name: 'twitter:description', content: 'Privacy Policy for KeSMIS and SlumMapper app. Learn how we collect, use, and protect your personal information.' },
    { name: 'twitter:image', content: 'https://kesmis.go.ke/twitter-card.jpg' },
    { name: 'twitter:image:alt', content: 'KeSMIS Logo - Kenya Slum Management Information System' },
    
    // Additional meta tags for better SEO
    { name: 'theme-color', content: '#00DC82' },
    { name: 'msapplication-TileColor', content: '#00DC82' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { name: 'format-detection', content: 'telephone=no' }
  ]
})
</script>

<style scoped>
.privacy-container {
  min-height: 100vh;
  color: var(--text-primary);
  transition: all 0.3s ease;
  padding: 4rem 2rem;
}

.privacy-content {
  max-width: 1280px;
  margin: 0 auto;
  display: block;
  position: relative;
}

.privacy-title {
  margin-bottom: 2rem;
  color: var(--text-primary);
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

/* Navigation */
.privacy-nav {
  position: fixed;
  top: 200px;
  left: calc((100vw - 1280px) / 2 + 2rem);
  width: 280px;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
  z-index: 10;
}

@media (min-width: 1400px) {
  .privacy-nav {
    left: calc((100vw - 1280px) / 2);
  }
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.3s ease;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  width: 100%;
  text-align: left;
  font-family: inherit;
}

.nav-link:hover {
  color: #00DC82;
  background: rgba(0, 220, 130, 0.05);
  border-color: rgba(0, 220, 130, 0.2);
  transform: translateX(4px);
}

.nav-link.active {
  color: #00DC82;
  background: rgba(0, 220, 130, 0.1);
  border-color: #00DC82;
  font-weight: 600;
}

/* Sections */
.privacy-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-left: 300px;
}

.privacy-section {
  scroll-margin-top: 100px;
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
  color: #00DC82;
  flex-shrink: 0;
}

.section-content {
  color: var(--text-secondary);
  line-height: 1.8;
  font-size: 1rem;
}

.section-content p {
  margin-bottom: 1rem;
}

.section-content a {
  color: #00DC82;
  text-decoration: none;
  transition: color 0.3s ease;
  font-weight: 500;
}

.section-content a:hover {
  color: #00B86B;
  text-decoration: underline;
}

/* Scrollbar for navigation */
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

.privacy-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 220, 130, 0.5);
}

@media (max-width: 768px) {
  .privacy-container {
    padding: 2rem 1rem;
  }
  
  .privacy-content {
    display: block;
  }

  .privacy-title {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .privacy-nav {
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    width: 100%;
    max-height: none;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
    padding: 0.75rem 1rem;
    z-index: 100;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .privacy-sections {
    margin-left: 0;
    margin-top: 80px;
  }

  .privacy-nav::-webkit-scrollbar {
    height: 4px;
    width: auto;
  }

  .nav-list {
    flex-direction: row;
    gap: 0.5rem;
    min-width: max-content;
    padding-bottom: 0.5rem;
  }

  .nav-link {
    white-space: nowrap;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }

  .nav-link:hover {
    transform: translateY(-2px);
  }

  .section-card {
    padding: 2rem 1.5rem;
  }

  .section-title {
    font-size: 1.25rem;
    gap: 0.75rem;
  }

  .section-icon {
    font-size: 1.5rem;
  }

  .privacy-sections {
    gap: 1.5rem;
  }
}

@media (max-width: 480px) {
  .privacy-container {
    padding: 1.5rem 1rem;
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

/* Dark Mode Support */
.dark-mode .section-card {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.dark-mode .section-card:hover {
  border-color: rgba(0, 220, 130, 0.4);
  box-shadow: 0 8px 24px rgba(0, 220, 130, 0.15);
}

.dark-mode .nav-link {
  color: var(--text-secondary);
}

.dark-mode .nav-link:hover {
  background: rgba(0, 220, 130, 0.1);
}

.dark-mode .nav-link.active {
  background: rgba(0, 220, 130, 0.15);
}
</style>
