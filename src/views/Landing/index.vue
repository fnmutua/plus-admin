<template>
   <BaseLayout>
    <div class="hero">
      <div class="hero-content">
        <h1>Welcome to KeSMIS</h1>
        <p>Kenya Slum Management Information System</p>
      
  
        
          <el-button type="primary" size="large"   @click="navigateTo('get-started')">Get Started</el-button>
 
       
         <el-button type="primary" size="large" @click="navigateTo('grm')" plain>File Grievance</el-button>
  

       
 
 
      

      </div>
      <div class="hero-image">
        <img src="@/assets/svgs/kisip.svg" alt="Hero Image" />
      </div>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ElButton , ElCol,ElRow, ElButtonGroup} from 'element-plus';
import BaseLayout from './BaseLayout.vue';


const router = useRouter();

 

// Function to handle button navigation
const navigateTo = (page: string) => {
  switch (page) {
    case 'get-started':
      router.push('/login'); // Navigate to Get Started page
      break;
    case 'grm':
      router.push('/grm'); // Navigate to File Grievance page
      break;
    default:
      router.push('/'); // Navigate to Home or fallback page
      break;
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


/* Media Query for small screens */
@media (max-width: 768px) {
  .hero {
    padding: 30px 15px; /* Further reduced padding for small screens */
    height: auto; /* Adjust height */
  }

  .hero-content h1 {
    font-size: 2rem; /* Smaller font size for small screens */
  }

  .hero-content p {
    font-size: 1rem; /* Smaller font size for small screens */
  }

  .hero-image img {
    max-width: 80%; /* Slightly reduce image size */
    margin-top: 20px;
  }
}

</style>