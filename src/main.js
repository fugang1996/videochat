/*
 * @Descripttion: no
 * @version: 1.0.0
 * @Author: fugang
 * @Date: 2021-11-18 15:14:09
 * @LastEditors: fugang
 * @LastEditTime: 2021-11-18 15:27:22
 */
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
