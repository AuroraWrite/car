<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useTaskStore } from "@/store/task.js";
import { useUserStore } from "@/store/user.js";
import { checkLogin } from "@/utils/util.js";
import BaseTabbar from "@/components/BaseTabbar.vue";
import {
  updateNoticeStatus,
  updateTaskStatus,
  getTaskDetail,
} from "@/utils/api.js";

// 任务数据
const taskData = ref(null);
const isLoading = ref(true);
const taskStore = useTaskStore();
const userStore = useUserStore();

// 通知状态文本
function getNoticeStatusText(status) {
  return status === 1 ? "已通知" : "未通知";
}

// 通知状态类
function getNoticeStatusClass(status) {
  return status === 1 ? "completed" : "pending";
}

// 任务状态文本
function getStatusText(status) {
  switch (status) {
    case 1:
      return "已完成";
    case 2:
      return "未完成";
    case 3:
      return "已取消";
    default:
      return "未知状态";
  }
}

// 获取任务状态CSS类名
function getStatusClass(status) {
  switch (status) {
    case 1:
      return "completed";
    case 2:
      return "pending";
    case 3:
      return "canceled";
    default:
      return "pending";
  }
}

// 获取任务类型标签
function getTaskTypeLabel(task) {
  if (!task || !task.tag) return "";

  switch (task.tag) {
    case 1:
      return "接机";
    case 2:
      return "送机";
    case 3:
      return "接站";
    case 4:
      return "送站";
    default:
      return "";
  }
}

// 获取任务类型标签颜色
function getTaskTypeColor(task) {
  if (!task || !task.tag) return "primary";

  // 送机(2)和送站(4)使用黄色，接机(1)和接站(3)使用默认色
  switch (task.tag) {
    case 2:
    case 4:
      return "warning";
    default:
      return "primary";
  }
}

// 拨打电话
function callPhone(phone) {
  if (phone) {
    uni.makePhoneCall({
      phoneNumber: phone,
      success: () => {
        console.log("拨打电话成功");
      },
      fail: (err) => {
        console.log("拨打电话失败", err);
      },
    });
  }
}

// 返回上一页
function goBack() {
  // 清除当前任务数据
  taskStore.clearCurrentTask();
  uni.navigateBack();
}

// 设置为已通知
async function setAsNotified() {
  if (!taskData.value || taskData.value.isnotice === 1) return;

  try {
    isLoading.value = true;

    // 获取用户ID
    const userId = userStore.userInfo.userid;

    // 调用API更新通知状态
    await updateNoticeStatus(
      taskData.value.id,
      1, // 设置为已通知
      userId
    );

    // 更新本地状态
    taskData.value.isnotice = 1;

    // 同时更新store中的数据
    taskStore.updateTaskNoticeStatus(taskData.value.id, 1);

    uni.showToast({
      title: "已设为已通知",
      icon: "success",
    });
  } catch (error) {
    console.error("设置通知状态失败", error);
    uni.showToast({
      title: "设置失败，请重试",
      icon: "none",
    });
  } finally {
    isLoading.value = false;
  }
}

// 设置为已完成
async function setAsCompleted() {
  if (!taskData.value || taskData.value.status === 1) return;

  try {
    isLoading.value = true;

    // 获取用户ID
    const userId = userStore.userInfo.userid;

    // 调用API更新任务状态
    await updateTaskStatus(
      taskData.value.id,
      1, // 设置为已完成
      userId
    );

    // 更新本地状态
    taskData.value.status = 1;

    // 同时更新store中的数据
    taskStore.updateTaskStatus(taskData.value.id, 1);

    uni.showToast({
      title: "已设为已完成",
      icon: "success",
    });
  } catch (error) {
    console.error("设置任务状态失败", error);
    uni.showToast({
      title: "设置失败，请重试",
      icon: "none",
    });
  } finally {
    isLoading.value = false;
  }
}

