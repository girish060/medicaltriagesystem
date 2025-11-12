import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { API_BASE } from '../api'

// Import existing pages
import Booking from './Booking'
import Doctor from './Doctor'
import Reception from './Reception'
import Emergency from './Emergency'

interface User {
  id: string
  email: string
  name: string
  role: 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN'
  phone?: string
  patientId?: string
  doctorId?: string
  patient?: any
  doctor?: any
}

interface AdminStats {
  totalPatients: number
  totalDoctors: number
  totalAppointments: number
  todayAppointments: number
  activeQueue: number
  notifications: number
}

export default function Dashboard({ 
  user, 
  onLogout 
}: { 
  user: User
  onLogout: () => void 
}) {
  const [activeTab, setActiveTab] = useState('dashboard')

  // Get user profile with appointments
  const { data: profile } = useQuery({
    queryKey: ['profile', user.id],
    queryFn: () => 
      fetch(`${API_BASE}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }).then(res => res.json()),
  })

  // Admin-specific data
  const { data: adminStats, error: adminStatsError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch admin stats: ${response.status}`)
      }
      
      return response.json()
    },
    enabled: user.role === 'ADMIN',
    retry: false
  })

  const { data: systemLogs, error: logsError } = useQuery({
    queryKey: ['system-logs'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/admin/logs?limit=50`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.status}`)
      }
      
      return response.json()
    },
    enabled: user.role === 'ADMIN' && activeTab === 'logs',
    retry: false
  })

  const { data: allUsers, error: usersError } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`)
      }
      
      return response.json()
    },
    enabled: user.role === 'ADMIN' && activeTab === 'users',
    retry: false
  })

  const { data: allAppointments, error: appointmentsError, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['all-appointments', user.role, user.id],
    queryFn: async () => {
      let endpoint = '/appointments/queue'
      
      if (user.role === 'ADMIN') {
        endpoint = '/admin/appointments?limit=100'
      } else if (user.role === 'DOCTOR' && user.doctor) {
        endpoint = `/appointments/queue?doctorId=${user.doctor.id}`
      } else if (user.role === 'PATIENT') {
        // For patients, get their specific appointments
        if (user.patient?.id) {
          endpoint = `/appointments/queue?patientId=${user.patient.id}`
        } else {
          // Fallback: use user ID to find patient appointments
          endpoint = `/appointments/queue?userId=${user.id}`
        }
      }
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch appointments: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Debug logging
      console.log('Appointments API Response:', data)
      console.log('User info:', { 
        role: user.role, 
        patientId: user.patientId, 
        patient: user.patient 
      })
      
      // If patient role, ensure client-side filtering as additional security
      if (user.role === 'PATIENT') {
        if (Array.isArray(data)) {
          const filtered = data.filter(item => {
            const apt = item.appointment || item
            // Filter by patientId - user.patient.id should match apt.patientId
            if (user.patient?.id) {
              return apt.patientId === user.patient.id
            } else {
              // If no patient relationship, check if appointment patient matches user
              return apt.patient?.id === user.patientId || false
            }
          })
          console.log('Filtered appointments:', filtered)
          return filtered
        }
      }
      
      return data
    },
    enabled: activeTab === 'appointments'
  })

  const renderPatientDashboard = () => (
    <div className="grid gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Patient Portal</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">Manage your appointments and health records</p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => setActiveTab('booking')}
            className="flex items-center justify-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Book New Appointment
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className="flex items-center justify-center gap-3 p-4 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            My Appointments
          </button>
        </div>
      </div>

      {profile?.patient?.appointments && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent Appointments</h3>
          <div className="space-y-3">
            {profile.patient.appointments.slice(0, 3).map((apt: any) => (
              <div key={apt.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      Dr. {apt.doctor.name} - {apt.department}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(apt.scheduledAt).toLocaleString()}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    apt.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    apt.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderDoctorDashboard = () => (
    <div className="grid gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Doctor Portal</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">Manage your patients and appointments</p>
        
        <div className="grid gap-4 md:grid-cols-3">
          <button
            onClick={() => setActiveTab('doctor-queue')}
            className="flex items-center justify-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            My Queue
          </button>
          <button
            onClick={() => setActiveTab('emergency')}
            className="flex items-center justify-center gap-3 p-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Emergency
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className="flex items-center justify-center gap-3 p-4 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            All Appointments
          </button>
        </div>
      </div>
    </div>
  )

  const renderNurseDashboard = () => (
    <div className="grid gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Nurse Portal</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">Manage reception and patient flow</p>
        
        <div className="grid gap-4 md:grid-cols-3">
          <button
            onClick={() => setActiveTab('reception')}
            className="flex items-center justify-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Reception Queue
          </button>
          <button
            onClick={() => setActiveTab('booking')}
            className="flex items-center justify-center gap-3 p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Book Appointment
          </button>
          <button
            onClick={() => setActiveTab('emergency')}
            className="flex items-center justify-center gap-3 p-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Emergency
          </button>
        </div>
      </div>
    </div>
  )

  const renderAdminDashboard = () => (
    <div className="grid gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Admin Portal</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">Complete system management and monitoring</p>
        
        {adminStatsError ? (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-red-600 dark:text-red-400 font-medium">Error loading admin statistics</div>
            <div className="text-red-500 dark:text-red-300 text-sm mt-1">{adminStatsError.message}</div>
            <div className="text-slate-600 dark:text-slate-400 text-sm mt-3 p-3 bg-slate-100 dark:bg-slate-700 rounded">
              <strong>Current user:</strong> {user.email} (Role: {user.role})<br/>
              <strong>Issue:</strong> Your admin token may be expired or invalid<br/>
              <strong>Solution:</strong> Click the button below to refresh your session
              <div className="mt-3">
                <button 
                  onClick={() => {
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                    window.location.reload()
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Refresh Session (Re-login)
                </button>
              </div>
            </div>
          </div>
        ) : adminStats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{adminStats.totalPatients || 0}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Total Patients</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{adminStats.totalDoctors || 0}</div>
              <div className="text-sm text-green-700 dark:text-green-300">Total Doctors</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{adminStats.totalAppointments || 0}</div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Total Appointments</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{adminStats.todayAppointments || 0}</div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">Today's Appointments</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{adminStats.activeQueue || 0}</div>
              <div className="text-sm text-red-700 dark:text-red-300">Active Queue</div>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{adminStats.notifications || 0}</div>
              <div className="text-sm text-indigo-700 dark:text-indigo-300">Notifications (24h)</div>
            </div>
          </div>
        ) : user.role === 'ADMIN' ? (
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
            <div className="text-slate-600 dark:text-slate-400">Loading admin statistics...</div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="text-yellow-700 dark:text-yellow-300">Admin access required to view statistics</div>
          </div>
        )}
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => setActiveTab('users')}
            className="flex items-center justify-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            User Management
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className="flex items-center justify-center gap-3 p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            All Appointments
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className="flex items-center justify-center gap-3 p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            System Logs
          </button>
          <button
            onClick={() => setActiveTab('system-health')}
            className="flex items-center justify-center gap-3 p-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            System Health
          </button>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'booking':
        return <Booking />
      case 'doctor-queue':
        return <Doctor />
      case 'reception':
        return <Reception />
      case 'emergency':
        return <Emergency />
      case 'appointments':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              {user.role === 'PATIENT' ? 'My Appointments' : 
               user.role === 'DOCTOR' ? 'My Patient Queue' : 
               'All Appointments'}
            </h3>
            {appointmentsError ? (
              <div className="text-center py-8">
                <div className="text-red-600 dark:text-red-400 mb-2">Error loading appointments</div>
                <div className="text-slate-500 dark:text-slate-400 text-sm">{appointmentsError.message}</div>
              </div>
            ) : appointmentsLoading ? (
              <div className="text-center py-8">
                <div className="text-slate-400 dark:text-slate-500">Loading appointments...</div>
              </div>
            ) : allAppointments && allAppointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Patient</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Doctor</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Department</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Date & Time</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAppointments.map((item: any) => {
                      // Handle different data structures from different endpoints
                      const apt = item.appointment || item // Queue items have nested appointment, admin endpoint returns appointments directly
                      const queueState = item.state || apt.status // Queue items have state, appointments have status
                      
                      return (
                        <tr key={apt.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                          <td className="py-3 px-4 text-slate-900 dark:text-slate-100">{apt.patient?.name || 'Unknown'}</td>
                          <td className="py-3 px-4 text-slate-900 dark:text-slate-100">Dr. {apt.doctor?.name || 'Unknown'}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{apt.department || 'N/A'}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {apt.scheduledAt ? new Date(apt.scheduledAt).toLocaleString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              queueState === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              queueState === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                              queueState === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            }`}>
                              {queueState}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {apt.patient?.phone || apt.patient?.email || 'N/A'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-400 dark:text-slate-500">No appointments found</div>
                <div className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                  {user.role === 'PATIENT' ? 'Book your first appointment to see it here' : 'No appointments in the system yet'}
                </div>
              </div>
            )}
          </div>
        )
      case 'users':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">User Management</h3>
            {usersError ? (
              <div className="text-center py-8">
                <div className="text-red-600 dark:text-red-400 mb-2">Error loading users</div>
                <div className="text-slate-500 dark:text-slate-400 text-sm">{usersError.message}</div>
                <div className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                  Please ensure you are logged in as an admin user.
                </div>
              </div>
            ) : allUsers && allUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Phone</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-900 dark:text-slate-100">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((user: any) => (
                      <tr key={user.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                        <td className="py-3 px-4 text-slate-900 dark:text-slate-100">{user.name}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                            user.role === 'DOCTOR' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            user.role === 'NURSE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{user.phone || 'N/A'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-400 dark:text-slate-500">Loading users...</div>
              </div>
            )}
          </div>
        )
      case 'logs':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">System Logs</h3>
            {logsError ? (
              <div className="text-center py-8">
                <div className="text-red-600 dark:text-red-400 mb-2">Error loading system logs</div>
                <div className="text-slate-500 dark:text-slate-400 text-sm">{logsError.message}</div>
                <div className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                  Please ensure you are logged in as an admin user.
                </div>
              </div>
            ) : systemLogs && systemLogs.length > 0 ? (
              <div className="space-y-3">
                {systemLogs.map((log: any) => (
                  <div key={log.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          log.status === 'SENT' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {log.type}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.status === 'SENT' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="text-slate-900 dark:text-slate-100">{log.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-400 dark:text-slate-500">Loading logs...</div>
              </div>
            )}
          </div>
        )
      case 'system-health':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">System Health</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">SMS Service</h4>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">Operational</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">All notifications sending successfully</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Database</h4>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">Connected</div>
                <div className="text-sm text-green-700 dark:text-green-300">Supabase PostgreSQL running</div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Queue System</h4>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">Active</div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Real-time updates working</div>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Scheduler</h4>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">Running</div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">Checking appointments every minute</div>
              </div>
            </div>
          </div>
        )
      default:
        return user.role === 'PATIENT' ? renderPatientDashboard() :
               user.role === 'DOCTOR' ? renderDoctorDashboard() :
               user.role === 'NURSE' ? renderNurseDashboard() :
               renderAdminDashboard()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">Medical Triage System</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Healthcare Management Platform</div>
              </div>
            </button>
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
              {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {renderContent()}
      </div>
    </div>
  )
}
