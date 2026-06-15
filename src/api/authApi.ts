import axios from 'axios'
import type { LoginFormPayload, SignupPayload } from '@/types/forms'

const API_BASE = import.meta.env.VITE_LOCALE_URL
const axiosPost = async (url: string, apiPayload: any) => {
  return await axios.post(url, apiPayload, {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function loginUser(payload: LoginFormPayload) {
  const url = `${API_BASE}/auth/login`
  const apiPayload = { user_name: payload.username, passwd: payload.password }
  const response = await axiosPost(url, apiPayload)
  return response.data
}

export async function createUser(payload: SignupPayload) {
  const url = `${API_BASE}/auth/signup`
  const { confirmPassword, ...rest } = payload
  const apiPayload = payload
  const response = await axiosPost(url, apiPayload)
  return response.data
}
