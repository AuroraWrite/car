<script setup>
import { ref, onMounted } from "vue";
import { request } from "@/utils/api.js";
import { useUserStore } from "@/store/user.js";

const userStore = useUserStore();

const form = ref({
  username: "",
  password: "",
  remember: false,
});

// 页面加载时自动填充记住的用户名和密码
onMounted(() => {
  const rememberUser = uni.getStorageSync("remember_user");
  if (rememberUser && rememberUser.username && rememberUser.password) {
    form.value.username = rememberUser.username;
    form.value.password = rememberUser.password;
    form.value.remember = true;
  }
});

const onLogin = async () => {
  if (!form.value.username || !form.value.password) {
    uni.showToast({ title: "请输入用户名和密码", icon: "none" });
    return;
  }
  uni.showLoading({ title: "登录中..." });
  try {
    const res = await request({
      url: "http://115.120.220.164:3001/login",
      method: "POST",
      data: {
        username: form.value.username,
        password: form.value.password,
      },
      header: {
        "Content-Type": "application/json",
      },
    });
    uni.hideLoading();
    if (res && res.data && res.statusCode === 200) {
      uni.showToast({ title: res.data.msg || "登录成功", icon: "success" });
      // 计算token过期时间（7天后时间戳）
      const expire = Date.now() + 7 * 24 * 60 * 60 * 1000;
      // 登录成功后存入pinia
      userStore.setLoginInfo({
        username: form.value.username,
        password: form.value.password,
        remember: form.value.remember,
        token: res.data.token,
        userInfo: res.data.user,
        token_expire: expire,
        name: res.data.user.name,
        userid: res.data.user.id || res.data.userid,
        company: res.data.user.company,
        userphone: res.data.user.phone,
      });
      // 保存token和过期时间到本地
      uni.setStorageSync("token", res.data.token);
      uni.setStorageSync("token_expire", expire);
      // 记住密码逻辑
      if (form.value.remember) {
        uni.setStorageSync("remember_user", {
          username: form.value.username,
          password: form.value.password,
        });
      } else {
        uni.removeStorageSync("remember_user");
      }
      // 登录成功后跳转首页
      setTimeout(() => {
        uni.reLaunch({ url: "/pages/index/index" });
      }, 500);
    } else {
      uni.showToast({
        title: (res && res.data && res.data.msg) || "登录失败",
        icon: "none",
      });
    }
  } catch (e) {
    uni.hideLoading();
    uni.showToast({ title: "网络错误", icon: "none" });
  }
};

// 监听记住密码勾选变化，取消勾选时清除本地保存
function onRememberChange(val) {
  if (!val) {
    uni.removeStorageSync("remember_user");
  }
}
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
          <van-checkbox
            v-model="form.remember"
            shape="square"
            icon-size="18px"
            checked-color="#3b5998"
            @change="onRememberChange"
          >
            记住密码
          </van-checkbox>
        </view>
        <van-button block type="primary" native-type="submit" class="login-btn">
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
  background: url("/static/login.jpg") no-repeat center center;
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
  box-shadow: 0 16rpx 64rpx rgba(0, 0, 0, 0.15);
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