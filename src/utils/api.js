import { useUserStore } from '@/store/user.js'

// API基础URL
const BASE_URL = 'http://localhost:3001' // 可以根据实际环境配置

/**
 * 通用请求方法
 * @param {Object} options
 * @param {string} options.url - 相对路径，不需要包含BASE_URL
 * @param {string} [options.method='GET']
 * @param {Object} [options.data={}]
 * @param {Object} [options.header={}]
 * @param {boolean} [options.auth=true] - 是否需要添加授权token
 * @returns {Promise}
 */
export function request({
  url,
  method = 'GET',
  data = {},
  header = {},
  auth = true,
}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
  const headers = { ...header }

  // 如果需要授权，自动添加token
  if (auth) {
    const userStore = useUserStore()
    if (userStore.token) {
      headers['Authorization'] = `Bearer ${userStore.token}`
    }
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: fullUrl,
      method,
      data,
      header: headers,
      success: (res) => resolve(res),
      fail: (err) => reject(err),
    })
  })
}

/**
 * 获取任务列表
 * @param {string} date - 日期字符串，格式为YYYY-MM-DD
 * @param {string} [userId] - 用户ID，如果不提供则从store中获取
 * @param {number} [page=1] - 页码，默认第1页
 * @returns {Promise}
 */
export function fetchTasks(date, userid, page = 1) {
  return request({
    url: '/tasks',
    method: 'POST',
    data: {
      userid,
      date: date,
      page: page,
    },
  })
}

/**
 * 搜索任务
 * @param {Object} params - 搜索参数
 * @param {string} params.userid - 用户ID
 * @param {string} [params.yname] - 客户姓名，与tel二选一
 * @param {string} [params.tel] - 客户电话，与yname二选一
 * @param {number} [params.page=1] - 页码，默认第1页
 * @returns {Promise}
 */
export function searchTasks(params) {
  return request({
    url: '/search-tasks',
    method: 'POST',
    data: params,
  })
}

/**
 * 更新任务备注
 * @param {number} taskId - 任务ID
 * @param {string} remark - 备注内容
 * @param {string} userId - 用户ID
 * @returns {Promise}
 */
export function updateTaskRemark(taskId, remark, userId) {
  return request({
    url: '/update-remark',
    method: 'POST',
    data: {
      id: taskId,
      remark: remark,
      userid: userId,
    },
  })
}

/**
 * 更新任务通知状态
 * @param {number} taskId - 任务ID
 * @param {number} isnotice - 通知状态（1: 已通知, 2: 未通知）
 * @param {string} userId - 用户ID
 * @returns {Promise}
 */
export function updateNoticeStatus(taskId, isnotice, userId) {
  return request({
    url: '/update-notice-status',
    method: 'POST',
    data: {
      id: taskId,
      isnotice: isnotice,
      userid: userId,
    },
  })
}

/**
 * 更新任务状态
 * @param {number} taskId - 任务ID
 * @param {number} status - 任务状态（1: 已完成, 2: 未完成, 3: 已取消）
 * @param {string} userId - 用户ID
 * @returns {Promise}
 */
export function updateTaskStatus(taskId, status, userId) {
  return request({
    url: '/update-task-status',
    method: 'POST',
    data: {
      id: taskId,
      status: status,
      userid: userId,
    },
  })
}

/**
 * 获取单个任务详情
 * @param {number} taskId - 任务ID
 * @param {string} userId - 用户ID
 * @returns {Promise}
 */
export function getTaskDetail(taskId, userId) {
  return request({
    url: '/task-detail',
    method: 'POST',
    data: {
      id: taskId,
      userid: userId,
    },
  })
}

/**
 * 修改用户密码
 * @param {string} userId - 用户ID
 * @param {string} oldPassword - 原密码
 * @param {string} newPassword - 新密码
 * @returns {Promise}
 */
export function changePassword(userId, oldPassword, newPassword) {
  return request({
    url: '/change-password',
    method: 'POST',
    data: {
      userid: userId,
      oldPassword: oldPassword,
      newPassword: newPassword,
    },
  })
}

/**
 * 获取绩效数据
 * @param {string} userId - 用户ID
 * @param {string} date - 日期字符串，格式为YYYY-MM-DD
 * @param {number} [page=1] - 页码，默认第1页
 * @returns {Promise}
 */
export function getPerformanceData(userId, date, page = 1) {
  return request({
    url: '/all-tasks',
    method: 'POST',
    data: {
      userid: userId,
      date: date,
      page: page,
    },
  })
}
