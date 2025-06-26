import { createSSRApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
const pinia = createPinia()
export function createApp() {
  const app = createSSRApp(App)
  pinia.use(piniaPluginPersistedstate)

  app.use(pinia)
  return {
    app,
  }
}
