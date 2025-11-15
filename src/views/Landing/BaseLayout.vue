<template>
  <div class="base-layout" :class="{ 'dark-mode': isDark }">
    <div class="landing-page">
      <el-container direction="vertical">
        <el-header :class="{ 'scrolled': isScrolled }" height="70px">
          <div class="header-content">
            <!-- Mobile Menu (Top left) -->
            <div v-if="isCompactScreen" class="mobile-menu-container">
              <!-- Hamburger icon for small screens -->
              <div class="hamburger" @click="menuOpen = !menuOpen">
                <Icon icon="mdi:menu" class="hamburger-icon" />
              </div>
              
              <!-- Dropdown Menu -->
              <div class="mobile-dropdown-menu" :class="{ open: menuOpen }" @click.stop>
                <div class="menu-item" :class="{ 'is-active': activeIndex === '1' }" @click="handleSelect('1')">
                  <Icon icon="mdi:home" />
                  <span>Home</span>
                </div>
                <div class="menu-item" :class="{ 'is-active': activeIndex === 'features' }" @click="scrollToSection('features')">
                  <Icon icon="mdi:star-outline" />
                  <span>Features</span>
                </div>
                <div class="menu-item" :class="{ 'is-active': activeIndex === 'how-it-works' }" @click="scrollToSection('how-it-works')">
                  <Icon icon="mdi:information-outline" />
                  <span>How it works</span>
                </div>
                <div class="menu-item" :class="{ 'is-active': activeIndex === '3' }" @click="handleSelect('3')">
                  <Icon icon="mdi:file-document-outline" />
                  <span>Grievances</span>
                </div>
                <div class="menu-item" @click="toggleDark">
                  <Icon :icon="isDark ? 'carbon:moon' : 'carbon:sun'" />
                  <span>{{ isDark ? 'Dark Mode' : 'Light Mode' }}</span>
                </div>
              </div>
            </div>

            <!-- Logo (Desktop only) -->
            <div v-if="!isCompactScreen" class="logo">
              <img src="@/assets/imgs/1logo.png" alt="KISIP - Kenya Informal Settlements Improvement Project" width="50" height="40" loading="lazy" />
            </div>

            <nav style="background: transparent;">
              <!-- Desktop Menu -->
              <el-menu
                v-if="!isCompactScreen"
                mode="horizontal"
                active-text-color="#00DC82"
                class="el-menu-demo"
                :default-active="activeIndex"
                @select="handleSelect"
                :ellipsis="false"
                style="background: transparent;"
              >
                <el-menu-item index="1">Home</el-menu-item>
                <el-menu-item index="features" @click="scrollToSection('features')">Features</el-menu-item>
                <el-menu-item index="how-it-works" @click="scrollToSection('how-it-works')">How it works</el-menu-item>
                <el-menu-item index="3" @click="handleSelect('3')">Grievances</el-menu-item>
                <el-menu-item index="7" @click="toggleDark" class="theme-toggle">
                  <Icon :icon="isDark ? 'carbon:moon' : 'carbon:sun'" inline />
                </el-menu-item>
              </el-menu>
            </nav>
          </div>
        </el-header>

        <el-main>
          <!-- Slot for page-specific content -->
          <slot></slot>
        </el-main>

        <el-footer>
          <div class="footer-content">
            <div class="left-content">
              <h3 class="footer-title">KeSMIS</h3>
              <p class="footer-description">Kenya Slum Management Information System - A comprehensive platform for managing settlements, grievances, and urban development projects.</p>
              <p class="footer-copyright">&copy; {{ currentYear }} KISIP. All rights reserved.</p>
            </div>
            <div class="right-content">
              <nav>
                <div class="footer-links-group">
                  <h4>Resources</h4>
                  <ul>
                    <li><router-link to="/about">About</router-link></li>
                    <li><router-link to="/faqs">FAQs</router-link></li>
                    <li><router-link to="/contact">Support</router-link></li>
                  </ul>
                </div>
                <div class="footer-links-group">
                   <ul>
                    <li><router-link to="/privacy">Privacy</router-link></li>
                   </ul>
                </div>
              </nav>
            </div>
          </div>
        </el-footer>
      </el-container>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMain, ElMenu, ElMenuItem, ElContainer, ElFooter, ElHeader } from 'element-plus';
