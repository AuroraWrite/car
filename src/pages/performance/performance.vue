<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useUserStore } from "@/store/user.js";
import { checkLogin } from "@/utils/util.js";
import BaseTabbar from "@/components/BaseTabbar.vue";
import { getPerformanceData } from "@/utils/api.js";

// 用户信息
const userStore = useUserStore();

const userId = ref(userStore.userInfo.userid);

// 绩效数据
const performanceData = ref({
  passengerCount: 0,
  tasks: [],
});

// 当前月份
const currentMonth = ref(new Date());

// 月份选择器是否显示
const showMonthPicker = ref(false);

// 可选月份列表
const monthList = ref([]);

// 分页相关
const currentPage = ref(1);
const isLoading = ref(false);
const noMoreData = ref(false);
const loadingMore = ref(false);

// 刷新按钮状态
const refreshBtnLoading = ref(false);

// 检测平台类型
const isAndroid = ref(false);

// 初始化平台检测
function initPlatformDetection() {
  // #ifdef APP-PLUS
  const platform = uni.getSystemInfoSync().platform;
  isAndroid.value = platform.toLowerCase() === "android";
  console.log("当前平台:", platform, "是安卓:", isAndroid.value);
  // #endif
}

// 检查是否为手机号码
function isPhoneNumber(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

// 生成月份列表，显示最近12个月
function generateMonthList() {
  const list = [];
  const today = new Date();

  // 获取当前年月
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // 生成最近12个月的列表
  for (let i = 0; i < 12; i++) {
    // 计算月份，处理跨年的情况
    let year = currentYear;
    let month = currentMonth - i;

    if (month < 0) {
      month += 12;
      year -= 1;
    }

    // 添加到列表
    list.push({
      year: year,
      month: month + 1, // 月份从0开始，需要+1
      text: `${year}年${String(month + 1).padStart(2, "0")}月`,
    });
  }

  return list;
}

// 格式化月份显示
function formatMonth(date) {
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}月`;
}

// 格式化日期为API所需格式 YYYY-MM
function formatDateForApi(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// 获取任务类型标签
function getTaskTypeLabel(tag) {
  switch (tag) {
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

// 打开月份选择器
function openMonthPicker() {
  monthList.value = generateMonthList();
  showMonthPicker.value = true;
}

// 关闭月份选择器
function closeMonthPicker() {
  showMonthPicker.value = false;
}

// 选择月份
function selectMonth(year, month) {
  currentMonth.value = new Date(year, month - 1, 1);
  fetchPerformanceData(true);
  closeMonthPicker();
  console.log(currentMonth.value);
}

// 上一个月
function prevMonth() {
  const newDate = new Date(currentMonth.value);
  newDate.setMonth(newDate.getMonth() - 1);
  currentMonth.value = newDate;
  fetchPerformanceData(true);
}

// 下一个月
function nextMonth() {
  const newDate = new Date(currentMonth.value);
  newDate.setMonth(newDate.getMonth() + 1);

  // 不允许选择未来的月份
  const today = new Date();
  if (
    newDate.getFullYear() > today.getFullYear() ||
    (newDate.getFullYear() === today.getFullYear() &&
      newDate.getMonth() > today.getMonth())
  ) {
    uni.showToast({
      title: "不能选择未来的月份",
      icon: "none",
    });
    return;
  }

  currentMonth.value = newDate;
  fetchPerformanceData(true);
}

// 获取绩效数据
async function fetchPerformanceData(isRefresh = false) {
  if (isLoading.value && !isRefresh) return;

  try {
    isLoading.value = true;

    // 如果是刷新，重置页码
    if (isRefresh) {
      currentPage.value = 1;
      noMoreData.value = false;
      performanceData.value.tasks = [];
    }

    // 获取当前选中月份的格式化日期
    const formattedDate = formatDateForApi(currentMonth.value);

    // 调用API获取数据
    const response = await getPerformanceData(
      userId.value,
      formattedDate,
      currentPage.value
    );

    if (response.data && response.data.code === 200) {
      const data = response.data.data;

      // 更新绩效概览数据
      if (isRefresh) {
        performanceData.value.passengerCount = data.total || 0; // 使用总任务数作为任务数
      }

      // 更新任务列表
      if (data.list && data.list.length > 0) {
        if (isRefresh) {
          performanceData.value.tasks = data.list;
        } else {
          performanceData.value.tasks = [
            ...performanceData.value.tasks,
            ...data.list,
          ];
        }

        // 检查是否还有更多页
        if (data.currentPage < data.totalPages) {
          // 更新页码
          currentPage.value += 1;
        } else {
          noMoreData.value = true;
        }
      } else {
        if (isRefresh) {
          performanceData.value.tasks = [];
        }
        noMoreData.value = true;
      }
    } else {
      throw new Error(response.data?.msg || "获取数据失败");
    }
  } catch (error) {
    console.error("获取绩效数据失败", error);
    uni.showToast({
      title: "获取数据失败",
      icon: "none",
    });
  } finally {
    isLoading.value = false;
    loadingMore.value = false;

    // 如果是下拉刷新操作，停止下拉刷新动画
    if (isRefresh) {
      uni.stopPullDownRefresh();
    }
  }
}

// 监听页面滚动到底部，加载更多任务
function handleReachBottom() {
  console.log(
    "触发触底事件",
    "当前页码:",
    currentPage.value,
    "加载中:",
    isLoading.value,
    "无更多数据:",
    noMoreData.value
  );

  if (noMoreData.value) {
    console.log("已无更多数据，不再加载");
    return;
  }

  if (isLoading.value) {
    console.log("正在加载中，忽略此次触发");
    return;
  }

  // 安卓端增加震动反馈
  if (isAndroid.value) {
    // #ifdef APP-PLUS
    uni.vibrateShort({
      success: function () {
        console.log("震动成功");
      },
    });
    // #endif
  }

  console.log("开始加载下一页数据");
  loadingMore.value = true;
  fetchPerformanceData()
    .then(() => {
      console.log("加载完成，当前页码:", currentPage.value);
    })
    .catch((err) => {
      console.error("加载失败:", err);
    });
}

// 防抖函数
function debounce(fn, delay = 200) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// H5环境下滚动处理
const handleScroll = debounce(() => {
  // #ifdef H5
  // 获取页面高度、滚动高度和窗口高度
  const scrollHeight =
    document.documentElement.scrollHeight || document.body.scrollHeight;
  const scrollTop =
    document.documentElement.scrollTop || document.body.scrollTop;
  const clientHeight =
    document.documentElement.clientHeight || window.innerHeight;

  // 计算距离底部的距离
  const distanceToBottom = scrollHeight - scrollTop - clientHeight;
  console.log(
    "H5滚动检测",
    "距离底部:",
    distanceToBottom,
    "px",
    "是否加载中:",
    isLoading.value,
    "是否无更多数据:",
    noMoreData.value
  );

  // 如果滚动到距离底部50px内，触发加载更多
  if (distanceToBottom < 50) {
    console.log("H5环境触发触底事件");
    // 直接调用加载函数，跳过handleReachBottom中的检查
    if (!isLoading.value && !noMoreData.value) {
      console.log("H5环境直接触发加载");
      loadingMore.value = true;
      fetchPerformanceData();
    } else {
      console.log(
        "H5环境触底但不加载",
        "是否加载中:",
        isLoading.value,
        "是否无更多数据:",
        noMoreData.value
      );
    }
  }
  // #endif
}, 100);

// 处理下拉刷新
function handlePullDownRefresh() {
  console.log("页面生命周期触发onPullDownRefresh");
  return fetchPerformanceData(true)
    .then(() => {
      uni.showToast({
        title: "刷新成功",
        icon: "success",
        duration: 1500,
      });
      uni.stopPullDownRefresh();
    })
    .catch((err) => {
      console.error("刷新失败", err);
      uni.showToast({
        title: "刷新失败",
        icon: "none",
        duration: 1500,
      });
    });
}

// 处理刷新按钮点击
async function handleRefreshBtnClick() {
  if (refreshBtnLoading.value) return;

  refreshBtnLoading.value = true;
  try {
    await handlePullDownRefresh();
  } finally {
    // 延迟关闭loading状态，提供更好的视觉反馈
    setTimeout(() => {
      refreshBtnLoading.value = false;
    }, 800);
  }
}

// 添加滚动监听器
onMounted(() => {
  // 初始化平台检测
  initPlatformDetection();

  checkLogin();
  fetchPerformanceData(true);

  // #ifdef H5
  console.log("H5环境初始化：添加滚动监听器");
  window.addEventListener("scroll", handleScroll);
  // 初始检查一次，处理内容不足一屏的情况
  setTimeout(() => {
    handleScroll();
  }, 500);
  // #endif
});

// 移除滚动监听器
onUnmounted(() => {
  // #ifdef H5
  console.log("H5环境卸载：移除滚动监听器");
  window.removeEventListener("scroll", handleScroll);
  // #endif
});

// 这里暴露页面生命周期钩子
defineExpose({
  onReachBottom() {
    console.log("页面生命周期触发onReachBottom");
    // 安卓端特别处理
    if (isAndroid.value) {
      // #ifdef APP-PLUS
      // 安卓端增加震动反馈
      uni.vibrateShort({
        success: function () {
          console.log("安卓触底震动反馈");
        },
      });
      // #endif
    }
    handleReachBottom();
  },
  onPullDownRefresh() {
    console.log("页面生命周期触发onPullDownRefresh");
    handlePullDownRefresh();
  },
});
</script>

<template>
  <view class="performance-page">
    <!-- 绩效概览 -->
    <view class="performance-overview">
      <view class="overview-item">
        <van-icon name="friends" color="#ffeb3b" size="24" />
        <text class="item-label">共计任务：</text>
        <text class="item-value">{{ performanceData.passengerCount }} 个</text>
      </view>
    </view>

    <!-- 日期选择器 -->
    <view class="month-selector" @click="openMonthPicker">
      <view class="month-text">绩效月份</view>
      <view class="month-value">
        {{ formatMonth(currentMonth) }}
        <van-icon name="arrow" color="#333" size="18" />
      </view>
    </view>

    <!-- 任务信息和刷新按钮 -->
    <view class="task-info">
      <span></span>
      <!-- 添加手动刷新按钮 -->
      <view class="refresh-btn" @click="handleRefreshBtnClick">
        <van-icon
          name="replay"
          :class="{ 'loading-rotate': refreshBtnLoading }"
        />
        <text>{{ refreshBtnLoading ? "刷新中..." : "刷新" }}</text>
      </view>
    </view>

    <!-- 任务列表 -->
    <view class="task-list">
      <view
        class="task-item"
        v-for="task in performanceData.tasks"
        :key="task.id"
      >
        <!-- 时间信息 -->
        <view class="task-time-info">
          <van-icon name="clock" color="#666" size="16" />
          <text>{{ task.date.substring(5) }} {{ task.time.start }}</text>
          <text class="task-name">{{ task.name }}</text>
          <text v-if="task.phone && !isPhoneNumber(task.phone)">{{
            task.phone
          }}</text>
          <text class="person-count">{{ task.personCount }}人</text>
          <view class="task-tag" :class="`tag-type-${task.tag}`">
            {{ getTaskTypeLabel(task.tag) }}
          </view>
        </view>

        <!-- 接送信息 -->
        <view class="task-route">
          <view class="route-point pickup">
            <text class="point-label">接</text>
            <text class="point-value">{{
              task.flightInfo?.location || "---"
            }}</text>
          </view>
          <view class="route-point dropoff">
            <text class="point-label">送</text>
            <text class="point-value">{{ task.destination || "---" }}</text>
          </view>
          <view class="route-point company">
            <text class="point-label">社</text>
            <text class="point-value">{{ task.travelagency }}</text>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view class="loading-status" v-if="performanceData.tasks.length > 0">
        <view v-if="loadingMore" class="loading-more">
          <view class="loading-icon"></view>
          <text>正在加载更多...</text>
        </view>
        <text v-else-if="noMoreData">没有更多数据了</text>
        <view v-else class="load-more-btn" @click="handleReachBottom">
          <text>点击加载更多</text>
        </view>
      </view>

      <!-- 无数据提示 -->
      <view
        v-if="!isLoading && performanceData.tasks.length === 0"
        class="empty-status"
      >
        <text>暂无任务数据</text>
      </view>
    </view>

    <!-- 日期选择弹出层 -->
    <van-popup
      v-model:show="showMonthPicker"
      position="bottom"
      round
      :close-on-click-overlay="true"
      @close="closeMonthPicker"
    >
      <view class="month-picker">
        <view class="month-picker-header">
          <view class="cancel-btn" @click="closeMonthPicker">取消</view>
          <view class="title-text">选择月份</view>
          <view class="confirm-btn" @click="closeMonthPicker">确认</view>
        </view>
        <view class="month-picker-content">
          <view
            class="date-item"
            v-for="(item, index) in monthList"
            :key="index"
            @click="selectMonth(item.year, item.month)"
            :class="{ 'current-month': index === 0 }"
          >
            <text class="date-text">{{ item.text }}</text>
          </view>
        </view>
      </view>
    </van-popup>

    <!-- 底部选项卡 -->
    <BaseTabbar />
  </view>
</template>

<style scoped>
.performance-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 100rpx;
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

.performance-overview {
  background-color: #2d466b;
  color: white;
  padding: 32rpx;
  padding-top: 20rpx;
  padding-bottom: 28rpx;
}

.overview-item {
  display: flex;
  align-items: center;
  margin: 20rpx 0;
}

.item-label {
  margin-left: 12rpx;
  font-size: 32rpx;
}

.item-value {
  font-size: 32rpx;
  font-weight: bold;
  margin-left: 8rpx;
}

.month-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  padding: 24rpx 32rpx;
  border-bottom: 1px solid #eee;
}

.month-text {
  font-size: 28rpx;
  color: #666;
}

.month-value {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.month-value .van-icon {
  margin-left: 8rpx;
}

/* 任务信息样式 */
.task-info {
  padding: 24rpx 32rpx 0;
  font-size: 28rpx;
  color: #666;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.refresh-btn {
  color: #2d466b;
  font-size: 28rpx;
  padding: 4rpx 16rpx;
  border: 1px solid #2d466b;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn .van-icon {
  margin-right: 8rpx;
}

.loading-rotate {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.task-list {
  padding: 0 24rpx;
}

.task-item {
  background-color: white;
  border-radius: 12rpx;
  margin: 24rpx 0;
  padding: 24rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
  position: relative;
}

.task-time-info {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.task-time-info text {
  margin-left: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.task-name {
  font-weight: 500;
  margin-left: 16rpx !important;
}

.person-count {
  background-color: #f0f2f5;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #666;
  margin-left: 12rpx !important;
}

.task-tag {
  margin-left: 12rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: white;
}

.tag-type-1 {
  background-color: #1989fa;
}

.tag-type-2 {
  background-color: #ff976a;
}

.tag-type-3 {
  background-color: #07c160;
}

.tag-type-4 {
  background-color: #ee0a24;
}

.task-route {
  padding: 16rpx 0;
}

.route-point {
  display: flex;
  margin-bottom: 12rpx;
}

.point-label {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background-color: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #666;
  margin-right: 16rpx;
}

.point-value {
  font-size: 28rpx;
  color: #333;
  flex: 1;
}

/* 日期选择器样式 */
.month-picker {
  padding-bottom: 20rpx;
}

.month-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 1px solid #eee;
}

.title-text {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.cancel-btn {
  font-size: 32rpx;
  color: #999;
}

.confirm-btn {
  font-size: 32rpx;
  color: #2d466b;
  font-weight: 500;
}

.month-picker-content {
  padding: 20rpx 0;
  max-height: 600rpx;
  overflow-y: auto;
}

.date-item {
  padding: 28rpx 32rpx;
  font-size: 32rpx;
  color: #333;
  text-align: center;
  border-bottom: 1px solid #f5f7fa;
}

.current-month {
  color: #2d466b;
  font-weight: 500;
  background-color: #f0f2f5;
}

.date-item:active {
  background-color: #f5f7fa;
}

/* 加载状态样式 */
.loading-status {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
  font-size: 28rpx;
}

.empty-status {
  text-align: center;
  padding: 100rpx 0;
  color: #999;
  font-size: 28rpx;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 0;
}

.loading-icon {
  width: 30rpx;
  height: 30rpx;
  border: 3rpx solid #2d466b;
  border-radius: 50%;
  border-top-color: transparent;
  margin-right: 10rpx;
  animation: rotate 0.8s linear infinite;
}

.load-more-btn {
  display: inline-block;
  padding: 16rpx 40rpx;
  background-color: #f5f7fa;
  border: 1px solid #ddd;
  border-radius: 40rpx;
  margin: 20rpx 0;
  color: #666;
}

.load-more-btn:active {
  background-color: #e8e8e8;
}

/* 安卓平台特定样式 */
.android-platform .refresh-btn {
  padding: 8rpx 20rpx;
}

.android-platform .loading-icon {
  width: 36rpx;
  height: 36rpx;
  border-width: 4rpx;
}
</style>