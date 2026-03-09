import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/viewsHtml/Login.vue'
import RegisterView from '../views/viewsHtml/Register.vue'
import DashboardView from '../views/viewsHtml/Dashboard.vue'
import ForgotPasswordView from '../views/viewsHtml/ForgotPassword.vue'
import ResetPasswordView from '../views/viewsHtml/ResetPassword.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    {
      path: '/login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      component: RegisterView,
      meta: { guestOnly: true },
    },
    {
      path: '/forgot-password',
      component: ForgotPasswordView,
      meta: { guestOnly: true },
    },
    {
      path: '/reset-password',
      component: ResetPasswordView,
      meta: { guestOnly: true },
    },
    {
      path: '/dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // Initialiser depuis le stockage si nécessaire
  if (!authStore.token) {
    authStore.initFromStorage()
  }

  const isAuthenticated = authStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ path: '/login' })
    return
  }

  if (to.meta.guestOnly && isAuthenticated) {
    next({ path: '/dashboard' })
    return
  }

  next()
})

export default router
