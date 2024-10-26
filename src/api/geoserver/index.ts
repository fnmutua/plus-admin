import request from '@/config/axios'
 
interface RoleParams {
  roleName: string
}

const prod = import.meta.env.VITE_APP_HOST // remove the port for production
 
 
export const uploadToGeoServer = (data)  => {
   return request.post({
    url: prod + '/api/v1/geoserver/upload',
    data    
  });
};
 


