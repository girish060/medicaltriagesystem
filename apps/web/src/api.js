export const API_BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:3001'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const api = {
  doctors: () => request(`/doctors`),
  patients: () => request(`/patients`),
  patientUpcoming: (id) => request(`/patients/${encodeURIComponent(id)}/upcoming`),
  createAppointment: (data) => request(`/appointments`, { method: 'POST', body: JSON.stringify(data) }),
  queue: (doctorId) =>
    request(`/appointments/queue?doctorId=${encodeURIComponent(doctorId)}`),
  arrive: (id) => request(`/appointments/${id}/arrive`, { method: 'POST' }),
  doctorStart: (appointmentId) =>
    request(`/doctor/${encodeURIComponent(appointmentId)}/start`, { method: 'POST' }),
  doctorComplete: (appointmentId) =>
    request(`/doctor/${encodeURIComponent(appointmentId)}/complete`, { method: 'POST' }),
  emergencies: () => request(`/emergency`),
  raiseEmergency: (data) => request(`/emergency`, { method: 'POST', body: JSON.stringify(data) }),
  notifications: (limit = 50) => request(`/notifications?limit=${limit}`),
  scanQr: (qrData) => request(`/qr/scan`, { method: 'POST', body: JSON.stringify({ qrData }) }),
  markOnWay: (id, latitude, longitude) => 
    request(`/appointments/${id}/on-way`, { method: 'POST', body: JSON.stringify({ latitude, longitude }) }),
  updateLocation: (id, latitude, longitude) => 
    request(`/appointments/${id}/update-location`, { method: 'POST', body: JSON.stringify({ latitude, longitude }) }),
}
