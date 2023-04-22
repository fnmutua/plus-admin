<template>
  <div>
    <el-header>
      <el-menu mode="horizontal" @select="handleSelect" style="padding-left: -8">
        <el-menu-item index="home">Home</el-menu-item>
        <el-menu-item index="about">About</el-menu-item>
        <el-menu-item index="more">More</el-menu-item>
      </el-menu>
    </el-header>
    <el-main>
      <div v-if="activeIndex === 'home'">
        <h1>Home Page</h1>
        <p>Welcome to the home page!</p>
      </div>
      <div v-if="activeIndex === 'about'">
        <h1>About Page</h1>
        <p>Learn more about us!</p>
      </div>
      <div v-if="activeIndex === 'more'">
        <h1>More Page</h1>
        <p>Find out more information here.</p>
      </div>
    </el-main>
  </div>
</template>

<script>
import { ref } from 'vue';
import { ElHeader, ElMenu, ElMenuItem, ElMain } from 'element-plus';

export default {
  components: {
    ElHeader,
    ElMenu,
    ElMenuItem,
    ElMain,
  },
  setup() {
    const activeIndex = ref('home');

    function handleSelect(index) {
      activeIndex.value = index;
    }

    return {
      activeIndex,
      handleSelect,
    };
  },
};
</script>
