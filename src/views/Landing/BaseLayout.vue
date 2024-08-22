<template>
    <div class="landing-page">
      <el-container>
        <el-header>
          <div class="header-content">
            <div class="logo">
              <img src="@/assets/imgs/1logo.png" alt="Your Company Logo" />
            </div>
            <nav>
              <el-menu mode="horizontal"    active-text-color="#684035"    class="el-menu-demo"  :default-active="activeIndex" @select="handleSelect" :ellipsis=false>
                <el-menu-item index="1">Home</el-menu-item>
                <el-menu-item index="2">Dashboard</el-menu-item>
                <el-menu-item index="3">GRM</el-menu-item>
                <el-menu-item index="4">About</el-menu-item>
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

  const activeIndex = ref('1');
  const router = useRouter();
  
  const handleSelect = (index: string) => {
    activeIndex.value = index;
    console.log( 'activeIndex.value', activeIndex.value)
    
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
      default:
        ElMessage.warning('Page not found.');
    }
  };
  </script>
  
  <style scoped>
   .landing-page {
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

/* Header styles */
.header-content {
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

/* Navigation menu styles */
.el-menu-demo {
  display: flex;
  justify-content: center;
  padding: 0;
}

.el-menu-item {
  padding: 0 20px;
}

/* Main content styles */
.el-main {
  padding: 20px;
}

/* Footer styles */
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

  .footer-content ul {
    flex-direction: column;
    align-items: center;
  }

  .footer-content ul li {
    margin: 10px 0;
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
    padding: 10px;
  }

  .footer-content ul {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .hero-content h1 {
    font-size: 2rem; /* Adjust the font size for very small screens */
  }

  .hero-content p {
    font-size: 0.875rem; /* Adjust the font size for very small screens */
  }

  .hero-image img {
    max-width: 100%;
  }

  .footer-content ul li {
    margin: 5px 0;
  }
}

  </style>
  