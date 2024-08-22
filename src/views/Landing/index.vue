<template>
  <div class="landing-page">
    <el-container>
      <el-header>
        <div class="header-content">
          <div class="logo">
            <img src="@/assets/imgs/1logo.png" alt="Your Company Logo" />
          </div>
          <nav>
            <el-menu mode="horizontal" :default-active="activeIndex" @select="handleSelect">
              <el-menu-item index="1">Home</el-menu-item>
              <el-menu-item index="2">Dashboard</el-menu-item>
              <el-menu-item index="3">GRM</el-menu-item>
              <el-menu-item index="4">About</el-menu-item>
            </el-menu>
          </nav>
        </div>
      </el-header>

      <el-main>
        <div class="hero">
          <div class="hero-content">
            <h1>Welcome to KeSMIS</h1>
            <p>Kenya Slum Management Information System</p>
            <el-button type="primary" size="large">Get Started</el-button>
            <el-button type="primary" size="large">File Grievance</el-button>
          </div>
          <div class="hero-image">
            <img src="@/assets/svgs/kisip.svg" alt="Hero Image" />
          </div>
        </div>
      </el-main>

      <el-footer>
        <div class="footer-content">
          <p>&copy; 2024 Kenya Informal Settlements Improvement Project. All rights reserved.</p>
          <nav>  

            <ul>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </nav>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage,ElMain,ElMenu,ElMenuItem,ElButton } from 'element-plus';

// Reactive variable for tracking the active menu item
const activeIndex = ref('1');
const router = useRouter();

// Function to handle menu selection
const handleSelect = (index: string) => {
  activeIndex.value = index;
  
  switch (index) {
    case '1':
      router.push('/landing'); // Navigate to Home
      break;
    case '2':
      router.push('/login'); // Navigate to Features
      break;
    case '3':
      router.push('/grm'); // Navigate to Pricing
      break;
    case '4':
      router.push('/about'); // Navigate to Contact
      break;
    default:
      ElMessage.warning('Page not found.');
  }
};
</script>

<style scoped>
.landing-page {
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.header-content,
.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
}

.logo img {
  height: 50px;
}

.hero {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
  padding: 100px 20px;
  background-color: #f5f5f5;
  //background-image: url('@/assets/svgs/kisip.svg.jpg');
  background-size: cover;
  background-position: center;
  color: #030303;
  height: 70vh;
}

.hero-content h1 {
  font-size: 5rem;
  margin-bottom: 1rem;
  font-weight: bold;
  color: #070707;
}

.hero-content p {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  color: #696969;
}

.hero-image img {
  max-width: 70%;
  height: auto;
  margin-top: 30px;
}

.footer-content {
  border-top: 1px solid #e5e5e5;
  text-align: center;
  padding: 20px;
  color: #666;
}

.footer-content ul {
  display: flex;
  justify-content: center;
  list-style-type: none;
  padding: 0;
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
</style>
