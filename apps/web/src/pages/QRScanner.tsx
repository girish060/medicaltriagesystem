import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../api'

export default function QRScanner() {
  const [qrData, setQrData] = useState('')
  const [result, setResult] = useState<any>(null)

  const scan = useMutation({
    mutationFn: (data: string) => api.scanQr(data),
    onSuccess: (data) => {
      setResult(data)
      setQrData('')
    },
    onError: (error: any) => {
      setResult({ success: false, message: error.message || 'Scan failed' })
    },
  })

  const handleScan = () => {
    if (qrData.trim()) {
      scan.mutate(qrData.trim())
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 p-6 animate-fadeIn">
      <div className="max-w-2xl mx-auto grid gap-6">
        <div className="animate-slideIn">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent mb-2">QR Code Scanner</h2>
          <p className="text-slate-600 dark:text-slate-400">Scan patient QR codes to check them in</p>
        </div>

        <div className="p-8 rounded-3xl bg-white/90 dark:bg-slate-800/90 shadow-2xl border border-slate-200 dark:border-slate-700 backdrop-blur animate-scaleIn">
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Enter QR Code Data
              </label>
              <input
                type="text"
                placeholder="Paste QR code data (e.g., APPT:clxxxxx...)"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900 transition-all duration-200 font-mono"
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleScan()}
              />
              <p className="text-xs text-slate-500 mt-2">
                Right-click on the QR code image and select "Copy image address" or scan with a QR reader app
              </p>
            </div>

            <button
              onClick={handleScan}
              disabled={!qrData.trim() || scan.isPending}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-sky-600 hover:to-blue-700 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {scan.isPending ? 'Scanning...' : 'Scan QR Code'}
            </button>
          </div>
        </div>

        {result && (
          <div className={`p-8 rounded-3xl shadow-2xl border-2 backdrop-blur animate-scaleIn ${
            result.success
              ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 dark:from-emerald-900/30 dark:via-green-900/20 dark:to-emerald-900/30 border-emerald-300 dark:border-emerald-700'
              : 'bg-gradient-to-br from-rose-50 via-red-50 to-rose-100 dark:from-rose-900/30 dark:via-red-900/20 dark:to-rose-900/30 border-rose-300 dark:border-rose-700'
          }`}>
            <div className="text-center">
              <div className={`text-2xl font-bold mb-3 ${
                result.success
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}>
                {result.success ? 'Check-in Successful!' : 'Scan Failed'}
              </div>
              <div className="text-slate-700 dark:text-slate-300 mb-6">
                {result.message}
              </div>

              {result.success && result.appointment && (
                <div className="grid gap-3 text-left">
                  <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Patient</div>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                      {result.appointment.patient}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Doctor</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {result.appointment.doctor}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Department</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {result.appointment.department}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Scheduled Time</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {new Date(result.appointment.scheduledAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setResult(null)}
                className="mt-6 px-6 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium hover:bg-white dark:hover:bg-slate-800 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Scan Another
              </button>
            </div>
          </div>
        )}

        <div className="p-6 rounded-2xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
          <h3 className="font-bold text-sky-700 dark:text-sky-400 mb-2">How to use:</h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-sky-500 mt-0.5">1.</span>
              <span>Patient shows their QR code from the booking confirmation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-500 mt-0.5">2.</span>
              <span>Scan the QR code with your phone camera or QR scanner app</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-500 mt-0.5">3.</span>
              <span>Copy the QR data and paste it in the field above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-500 mt-0.5">4.</span>
              <span>Click "Scan QR Code" to check the patient in</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
