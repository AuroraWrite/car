import { defineStore } from 'pinia'

export const useTaskStore = defineStore('task', {
  state: () => ({
    // 当前选中的任务详情
    currentTask: null,
    // 任务列表缓存
    taskList: [],
    // 任务总数
    totalTasks: 0,
    // 当前页码
    currentPage: 1,
    // 是否还有更多数据
    noMoreData: false,
    // 当前选中的日期
    selectedDate: '',
  }),
  actions: {
    // 设置当前选中的任务
    setCurrentTask(task) {
      this.currentTask = task
    },
    // 清除当前任务
    clearCurrentTask() {
      this.currentTask = null
    },
    // 设置任务列表
    setTaskList(list) {
      this.taskList = list
    },
    // 添加任务到列表
    addTasksToList(tasks) {
      this.taskList = [...this.taskList, ...tasks]
    },
    // 更新任务总数
    setTotalTasks(total) {
      this.totalTasks = total
    },
    // 设置当前页码
    setCurrentPage(page) {
      this.currentPage = page
    },
    // 设置是否还有更多数据
    setNoMoreData(status) {
      this.noMoreData = status
    },
    // 设置当前选中的日期
    setSelectedDate(date) {
      this.selectedDate = date
    },
    // 重置分页数据
    resetPagination() {
      this.currentPage = 1
      this.noMoreData = false
      this.taskList = []
      this.totalTasks = 0
    },
    // 更新任务状态
    updateTaskStatus(taskId, status) {
      const taskIndex = this.taskList.findIndex((t) => t.id === taskId)
      if (taskIndex > -1) {
        this.taskList[taskIndex].status = status

        // 如果当前任务是选中的任务，也更新它
        if (this.currentTask && this.currentTask.id === taskId) {
          this.currentTask.status = status
        }
      }
    },
    // 更新任务通知状态
    updateTaskNoticeStatus(taskId, status) {
      const taskIndex = this.taskList.findIndex((t) => t.id === taskId)
      if (taskIndex > -1) {
        this.taskList[taskIndex].isnotice = status

        // 如果当前任务是选中的任务，也更新它
        if (this.currentTask && this.currentTask.id === taskId) {
          this.currentTask.isnotice = status
        }
      }
    },
    // 更新任务备注
    updateTaskRemark(taskId, remark) {
      const taskIndex = this.taskList.findIndex((t) => t.id === taskId)
      if (taskIndex > -1) {
        this.taskList[taskIndex].remark = remark

        // 如果当前任务是选中的任务，也更新它
        if (this.currentTask && this.currentTask.id === taskId) {
          this.currentTask.remark = remark
        }
      }
    },
  },
  persist: {
    // 配置持久化，只持久化currentTask
    paths: ['currentTask'],
  },
})
