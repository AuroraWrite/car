<script setup>
import { ref } from "vue";

const form = ref({
  username: "",
  password: "",
  remember: false,
});

const onLogin = () => {
  uni.showToast({
    title: "登录功能待接入",
    icon: "none",
  });
};
</script>

<template>
  <view class="login-bg">
    <view class="login-card">
      <view class="login-title">旅行社接送系统</view>
      <van-form @submit="onLogin">
        <van-field
          v-model="form.username"
          name="username"
          placeholder="请输入用户名"
          left-icon="user-o"
          :border="false"
          required
          class="login-field"
        />
        <van-field
          v-model="form.password"
          name="password"
          placeholder="请输入密码"
          type="password"
          left-icon="lock"
          :border="false"
          required
          class="login-field"
        />
        <view class="login-remember">
          <van-checkbox v-model="form.remember" shape="square" icon-size="18px" checked-color="#3b5998">
            记住密码
          </van-checkbox>
        </view>
        <van-button
          block
          type="primary"
          native-type="submit"
          class="login-btn"
        >
          登录
        </van-button>
      </van-form>
    </view>
  </view>
</template>

<style scoped>
.login-bg {
  width: 100vw;
  height: 100vh;
  background: url('/static/login.jpg') no-repeat center center;
  background-size: cover;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-card {
  width: 90vw;
  max-width: 800rpx;
  background: #fff;
  border-radius: 36rpx;
  box-shadow: 0 16rpx 64rpx rgba(0,0,0,0.15);
  padding: 76rpx 48rpx 56rpx 48rpx;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin: 0 20rpx;
}
.login-title {
  font-size: 52rpx;
  font-weight: 600;
  margin-bottom: 64rpx;
  color: #2d2d2d;
  text-align: center;
  letter-spacing: 4rpx;
}
.login-field :deep(.van-field__control) {
  font-size: 32rpx;
  padding-left: 4rpx;
}
.login-field {
  margin-bottom: 24rpx;
}
.login-remember {
  width: 100%;
  margin: 20rpx 0 48rpx 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 30rpx;
  color: #666;
  padding-left: 32rpx;
}
.login-btn {
  width: 100%;
  height: 88rpx;
  font-size: 34rpx;
  border-radius: 16rpx;
  background: #3b5998;
  border: none;
  margin-top: 8rpx;
}
</style>