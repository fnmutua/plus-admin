<template>
  <div class="base-layout" :class="{ 'dark-mode': isDark }">
    <div class="landing-page">
      <el-container>
        <el-header>
          <div class="header-content">
            <!-- Mobile Menu (Top left) -->
            <div v-if="isSmallScreen" class="mobile-menu-container">
              <!-- Hamburger icon for small screens -->
              <div class="hamburger" @click="menuOpen = !menuOpen">
                <Icon icon="mdi:menu" class="hamburger-icon" />
              </div>
              
              <!-- Dropdown Menu -->
              <div class="mobile-dropdown-menu" :class="{ open: menuOpen }" @click.stop>
                <div class="menu-item" @click="handleSelect('1')">
                  <Icon icon="mdi:home" />
                  <span>Home</span>
                </div>
                <div class="menu-item" @click="handleSelect('3')">
                  <Icon icon="mdi:file-document-outline" />
                  <span>Grievances</span>
                </div>
                <div class="menu-item" @click="handleSelect('4')">
                  <Icon icon="mdi:alert-circle-outline" />
                  <span>Incident</span>
                </div>
                <div class="menu-item" @click="handleLoginOrLogout">
                  <Icon :icon="isLoggedIn ? 'mdi:logout' : 'mdi:login'" />
                  <span>{{ isLoggedIn ? 'Logout' : 'Login' }}</span>
                </div>
                <div class="menu-item" @click="toggleDark">
                  <Icon :icon="isDark ? 'carbon:moon' : 'carbon:sun'" />
                  <span>{{ isDark ? 'Dark Mode' : 'Light Mode' }}</span>
                </div>
              </div>
            </div>

            <!-- Logo (Desktop only) -->
            <div v-if="!isSmallScreen" class="logo">
              <img src="@/assets/imgs/1logo.png" alt="KISIP - Kenya Informal Settlements Improvement Project" width="50" height="40" loading="lazy" />
            </div>

            <nav style="background: transparent;">
              <!-- Desktop Menu -->
              <el-menu
                v-if="!isSmallScreen"
                mode="horizontal"
                active-text-color="#684035"
                class="el-menu-demo"
                :default-active="activeIndex"
                @select="handleSelect"
                :ellipsis="false"
                style="background: transparent;"
              >
                <el-menu-item index="1">Home</el-menu-item>
                <el-menu-item index="3">Grievances</el-menu-item>
                <el-menu-item index="4">Incident</el-menu-item>
                <el-menu-item index="2" @click="handleLoginOrLogout">{{ isLoggedIn ? 'Logout' : 'Login' }}</el-menu-item>
                <el-menu-item index="7" @click="toggleDark">
                  <Icon :icon="isDark ? 'carbon:moon' : 'carbon:sun'" inline />
                </el-menu-item>
              </el-menu>
            </nav>
          </div>
        </el-header>

        <el-main class="main-content">
          <div class="content-wrapper">
            <!-- Slot for page-specific content -->
            <slot></slot>
          </div>
        </el-main>

        <el-footer>
          <div class="footer-content">
            <div class="left-content">
              <p>&copy; 2024 KISIP. All rights reserved.</p>
            </div>
            <div class="right-content">
              <nav>
                <ul>
                  <li><router-link to="/privacy">Privacy Policy</router-link></li>
                  <li><router-link to="/contact">Contact Us</router-link></li>
                </ul>
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

const isSmallScreen = computed(() => window.innerWidth <= 768);
const menuOpen = ref(false);
const isDark = ref(false);

// Function to check system dark mode preference
const checkDarkMode = () => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  isDark.value = savedTheme ? savedTheme === 'dark' : prefersDark;
};

// Function to toggle dark mode
const toggleDark = () => {
  isDark.value = !isDark.value;
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

// Watch for system theme changes
onMounted(() => {
  checkDarkMode();
  
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      isDark.value = e.matches;
    }
  });

  window.addEventListener('resize', handleResize);
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (isSmallScreen.value && menuOpen.value) {
      const mobileMenu = document.querySelector('.mobile-menu-container');
      if (mobileMenu && !mobileMenu.contains(e.target as Node)) {
        menuOpen.value = false;
      }
    }
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

function handleResize() {
  if (window.innerWidth > 768 && menuOpen.value) {
    menuOpen.value = false;
  }
}

const activeIndex = ref('1');
const router = useRouter();
const { wsCache } = useCache();
const appStore = useAppStoreWithOut();
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

