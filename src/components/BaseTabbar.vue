<script setup>
import { ref, onMounted } from "vue";

const active = ref("index");

function setActiveByRoute() {
  const page = getCurrentPages().pop();

  if (page && page.route) {
    if (page.route.includes("index")) {
      active.value = "index";
    } else if (page.route.includes("task")) {
      active.value = "task";
    } else if (page.route.includes("user")) {
      active.value = "user";
    }
  }
}

function onTabChange(name) {
  if (name === "index") {
    uni.reLaunch({ url: "/pages/index/index" });
  } else if (name === "task") {
    uni.reLaunch({ url: "/pages/task/task" });
  } else if (name === "user") {
    uni.reLaunch({ url: "/pages/user/user" });
  }
}

onMounted(() => {
  setActiveByRoute();
  // 监听路由变化（H5端）
  if (typeof window !== "undefined") {
    window.addEventListener("hashchange", setActiveByRoute);
  }
});
</script>

<template>
  <van-tabbar v-model="active" @change="onTabChange">
    <van-tabbar-item icon="home-o" name="index">首页</van-tabbar-item>
    <van-tabbar-item icon="todo-list-o" name="task">我的任务</van-tabbar-item>
    <van-tabbar-item icon="user-o" name="user">关于我</van-tabbar-item>
  </van-tabbar>
</template>

<style scoped>
.van-tabbar {
  z-index: 13;
}
</style>
