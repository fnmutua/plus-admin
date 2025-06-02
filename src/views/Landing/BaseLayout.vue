<template>
  <div class="base-layout" :class="{ 'dark-mode': isDark }">
    <div class="landing-page">
      <el-container>
        <el-header>
          <div class="header-content">
            <div v-if="!isSmallScreen || menuOpen" class="logo">
              <img src="@/assets/imgs/1logo.png" alt="KISIP" />
            </div>
            <nav>
              <!-- Hamburger icon for small screens -->
              <div class="hamburger" @click="menuOpen = !menuOpen">
                <Icon icon="mdi:menu" class="hamburger-icon" />
              </div>
              <!-- Menu -->
              <el-menu
                :class="{ open: isSmallScreen && menuOpen }"
                mode="horizontal"
                active-text-color="#684035"
                class="el-menu-demo"
                :default-active="activeIndex"
                @select="handleSelect"
                :ellipsis="false"
              >
                <el-menu-item index="1">Home</el-menu-item>
                <el-menu-item index="3">Grievances</el-menu-item>
                <el-menu-item index="5">Contact</el-menu-item>
                <el-menu-item index="4">About</el-menu-item>
                <el-menu-item index="6">FAQs</el-menu-item>
                <el-menu-item index="2">Login</el-menu-item>
                <el-menu-item index="7" @click="toggleDark">
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
import { ElMessage, ElMain, ElMenu, ElMenuItem, ElContainer, ElFooter, ElHeader } from 'element-plus';
import { Icon } from '@iconify/vue';

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

const handleSelect = (index: string) => {
  activeIndex.value = index;
  console.log("Index", activeIndex.value);
  switch (index) {
    case '1':
      router.push('/landing');
      break;
    case '2':
      router.push('/login');
      break;
    case '3':
      router.push('/grm');
      break;
    case '4':
      router.push('/about');
      break;
    case '5':
      router.push('/contact');
      break;
    case '6':
      router.push('/privacy');
      break;
    default:
      ElMessage.warning('Page not found.');
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
}

.el-header {
  background-color: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--card-shadow);
}

.el-footer {
  background-color: var(--card-bg);
  border-top: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.el-menu {
  background-color: var(--card-bg);
  border-right: 1px solid var(--border-color);
}

.el-menu-item {
  color: var(--text-primary);
}

.el-menu-item:hover {
  background-color: var(--hover-bg);
}

.el-menu-item.is-active {
  color: var(--accent-color);
  background-color: var(--hover-bg);
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

/* Header styles */
.header-content {
  max-width: 100%;
  margin: 10 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
}

.logo img {
  height: 50px;
}

.el-menu-demo {
  display: flex;
  justify-content: center;
  padding: 0;
}

.el-menu-item {
  padding: 0 20px;
}

/* Hamburger icon styles */
.hamburger {
  display: none;
  cursor: pointer;
  position: absolute;
  right: 20px;
  top: 20px;
  z-index: 1100;
}

.hamburger-icon {
  font-size: 24px;
  color: var(--text-primary);
}

/* Small screen styles */
@media (max-width: 768px) {
  .header-content {
    justify-content: flex-end;
    padding: 10px;
  }

  .logo {
    display: none;
  }

  .hamburger {
    display: block;
  }

  .el-menu-demo {
    display: none;
    position: fixed;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background-color: var(--card-bg);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .el-menu-demo.open {
    display: flex;
  }

  .el-menu-item {
    color: var(--text-primary);
    padding: 20px 0;
    font-size: 18px;
    text-align: center;
  }

  .el-menu-item:hover {
    background-color: var(--hover-bg);
    border-radius: 8px;
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

  .logo img {
    height: 40px;
  }

  .el-menu-item {
    padding: 0 15px;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: center;
    padding: 10px;
  }

  .logo img {
    height: 50px;
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