const handleSelect = (index: string) => {
  activeIndex.value = index;
  menuOpen.value = false; // Close mobile menu after selection
  console.log("Index", activeIndex.value);
  switch (index) {
    case '1':
      router.push('/landing');
      break;
    case '3':
      router.push('/grm');
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
    case '8':
      openApiDocs();
      break;
    default:
      //ElMessage.warning('Page not found.');
  }
};

</script>

<style scoped>
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f7fa;
  --text-primary: #2c3e50;
  --text-secondary: #606266;
  --border-color: #dcdfe6;
  --accent-color: #409eff;
  --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  --card-bg: #ffffff;
  --hover-bg: #f5f7fa;
  --disabled-bg: #f5f7fa;
  --disabled-text: #c0c4cc;
}

.dark-mode {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2c2c2c;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --border-color: #3a3a3a;
  --accent-color: #4a9eff;
  --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  --card-bg: #2c2c2c;
  --hover-bg: #363636;
  --disabled-bg: #2c2c2c;
  --disabled-text: #666666;
}

.base-layout {
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.3s ease;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.el-header {
  background-color: transparent;
  border-bottom: none;
  box-shadow: none;
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
  color: var(--el-color-primary);
  font-weight: 450;
  border-radius: 15px !important;
  margin: 0 5px !important;
  transition: all 0.3s ease;
  border: 1px solid rgba(64, 158, 255, 0.3);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
}

.el-menu-item:hover {
  background: var(--el-color-primary) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.el-menu-item.is-active {
  background: var(--el-color-primary) !important;
  color: white !important;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Special styling for login/logout button */
.el-menu-item[index="2"] {
  background: transparent !important;
  color: #4CAF50 !important;
  border: 1px solid #4CAF50 !important;
  font-weight: 700;
}

.el-menu-item[index="2"]:hover {
  background: #4CAF50 !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

/* Special styling for dark mode toggle */
.el-menu-item[index="7"] {
  background: transparent !important;
  color: #6366f1 !important;
  border: 1px solid #6366f1 !important;
  min-width: 50px;
  padding: 12px !important;
}

.el-menu-item[index="7"]:hover {
  background: #6366f1 !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.el-sub-menu__title {
  color: var(--text-primary);
}

.el-sub-menu__title:hover {
  background-color: var(--hover-bg);
}

.el-main {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.main-content {
  padding: 0;
  min-height: calc(100vh - 120px);
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100%;
  width: 100%;
}

/* Header styles */
.header-content {
  max-width: 100%;
  margin: 10 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #ffffff;
  border-radius: 8px;
  position: relative;
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
  background: #ffffff;
  border: 1px solid #e8eaed;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
}

.hamburger:hover {
  background: #f8f9fa;
  transform: scale(1.08);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
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
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8eaed;
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

/* Small screen styles */
@media (max-width: 768px) {
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
  align-items: center;
  max-width: 100%;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: var(--text-secondary);
  border-top: 1px solid var(--border-color);
}

.left-content {
  flex: 1;
}

.right-content {
  flex: 1;
  text-align: right;
}

.footer-content ul {
  list-style-type: none;
  padding: 0;
  display: flex;
  justify-content: flex-end;
  margin: 0;
}

.footer-content ul li {
  margin-left: 1.5rem;
}

.footer-content ul li a {
  color: var(--text-secondary);
  text-decoration: none;
}

.footer-content ul li a:hover {
  color: var(--accent-color);
}

/* Responsive styles */
@media (max-width: 1024px) {
  .header-content {
    padding: 15px;
  }

  /* Logo visible on desktop */

  .el-menu-item {
    padding: 0 15px;
  }
}

@media (max-width: 768px) {
  .base-layout {
    height: 100vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .header-content {
    flex-direction: column;
    align-items: center;
    padding: 10px;
  }

  /* Logo visible on desktop */

  .main-content {
    min-height: calc(100vh - 100px);
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    flex: 1;
  }

  .content-wrapper {
    padding: 10px;
    width: 100%;
    max-width: 100%;
    min-height: auto;
  }

  .footer-content {
    flex-direction: column;
    text-align: center;
  }

  .footer-content p {
    margin-bottom: 15px;
  }

  .footer-content ul {
    justify-content: center;
  }

  .footer-content ul li {
    margin: 0 0.5rem;
  }
}

@media (max-width: 480px) {
  .base-layout {
    height: 100vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .main-content {
    min-height: calc(100vh - 80px);
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    flex: 1;
  }

  .content-wrapper {
    padding: 5px;
    width: 100%;
    max-width: 100%;
    min-height: auto;
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
}

.dark-mode .mobile-dropdown-menu {
  background: #2c2c2c;
  border-color: #3a3a3a;
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
