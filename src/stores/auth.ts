import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { type LoginFormPayload } from '@/types/forms'
import { loginUser } from '@/api/authApi'
import { useCookies } from '@vueuse/integrations/useCookies'
import api from '@/api/index'
import { useUsersStore } from './users'

/**
 * Pinia auth store.
 * Responsibilities:
 * - persist token/user in cookies
 * - restore auth state after refresh
 * - validate session via /me endpoint
 */
export const useAuthStore = defineStore('auth', () => {
  const cookies = useCookies(['auth_user', 'auth_token'])
  const user = ref<any>(cookies.get('auth_user') || null)
  const accessToken = ref<string | null>(cookies.get('auth_token') || null)

  const isAuthenticated = computed(() => !!accessToken.value)

  /** Sync in-memory user and cookie state. */
  function setUser(u: any) {
    user.value = u
    if (u) {
      cookies.set('auth_user', u, { path: '/', sameSite: 'lax' })
    } else {
      cookies.remove('auth_user', { path: '/' })
    }
  }

  function clearUser() {
    user.value = null
    cookies.remove('auth_user', { path: '/' })
  }


  /**
   * Login flow:
   * 1) request token/user
   * 2) persist auth data
   * 3) preload users list for cross-feature lookups
   */
  async function login(payload: LoginFormPayload) {
    const resp = await loginUser(payload)
    setAccessToken(resp.auth_token)
    cookies.set('auth_token', resp.auth_token, { path: '/', sameSite: 'lax' })
    setUser(resp.user)

    // Load all users after successful login for efficient lookups
    const usersStore = useUsersStore()
    await usersStore.fetchAll().catch(err => {
      console.warn('Failed to load users list:', err)
    })

    return resp
  }

  /** Clear local auth session state. */
  async function logout() {
    // await authApi.logout()
    // accessToken.value = null
    // user.value = null
    console.log('Logging out user:', user.value)
    cookies.remove('auth_token', { path: '/' })
    clearUser()
  }

  function setAccessToken(t: string) {
    accessToken.value = t
  }

  /**
   * Verifies the current token by calling /me.
   * Authentication failures (401/403) trigger logout, while transient server
   * failures keep the session to avoid unnecessary user disruption.
   */
  async function verifyAuth() {
    // First check if token exists in cookies and restore it if needed
    const tokenFromCookie = cookies.get('auth_token')
    const userFromCookie = cookies.get('auth_user')

    if (tokenFromCookie && !accessToken.value) {
      accessToken.value = tokenFromCookie
    }

    if (userFromCookie && !user.value) {
      user.value = userFromCookie
    }

    // If no token found in state or cookies, return false
    if (!accessToken.value) {
      console.log('No token found, cannot verify auth')
      return false
    }

    try {
      // Call /me endpoint which validates the token via authenticateToken middleware
      console.log('Verifying auth with /me endpoint...')
      const response = await api.get('/me')

      // Update user data with the response
      if (response.data) {
        setUser(response.data)
        console.log('Auth verified successfully, user updated')
      }

      // Load all users for efficient lookups (if not already loaded)
      const usersStore = useUsersStore()
      if (usersStore.list.length === 0) {
        await usersStore.fetchAll().catch(err => {
          console.warn('Failed to load users list:', err)
        })
      }

      return true
    } catch (error: any) {
      const status = error.response?.status
      console.error('Auth verification failed:', status, error.response?.data)

      // Only logout on authentication errors (401, 403)
      // Don't logout on server errors (500, 502, etc.)
      if (status === 401 || status === 403) {
        console.log('Token is invalid or expired, logging out')
        await logout()
        return false
      }

      // For other errors (500, network errors), keep the user logged in
      console.warn('Server error during auth verification, keeping user logged in')
      return true
    }
  }

  return { user, accessToken, isAuthenticated, login, logout, setAccessToken, verifyAuth }
})
