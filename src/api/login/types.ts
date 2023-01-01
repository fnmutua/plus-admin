export type UserLoginType = {
  username: string
  password: string
}

export type UserType = {
  id:string
  username: string
  password: string
  role: string
  roleId: string
  permissions: string | string[]
}
