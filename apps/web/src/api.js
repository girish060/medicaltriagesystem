export const API_BASE = import.meta.env?.VITE_API_BASE || 'https://medical-triage-api.onrender.com'

async function request(path, options = {}) {
  try {
    console.log(`🚀 Making request to: ${API_BASE}${path}`)
    console.log(`🔗 API_BASE is: ${API_BASE}`)
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error(`API Error (${res.status}):`, errorText)
      throw new Error(`API Error: ${errorText || res.statusText}`)
    }
    
    return res.json()
  } catch (error) {
    console.error('Request failed:', error)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please check your internet connection.')
    }
    throw error
  }
}

export const api = {
  // Auth endpoints
  register: (data) => request(`/auth/register`, { method: 'POST', body: JSON.stringify(data) }),
  login: (email, password) => request(`/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) }),
  profile: (token) => request(`/auth/profile`, { headers: { Authorization: `Bearer ${token}` } }),
  validateToken: (token) => request(`/auth/validate`, { method: 'POST', body: JSON.stringify({ token }) }),
  
  // Core endpoints
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
