import { useUserStore } from '@/store/user.js'

// 用于防止重复检查登录状态的标记
let isCheckingLogin = false

export function checkLogin() {
  // 如果正在检查登录状态，直接返回
  if (isCheckingLogin) {
    return true
  }

  isCheckingLogin = true

  try {
    const userStore = useUserStore()
    const token = uni.getStorageSync('token')
    const expire = uni.getStorageSync('token_expire')

    if (!token || !expire || Date.now() > expire) {
      console.log('需要登录：token不存在或已过期')
      uni.removeStorageSync('token')
      uni.removeStorageSync('token_expire')
      userStore.clearLoginInfo()

      // 检查当前是否在登录页
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]

      if (currentPage && !currentPage.route.includes('/pages/login')) {
        uni.redirectTo({ url: '/pages/login' })
      }
      return false
    }
    return true
  } finally {
    // 确保检查完成后重置标记
    setTimeout(() => {
      isCheckingLogin = false
    }, 500)
  }
}
