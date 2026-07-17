import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '../types/api'
import { adminLoginApi, getProfileApi } from '../api'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string>(localStorage.getItem('accessToken') || '')
  const refreshToken = ref<string>(localStorage.getItem('refreshToken') || '')
  const permissions = ref<string[]>(
    (() => { try { return JSON.parse(localStorage.getItem('permissions') || '[]') } catch { return [] } })()
  )
  const userInfo = ref<UserInfo | null>(
    (() => { try { return JSON.parse(localStorage.getItem('userInfo') || 'null') } catch { return null } })()
  )

  const isLoggedIn = computed(() => !!accessToken.value)
  const isAdmin = computed(() => userInfo.value?.roles.includes('ROLE_ADMIN') ?? false)
  const hasPermission = (code: string) => permissions.value.includes(code)

  // 管理员登录：调 /auth/admin/login，后端校验 ROLE_ADMIN，无则 403
  async function adminLogin(username: string, password: string) {
    const res = await adminLoginApi({ username, password })
    const d = res.data.data
    accessToken.value = d.accessToken
    refreshToken.value = d.refreshToken
    permissions.value = d.permissions
    userInfo.value = d.userInfo
    localStorage.setItem('accessToken', d.accessToken)
    localStorage.setItem('refreshToken', d.refreshToken)
    localStorage.setItem('permissions', JSON.stringify(d.permissions))
    localStorage.setItem('userInfo', JSON.stringify(d.userInfo))
    return d
  }

  async function fetchProfile() {
    const res = await getProfileApi()
    userInfo.value = res.data.data
    permissions.value = res.data.data.permissions || []
  }

  function logout() {
    accessToken.value = ''
    refreshToken.value = ''
    permissions.value = []
    userInfo.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('permissions')
    localStorage.removeItem('userInfo')
  }

  return { accessToken, refreshToken, permissions, userInfo, isLoggedIn, isAdmin, hasPermission, adminLogin, fetchProfile, logout }
})
