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

// Public: submit a new data request (no auth)
export const submitDataRequest = (payload: DataRequestPayload) =>
  axios
    .post(`${base}/api/public/data-request`, payload, {
      headers: { 'Content-Type': 'application/json' }
    })
    .then((res) => res.data)

// ── Admin: Data Request Documents ───────────────────────────────────────────
// These operate on the DataRequestDocument model — a dedicated table
// separate from settlement/repository documents.

// List all documents attached to a data request (includes auto-generated PDF)
export const getDataRequestDocuments = (requestId: number, token: string) =>
  axios
    .get(`${base}/api/v1/data-requests/${requestId}/documents`, {
      headers: { 'x-access-token': token }
    })
    .then((res) => res.data)

// Upload a document (PDF / ZIP / etc.) to a data request
export const uploadDataRequestDocument = (requestId: number, file: File, token: string) => {
  const fd = new FormData()
  fd.append('file', file)
  return axios
    .post(`${base}/api/v1/data-requests/${requestId}/documents`, fd, {
      headers: { 'x-access-token': token }
    })
    .then((res) => res.data)
}

// Delete a document from a data request
export const deleteDataRequestDocument = (requestId: number, docId: number, token: string) =>
  axios
    .delete(`${base}/api/v1/data-requests/${requestId}/documents/${docId}`, {
      headers: { 'x-access-token': token }
    })
    .then((res) => res.data)

// Download a document (returns Blob for browser save-as)
export const downloadDataRequestDocument = (
  requestId: number,
  docId: number,
  token: string
): Promise<Blob> =>
  axios
    .get(`${base}/api/v1/data-requests/${requestId}/documents/${docId}/download`, {
      headers: { 'x-access-token': token },
      responseType: 'blob'
    })
    .then((res) => res.data)

// Ensure the generated request form exists (creates it if missing)
export const generateDataRequestFormDocument = (requestId: number, token: string, force = false) =>
  axios
    .post(
      `${base}/api/v1/data-requests/${requestId}/documents/generate-form`,
      { force },
      { headers: { 'x-access-token': token, 'Content-Type': 'application/json' } }
    )
    .then((res) => res.data)

// Share all documents for a request with the requester:
//   - backend generates a public share token
//   - sends email to the requester with the link
//   - returns { token } so the admin can also copy the link
// Public link will be:  /#/share/<token>  (served by SharedDocumentsPublic.vue)
export const shareDataRequest = (requestId: number, token: string) =>
  axios
    .post(
      `${base}/api/v1/data-requests/${requestId}/share`,
      {},
      { headers: { 'x-access-token': token, 'Content-Type': 'application/json' } }
    )
    .then((res) => res.data)
