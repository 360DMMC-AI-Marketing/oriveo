import api from "./api";

export function getUnifiedPatient(id: string) {
  return api.get(`/patients/${id}/unified`).then(r => r.data);
}

export function createMedicalRecord(id: string, data: any) {
  return api.post(`/patients/${id}/records`, data).then(r => r.data);
}

export function deleteMedicalRecord(id: string, rid: string) {
  return api.delete(`/patients/${id}/records/${rid}`).then(r => r.data);
}

export function uploadDocument(id: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return api.post(`/patients/${id}/documents`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(r => r.data);
}

export function deleteDocument(id: string, did: string) {
  return api.delete(`/patients/${id}/documents/${did}`).then(r => r.data);
}

export function addVitalSign(id: string, data: any) {
  return api.post(`/patients/${id}/vitals`, data).then(r => r.data);
}

export function getVitalSigns(id: string, params?: { from?: string; to?: string }) {
  return api.get(`/patients/${id}/vitals`, { params }).then(r => r.data);
}

export function searchDocuments(query: string) {
  return api.get("/patients/search/documents", { params: { q: query } }).then(r => r.data);
}