import { Icon } from '@iconify/vue';
import { useCache } from '@/hooks/web/useCache';
import { useAppStoreWithOut } from '@/store/modules/app';
import { loginOutApi } from '@/api/login';

// Enable scrolling for landing page
onMounted(() => {
  document.body.classList.add('landing-page-active');
  document.documentElement.classList.add('landing-page-active');
  const app = document.getElementById('app');
  if (app) {
    app.classList.add('landing-page-active');
  }
});

onBeforeUnmount(() => {
  document.body.classList.remove('landing-page-active');
  document.documentElement.classList.remove('landing-page-active');
  const app = document.getElementById('app');
  if (app) {
    app.classList.remove('landing-page-active');
  }
});

const router = useRouter();
const { wsCache } = useCache();
const appStore = useAppStoreWithOut();

// Get current year for copyright
const currentYear = new Date().getFullYear();

const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1600);
const isSmallScreen = computed(() => windowWidth.value <= 768);
const isMediumScreen = computed(() => windowWidth.value > 768 && windowWidth.value <= 1600);
const isCompactScreen = computed(() => isSmallScreen.value || isMediumScreen.value);
const menuOpen = ref(false);
const isDark = computed(() => appStore.getIsDark);
const isScrolled = ref(false);

const prefersDarkQuery = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null;

const handleSystemThemeChange = (event: MediaQueryListEvent) => {
  if (!localStorage.getItem('theme')) {
    appStore.setIsDark(event.matches);
  }
};

const handleDocumentClick = (e: MouseEvent) => {
  if (isCompactScreen.value && menuOpen.value) {
    const mobileMenu = document.querySelector('.mobile-menu-container');
    if (mobileMenu && !mobileMenu.contains(e.target as Node)) {
      menuOpen.value = false;
    }
  }
};

// Function to check system dark mode preference
const checkDarkMode = () => {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = prefersDarkQuery ? prefersDarkQuery.matches : false;
  const shouldUseDark = savedTheme ? savedTheme === 'dark' : prefersDark;

  if (!savedTheme) {
    localStorage.setItem('theme', shouldUseDark ? 'dark' : 'light');
  }

  appStore.setIsDark(shouldUseDark);
};

// Function to toggle dark mode
const toggleDark = () => {
  const next = !appStore.getIsDark;
  localStorage.setItem('theme', next ? 'dark' : 'light');
  appStore.setIsDark(next);
};

// Handle scroll for header transparency and active menu item - optimized with throttling
let ticking = false;
const handleScroll = () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      isScrolled.value = scrollTop > 20;
      
      // Update active menu item based on scroll position
      updateActiveMenuItem();
      
      ticking = false;
    });
    ticking = true;
  }
};

// Update active menu item based on current scroll position
const updateActiveMenuItem = () => {
  const sections = [
    { id: 'features', index: 'features' },
    { id: 'how-it-works', index: 'how-it-works' },
    { id: 'grievances', index: '3' },
  ];
  
  const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  const headerOffset = 100; // Account for fixed header
  
  // Check if we're at the top (home section)
  if (scrollPosition < 200) {
    activeIndex.value = '1';
    return;
  }
  
  // Check each section from bottom to top to find the one currently in view
  // Use a larger threshold (200px) to activate earlier as user scrolls
  for (let i = sections.length - 1; i >= 0; i--) {
    const section = document.getElementById(sections[i].id);
    if (section) {
      const sectionTop = section.offsetTop - headerOffset;
      if (scrollPosition >= sectionTop - 200) { // 200px threshold for early activation
        activeIndex.value = sections[i].index;
        return;
      }
    }
  }
};

// Watch for system theme changes
onMounted(() => {
  windowWidth.value = window.innerWidth;
  checkDarkMode();
  
  prefersDarkQuery?.addEventListener('change', handleSystemThemeChange);

  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', handleDocumentClick);
  
  // Initial scroll check
  handleScroll();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleScroll);
  prefersDarkQuery?.removeEventListener('change', handleSystemThemeChange);
  document.removeEventListener('click', handleDocumentClick);
});

function handleResize() {
  windowWidth.value = window.innerWidth;
  if (windowWidth.value > 1600 && menuOpen.value) {
    menuOpen.value = false;
  }
}

