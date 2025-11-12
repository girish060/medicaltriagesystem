import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

export default function Admin() {
  const { data: doctors } = useQuery({ queryKey: ['doctors'], queryFn: api.doctors })
  const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: api.patients })
  const { data: emergencies } = useQuery({ queryKey: ['emergencies'], queryFn: api.emergencies })
  const { data: notifications } = useQuery({ queryKey: ['notifications'], queryFn: () => api.notifications(20) })

  const stats = [
    { label: 'Total Doctors', value: doctors?.length || 0, color: 'bg-sky-500' },
    { label: 'Total Patients', value: patients?.length || 0, color: 'bg-emerald-500' },
    { label: 'Active Emergencies', value: emergencies?.length || 0, color: 'bg-rose-500' },
    { label: 'Notifications Sent', value: notifications?.length || 0, color: 'bg-amber-500' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 p-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto grid gap-6">
        <div className="flex items-center justify-between animate-slideIn">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">Admin Dashboard</h2>
            <p className="text-slate-600 dark:text-slate-400">System overview and analytics</p>
          </div>
          <div className="text-sm text-slate-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={stat.label} className="p-8 rounded-3xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 animate-scaleIn" style={{animationDelay: `${idx * 0.1}s`}}>
              <div className="text-5xl font-bold mb-2">{stat.value}</div>
              <div className="text-sm opacity-90">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-8 rounded-3xl bg-white/90 dark:bg-slate-800/90 shadow-2xl border border-slate-200 dark:border-slate-700 backdrop-blur animate-scaleIn" style={{ animationDelay: '0.4s' }}>
            <div className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-200">Doctors on Duty</div>
            <div className="space-y-3">
              {doctors?.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-sm text-slate-500">{d.department}</div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-medium">
                    Active
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white/90 dark:bg-slate-800/90 shadow-2xl border border-slate-200 dark:border-slate-700 backdrop-blur animate-scaleIn" style={{ animationDelay: '0.5s' }}>
            <div className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-200">Recent Activity</div>
            <div className="space-y-3">
              {notifications?.slice(0, 5).map((n) => (
                <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <div className="w-2 h-2 rounded-full bg-sky-500 mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{n.templateKey}</div>
                    <div className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-2xl animate-scaleIn" style={{animationDelay: '0.6s'}}>
          <h3 className="text-2xl font-bold mb-3">System Status</h3>
          <p className="text-sky-100 mb-6">All systems operational. Real-time queue management active.</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/20 backdrop-blur hover:bg-white/30 transition-all duration-300">
              <div className="text-xs text-sky-100 mb-1">API Server</div>
              <div className="font-bold text-lg">Online</div>
              <div className="text-xs text-sky-100 mt-1">99.9% uptime</div>
            </div>
            <div className="p-4 rounded-xl bg-white/20 backdrop-blur hover:bg-white/30 transition-all duration-300">
              <div className="text-xs text-sky-100 mb-1">Database</div>
              <div className="font-bold text-lg">Connected</div>
              <div className="text-xs text-sky-100 mt-1">Low latency</div>
            </div>
            <div className="p-4 rounded-xl bg-white/20 backdrop-blur hover:bg-white/30 transition-all duration-300">
              <div className="text-xs text-sky-100 mb-1">WebSocket</div>
              <div className="font-bold text-lg">Active</div>
              <div className="text-xs text-sky-100 mt-1">Real-time sync</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
