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
    background-size: cover;
  background-position: center;
   height: 70vh;
}

.xhero {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
  padding: 100px 20px;
  background: radial-gradient(circle at center, #e0dff5 15%, transparent 2%) 0 0,
              repeating-linear-gradient(0deg, transparent 2.5%, #ffffff 7%, #ffffff 9%, transparent 10%) 0 0,
              linear-gradient(45deg, transparent 49%, #e0dff5 49%, #e0dff5 51%, transparent 51%) 0 0,
              linear-gradient(-45deg, transparent 49%, #e0dff5 49%, #e0dff5 51%, transparent 51%) 0 0;
  background-size: 6em 6em;
  background-color: #ffffff;
  opacity: 1;
  height: 70vh;
}

.hero-content h1 {
  font-size: 5rem;
  margin-bottom: 1rem;
  font-weight: bold;
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