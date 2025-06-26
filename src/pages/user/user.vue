<script setup>
import { ref, onMounted } from "vue";
import { useUserStore } from "@/store/user.js";
import { checkLogin } from "@/utils/util.js";
import BaseTabbar from "@/components/BaseTabbar.vue";

const userStore = useUserStore();

onMounted(() => {
  checkLogin();
});

const userInfo = userStore.userInfo || {};

function logout() {
  userStore.clearLoginInfo();
  uni.removeStorageSync("token");
  uni.removeStorageSync("token_expire");
  uni.redirectTo({ url: "/pages/login" });
}

// 跳转到修改密码页面
function goToPasswordPage() {
  uni.navigateTo({
    url: "/pages/user/password",
    success: () => {
      console.log("跳转到修改密码页面成功");
    },
    fail: (err) => {
      console.error("跳转到修改密码页面失败", err);
      uni.showToast({
        title: "页面跳转失败",
        icon: "none",
      });
    },
  });
}

// 跳转到绩效页面
function goToPerformancePage() {
  uni.navigateTo({
    url: "/pages/performance/performance",
  });
}
</script>

<template>
  <view class="user-center-bg">
    <view class="user-header">
      <view class="user-avatar">
        <van-icon name="user-circle-o" class="avatar-img" />
      </view>
      <view class="user-name">{{ userInfo.name || "未登录" }}</view>
    </view>
    <view class="user-list">
      <view class="user-item">
        <van-icon name="user-o" class="user-icon" />
        <text class="user-item-text">{{ userInfo.name || "南文华" }}</text>
      </view>
      <view class="user-item">
        <van-icon name="phone-o" class="user-icon" />
        <text class="user-item-text">{{
          userInfo.userphone || "166****5281"
        }}</text>
      </view>
      <view class="user-item">
        <van-icon name="shop-o" class="user-icon" />
        <text class="user-item-text">{{
          userInfo.company || "新疆星康程汽车服务有限公司"
        }}</text>
      </view>
      <view class="user-item user-link" @click="goToPerformancePage">
        <van-icon name="award-o" class="user-icon" />
        <text class="user-item-text">我的绩效</text>
        <van-icon name="arrow" class="user-arrow" />
      </view>
      <view class="user-item user-link" @click="goToPasswordPage">
        <van-icon name="setting-o" class="user-icon" />
        <text class="user-item-text">修改密码</text>
        <van-icon name="arrow" class="user-arrow" />
      </view>
    </view>
    <view class="logout-btn-wrap">
      <button class="logout-btn" @click="logout">退出登录</button>
    </view>
    <BaseTabbar />
  </view>
</template>

<style scoped>
.user-center-bg {
  min-height: 100vh;
  background: #fff;
}
.user-header {
  background: #2d466b;
  padding: 40rpx 0 32rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
}
.avatar-img {
  font-size: 120rpx;
  color: #fff;
}
.user-name {
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
  margin-top: 8rpx;
}
.user-list {
  background: #fff;
  margin-top: 0;
  border-radius: 0 0 24rpx 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.04);
  padding: 0 0 16rpx 0;
}
.user-item {
  display: flex;
  align-items: center;
  padding: 0 32rpx;
  height: 88rpx;
  font-size: 28rpx;
  border-bottom: 1rpx solid #f0f0f0;
  color: #333;
}
.user-item:last-child {
  border-bottom: none;
}
.user-icon {
  margin-right: 18rpx;
  color: #2d466b;
  font-size: 32rpx;
}
.user-link {
  cursor: pointer;
}
.user-arrow {
  margin-left: auto;
  color: #bbb;
  font-size: 28rpx;
}
.logout-btn-wrap {
  margin: 48rpx 32rpx 0 32rpx;
}
.logout-btn {
  width: 100%;
  height: 88rpx;
  background: #2d466b;
  color: #fff;
  font-size: 32rpx;
  line-height: 88rpx;
  border-radius: 8rpx;
  border: none;
}
</style> 