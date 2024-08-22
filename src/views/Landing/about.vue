<template>
  <div class="about-page">
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
        <div class="about-content">
          <h1>About KeSMIS</h1>
          <p>Kenya Slum Management Information System (KeSMIS) is an innovative platform aimed at improving the living conditions in slums across Kenya. Through comprehensive data collection, management, and analysis, KeSMIS provides critical insights that inform policy decisions and development strategies.</p>
          
          <p>Our mission is to empower communities and stakeholders by providing access to reliable information and tools necessary for effective slum management and urban planning.</p>
          
          <p>KeSMIS is part of the Kenya Informal Settlements Improvement Project (KISIP), which is committed to transforming informal settlements into sustainable and livable environments.</p>
          
          <el-button type="primary" size="large">Learn More</el-button>
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
import { ElMessage, ElMain, ElMenu, ElMenuItem, ElButton } from 'element-plus';

const activeIndex = ref('4');
const router = useRouter();

const handleSelect = (index: string) => {
  activeIndex.value = index;
  
  switch (index) {
    case '1':
      router.push('/landing'); // Navigate to Home
      break;
    case '2':
      router.push('/login'); // Navigate to Dashboard
      break;
    case '3':
      router.push('/grm'); // Navigate to GRM
      break;
    case '4':
      router.push('/about'); // Stay on About
      break;
    default:
      ElMessage.warning('Page not found.');
  }
};
</script>

<style scoped>
.about-page {
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

.about-content {
  padding: 100px 20px;
  text-align: center;
  color: #030303;
}

.about-content h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: bold;
  color: #070707;
}

.about-content p {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  color: #696969;
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