// 页面加载时从task store获取任务ID，并调用API获取完整任务数据
onMounted(async () => {
  checkLogin();
  isLoading.value = true;

  // 从store获取当前任务基本信息（id、userid、driver）
  const currentTask = taskStore.currentTask;

  if (currentTask && currentTask.id) {
    try {
      // 获取用户ID，优先使用传递过来的userid
      const userId = currentTask.userid || userStore.userInfo.userid;

      // 调用API获取完整的任务详情
      const response = await getTaskDetail(currentTask.id, userId);
      console.log("API返回数据:", response.data);

      // 检查API返回的数据
      if (response.data && response.data.code === 200) {
        // 使用API返回的完整数据
        taskData.value = response.data.data;

        // 将传递过来的司机名称加入到任务数据中
        if (currentTask.driver) {
          taskData.value.driver = currentTask.driver;
        }
        // 如果没有传递司机名称，则使用userStore中的司机名称
        else if (userStore.userInfo && userStore.userInfo.name) {
          taskData.value.driver = userStore.userInfo.name;
        }

        console.log("获取任务详情数据成功:", taskData.value);
      } else {
        throw new Error(
          `获取任务详情失败：${response.data?.msg || "未知错误"}`
        );
      }
    } catch (error) {
      console.error("获取任务详情失败", error);

      uni.showToast({
        title: "获取任务数据失败",
        icon: "none",
      });

      // 延迟返回上一页
      setTimeout(() => {
        goBack();
      }, 1500);
    }
  } else {
    uni.showToast({
      title: "未找到任务ID",
      icon: "none",
    });

    // 延迟返回上一页
    setTimeout(() => {
      goBack();
    }, 1500);
  }

  isLoading.value = false;
});

// 页面卸载时清理数据
onUnmounted(() => {
  // 清除当前任务数据，确保下次进入时重新获取最新数据
  taskStore.clearCurrentTask();
});
</script>