const activeIndex = ref('1');
const isLoggedIn = computed(() => !!wsCache.get(appStore.getUserInfo));

const handleLoginOrLogout = async () => {
  if (isLoggedIn.value) {
    // Logout logic - call API first, then clear cache
    try {
      const userInfo = wsCache.get(appStore.getUserInfo);
      if (userInfo) {
        await loginOutApi(userInfo);
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API fails
    }
    
    wsCache.clear();
    localStorage.clear();
    sessionStorage.clear();
    router.push('/login');
  } else {
    router.push('/login');
  }
};

// Function to open API documentation
const openApiDocs = () => {
  const apiUrl = window.location.origin + '/api-docs';
  window.open(apiUrl, '_blank');
};

const scrollToSection = (sectionId: string) => {
  menuOpen.value = false;
  // Update active index immediately for better UX
  if (sectionId === 'features') {
    activeIndex.value = 'features';
  } else if (sectionId === 'how-it-works') {
    activeIndex.value = 'how-it-works';
  }
  
  // Use setTimeout to ensure DOM is updated and menu is closed
  setTimeout(() => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 90; // Height of fixed header (70px) with extra spacing
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: Math.max(0, offsetPosition), // Ensure we don't scroll to negative position
        behavior: 'smooth'
      });
    }
  }, 150);
};

const handleSelect = (index: string) => {
  activeIndex.value = index;
  menuOpen.value = false; // Close mobile menu after selection
  
  switch (index) {
    case '1':
      // Smooth scroll to top if already on landing page
      if (router.currentRoute.value.path === '/landing' || router.currentRoute.value.path === '/') {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } else {
        router.push('/landing');
      }
      break;
    case '3':
      // Scroll to grievances section if on landing page, otherwise navigate to route
      if (router.currentRoute.value.path === '/landing' || router.currentRoute.value.path === '/') {
        scrollToSection('grievances');
      } else {
        router.push('/landing').then(() => {
          setTimeout(() => {
            scrollToSection('grievances');
          }, 100);
        });
      }
      break;
    case '4':
      router.push('/incidents');
      break;
    case '5':
      router.push('/contact');
      break;
    case '6':
      router.push('/faqs');
      break;
    case 'docs':
      router.push('/docs');
      break;
    case 'get-started':
      if (isLoggedIn.value) {
        router.push('/dashboard/national');
      } else {
        router.push('/login');
      }
      break;
    case '8':
      openApiDocs();
      break;
    default:
      //ElMessage.warning('Page not found.');
  }
};

</script>

<style scoped>
.base-layout {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.3s ease;
  min-height: 100vh;
  overflow: visible;
  height: auto;
}

.base-layout :deep(.el-container) {
  height: auto;
  min-height: 100vh;
  overflow: visible;
}

.landing-page {
  width: 100%;
  overflow: visible;
  height: auto;
}

.el-header {
  background-color: transparent;
  border-bottom: none;
  box-shadow: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background-color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
  height: 70px;
  display: flex;
  align-items: center;
}

.el-header.scrolled {
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.dark-mode .el-header {
  background-color: rgba(26, 26, 26, 0.7);
}

.dark-mode .el-header.scrolled {
  background-color: rgba(26, 26, 26, 0.95);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.el-footer {
  background-color: var(--card-bg);
  border-top: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.el-menu {
  background-color: transparent !important;
  border-right: none;
}

.el-menu-item {
  color: #00DC82;
  font-weight: 450;
  border-radius: 15px !important;
  margin: 0 5px !important;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 220, 130, 0.3);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
}

.el-menu-item:hover {
  background: #00DC82 !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 220, 130, 0.3);
}

.el-menu-item.is-active {
  background: #00DC82 !important;
  color: white !important;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 220, 130, 0.4);
}

/* Special styling for login/logout button */
.login-menu-item {
  background: transparent !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--border-color) !important;
  font-weight: 500;
}

.login-menu-item:hover {
  background: var(--hover-bg) !important;
  color: var(--text-primary) !important;
  transform: translateY(-2px);
}

/* Special styling for primary CTA button */
.primary-menu-item {
  background: #00DC82 !important;
  color: white !important;
  border: none !important;
  font-weight: 600;
}

.primary-menu-item:hover {
  background: #00B86B !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 220, 130, 0.4);
}

