export type LoginFormPayload = {
  username: string,
  password: string
}

export type SignupPayload = {
  first_name: string
  last_name: string
  user_name: string
  province: string
  municipality: string
  user_type: 1 | 2 | 3
  email: string
  username: string
  passwd: string
  confirmPassword: string
}