<template>
  <view class="detail-page">
    <!-- 加载中 -->
    <view v-if="isLoading" class="loading">
      <van-loading type="spinner" color="#2d466b" size="36px" />
      <text>加载中...</text>
    </view>

    <!-- 任务详情内容 -->
    <view v-else-if="taskData" class="detail-content">
      <!-- 日期和人数 -->
      <view class="detail-header">
        <view class="date-box">
          <van-icon name="calendar-o" size="22" color="#666" />
          <text>{{ taskData.date || "未知日期" }}</text>
        </view>
        <view class="person-info">
          <van-icon name="friends-o" size="22" color="#666" />
          <text>{{ taskData.name }} / {{ taskData.personCount }}人</text>
        </view>
      </view>

      <!-- 详情卡片 -->
      <view class="detail-card">
        <!-- 状态标签 - 与列表页一致的样式 -->
        <view
          v-if="taskData.status === 1 || taskData.status === 3"
          class="status-badge"
          :class="getStatusClass(taskData.status)"
        >
          {{ getStatusText(taskData.status) }}
        </view>

        <!-- 详情列表 -->
        <view class="detail-list">
          <view class="detail-item">
            <text class="item-label">电话</text>
            <view class="item-value with-button">
              <text>{{ taskData.phone }}</text>
              <van-button
                size="small"
                round
                type="primary"
                class="call-btn"
                @click="callPhone(taskData.phone)"
              >
                <van-icon name="phone" class="btn-icon" size="18" />拨打
              </van-button>
            </view>
          </view>

          <view class="detail-item">
            <text class="item-label">接送时刻</text>
            <view class="item-value time-value">
              <text>{{ taskData.time?.start || "未设置" }}</text>
              <van-tag :type="getTaskTypeColor(taskData)" round size="large">{{
                getTaskTypeLabel(taskData)
              }}</van-tag>
            </view>
          </view>

          <view class="detail-item">
            <text class="item-label">起始地</text>
            <view class="item-value location-value">
              <van-icon
                name="location-o"
                size="18"
                color="#666"
                class="icon-margin"
              />
              <text>{{ taskData.flightInfo?.location || "未设置" }}</text>
            </view>
          </view>

          <view class="detail-item">
            <text class="item-label">目的地</text>
            <view class="item-value location-value">
              <van-icon
                name="location"
                size="18"
                color="#2d466b"
                class="icon-margin"
              />
              <text>{{ taskData.destination || "未设置" }}</text>
            </view>
          </view>

          <view class="detail-item">
            <text class="item-label">旅行社</text>
            <view class="item-value">
              <van-icon
                name="shop-o"
                size="18"
                color="#666"
                class="icon-margin"
              />
              <text>{{ taskData.travelagency || "未设置" }}</text>
            </view>
          </view>

          <view class="detail-item">
            <text class="item-label">司机</text>
            <view class="item-value">
              <van-icon
                name="manager-o"
                size="18"
                color="#666"
                class="icon-margin"
              />
              <text>{{ taskData.driver || "未分配" }}</text>
            </view>
          </view>

          <view class="detail-item">
            <text class="item-label">导游/团号</text>
            <view class="item-value">
              <van-icon
                name="label-o"
                size="18"
                color="#666"
                class="icon-margin"
              />
              <text>{{ taskData.Tournumber || "无" }}</text>
            </view>
          </view>

          <view class="detail-item">
            <text class="item-label">是否已通知</text>
            <view class="item-value notice-status">
              <view
                class="notice-badge"
                :class="getNoticeStatusClass(taskData.isnotice)"
              >
                <van-icon
                  :name="taskData.isnotice === 1 ? 'checked' : 'clock'"
                  size="16"
                />
                <text>{{ getNoticeStatusText(taskData.isnotice) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部操作按钮 -->
      <view class="detail-actions">
        <van-button
          block
          :disabled="taskData.isnotice === 1 || taskData.status === 3"
          :type="
            taskData.isnotice === 1 || taskData.status === 3
              ? 'default'
              : 'primary'
          "
          class="action-button"
          @click="setAsNotified"
          icon="bell"
          size="large"
        >
          设为已通知
        </van-button>

        <van-button
          block
          :disabled="taskData.status === 1 || taskData.status === 3"
          :type="
            taskData.status === 1 || taskData.status === 3
              ? 'default'
              : 'primary'
          "
          class="action-button"
          @click="setAsCompleted"
          icon="checked"
          size="large"
        >
          设为已完成
        </van-button>

        <van-button
          block
          :plain="taskData.status !== 3"
          type="primary"
          @click="goBack"
          color="#fff"
          size="large"
        >
          返回
        </van-button>
      </view>
    </view>

    <!-- 无数据提示 -->
    <view v-else class="no-data">
      <van-icon name="info-o" size="64" color="#ccc" />
      <text>未找到任务数据</text>
    </view>

    <BaseTabbar />
  </view>
</template>

<style scoped>
.detail-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 40rpx;
  padding-top: 20rpx;
}

.nav-header {
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

.back-icon {
  display: flex;
  align-items: center;
}

.back-icon text {
  margin-left: 8rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: 500;
}

.placeholder {
  width: 48rpx;
}

.loading,
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.loading text,
.no-data text {
  margin-top: 20rpx;
  color: #999;
  font-size: 32rpx;
}

.detail-content {
  padding: 32rpx;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.date-box,
.person-info {
  display: flex;
  align-items: center;
}

.date-box text,
.person-info text {
  margin-left: 12rpx;
  font-size: 32rpx;
  color: #666;
}

/* 详情卡片容器，用于定位状态标签 */
.detail-card {
  position: relative;
  margin-bottom: 40rpx;
}

/* 状态标签 - 与列表页一致的样式 */
.status-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  font-size: 32rpx;
  font-weight: bold;
  padding: 8rpx 20rpx;
  border: 4rpx solid;
  border-radius: 8rpx;
  display: inline-block;
  z-index: 11;
  background-color: rgba(255, 255, 255, 0.9);
  pointer-events: none;
}

.status-badge.completed {
  color: #52c41a;
  border-color: #52c41a;
}

.status-badge.canceled {
  color: #999;
  border-color: #999;
}

.status-badge.pending {
  display: none;
}

.detail-list {
  background-color: white;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1px solid #f0f2f5;
}

.detail-item:last-child {
  border-bottom: none;
}

.item-label {
  color: #999;
  font-size: 32rpx;
  width: 160rpx;
}

.item-value {
  flex: 1;
  text-align: right;
  font-size: 32rpx;
  color: #333;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.icon-margin {
  margin-right: 8rpx;
}

.with-button {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.call-btn {
  margin-left: 16rpx;
  height: 64rpx !important;
  font-size: 28rpx !important;
}

.btn-icon {
  margin-right: 8rpx;
}

.time-value {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.time-value .van-tag {
  margin-left: 16rpx;
  font-size: 24rpx !important;
}

.location-value {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.notice-status {
  display: flex;
  justify-content: flex-end;
}

.notice-badge {
  padding: 8rpx 24rpx;
  border-radius: 30rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
}

.notice-badge .van-icon {
  margin-right: 8rpx;
}

.notice-badge.completed {
  background-color: #52c41a;
  color: white;
}

.notice-badge.pending {
  background-color: #1989fa;
  color: white;
}

.remark-text {
  white-space: pre-wrap;
  word-break: break-all;
  text-align: left;
  justify-content: flex-start;
}

.detail-actions {
  padding: 0 32rpx;
}

.action-button {
  margin-bottom: 24rpx;
  height: 88rpx !important;
  font-size: 32rpx !important;
}

/* 返回按钮样式 */
.return-button:not(.van-button--plain) {
  color: white !important;
}

:deep(.van-button--primary) {
  background-color: #2d466b !important;
  border-color: #2d466b !important;
}

:deep(.van-button--default) {
  color: #666 !important;
  border-color: #ddd !important;
}

:deep(.van-button__icon) {
  font-size: 36rpx !important;
}
</style>