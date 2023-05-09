
 
<template>
  <div class="my-container">

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
    KeSIS
  </el-menu-item>


  <div class="flex-grow" ></div>
  <el-menu-item index="1" @click="scrollTo('home-section')">Home</el-menu-item>

  <el-menu-item index="2">About</el-menu-item>
  <el-menu-item index="3">Dashboards</el-menu-item>
  <el-menu-item index="4">Resources</el-menu-item>
  <el-menu-item index="5">FAQs</el-menu-item>
  <el-menu-item index="6">Partners</el-menu-item>
</el-menu>

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

 

        <!-- <div class="button-container">

      <el-button
           type="success"
          size="large"
          round
           @click="$router.push('login')"
        >Get Started  
        </el-button>    </div> -->

        <div id="home-section">
      <h2>Home Section</h2>
      <p>Some dummy text goes here...</p>
    </div>



</div>



</template>
<script setup lang="ts">
import { Error } from '@/components/Error'
import { usePermissionStore } from '@/store/modules/permission'
import { useRouter } from 'vue-router'
import {
ElButton, ElMenu,ElMenuItem,ElMenuItemGroup,ElCarousel,ElCarouselItem

} from 'element-plus'
    


const { push } = useRouter()

const permissionStore = usePermissionStore()

const errorClick = () => {
console.log(permissionStore.addRouters[0]?.path )
push(permissionStore.addRouters[0]?.path as string)
}

const scrollTo = (id) =>{
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
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
      height: 400px; /* set the height of the box */
      overflow: auto; /* allow scrolling if text overflows the box */
      word-wrap: break-word; /* break words to fit inside the box */
      text-wrap: unrestricted; /* allow wrapping of text even if there is no whitespace */
}

    .xtitle {
      font-size: 42px;
      color: gainsboro;
      font-family: "arial";
      margin: 280px auto 40px auto;
      text-align: left;
      line-height: "43px";
      font-weight: 700;
    }

    h1 {
  font-family: "Proza Libre", sans-serif;
  color: seagreen;
  font-weight: 300;
}


.button-container {
  text-align: left;
}
 
</style>
