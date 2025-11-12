export const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3001'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const api = {
  doctors: () => request<{ id: string; name: string; department: string }[]>(`/doctors`),
  patients: () => request<{ id: string; name: string }[]>(`/patients`),
  patientUpcoming: (id: string) => request<any>(`/patients/${encodeURIComponent(id)}/upcoming`),
  createAppointment: (data: {
    patientId: string
    doctorId: string
    department: string
    scheduledAt: string
    emergency?: boolean
    phoneNumber?: string
  }) => request(`/appointments`, { method: 'POST', body: JSON.stringify(data) }),
  queue: (doctorId: string) =>
    request<any[]>(`/appointments/queue?doctorId=${encodeURIComponent(doctorId)}`),
  arrive: (id: string) => request(`/appointments/${id}/arrive`, { method: 'POST' }),
  doctorStart: (appointmentId: string) =>
    request(`/doctor/${encodeURIComponent(appointmentId)}/start`, { method: 'POST' }),
  doctorComplete: (appointmentId: string) =>
    request(`/doctor/${encodeURIComponent(appointmentId)}/complete`, { method: 'POST' }),
  emergencies: () => request<any[]>(`/emergency`),
  raiseEmergency: (data: {
    patientId: string
    doctorId: string
    department: string
    notes?: string
  }) => request(`/emergency`, { method: 'POST', body: JSON.stringify(data) }),
  notifications: (limit = 50) => request<any[]>(`/notifications?limit=${limit}`),
  scanQr: (qrData: string) => request<any>(`/qr/scan`, { method: 'POST', body: JSON.stringify({ qrData }) }),
  markOnWay: (id: string, latitude: number, longitude: number) => 
    request(`/appointments/${id}/on-way`, { method: 'POST', body: JSON.stringify({ latitude, longitude }) }),
  updateLocation: (id: string, latitude: number, longitude: number) => 
    request(`/appointments/${id}/update-location`, { method: 'POST', body: JSON.stringify({ latitude, longitude }) }),
}
