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


export const getSubmitters = (data)  => {
  return request.post({
   url: prod + '/api/v1/collector/project/submitter',
   data    
 });
};


export const getSubmissions = (data)  => {
  return request.post({
   url: prod + '/api/v1/collector/submissions',
   data    
 });
};

export const getCSVSubmissions = (data)  => {
  return request.post({
   url: prod + '/api/v1/collector/submissions/csv',
   data    
 });
};


export const getGeoSubmissions = (data)  => {
  return request.post({
   url: prod + '/api/v1/collector/submissions/geo',
   data    
 });
};



export const getAllSubmissions = (data)  => {
  return request.post({
   url: prod + '/api/v1/collector/submissions/all',
   data    
 });
};

export const createSubmission = (data)  => {
  return request.post({
   url: prod + '/api/v1/collector/submissions/create',
   data    
 });
};

export const getSubmissionXml = (data) => {
  return request.post({
    url: prod + '/api/v1/collector/submissions/xml',
    data
  });
};

export const updateSubmissionXml = (data) => {
  return request.post({
    url: prod + '/api/v1/collector/submissions/update',
    data
  });
};

// OpenRosa-compatible multipart submission (XML + attachments in one call)
export const submitOpenRosa = (projectId: string | number, formData: FormData) => {
  return request.post({
    url: `${prod}/v1/projects/${projectId}/submission`,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${localStorage.getItem('collectorToken') || ''}`
    }
  })
}

export const getSettlements = (data)  => {
  return request.post({
   url: prod + '/api/v1/collector/settlements',
   data    
 });
};

export const deleteSubmissions = (data)  => {
  return request.post({
   url: prod + '/api/v1/collector/submissions/delete',
   data    
 });
};


export const editSubmissions = (data)  => {
  return request.post({
   url: prod + '/api/v1/collector/submissions/edit',
   data    
 });
};

export const getSubmissionAttachments = (data)  => {
  return request.post({
   url: prod + '/api/v1/collector/submissions/docs',
   data    
 });
};

export const uploadSubmissionAttachment = (data) => {
  return request.post({
   url: prod + '/api/v1/collector/submissions/attachments/upload',
   data    
 });
}


export const downloadSubmissionAttachments = (data)  => {
  const { responseType, ...requestData } = data;
  return request.post({
   url: prod + '/api/v1/collector/submissions/download',
   data: requestData,
   responseType: responseType || 'blob'
 });
};

export const getProjectUsers = (data)  => {
  return request.post({
   url: prod + '/api/v1/collector/project/users',
   data    
 });
};




 