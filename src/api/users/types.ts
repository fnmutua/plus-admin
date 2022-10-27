export type UserLoginType = {
  username: string
  password: string
}

export type UserType = {
  username: string
  password: string
  role:  string[]
  roleId: string
  email: string
  county_id: BigInteger
  avatar: string
  phone: string
  isactive: boolean
  permissions: string | string[]
}
