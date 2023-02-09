export type UserLoginType = {
  username: string
  password: string
}

export type UserType = {
length: number
forEach(arg0: (arrayItem: any) => void): unknown
  username: string
  password: string
  role: string
  roleId: string
  email: string
  county_id: BigInteger
  avatar: string
  phone: string
  isactive: boolean
  permissions: string | string[]
}
