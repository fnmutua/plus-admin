<template>
 
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
              <el-menu-item index="2">Dashboard</el-menu-item>
              <el-menu-item index="3">Grievances</el-menu-item>
              <el-menu-item index="5">Contact</el-menu-item>
              <el-menu-item index="4">About</el-menu-item>
              <el-menu-item index="6">FAQs</el-menu-item>
              <el-menu-item index="7">
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
</template>

 

<script setup lang="ts">
import { ref ,onMounted, onBeforeUnmount} from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMain, ElMenu, ElMenuItem, ElContainer, ElFooter ,ElHeader} from 'element-plus';

import { useDark, useToggle } from "@vueuse/core";
import { Icon } from '@iconify/vue';

import { computed } from 'vue'

;
const isSmallScreen = computed(() => window.innerWidth <= 768);

const menuOpen = ref(false);
 
const isDark = useDark();
  const toggleDark = useToggle(isDark);


onMounted(() => {
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
  console.log("Index", activeIndex.value  )
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
      
      case '7':
      toggleDark()
      break;

    default:
      ElMessage.warning('Page not found.');
  }
};
</script>

<style scoped>
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
  position: absolute; /* Absolute positioning */
  right: 20px; /* Adjust as needed */
  top: 20px; /* Adjust as needed */
  z-index: 1100; /* Ensure it is above other content */
}

.hamburger-icon {
  font-size: 24px;
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

  /* Fullscreen overlay for the menu */
  .el-menu-demo {
    display: none;
    position: fixed;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.95); /* White background with slight transparency */
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .el-menu-demo.open {
    display: flex;
  }

  .el-menu-item {
    color: #000; /* Black text for better visibility on white background */
    padding: 20px 0;
    font-size: 18px;
    text-align: center; /* Center-align text */
  }

  /* Additional styles for hover effect */
  .el-menu-item:hover {
    background-color: #f0f0f0; /* Light gray background on hover */
    border-radius: 8px; /* Rounded corners */
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
  color: #666;
  border-top: 1px solid #e5e5e5;
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
  color: #666;
  text-decoration: none;
}

.footer-content ul li a:hover {
  color: #409eff;
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

/* Dark mode styles */
.dark-mode .header-content {
  background-color: #333;
  color: #fff;
}

.dark-mode .el-menu-demo {
  background-color: rgba(0, 0, 0, 0.95); /* Dark background with slight transparency */
}

.dark-mode .el-menu-item {
  color: #fff;
}

.dark-mode .el-menu-item:hover {
  background-color: #444; /* Darker gray background on hover */
}

.dark-mode .footer-content {
  background-color: #333;
  color: #fff;
  border-top: 1px solid #555;
}

.dark-mode .footer-content ul li a {
  color: #fff;
}

.dark-mode .footer-content ul li a:hover {
  color: #409eff;
}

.dark-mode .hamburger-icon {
  color: #fff;
}

.dark-mode .logo img {
  filter: brightness(0) invert(1); /* Invert logo color for dark mode */
}
</style>
