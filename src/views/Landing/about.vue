<template>
    

  <BaseLayout>
    <div class="hero"> 
    <div class="about-content">
          <h1>About KeSMIS</h1>
          <p>Kenya Slum Management Information System (KeSMIS) is an innovative platform aimed at improving the living conditions in slums across Kenya. Through comprehensive data collection, management, and analysis, KeSMIS provides critical insights that inform policy decisions and development strategies.</p>
          
          <p>Our mission is to empower communities and stakeholders by providing access to reliable information and tools necessary for effective slum management and urban planning.</p>
          
          <p>KeSMIS is part of the Kenya Informal Settlements Improvement Project (KISIP), which is committed to transforming informal settlements into sustainable and livable environments.</p>
          
          <el-button type="primary" size="large">Learn More</el-button>
        </div>
      </div>
  </BaseLayout>


</template>

<script setup lang="ts">
import { ElButton } from 'element-plus';
import BaseLayout from './BaseLayout.vue';


 
</script>

<style scoped>
.about-page {
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

 

.logo img {
  height: 50px;
}

.about-content {
  padding: 100px 20px;
  text-align: center;
 }

.about-content h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: bold;
 }

.about-content p {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  color: #696969;
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
  background: linear-gradient(45deg, transparent 49%, #ececec 49% 51%, transparent 51%), 
              linear-gradient(-45deg, transparent 49%, #ececec 49% 51%, transparent 51%);
  background-color: #ffffff;
  background-image: url('@/assets/imgs/background.png'); /* Correct syntax for background image */

  opacity: 0.1;
  z-index: -1; /* Ensure the background is behind the content */
}

.hero > * {
  position: relative;
  z-index: 1; /* Ensure content is above the background */
}



</style>