.primary-menu-item-mobile {
  background: linear-gradient(135deg, #00DC82 0%, #00B86B 100%);
  color: white !important;
  font-weight: 600;
}

.primary-menu-item-mobile:hover {
  background: linear-gradient(135deg, #00B86B 0%, #00A155 100%);
  color: white !important;
}

/* Special styling for dark mode toggle */
.theme-toggle {
  background: transparent !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--border-color) !important;
  min-width: 50px;
  padding: 12px !important;
}

.theme-toggle:hover {
  background: var(--hover-bg) !important;
  color: var(--text-primary) !important;
  transform: translateY(-2px);
}

.el-sub-menu__title {
  color: var(--text-primary);
}

.el-sub-menu__title:hover {
  background-color: var(--hover-bg);
}

.base-layout :deep(.el-main) {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  padding: 0;
  margin-top: 70px;
  overflow: visible !important;
  height: auto !important;
  max-height: none !important;
}


/* Header styles */
.header-content {
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  background: transparent;
  border-radius: 0;
  position: relative;
  height: 100%;
}

nav {
  background: transparent !important;
}

/* Logo styles */
.logo {
  display: block;
  flex-shrink: 0;
}

.logo img {
  height: 50px;
  width: auto;
  object-fit: contain;
  transition: all 0.3s ease;
}

.logo img:hover {
  transform: scale(1.05);
}

.el-menu-demo {
  display: flex;
  justify-content: center;
  padding: 10px 0;
  gap: 8px;
  background: transparent !important;
}

.el-menu-item {
  padding: 8px 16px !important;
  min-width: auto;
  white-space: nowrap;
  font-size: 0.9rem;
}

/* Mobile menu container */
.mobile-menu-container {
  position: absolute;
  top: 10px;
  left: 10px;
  display: none;
  z-index: 1000;
}

/* Hamburger icon styles */
.hamburger {
  cursor: pointer;
  position: relative;
  z-index: 1100;
  padding: 12px;
  border-radius: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
}

.dark-mode .hamburger {
  background: rgba(26, 26, 26, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.hamburger:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.08);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
}

.dark-mode .hamburger:hover {
  background: rgba(26, 26, 26, 1);
}

.hamburger-icon {
  font-size: 26px;
  color: #2c3e50;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
}

/* Mobile dropdown menu */
.mobile-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.1);
  min-width: 220px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-15px) scale(0.95);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  margin-top: 12px;
  overflow: hidden;
}

.mobile-dropdown-menu.open {
  opacity: 1;
  visibility: visible;
  transform: translateY(0) scale(1);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #2c3e50;
  font-size: 15px;
  font-weight: 500;
  border-bottom: 1px solid #f5f7fa;
  position: relative;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background: linear-gradient(135deg, rgba(104, 64, 53, 0.08), rgba(104, 64, 53, 0.12));
  color: #684035;
  transform: translateX(6px);
  box-shadow: inset 4px 0 0 #684035;
}

.menu-item.is-active {
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.1), rgba(0, 220, 130, 0.15));
  color: #00DC82;
  font-weight: 600;
  box-shadow: inset 4px 0 0 #00DC82;
}

.menu-item.is-active .iconify {
  color: #00DC82;
  opacity: 1;
}

.menu-item:active {
  transform: translateX(2px) scale(0.98);
}

.menu-item .iconify {
  margin-right: 14px;
  font-size: 20px;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: #684035;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.8;
}

.menu-item span {
  flex: 1;
  text-align: left;
}

/* Small & medium screen styles */
@media (max-width: 1600px) {
  .header-content {
    justify-content: flex-end;
    padding: 10px;
    align-items: center;
  }

  .logo {
    display: none; /* Hide logo on mobile */
  }

  .mobile-menu-container {
    display: block;
  }

  .el-menu-demo {
    display: none;
  }
}

/* Footer styles */
.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  max-width: 1280px;
  margin: 0 auto;
  padding: 3rem 2rem;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: var(--text-secondary);
  border-top: 1px solid var(--border-color);
  gap: 3rem;
}

.left-content {
  flex: 1;
  max-width: 400px;
}

