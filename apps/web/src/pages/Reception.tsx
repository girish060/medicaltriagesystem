import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { getSocket, joinDoctorRoom } from '../realtime'

export default function Reception() {
  const qc = useQueryClient()
  const { data: doctors } = useQuery({ queryKey: ['doctors'], queryFn: api.doctors })
  const [doctorId, setDoctorId] = useState<string>('')
  const [toast, setToast] = useState<string>('')
  const [flash, setFlash] = useState<boolean>(false)

  useEffect(() => {
    if (!doctorId && doctors && doctors.length) setDoctorId(doctors[0].id)
  }, [doctors, doctorId])

  const {
    data: queue,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['queue', doctorId],
    queryFn: () => api.queue(doctorId!),
    enabled: !!doctorId,
  })

  useEffect(() => {
    if (!doctorId) return
    const s = getSocket()
    joinDoctorRoom(doctorId)
    const handler = (p: { doctorId: string }) => {
      if (p?.doctorId === doctorId) {
        qc.invalidateQueries({ queryKey: ['queue', doctorId] })
        setToast('Queue updated')
        setFlash(true)
        setTimeout(() => setFlash(false), 850)
        setTimeout(() => setToast(''), 2000)
      }
    }
    s.on('queue:update', handler)
    return () => {
      s.off('queue:update', handler)
    }
  }, [doctorId, qc])

  const arrive = useMutation({
    mutationFn: (id: string) => api.arrive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queue', doctorId] })
    },
  })

  const title = useMemo(() => {
    const d = doctors?.find((x) => x.id === doctorId)
    return d ? `${d.name} — ${d.department}` : 'Select doctor'
  }, [doctors, doctorId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 animate-fadeIn">
      <div className="max-w-6xl mx-auto p-6 grid gap-6">
        {toast && <div className="toast">{toast}</div>}
        <div className="flex flex-wrap items-center gap-4 animate-slideIn">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">Reception Queue</h2>
          <select
            className="px-4 py-2 rounded-xl bg-white/90 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all duration-200 cursor-pointer font-medium"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
          >
            {doctors?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.department}
              </option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            className="ml-auto px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium hover:from-sky-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Refresh
          </button>
        </div>

        <div className={`p-8 rounded-3xl bg-white/90 dark:bg-slate-800/90 shadow-2xl border border-slate-200 dark:border-slate-700 backdrop-blur animate-scaleIn ${flash ? 'flash-once' : ''}`}>
          <div className="mb-6 flex items-center justify-between">
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{title}</div>
            {queue && queue.length > 0 && (
              <div className="px-4 py-2 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 font-bold">
                {queue.length} in queue
              </div>
            )}
          </div>
          {isLoading && (
            <div className="flex items-center justify-center gap-3 py-12">
              <svg className="animate-spin h-8 w-8 text-sky-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-lg text-slate-600 dark:text-slate-400">Loading queue...</span>
            </div>
          )}
          {!isLoading && queue && queue.length === 0 && (
            <div className="text-center py-12">
              <div className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Queue is Empty</div>
              <div className="text-slate-500">No patients waiting</div>
            </div>
          )}
          <div className="grid gap-4">
            {queue?.map((q, idx) => {
              const state = q.state as string
              const emergency = q.priority === 0
              const locationInfo = q.appointment?.locationInfo ? JSON.parse(q.appointment.locationInfo) : null
              
              const bgColor = emergency
                ? 'bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 border-rose-300 dark:border-rose-800'
                : state === 'ARRIVED'
                ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-300 dark:border-emerald-800'
                : state === 'ABSENT'
                ? 'bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-300 dark:border-purple-800'
                : state === 'BOOKED'
                ? 'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border-slate-300 dark:border-slate-700'
                : 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-300 dark:border-amber-800'
              
              const statusBadge = emergency
                ? 'bg-rose-600 text-white'
                : state === 'ARRIVED'
                ? 'bg-emerald-600 text-white'
                : state === 'ABSENT'
                ? 'bg-purple-600 text-white'
                : state === 'BOOKED'
                ? 'bg-slate-600 text-white'
                : 'bg-amber-600 text-white'
              
              return (
                <div
                  key={q.appointmentId}
                  className={`flex items-center justify-between p-5 rounded-2xl border-2 ${bgColor} shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 animate-slideIn`}
                  style={{animationDelay: `${idx * 0.05}s`}}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-md">
                      <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">#{q.position}</div>
                    </div>
                    <div>
                      <div className="font-bold text-lg text-slate-800 dark:text-slate-200">{q.appointment?.department}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <span>{new Date(q.appointment?.scheduledAt).toLocaleTimeString()}</span>
                        {emergency && <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-xs font-bold animate-pulse">EMERGENCY</span>}
                        {state === 'ON_WAY' && locationInfo && (
                          <a 
                            href={`https://www.google.com/maps?q=${locationInfo.latitude},${locationInfo.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                          >
                            View Location
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${statusBadge}`}>{state}</span>
                    {state !== 'ARRIVED' && (
                      <button
                        onClick={() => arrive.mutate(q.appointmentId)}
                        disabled={arrive.isPending}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium hover:from-emerald-600 hover:to-green-700 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                      >
                        Mark Arrived
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
