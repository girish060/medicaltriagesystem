import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../api'

function useCountdown(target?: string) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!target) return ''
  const diff = new Date(target).getTime() - now
  if (diff <= 0) return 'Now'
  const m = Math.floor(diff / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${m}m ${s}s`
}

export default function Patient() {
  const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: api.patients })
  const [patientId, setPatientId] = useState<string>('')
  const [isTracking, setIsTracking] = useState(false)
  const [locationError, setLocationError] = useState<string>('')

  useEffect(() => {
    if (!patientId && patients && patients.length) setPatientId(patients[0].id)
  }, [patients, patientId])

  const { data: upcoming, isLoading, refetch } = useQuery({
    queryKey: ['patient-upcoming', patientId],
    queryFn: () => api.patientUpcoming(patientId!),
    enabled: !!patientId,
    refetchInterval: 5000,
  })

  const markOnWay = useMutation({
    mutationFn: ({ lat, lng }: { lat: number; lng: number }) => 
      api.markOnWay(upcoming.id, lat, lng),
    onSuccess: () => {
      setIsTracking(true)
      refetch()
    },
  })

  const updateLocation = useMutation({
    mutationFn: ({ lat, lng }: { lat: number; lng: number }) => 
      api.updateLocation(upcoming.id, lat, lng),
  })

  const startTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        markOnWay.mutate({ lat: latitude, lng: longitude })
        
        // Update location every 30 seconds
        const interval = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              updateLocation.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude })
            },
            (error) => console.error('Location update error:', error)
          )
        }, 30000)

        return () => clearInterval(interval)
      },
      (error) => {
        setLocationError(`Location error: ${error.message}`)
      }
    )
  }

  const countdown = useCountdown(upcoming?.scheduledAt)
  const timeText = useMemo(
    () => (upcoming ? new Date(upcoming.scheduledAt).toLocaleString() : ''),
    [upcoming]
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 p-6 animate-fadeIn">
      <div className="max-w-4xl mx-auto grid gap-6">
        <div className="flex items-center gap-4 animate-slideIn">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">Patient Dashboard</h2>
          <select
            className="px-4 py-2 rounded-xl bg-white/90 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all duration-200 cursor-pointer font-medium"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          >
            {patients?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="p-8 rounded-3xl shadow-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-700 animate-scaleIn">
          {isLoading && (
            <div className="flex items-center justify-center gap-3 py-12">
              <svg className="animate-spin h-8 w-8 text-sky-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-lg text-slate-600 dark:text-slate-400">Loading your appointment...</span>
            </div>
          )}
          {!isLoading && !upcoming && (
            <div className="text-center py-12">
              <div className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No Upcoming Appointments</div>
              <div className="text-slate-500">Book an appointment to see it here</div>
            </div>
          )}
          {!isLoading && upcoming && (
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">Upcoming Appointment</div>
                {upcoming.emergency && (
                  <div className="px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold text-sm shadow-lg animate-pulse">
                    EMERGENCY
                  </div>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border border-sky-200 dark:border-sky-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Doctor</div>
                  <div className="text-lg font-bold text-sky-700 dark:text-sky-400">{upcoming.doctor.name}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{upcoming.department}</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Scheduled Time</div>
                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{timeText}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Status: {upcoming.status}</div>
                </div>
              </div>

              {upcoming.status === 'BOOKED' && !isTracking && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 shadow-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-700 dark:text-amber-400 mb-2">Ready to head to the hospital?</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">Share your location so we can track your arrival</div>
                    <button
                      onClick={startTracking}
                      disabled={markOnWay.isPending}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:from-amber-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50"
                    >
                      {markOnWay.isPending ? 'Starting...' : "I'm On My Way"}
                    </button>
                    {locationError && (
                      <div className="mt-3 text-sm text-rose-600 dark:text-rose-400">{locationError}</div>
                    )}
                  </div>
                </div>
              )}

              {(upcoming.status === 'ON_WAY' || isTracking) && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-800 shadow-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-700 dark:text-green-400 mb-2">Location Sharing Active</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">We're tracking your journey. Drive safely!</div>
                  </div>
                </div>
              )}
              {upcoming.qrCode && (
                <div className="p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 shadow-xl">
                  <div className="text-center">
                    <div className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-2">Your Check-in QR Code</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-6">Show this at reception to check in</div>
                    <div className="inline-block p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                      <img src={upcoming.qrCode} alt="Appointment QR" className="w-64 h-64" />
                    </div>
                    <div className="mt-6 p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl backdrop-blur">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">QR Code Data</div>
                      <div className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200 mb-2">APPT:{upcoming.id}</div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`APPT:${upcoming.id}`)
                          alert('QR code data copied to clipboard!')
                        }}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
                      >
                        Copy QR Data
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
                  <div className="text-sm opacity-90 mb-2">Time Until Appointment</div>
                  <div className="text-4xl font-bold">{countdown || '—'}</div>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
                  <div className="text-sm opacity-90 mb-2">Queue Position</div>
                  <div className="text-4xl font-bold">#{upcoming.queue.position}</div>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
                  <div className="text-sm opacity-90 mb-2">Ahead of You</div>
                  <div className="text-4xl font-bold">{upcoming.queue.ahead}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
