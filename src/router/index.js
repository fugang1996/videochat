/*
 * @Descripttion: no
 * @version: 1.0.0
 * @Author: fugang
 * @Date: 2021-11-18 15:14:09
 * @LastEditors: fugang
 * @LastEditTime: 2021-12-10 18:09:31
 */
import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
