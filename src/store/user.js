import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    username: '',
    password: '',
    remember: false,
    token: '',
    userInfo: null,
    token_expire: 0,
    company: '',
    userphone: '',
  }),
  actions: {
    setLoginInfo({
      username,
      password,
      remember,
      token,
      userInfo,
      token_expire,
      name,
      userid,
      company,
      userphone,
    }) {
      this.username = username
      this.password = password
      this.remember = remember
      this.token = token
      this.userInfo = userInfo
      this.token_expire = token_expire || 0
      this.name = name || (userInfo && userInfo.name) || ''
      this.userid = userid || (userInfo && userInfo.id) || ''
      this.company = company || (userInfo && userInfo.company) || ''
      this.userphone = userphone || (userInfo && userInfo.phone) || ''
    },
    clearLoginInfo() {
      this.username = ''
      this.password = ''
      this.remember = false
      this.token = ''
      this.userInfo = null
      this.token_expire = 0
      this.name = ''
      this.userid = ''
      this.company = ''
      this.userphone = ''
    },
  },
  persist: true,
})
