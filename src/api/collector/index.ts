import request from '@/config/axios'
 
interface RoleParams {
  roleName: string
}

const dev = import.meta.env.VITE_APP_HOST + ':4000' // Add the port for local Dev
const prod = import.meta.env.VITE_APP_HOST // remove the port for production
 
 
export const loginCollector = (data)  => {
   return request.post({
    url: prod + '/api/v1/collector',
    data    
  });
};
 



export const getCollectorData = (data)  => {
  return request.post({
   url: prod + '/api/v1/collector/project/data',
   data    
 });
};


export const getCollectorDataCSV = (data)  => {
  return request.post({
   url: prod + '/api/v1/collector/project/csv',
   data    
 });
};

export const getCollectorDataFlattened = (data)  => {
  return request.post({
   url: prod + '/api/v1/collector/project/flat',
   data    
 });
};

 
export const getCollectorProjects = ({ params }: AxiosConfig) => {
  return request.get<{
then(arg0: (response: { data: any }) => void): unknown
    }>({ url: prod + '/api/v1/collector/project', params })
}



export const getWithMedia = (data)  => {
  return request.post({
   url: prod + '/api/v1/collector/project/media',
   data    
 });
};


export const getGeoJSON= (data)  => {
  return request.post({
   url: prod + '/api/v1/collector/project/geo',
   data    
 });
};



export const getRawCSV = (data)  => {
  return request.post({
   url: prod + '/api/v1/collector/project/raw',
   data    
 });
};
