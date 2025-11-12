import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

export default function Notifications() {
  const { data } = useQuery({ queryKey: ['notifications'], queryFn: () => api.notifications(100) })

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      <div className="max-w-6xl mx-auto grid gap-6">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">Notifications</h2>
          <div className="ml-auto text-sm text-slate-500">System Event Log</div>
        </div>

        <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="grid gap-2">
            <div className="text-sm text-slate-500">Most recent first</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2 pr-3">Time</th>
                    <th className="py-2 pr-3">Channel</th>
                    <th className="py-2 pr-3">Template</th>
                    <th className="py-2 pr-3">Patient</th>
                    <th className="py-2">Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((n) => (
                    <tr key={n.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-3 whitespace-nowrap">{new Date(n.createdAt).toLocaleString()}</td>
                      <td className="py-2 pr-3">{n.channel}</td>
                      <td className="py-2 pr-3">{n.templateKey}</td>
                      <td className="py-2 pr-3">{n.patient?.name || '-'}</td>
                      <td className="py-2 text-xs font-mono opacity-80 max-w-[420px] truncate">{n.payload}</td>
                    </tr>
                  ))}
                  {!data?.length && (
                    <tr>
                      <td className="py-6 text-slate-500" colSpan={5}>No notifications yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
