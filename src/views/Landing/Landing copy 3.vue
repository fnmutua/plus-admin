
 
<template>

<el-menu
  :default-active="activeIndex"
  text-color="white"
  background-color="#24292e"  

    active-text-color="#ffd04b"
      class="el-menu-demo"
  mode="horizontal"
  :ellipsis="true"
   @select="handleSelect"

>
<!-- background-color="transparent" -->

<!-- background-color="#545c64" -->

  <el-menu-item index="0">
    <!-- <img src="@/assets/imgs/logo.png" class="w-[calc(var(--logo-height)-10px)] h-[calc(var(--logo-height)-10px)]" /> -->
    KSIS
  </el-menu-item>


  <div class="flex-grow" ></div>
  <el-menu-item index="home" >Home</el-menu-item>

  <el-menu-item index="about">About</el-menu-item>
  <el-menu-item index="dashboard">Dashboards</el-menu-item>
  <el-menu-item index="4">Resources</el-menu-item>
  <el-menu-item index="5">FAQs</el-menu-item>
  <el-menu-item index="6">Partners</el-menu-item>
</el-menu>

  


      <el-main>
      <div v-if="activeIndex === 'home'">
        <div class="my-container">

        <h4 class="title">
        Monitoring the Status of Slums and Informal Settlements in Kenya
        <el-button
           type="success"
          size="large"
          round
           @click="$router.push('login')"
        >Get Started  
        </el-button> 
      </h4>
    </div>

      </div>
      <div  v-if="activeIndex === 'about'" id="about" style="  justify-content: center; align-items: center;">
        <el-row >
          <el-col :span="12"><div class="grid-content ep-bg-purple"></div>
          
            <el-card class="box-card">
    <div v-for="o in 4" :key="o" class="text item">{{ 'List item ' + o }}</div>
  </el-card>
          
          </el-col>
          <el-col :span="12"><div class="grid-content ep-bg-purple"></div>ss</el-col>
        </el-row>
      </div>
      <div v-if="activeIndex === 'dashboard'">
        <h4 class="title">Dashboards </h4>
        <h1>More Page</h1>

        <p>Find out more information here.</p>
      </div>
    </el-main>






</template>
<script setup lang="ts">
import { usePermissionStore } from '@/store/modules/permission'
import { useRouter } from 'vue-router'
import { ref } from 'vue';

import {
ElButton,ElMain,ElHeader, ElCard, ElCol,ElRow, ElMenu,ElMenuItem,ElMenuItemGroup,ElCarousel,ElCarouselItem

} from 'element-plus'
    


const { push } = useRouter()
 
const activeIndex = ref('home');

function handleSelect(index) {
      activeIndex.value = index;
    }

 


</script>



<style>
.flex-grow {
flex-grow: 1;
}

.my-container {
 min-height: 100%;
width: 100%;
 background-image: url("@/assets/imgs/sat5.png");
}

 
    .subtitle {
      font-size: 18px;
      color: red;
      letter-spacing: 23px;
      font-family: "Raleway";
      margin: 160px auto 40px auto;
      text-align: center;
      font-weight: bold;
    }

    .title {
      font-size: 36px;
      color: gainsboro;
      font-family: "arial";
       margin-left: 5%;
      margin-top: 15%;
      text-align: left;
      line-height: "43px";
      font-weight: 700;
      width: 400px; /* set the width of the box */
      height: 300px; /* set the height of the box */
      overflow: auto; /* allow scrolling if text overflows the box */
      word-wrap: break-word; /* break words to fit inside the box */
      text-wrap: unrestricted; /* allow wrapping of text even if there is no whitespace */
}
.secheader {
      font-size: 36px;
      color: gainsboro;
      font-family: "arial";
       margin-left: 5%;
      margin-top: 15%;
      text-align: left;
       font-weight: 700;
      width: 400px; /* set the width of the box */
      height: 100px; /* set the height of the box */
      overflow: auto; /* allow scrolling if text overflows the box */
      word-wrap: break-word; /* break words to fit inside the box */
      text-wrap: unrestricted; /* allow wrapping of text even if there is no whitespace */
}
    

    h1 {
  font-family: "Proza Libre", sans-serif;
  color: #e6ede9;
  font-weight: 300;
}


.button-container {
  text-align: left;
}
 
</style>
