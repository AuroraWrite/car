<script setup>
import { ref, onBeforeMount, watch, onMounted, onUnmounted } from "vue";
import { checkLogin } from "@/utils/util.js";
import BaseTabbar from "@/components/BaseTabbar.vue";
import {
  fetchTasks,
  updateTaskRemark,
  searchTasks,
  updateTaskStatus,
} from "@/utils/api.js";
import { useUserStore } from "@/store/user.js";
import { useTaskStore } from "@/store/task.js";

// 检测平台类型
const isAndroid = ref(false);

// 添加记录滚动位置的变量
const scrollPosition = ref(0);

function getDateStr(d) {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDateTabs() {
  const arr = [];
  const today = new Date();
  // 确保只使用年月日，重置时分秒
  today.setHours(0, 0, 0, 0);

  console.log("今天日期：", getDateStr(today));
  console.log("月份:", today.getMonth() + 1, "日:", today.getDate());

  // 创建前30天、今天和后7天的日期选项卡，共38天
  for (let i = -30; i <= 7; i++) {
    // 创建新日期对象，避免修改原始today对象
    const d = new Date(today);
    // 使用setDate计算日期
    d.setDate(d.getDate() + i);

    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    const dateStr = getDateStr(d);

    arr.push({
      label: `${mm}月${dd}日`,
      value: dateStr,
      isToday: i === 0, // 直接用i判断是否为今天
      name: dateStr,
    });
  }

  return arr;
}

const dateTabs = ref(getDateTabs());
const today = new Date();
today.setHours(0, 0, 0, 0);

// 计算今天在选项卡中的索引位置 - 使用数字索引而不是日期值
const todayIndex = dateTabs.value.findIndex((tab) => tab.isToday);
// 使用索引作为activeTab的值
const activeTab = ref(todayIndex);

// 分页相关变量
const currentPage = ref(1);
const pageSize = 10; // 每页显示的数量固定为常量
const loadingMore = ref(false);
const noMoreData = ref(false);
const isLoading = ref(false);

// 搜索框内容
const searchValue = ref("");
// 添加搜索状态变量
const isSearchMode = ref(false);

// 模拟任务列表数据
const taskList = ref([]);

// 当前任务总数
const totalTasks = ref(0);

// 刷新按钮状态
const refreshBtnLoading = ref(false);

// 滑动相关变量
const touchStartX = ref(0);
const touchEndX = ref(0);
const swipedTaskId = ref(null);

// 初始化平台检测
function initPlatformDetection() {
  // #ifdef APP-PLUS
  const platform = uni.getSystemInfoSync().platform;
  isAndroid.value = platform.toLowerCase() === "android";
  console.log("当前平台:", platform, "是安卓:", isAndroid.value);
  // #endif
}

// 获取任务状态显示文本
function getStatusText(status) {
  switch (status) {
    case 1:
      return "已完成";
    case 2:
      return "未完成";
    case 3:
      return "已取消";
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

// 备注相关
const showRemark = ref(false);
const currentTaskId = ref(null);
const remarkContent = ref("");
const remarkSaving = ref(false);

// 打开备注弹窗
function openRemarkPopup(taskId) {
  currentTaskId.value = taskId;
  // 查找当前任务的备注信息
  const task = taskList.value.find((t) => t.id === taskId);
  if (task && task.remark) {
    remarkContent.value = task.remark; // 如果已有备注，则自动填入
  } else {
    remarkContent.value = ""; // 如果没有，则清空
  }
  showRemark.value = true;
}

// 保存备注
async function saveRemark() {
  if (!currentTaskId.value || remarkSaving.value) return;

  // 验证备注内容不能为空或纯空格
  const trimmedRemark = remarkContent.value.trim();
  if (!trimmedRemark) {
    uni.showToast({
      title: "备注内容不能为空",
      icon: "none",
      position: "center",
      mask: true,
    });
    return;
  }

  remarkSaving.value = true;

  try {
    // 获取用户ID
    const userStore = useUserStore();
    const userId = userStore.userInfo.userid;

    // 调用API保存备注，传递用户ID
    const response = await updateTaskRemark(
      currentTaskId.value,
      trimmedRemark, // 使用去除前后空格的内容
      userId
    );

    // 更新本地数据
    const taskIndex = taskList.value.findIndex(
      (t) => t.id === currentTaskId.value
    );

    if (taskIndex > -1) {
      taskList.value[taskIndex].remark = trimmedRemark; // 使用去除前后空格的内容

      // 先关闭弹窗
      showRemark.value = false;

      // 延迟显示Toast，确保在弹窗关闭后显示
      setTimeout(() => {
        uni.showToast({
          title: "备注已保存",
          icon: "success",
          position: "center",
          mask: true,
        });
      }, 300);
    } else {
      // 先关闭弹窗
      showRemark.value = false;

      // 延迟显示Toast
      setTimeout(() => {
        uni.showToast({
          title: "保存成功",
          icon: "success",
          position: "center",
          mask: true,
        });
      }, 300);
    }
  } catch (error) {
    console.error("保存备注失败", error);
    uni.showToast({
      title: "保存备注失败",
      icon: "none",
      position: "center",
      mask: true,
    });
  } finally {
    remarkSaving.value = false;
  }
}

// 获取任务类型标签
function getTaskTypeLabel(task) {
  if (!task.tag) return "";

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

// 处理搜索按钮点击
function handleSearch() {
  // 如果搜索框为空，则使用普通的任务加载
  if (!searchValue.value.trim()) {
    // 如果当前是搜索模式，则恢复到普通模式
    if (isSearchMode.value) {
      isSearchMode.value = false;
      loadTasks(true);
    } else {
      // 否则只是刷新当前页面
      handleRefreshBtnClick();
    }
    return;
  }

  // 设置为搜索模式
  isSearchMode.value = true;

  // 重置分页
  currentPage.value = 1;
  noMoreData.value = false;

  // 显示加载状态
  isLoading.value = true;

  // 获取用户ID
  const userStore = useUserStore();
  const userId = userStore.userInfo.userid;

  // 判断是手机号还是姓名
  const isMobile = /^1[3-9]\d{9}$/.test(searchValue.value);

  // 构建搜索参数
  const searchParams = {
    userid: userId,
    page: currentPage.value,
  };

  // 根据输入类型设置不同的参数
  if (isMobile) {
    searchParams.tel = searchValue.value;
  } else {
    searchParams.yname = searchValue.value;
  }

  // 调用搜索API
  searchTasks(searchParams)
    .then((res) => {
      const { data } = res.data || {};

      if (data && data.list) {
        // 替换任务列表
        taskList.value = data.list || [];

        // 更新总任务数
        totalTasks.value = data.total || 0;

        // 判断是否还有更多数据
        if (taskList.value.length >= totalTasks.value) {
          noMoreData.value = true;
        } else {
          // 页码加1，为下次加载做准备
          currentPage.value += 1;
        }

        uni.showToast({
          title: `搜索到${totalTasks.value}条结果`,
          icon: "success",
        });
      } else {
        // 如果没有数据返回
        taskList.value = [];
        totalTasks.value = 0;
        noMoreData.value = true;

        uni.showToast({
          title: "未找到匹配的任务",
          icon: "none",
        });
      }
    })
    .catch((error) => {
      console.error("搜索任务失败", error);
      uni.showToast({
        title: "搜索失败",
        icon: "none",
      });
    })
    .finally(() => {
      isLoading.value = false;
    });
}

// 加载任务数据
async function loadTasks(isRefresh = false) {
  // 如果正在加载或已经没有更多数据且不是刷新操作，则退出
  if ((isLoading.value || noMoreData.value) && !isRefresh) {
    return Promise.resolve();
  }

  try {
    isLoading.value = true;

    // 如果是刷新，重置页码和搜索模式
    if (isRefresh) {
      currentPage.value = 1;
      noMoreData.value = false;
      // 如果是在搜索模式下刷新，则继续使用搜索API
      if (isSearchMode.value && searchValue.value.trim()) {
        return handleSearch();
      } else {
        isSearchMode.value = false;
      }
    }

    // 如果是搜索模式下加载更多，调用搜索API
    if (isSearchMode.value && searchValue.value.trim()) {
      const userStore = useUserStore();
      const userId = userStore.userInfo.userid;

      // 判断是手机号还是姓名
      const isMobile = /^1[3-9]\d{9}$/.test(searchValue.value);

      // 构建搜索参数
      const searchParams = {
        userid: userId,
        page: currentPage.value,
      };

      if (isMobile) {
        searchParams.tel = searchValue.value;
      } else {
        searchParams.yname = searchValue.value;
      }

      const res = await searchTasks(searchParams);
      const { data } = res.data || {};

      if (data && data.list) {
        // 如果是刷新操作，替换任务列表；否则追加到现有列表
        if (isRefresh) {
          taskList.value = data.list || [];
        } else {
          taskList.value = [...taskList.value, ...(data.list || [])];
        }

        // 更新总任务数
        totalTasks.value = data.total || 0;

        if (taskList.value.length >= totalTasks.value) {
          noMoreData.value = true;
        } else {
          currentPage.value += 1;
        }
      } else {
        if (isRefresh) {
          taskList.value = [];
        }
        noMoreData.value = true;
      }

      return Promise.resolve();
    }

    // 获取当前选中的日期
    const selectedDate = dateTabs.value[activeTab.value].value;
    const userStore = useUserStore();
    const userId = userStore.userInfo.userid;

    // 调用API获取任务，传入页码参数
    const res = await fetchTasks(selectedDate, userId, currentPage.value);
    const { data } = res.data || {};

    if (data && data.list) {
      // 如果是刷新操作，替换任务列表；否则追加到现有列表
      uni.showToast({
        title: res.data.msg,
        icon: "success",
      });
      if (isRefresh) {
        taskList.value = data.list || [];
      } else {
        taskList.value = [...taskList.value, ...(data.list || [])];
      }

      // 更新总任务数
      totalTasks.value = data.total || 0;

      // 判断是否还有更多数据 - 修复判断逻辑
      // 只有当当前列表长度等于或超过总数时，才认为没有更多数据
      if (taskList.value.length >= totalTasks.value) {
        console.log(
          "已加载全部数据",
          taskList.value.length,
          "/",
          totalTasks.value
        );
        noMoreData.value = true;
      } else {
        // 页码加1，为下次加载做准备
        currentPage.value += 1;
        console.log(
          "还有更多数据待加载",
          taskList.value.length,
          "/",
          totalTasks.value
        );
      }
    } else {
      // 如果没有数据返回
      if (isRefresh) {
        taskList.value = [];
      }
      noMoreData.value = true;
    }
    return Promise.resolve();
  } catch (error) {
    console.error("加载任务失败", error);
    uni.showToast({
      title: "加载任务失败",
      icon: "none",
    });
    return Promise.reject(error);
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
    noMoreData.value,
    "平台:",
    isAndroid.value ? "Android" : "其他"
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
  loadTasks()
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
    "页面高度:",
    scrollHeight,
    "滚动位置:",
    scrollTop,
    "窗口高度:",
    clientHeight,
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
      loadTasks();
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
  // 重置搜索状态，回到普通模式
  isSearchMode.value = false;
  searchValue.value = "";
  // 重置滑动状态
  swipedTaskId.value = null;
  return loadTasks(true)
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

  // 重置滑动状态
  swipedTaskId.value = null;

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

// 切换日期选项卡时重新加载任务
watch(activeTab, () => {
  // 如果在搜索模式下切换日期，则退出搜索模式
  if (isSearchMode.value) {
    isSearchMode.value = false;
    searchValue.value = "";
  }
  loadTasks(true);
});

onBeforeMount(() => {
  const isLoggedIn = checkLogin();
  if (isLoggedIn) {
    // 用户已登录，加载任务数据
    loadTasks(true);
  }

  // 为任务数据添加备注字段
  taskList.value.forEach((task) => {
    if (!task.hasOwnProperty("remark")) {
      task.remark = "";
    }
  });
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
  // 添加onShow生命周期钩子
  onShow() {
    console.log("页面生命周期触发onShow");
    handlePageShow();
  },
});

// 处理任务详情跳转
async function goToTaskDetail(taskId) {
  try {
    // 保存当前滚动位置
    // #ifdef H5
    scrollPosition.value =
      document.documentElement.scrollTop || document.body.scrollTop;
    // #endif

    // #ifdef APP-PLUS
    const currentWebview = plus.webview.currentWebview();
    scrollPosition.value = currentWebview.getScrollPosition().y;
    // #endif

    // 显示加载提示
    uni.showLoading({
      title: "加载中...",
      mask: true,
    });

    // 获取用户ID和司机名称
    const userStore = useUserStore();
    const userId = userStore.userInfo.userid;
    const driverName = userStore.userInfo.name || "";

    // 准备任务基本信息
    const taskInfo = {
      id: taskId,
      userid: userId,
      driver: driverName,
    };

    // 使用task store存储基本任务数据
    const taskStore = useTaskStore();
    taskStore.setCurrentTask(taskInfo);

    // 跳转到详情页
    uni.navigateTo({
      url: `/pages/task/detail`,
      success: () => {
        console.log("跳转到任务详情页", taskId);
      },
      fail: (err) => {
        console.error("跳转失败", err);
        uni.showToast({
          title: "跳转失败",
          icon: "none",
        });
      },
      complete: () => {
        uni.hideLoading();
      },
    });
  } catch (error) {
    console.error("跳转到详情页失败", error);
    uni.hideLoading();
    uni.showToast({
      title: "加载失败，请重试",
      icon: "none",
    });
  }
}

// 添加页面显示时的处理函数
function handlePageShow() {
  console.log("页面显示，恢复滚动位置:", scrollPosition.value);

  // 重置滑动状态，确保返回时不再显示详情按钮
  swipedTaskId.value = null;

  // 延迟执行，确保DOM已经渲染完成
  setTimeout(() => {
    // #ifdef H5
    window.scrollTo(0, scrollPosition.value);
    // #endif

    // #ifdef APP-PLUS
    const currentWebview = plus.webview.currentWebview();
    currentWebview.scrollTo(0, scrollPosition.value);
    // #endif
  }, 100);
}

// 处理触摸开始事件
function handleTouchStart(event, taskId) {
  touchStartX.value = event.touches[0].clientX;
  // 如果点击的不是当前已滑出的项，则重置滑出状态
  if (swipedTaskId.value !== null && swipedTaskId.value !== taskId) {
    swipedTaskId.value = null;
  }
}

// 处理触摸结束事件
function handleTouchEnd(event, taskId) {
  touchEndX.value = event.changedTouches[0].clientX;
  const diffX = touchStartX.value - touchEndX.value;

  // 如果是向左滑动超过50px，则显示操作按钮
  if (diffX > 50) {
    swipedTaskId.value = taskId;
  }
  // 如果是向右滑动超过50px，则隐藏操作按钮
  else if (diffX < -50) {
    swipedTaskId.value = null;
  }
}

// 重置滑动状态
function resetSwipeState() {
  swipedTaskId.value = null;
}

// 设置任务为已完成
async function setTaskCompleted(taskId) {
  try {
    // 获取用户ID
    const userStore = useUserStore();
    const userId = userStore.userInfo.userid;

    // 调用API更新任务状态
    const response = await updateTaskStatus(taskId, 1, userId);

    // 更新本地数据
    const taskIndex = taskList.value.findIndex((t) => t.id === taskId);
    if (taskIndex > -1) {
      taskList.value[taskIndex].status = 1;

      // 更新store中的数据
      const taskStore = useTaskStore();
      taskStore.updateTaskStatus(taskId, 1);

      uni.showToast({
        title: "已设为已完成",
        icon: "success",
        position: "center",
        mask: true,
      });
    }
  } catch (error) {
    console.error("设置任务状态失败", error);
    uni.showToast({
      title: "设置失败，请重试",
      icon: "none",
      position: "center",
      mask: true,
    });
  }
}
</script>

<template>
  <view class="task-page" :class="{ 'android-platform': isAndroid }">
    <!-- 日期选项卡 - 固定在顶部 -->
    <view class="date-tabs-wrap">
      <van-tabs
        v-model:active="activeTab"
        :swipeable="false"
        :scrollspy="false"
        :sticky="true"
        type="card"
        color="#2d466b"
      >
        <van-tab
          v-for="(item, index) in dateTabs"
          :title="item.label"
          :key="index"
          :name="index"
        />
      </van-tabs>
    </view>

    <!-- 日期选项卡占位元素，防止内容被遮挡 -->
    <view class="date-tabs-space"></view>

    <!-- 搜索框 -->
    <view class="search-box">
      <view class="search-input">
        <van-icon name="search" color="#999" size="16" />
        <input
          type="text"
          v-model="searchValue"
          placeholder="请输入姓名/电话"
          placeholder-class="placeholder-style"
          @confirm="handleSearch"
        />
        <van-icon
          v-if="searchValue"
          name="clear"
          color="#999"
          size="16"
          @click="
            searchValue = '';
            isSearchMode && loadTasks(true);
            isSearchMode = false;
          "
        />
      </view>
      <view class="search-btn" @click="handleSearch">
        {{ isSearchMode ? "取消" : "搜索" }}
      </view>
    </view>

    <!-- 任务信息 -->
    <view class="task-info">
      <view v-if="isSearchMode" class="search-info">
        搜索结果: {{ totalTasks }} 个任务
      </view>
      <view v-else> 当天共计 {{ totalTasks }} 个任务： </view>
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
        class="task-item-wrapper"
        v-for="task in taskList"
        :key="task.id"
        @touchstart="handleTouchStart($event, task.id)"
        @touchend="handleTouchEnd($event, task.id)"
      >
        <view
          class="task-item"
          :class="{
            'canceled-item': task.status === 3,
            swiped: swipedTaskId === task.id,
          }"
          @click="resetSwipeState"
        >
          <!-- 任务头部信息 -->
          <view class="task-header">
            <view class="user-info">
              <van-icon name="manager" size="16" color="#999" />
              <text class="task-number">{{ task.id }}. </text>
              <text class="user-name">{{ task.name }}</text>
              <text class="user-phone">{{ task.phone }}</text>
              <text class="person-count">{{ task.personCount }}人</text>
              <van-icon
                v-if="task.hasMessage"
                name="chat"
                color="#ff4d4f"
                size="16"
              />
            </view>
            <view class="route-info">
              <van-icon name="location" size="16" color="#999" />
              <text>{{ task.route }}</text>
            </view>
          </view>

          <!-- 任务时间信息 -->
          <view class="task-time">
            <view class="start-time">
              <text class="time">{{ task.time.start }}</text>
              <text class="location">{{
                task.flightInfo?.location || "---"
              }}</text>
              <text class="flight-code">{{
                task.flightInfo?.code || "---"
              }}</text>
            </view>

            <view class="time-line">
              <view class="time-icon-wrapper">
                <van-icon name="logistics" color="#2d466b" size="24" />
                <text class="task-type-label">{{
                  getTaskTypeLabel(task)
                }}</text>
              </view>
            </view>

            <view class="end-time" v-if="task.time.end">
              <text class="time">{{ task.time.end }}</text>
              <text class="location">{{
                task.flightInfo?.location || "---"
              }}</text>
              <text class="flight-code">{{
                task.flightInfo?.code || "---"
              }}</text>
            </view>
            <view class="end-time" v-else>
              <text class="time">---</text>
            </view>
          </view>

          <!-- 任务状态和操作 -->
          <view class="task-status">
            <view class="status-badge" :class="getStatusClass(task.status)">
              {{ getStatusText(task.status) }}
            </view>

            <view class="task-actions">
              <van-button
                size="small"
                round
                plain
                type="primary"
                custom-class="plain-btn remark-btn"
                class="action-btn"
                @click.stop="openRemarkPopup(task.id)"
              >
                <van-icon name="comment-o" class="btn-icon" />备注
              </van-button>
              <van-button
                size="small"
                round
                plain
                type="primary"
                custom-class="plain-btn call-btn"
                class="action-btn"
                @click.stop="callPhone(task.phone)"
              >
                <van-icon name="phone" class="btn-icon" />呼叫
              </van-button>
              <van-button
                size="small"
                round
                plain
                type="primary"
                custom-class="plain-btn"
                class="action-btn"
                :disabled="task.status === 1 || task.status === 3"
                :class="{
                  'disabled-btn': task.status === 1 || task.status === 3,
                }"
                @click.stop="setTaskCompleted(task.id)"
                >设为已完成</van-button
              >
            </view>
          </view>
        </view>

        <!-- 左滑显示的操作按钮 -->
        <view class="swipe-actions" :class="{ show: swipedTaskId === task.id }">
          <view
            class="swipe-btn detail-btn"
            @click.stop="goToTaskDetail(task.id)"
          >
            <van-icon name="description" size="20" />
            <text>详情</text>
          </view>
        </view>
      </view>

      <!-- 加载状态提示 -->
      <view class="loading-status" v-if="taskList.length > 0">
        <view v-if="loadingMore" class="loading-more">
          <view class="loading-icon"></view>
          <text>正在加载更多...</text>
        </view>
        <text v-else-if="noMoreData">没有更多数据了</text>
        <view v-else class="load-more-btn" @click="handleReachBottom">
          <text>点击加载更多</text>
        </view>
      </view>
      <view class="empty-status" v-else-if="!isLoading">
        <text>暂无任务数据</text>
      </view>
    </view>

    <!-- 备注弹出层 -->
    <van-popup
      v-model:show="showRemark"
      round
      position="bottom"
      custom-style="height: 60%;"
    >
      <view class="remark-popup">
        <view class="remark-header">
          <text class="remark-title">添加备注</text>
          <van-icon name="cross" size="20" @click="showRemark = false" />
        </view>

        <view class="remark-content">
          <textarea
            v-model="remarkContent"
            placeholder="请输入备注信息..."
            class="remark-textarea"
            maxlength="500"
            auto-height
            cursor-spacing="120"
          />
        </view>

        <view class="remark-footer">
          <van-button
            block
            type="primary"
            round
            @click="saveRemark"
            :loading="remarkSaving"
            loading-text="保存中..."
          >
            保存备注
          </van-button>
        </view>
      </view>
    </van-popup>

    <!-- 底部选项卡 -->
    <BaseTabbar />
  </view>
</template>

<style scoped>
.task-page {
  background-color: #f5f7fa;
  min-height: 100vh;
  padding-bottom: 100rpx;
  box-sizing: border-box;
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
  margin-bottom: 20rpx;
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

.date-tabs-wrap {
  width: 100%;
  position: fixed;
  top: 0;
  padding: 138rpx 0 28rpx;
  width: 100%;
  z-index: 13;
  background-color: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

/* 为固定的日历添加占位空间，防止内容被遮挡 */
.date-tabs-space {
  height: 98rpx;
  line-height: 98rpx;
}

.search-box {
  /* 移除margin-top，改用padding-top */
  margin-top: -10rpx;
  display: flex;
  padding: 80rpx 24rpx 24rpx;
  background-color: white;
}

.search-input {
  display: flex;
  flex: 1;
  align-items: center;
  background-color: #f5f7fa;
  border-radius: 40rpx;
  padding: 12rpx 24rpx;
  margin-right: 20rpx;
}

.search-input input {
  flex: 1;
  border: none;
  background: transparent;
  margin-left: 12rpx;
  height: 48rpx;
  font-size: 28rpx;
}

.placeholder-style {
  color: #999;
  font-size: 28rpx;
}

.search-btn {
  background-color: #2d466b;
  color: white;
  padding: 12rpx 32rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.task-info {
  padding: 24rpx 32rpx;
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

.task-item-wrapper {
  position: relative;
  margin-bottom: 24rpx;
  overflow: hidden;
}

.task-item {
  background-color: white;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease;
}

.task-item.swiped {
  transform: translateX(-120rpx);
}

.task-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.user-info {
  display: flex;
  align-items: center;
}

.task-number {
  margin-left: 8rpx;
  font-weight: 500;
}

.user-name {
  margin-left: 4rpx;
  font-weight: 500;
}

.user-phone {
  margin-left: 12rpx;
  color: #666;
}

.person-count {
  margin: 0 12rpx;
  background-color: #f0f2f5;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #666;
}

.route-info {
  color: #666;
  display: flex;
  align-items: center;
}

.route-info text {
  margin-left: 8rpx;
}

.task-time {
  display: flex;
  align-items: center;
  margin: 32rpx 0;
}

.start-time,
.end-time {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.time {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
}

.location,
.flight-code {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999;
}

.time-line {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 32rpx;
  position: relative;
  z-index: 10;
}

.time-icon-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.task-type-label {
  font-size: 20rpx;
  color: #2d466b;
  margin-top: 6rpx;
  background-color: #f0f2f5;
  padding: 2rpx 8rpx;
  border-radius: 10rpx;
  white-space: nowrap;
}

.destination {
  background-color: #f5f7fa;
  padding: 16rpx 24rpx;
  border-radius: 8rpx;
  color: #666;
  font-size: 28rpx;
  margin-bottom: 24rpx;
}

.task-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24rpx;
}

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

.task-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-left: auto;
}

.action-btn {
  margin-left: 16rpx;
  height: 56rpx;
  line-height: 56rpx;
}

.call-btn {
  display: flex;
  align-items: center;
}

.btn-icon {
  margin-right: 4rpx;
}

.action-btn.disabled-btn {
  color: #ccc !important;
  border-color: #ccc !important;
  pointer-events: none;
}

/* 为按钮自定义颜色 */
:deep(.van-button--primary) {
  background-color: #2d466b !important;
  border-color: #2d466b !important;
}

:deep(.van-button--plain) {
  color: #2d466b !important;
  border-color: #2d466b !important;
  background-color: transparent !important;
}

:deep(.van-button--disabled) {
  opacity: 1 !important;
}

.bottom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background-color: white;
  border-top: 1px solid #eee;
  padding: 8px 0;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #999;
  padding: 4px 0;
}

.tab-item.active {
  color: #1989fa;
}

.tab-item text {
  margin-top: 4px;
}

.canceled-item {
  opacity: 0.6;
}

.canceled-item .user-name,
.canceled-item .task-number,
.canceled-item .user-phone,
.canceled-item .person-count,
.canceled-item .route-info,
.canceled-item .time,
.canceled-item .location,
.canceled-item .flight-code,
.canceled-item .destination {
  color: #999 !important;
}

.remark-popup {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 32rpx;
  box-sizing: border-box;
}

.remark-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.remark-title {
  font-size: 32rpx;
  font-weight: 500;
}

.remark-content {
  flex: 1;
  margin-bottom: 32rpx;
  background-color: #f5f7fa;
  border-radius: 8rpx;
  padding: 8rpx;
}

.remark-textarea {
  width: 100%;
  min-height: 300rpx;
  padding: 24rpx;
  border-radius: 8rpx;
  background-color: #f5f7fa;
  box-sizing: border-box;
  font-size: 28rpx;
  line-height: 1.5;
}

.remark-footer {
  padding-bottom: 20rpx;
}

.loading-status,
.empty-status {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
  font-size: 28rpx;
}

.loading-status {
  padding-bottom: 60rpx;
}

.empty-status {
  padding: 100rpx 0;
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

.search-info {
  color: #2d466b;
  font-weight: 500;
}

.swipe-actions {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  display: flex;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.swipe-actions.show {
  transform: translateX(0);
}

.swipe-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 100%;
  color: white;
  font-size: 24rpx;
}

.swipe-btn text {
  margin-top: 8rpx;
}

.detail-btn {
  background-color: #2d466b;
}
</style>