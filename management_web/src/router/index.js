import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

import Layout from '@/layout'

export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login/Login'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/404/404.vue'),
    hidden: true
  },
  {
    path: '/',
    component: Layout,
    redirect: '/mywork',
    children: [{
      path: 'mywork',
      name: '我的工作台',
      component: () => import('@/views/general/myWork/MyWork.vue'),
      meta: { path: '/mywork' }
    }]
  },
  {
    path: '/project',
    component: Layout,
    redirect: '/project/about',
    name: '项目',
    children: [{
      path: 'about',
      name: '项目',
      component: () => import('@/views/general/project/Project.vue'),
      meta: { path: '/project/about' }
    }]
  }
]

export const adminRoutes = [
  {
    path: '/admin',
    component: Layout,
    redirect: '/admin/user',
    name: '系统管理',
    children: [{
      path: 'user',
      name: '用户管理',
      component: () => import('@/views/admin/user/User.vue'),
      meta: { path: '/admin/user' }
    }]
  }
]

const createRouter = () => new VueRouter({
  mode: 'history',
  routes: constantRoutes
})

const router = createRouter()

// 重置路由
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher
}

export default router
