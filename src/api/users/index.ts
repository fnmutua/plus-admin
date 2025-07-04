import request from '@/config/axios'
import type { UserType } from '../register/types'

interface RoleParams {
  roleName: string
}

const dev = import.meta.env.VITE_APP_HOST + ':4000' // Add the port for local Dev
const prod = import.meta.env.VITE_APP_HOST // remove the port for production

/* export const xgetUserListApi = ({ params }: AxiosConfig) => {
  return request.get<{
    total: number
    list: UserType[]
  }>({ url: prod + '/api/v1/user/xall', params })
}
 */


export const getUserListApi = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/user/all', data })
}


export const getCountyStaff = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/user/county', data })
}


export const getGRMStaff = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/user/grm', data })
}

export const getGRMStaffByLocation = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/user/grm/location', data })
}





export const getAdminStaff = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/user/admin', data })
}




export const activateUserApi = (data: UserType, params): Promise<IResponse<UserType>> => {
  console.log('To Activate user....', data)
  return request.post({ url: prod + '/api/v1/user/activate', data, params: params })
}


export const updateUserApi = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('To Activate user....', data)
  return request.post({ url: prod + '/api/auth/update', data  })
}


export const updateByUserApi = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('To Activate user....', data)
  return request.post({ url: prod + '/api/auth/profile/update', data, enctype:'multipart/form-data' })
}
 

export const getMyProfile = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('To Activate user....', data)
  return request.post({ url: prod + '/api/auth/profile', data })
}



export const resetUserPassword = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('Reset user password....', data)
  return request.post({ url: prod + '/api/auth/reset', data })
}


export const updateUserPass = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('Reset user password....', data)
  return request.post({ url: prod + '/api/auth/set', data })
}



export const getUserByKeyWord = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('Get user via search string..', data)
  return request.post({ url: prod + '/api/v1/user/keyword', data })
}



export const getSystemRoles = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/roles/all', data })
}


export const setUserFeedback = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/feedback/add', data })
}


export const getUserFeedback = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/feedback/all', data })
}



export const getUserRoles = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/role/subordinate', data })
}


export const getByName = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/user/name', data })
}
 
export const checkUser = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/user/check', data })
}

export const checkUserNames = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/user/multiple', data })
}


export const deleteAccount = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/user/delete', data })
}

//export const getRoles = (params) => request.get({ url: prod + '/api/v1/roles', params })
//export const getRole = (roleId, params) => request.get({ url: prod + `/api/v1/roles/${roleId}`, params })
//export const createRole = (data) => request.post({ url: prod + '/api/v1/roles', data })
//export const updateRole = (roleId, data) => request.put({ url: prod + `/api/v1/roles/${roleId}`, data })
//export const deleteRole = (roleId) => request.delete({ url: prod + `/api/v1/roles/${roleId}` })


export const getRoles = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/roles/all', data })
}



export const getRole = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/roles/one', data })
}


export const updateRole = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/roles/update', data })
}

export const deleteRole = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/roles/delete', data })
}


export const createRole = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/roles/add', data })
}




export const getAllPermissions = () => request.get({ url: prod + '/api/v1/permissions' })

export const getRolePermissions = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/roles/permissions', data })
}
export const setRolePermissions = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/roles/permissions/update', data })
}
 
export const addRolePermission = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/roles/permissions/add', data })
}


export const removeRolePermission = (data: UserType): Promise<IResponse<UserType>> => {
  console.log('....', data)
  return request.post({ url: prod + '/api/v1/roles/permissions/remove', data })
}

// Function to get user permissions
export const getUserPermissions = (userId: number): Promise<IResponse<any>> => {
  return request.post({ url: prod + '/api/v1/user/permissions', data: { userId } })
}

// Function to get users by IDs and fields
export const getUsersByIds = (userIds: number[], fields?: string[]): Promise<IResponse<any>> => {
  console.log('Getting users by IDs:', userIds, 'with fields:', fields)
  return request.post({ url: prod + '/api/v1/user/by-ids', data: { userIds, fields } })
}

//export const setRolePermissions = (roleId, permissions) => request.put({ url: prod + `/api/v1/roles/${roleId}/permissions`, data: { permissions } })
//export const addRolePermission = (roleId, permission) => request.post({ url: prod + `/api/v1/roles/${roleId}/permissions`, data: { permission } })
//export const removeRolePermission = (roleId, permissionId) => request.delete({ url: prod + `/api/v1/roles/${roleId}/permissions/${permissionId}` })