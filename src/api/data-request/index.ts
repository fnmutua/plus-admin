import axios from 'axios'

const base = import.meta.env.VITE_APP_HOST || ''

export interface DataRequestPayload {
  // Requester
  name: string
  organization: string
  position: string
  work_area?: string
  mailing_address?: string
  email: string
  phone: string
  // Data details
  data_description: string
  intended_use: string
  data_classification?: string[]
  geographic_scope?: string
  how_data_used?: string
  data_shared?: boolean
  sharing_details?: string
  dissemination_plan?: string
  data_made_public?: string
  heard_about?: string
  // Declaration
  declaration_name?: string
  declaration_date?: string
}

export const submitDataRequest = (payload: DataRequestPayload) =>
  axios
    .post(`${base}/api/public/data-request`, payload, {
      headers: { 'Content-Type': 'application/json' }
    })
    .then((res) => res.data)
