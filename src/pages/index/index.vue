<script setup>
import { ref, onMounted } from "vue";
import { checkLogin } from "@/utils/util.js";
import BaseTabbar from "@/components/BaseTabbar.vue";

// 常用工具列表
const toolsList = ref([
  {
    icon: "todo-list-o",
    name: "我的任务",
    path: "/pages/task/task",
  },
  {
    icon: "chart-trending-o",
    name: "我的绩效",
    path: "/pages/performance/performance",
  },
  {
    icon: "contact",
    name: "个人中心",
    path: "/pages/user/user",
  },
]);

// 页面跳转
function navigateTo(path) {
  uni.navigateTo({
    url: path,
  });
}

// 返回上一页
function goBack() {
  uni.navigateBack({
    delta: 1,
  });
}

onMounted(() => {
  checkLogin();
});
</script>

<template>
  <view class="page-container">
    <!-- 页面内容 -->
    <view class="page-content">
      <!-- 常用工具标题 -->
      <view class="section-title">
        <view class="line"></view>
        <text>常用工具</text>
        <view class="line"></view>
      </view>

      <!-- 常用工具列表 -->
      <view class="tools-grid">
        <view
          class="tool-item"
          v-for="(tool, index) in toolsList"
          :key="index"
          @click="navigateTo(tool.path)"
        >
          <view class="tool-icon">
            <van-icon :name="tool.icon" size="28" />
          </view>
          <text class="tool-name">{{ tool.name }}</text>
        </view>
      </view>
    </view>

    <!-- 底部选项卡 -->
    <BaseTabbar />
  </view>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 100rpx;
  box-sizing: border-box;
}

.back-icon {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 36rpx;
  font-weight: 500;
}

.placeholder {
  width: 48rpx;
}

.page-content {
  padding: 28rpx 32rpx 0;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 40rpx 0;
}

.section-title text {
  font-size: 32rpx;
  color: #333;
  margin: 0 20rpx;
}

.line {
  height: 1px;
  background-color: #ddd;
  flex: 1;
}

.tools-grid {
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  margin: 0 -10rpx;
}

.tool-item {
  flex: 1;
  margin: 10rpx;
  background-color: white;
  border-radius: 16rpx;
  padding: 40rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.tool-icon {
  margin-bottom: 20rpx;
}

.tool-name {
  font-size: 28rpx;
  color: #333;
}
</style>