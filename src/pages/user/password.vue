<script setup>
import { ref } from "vue";
import { useUserStore } from "@/store/user.js";
import { checkLogin } from "@/utils/util.js";
import { request, changePassword } from "@/utils/api.js";

// 检查登录状态
checkLogin();

const userStore = useUserStore();
const loading = ref(false);

// 表单数据
const form = ref({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

// 表单验证规则
const rules = {
  oldPassword: [
    { required: true, message: "请输入原密码" },
    { min: 6, message: "密码长度不能少于6位" },
  ],
  newPassword: [
    { required: true, message: "请输入新密码" },
    { min: 6, message: "密码长度不能少于6位" },
  ],
  confirmPassword: [
    { required: true, message: "请确认新密码" },
    {
      validator: (value) => value === form.value.newPassword,
      message: "两次输入的密码不一致",
    },
  ],
};

// 返回上一页
function goBack() {
  uni.navigateBack();
}

// 退出登录并跳转到登录页
function logout() {
  userStore.clearLoginInfo();
  uni.removeStorageSync("token");
  uni.removeStorageSync("token_expire");

  // 跳转到登录页
  uni.reLaunch({
    url: "/pages/login",
    success: () => {
      console.log("退出登录成功，已跳转到登录页");
    },
  });
}

// 提交修改密码
async function submitForm() {
  // 表单验证
  let isValid = true;
  for (const field in rules) {
    for (const rule of rules[field]) {
      if (rule.required && !form.value[field]) {
        uni.showToast({
          title: rule.message,
          icon: "none",
        });
        isValid = false;
        return;
      }
      if (rule.min && form.value[field].length < rule.min) {
        uni.showToast({
          title: rule.message,
          icon: "none",
        });
        isValid = false;
        return;
      }
      if (rule.validator && !rule.validator(form.value[field])) {
        uni.showToast({
          title: rule.message,
          icon: "none",
        });
        isValid = false;
        return;
      }
    }
  }

  if (!isValid) return;

  // 检查原密码是否正确
  if (userStore.password !== form.value.oldPassword) {
    uni.showToast({
      title: "原密码不正确",
      icon: "none",
    });
    return;
  }

  // 显示加载中
  loading.value = true;

  try {
    // 调用修改密码API
    const res = await changePassword(
      userStore.userInfo.userid,
      form.value.oldPassword,
      form.value.newPassword
    );

    if (res.data && res.data.code === 200) {
      uni.showToast({
        title: "密码修改成功",
        icon: "success",
      });

      // 延迟退出登录
      setTimeout(() => {
        uni.showModal({
          title: "密码已修改",
          content: "为了安全，需要重新登录",
          showCancel: false,
          success: () => {
            // 退出登录
            logout();
          },
        });
      }, 1500);
    } else {
      uni.showToast({
        title: res.data?.msg || "修改失败，请重试",
        icon: "none",
      });
    }
  } catch (error) {
    console.error("修改密码失败", error);
    uni.showToast({
      title: "网络错误，请重试",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <view class="password-page">
    <!-- 表单内容 -->
    <view class="form-container">
      <!-- 锁图标 -->
      <view class="lock-icon">
        <van-icon name="lock" size="60" color="#ddd" />
      </view>

      <!-- 密码输入表单 -->
      <view class="form-item">
        <view class="input-wrapper">
          <text class="input-label">请输入原密码：</text>
          <input
            type="password"
            v-model="form.oldPassword"
            placeholder="请输入原密码"
            class="form-input"
          />
        </view>
      </view>

      <view class="form-item">
        <view class="input-wrapper">
          <text class="input-label">请输入新密码：</text>
          <input
            type="password"
            v-model="form.newPassword"
            placeholder="请输入新密码"
            class="form-input"
          />
        </view>
      </view>

      <view class="form-item">
        <view class="input-wrapper">
          <text class="input-label">再次输入新密码：</text>
          <input
            type="password"
            v-model="form.confirmPassword"
            placeholder="再次输入新密码"
            class="form-input"
          />
        </view>
      </view>

      <view class="submit-btn-wrap">
        <van-button
          block
          type="primary"
          :loading="loading"
          loading-text="提交中..."
          @click="submitForm"
          >修改密码</van-button
        >
      </view>
    </view>
  </view>
</template>

<style scoped>
.password-page {
  min-height: 100vh;
  background-color: #fff;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2d466b;
  color: white;
  padding: 24rpx 32rpx;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  display: flex;
  align-items: center;
  color: #fff;
}

.page-title {
  font-size: 36rpx;
  font-weight: 500;
}

.placeholder {
  width: 20rpx;
}

.form-container {
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 700rpx;
  margin: 0 auto;
}

.lock-icon {
  margin: 60rpx 0;
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-item {
  margin-bottom: 32rpx;
  width: 100%;
}

.input-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
}

.input-label {
  width: 200rpx;
  font-size: 28rpx;
  color: #333;
  text-align: right;
  margin-right: 20rpx;
  white-space: nowrap;
}

.form-input {
  flex: 1;
  height: 88rpx;
  border: none;
  border-bottom: 1px solid #e5e5e5;
  font-size: 28rpx;
  padding: 0 20rpx;
  box-sizing: border-box;
  text-align: left;
}

.submit-btn-wrap {
  margin-top: 60rpx;
  width: 100%;
  display: flex;
  justify-content: center;
}

:deep(.van-button--primary) {
  background-color: #2d466b !important;
  border-color: #2d466b !important;
  height: 88rpx !important;
  font-size: 32rpx !important;
  width: 60% !important;
}
</style>