.footer-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.footer-description {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.footer-copyright {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.right-content {
  flex: 1;
  display: flex;
  gap: 3rem;
  justify-content: flex-end;
}

.footer-links-group {
  min-width: 120px;
}

.footer-links-group h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.footer-content ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.footer-content ul li {
  margin-bottom: 0.75rem;
}

.footer-content ul li a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9375rem;
  transition: color 0.3s ease;
}

.footer-content ul li a:hover {
  color: #00DC82;
}

/* Responsive styles */
@media (max-width: 1600px) {
  .header-content {
    padding: 15px;
  }

  /* Logo visible on desktop */

  .el-menu-item {
    padding: 0 15px;
  }
}

@media (max-width: 1600px) {
  .base-layout {
    min-height: 100vh;
    overflow-y: visible;
    -webkit-overflow-scrolling: touch;
  }

  .header-content {
    flex-direction: column;
    align-items: center;
    padding: 10px;
  }

  /* Logo visible on desktop */

  .footer-content {
    flex-direction: column;
    text-align: left;
    padding: 2rem 1rem;
    gap: 2rem;
  }

  .left-content {
    max-width: 100%;
  }

  .footer-content p {
    margin-bottom: 15px;
  }

  .right-content {
    flex-direction: column;
    gap: 2rem;
    width: 100%;
  }

  .footer-content ul {
    justify-content: flex-start;
  }

  .footer-content ul li {
    margin: 0 0 0.75rem 0;
  }
}

@media (max-width: 480px) {
  .base-layout {
    min-height: 100vh;
    overflow-y: visible;
    -webkit-overflow-scrolling: touch;
  }


  .hero-content h1 {
    font-size: 2rem;
  }

  .hero-content p {
    font-size: 0.875rem;
  }

  .hero-image img {
    max-width: 100%;
  }
}

.dark-mode .logo img {
  filter: brightness(0) invert(1);
}

.dark-mode .header-content {
  background: #1a1a1a;
}

.dark-mode .el-menu-item {
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff !important;
}

.dark-mode .mobile-dropdown-menu {
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 8px 25px rgba(0, 0, 0, 0.2);
}

.dark-mode .menu-item {
  color: #e8eaed;
  border-bottom-color: #3a3a3a;
}

.dark-mode .menu-item:hover {
  background: linear-gradient(135deg, rgba(104, 64, 53, 0.2), rgba(104, 64, 53, 0.3));
  color: #ffffff;
  box-shadow: inset 4px 0 0 #684035;
}

.dark-mode .menu-item.is-active {
  background: linear-gradient(135deg, rgba(0, 220, 130, 0.2), rgba(0, 220, 130, 0.25));
  color: #00DC82;
  box-shadow: inset 4px 0 0 #00DC82;
}

.dark-mode .menu-item.is-active .iconify {
  color: #00DC82;
  opacity: 1;
}

.dark-mode .menu-item .iconify {
  color: #e8eaed;
  opacity: 0.9;
}

.dark-mode .hamburger-icon {
  color: #e8eaed;
}

.dark-mode .hamburger {
  background: #2c2c2c;
  border: 1px solid #3a3a3a;
}

.dark-mode .hamburger:hover {
  background: #363636;
}

.hero {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
  padding: 100px 20px;
  height: 80vh;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 49%, var(--text-secondary) 49% 51%, transparent 51%), 
              linear-gradient(-45deg, transparent 49%, var(--text-secondary) 49% 51%, transparent 51%);
  background-color: var(--bg-primary);
  background-image: url('@/assets/imgs/background.png');
  opacity: 0.1;
  z-index: -1;
}

.hero > * {
  position: relative;
  z-index: 1;
}
</style>

<style>
/* Global override for landing page - allow scrolling only on body */
body.landing-page-active,
html.landing-page-active {
  overflow-y: auto !important;
  overflow-x: hidden !important;
  height: auto !important;
}

/* Hide scrollbar but keep scrolling functionality */
body.landing-page-active::-webkit-scrollbar,
html.landing-page-active::-webkit-scrollbar {
  display: none;
}

body.landing-page-active,
html.landing-page-active {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

#app.landing-page-active {
  height: auto !important;
  overflow: visible !important;
}

/* Prevent nested scroll containers */
#app.landing-page-active .el-container,
#app.landing-page-active .el-main {
  overflow: visible !important;
  height: auto !important;
  max-height: none !important;
}
</style>