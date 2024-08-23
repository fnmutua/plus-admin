<template>
  <div class="landing-page">
    <el-container>
      <el-header>
        <div class="header-content">
          <div class="logo">
            <img src="@/assets/imgs/1logo.png" alt="KISIP" />
          </div>
          <nav>
            <el-menu
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
              <el-menu-item   index="7" >
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMain, ElMenu, ElMenuItem, ElContainer, ElFooter ,ElHeader} from 'element-plus';

import { useDark, useToggle } from "@vueuse/core";
import { Icon } from '@iconify/vue';

  const isDark = useDark();
  const toggleDark = useToggle(isDark);

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
.landing-page {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Ensure el-container grows and allows scrolling */
.el-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.el-main {
  flex-grow: 1;
  padding: 20px;
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

/* Navigation menu styles */
.el-menu-demo {
  display: flex;
  justify-content: center;
  padding: 0;
}

.el-menu-item {
  padding: 0 20px;
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
</style>
