import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { getSocket } from '../realtime'

export default function Emergency() {
  const qc = useQueryClient()
  const { data: doctors } = useQuery({ queryKey: ['doctors'], queryFn: api.doctors })
  const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: api.patients })
  const { data: emergencies } = useQuery({ queryKey: ['emergencies'], queryFn: api.emergencies })
  const [doctorId, setDoctorId] = useState('')
  const [patientId, setPatientId] = useState('')
  const [notes, setNotes] = useState('')
  const [toast, setToast] = useState('')
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (!doctorId && doctors && doctors.length) setDoctorId(doctors[0].id)
    if (!patientId && patients && patients.length) setPatientId(patients[0].id)
  }, [doctors, patients, doctorId, patientId])

  useEffect(() => {
    const s = getSocket()
    s.emit('join:emergency')
    const onUpdate = () => qc.invalidateQueries({ queryKey: ['emergencies'] })
    s.on('emergency:update', onUpdate)
    const onUpdateToast = () => {
      setToast('Emergency list updated')
      setFlash(true)
      setTimeout(() => setFlash(false), 850)
      setTimeout(() => setToast(''), 2000)
    }
    s.on('emergency:update', onUpdateToast)
    return () => {
      s.off('emergency:update', onUpdate)
      s.off('emergency:update', onUpdateToast)
    }
  }, [qc])

  const raise = useMutation({
    mutationFn: () =>
      api.raiseEmergency({
        patientId,
        doctorId,
        department: doctors?.find((d) => d.id === doctorId)?.department || '',
        notes,
      }),
    onSuccess: () => {
      setNotes('')
      qc.invalidateQueries({ queryKey: ['emergencies'] })
      setToast('Emergency raised')
      setFlash(true)
      setTimeout(() => setFlash(false), 850)
      setTimeout(() => setToast(''), 2000)
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-50 dark:from-slate-900 dark:to-red-950 text-slate-900 dark:text-slate-100 p-6 animate-fadeIn">
      <div className="max-w-6xl mx-auto grid gap-6">
        {toast && <div className="toast">{toast}</div>}
        <div className="flex flex-wrap items-center gap-4 animate-slideIn">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 bg-clip-text text-transparent">Emergency Team</h2>
          <div className="ml-auto px-6 py-3 rounded-full bg-gradient-to-r from-rose-600 to-red-700 text-white font-bold text-sm shadow-xl animate-pulse">SIREN MODE ACTIVE</div>
        </div>

        <div className="p-8 rounded-3xl bg-white/90 dark:bg-slate-800/90 shadow-2xl border-2 border-rose-200 dark:border-rose-800 backdrop-blur grid gap-6 animate-scaleIn">
          <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">Raise Emergency</div>
          <div className="grid gap-4 md:grid-cols-3">
            <select
              className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all duration-200 cursor-pointer font-medium"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            >
              {patients?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all duration-200 cursor-pointer font-medium"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              {doctors?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.department}
                </option>
              ))}
            </select>
            <input
              placeholder="Emergency Notes"
              className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-all duration-200 font-medium"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <button
            onClick={() => raise.mutate()}
            disabled={!patientId || !doctorId || raise.isPending}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-rose-700 hover:to-red-800 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl hover:shadow-2xl w-fit"
          >
            {raise.isPending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Raising Emergency...
              </span>
            ) : 'RAISE EMERGENCY'}
          </button>
        </div>

        <div className={`p-8 rounded-3xl bg-white/90 dark:bg-slate-800/90 shadow-2xl border-2 border-rose-200 dark:border-rose-800 backdrop-blur animate-scaleIn ${flash ? 'flash-once' : ''}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">Active Emergencies</div>
            {emergencies && emergencies.length > 0 && (
              <div className="px-4 py-2 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 font-bold animate-pulse">
                {emergencies.length} active
              </div>
            )}
          </div>
          <div className="grid gap-4">
            {emergencies?.map((e, idx) => (
              <div key={e.id} className="p-6 rounded-2xl border-2 border-rose-300 dark:border-rose-800 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-300 animate-slideIn" style={{animationDelay: `${idx * 0.05}s`}}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md font-bold text-2xl animate-pulse">
                      !
                    </div>
                    <div>
                      <div className="font-bold text-xl text-rose-900 dark:text-rose-200">{e.patient?.name || 'Patient'}</div>
                      <div className="text-sm text-rose-700 dark:text-rose-400 flex items-center gap-2">
                        <span>{e.doctor?.name}</span>
                        <span>•</span>
                        <span>{e.department}</span>
                        <span>•</span>
                        <span>{new Date(e.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold shadow-lg">
                    <div className="text-xs">Queue Position</div>
                    <div className="text-2xl">#{e.queuePosition?.position ?? '-'}</div>
                  </div>
                </div>
              </div>
            ))}
            {!emergencies?.length && (
              <div className="text-center py-12">
                <div className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">No Active Emergencies</div>
                <div className="text-slate-500">All clear!</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
