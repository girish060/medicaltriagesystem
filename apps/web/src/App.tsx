import { Suspense, useEffect, useState } from 'react'
import { Routes, Route, Link, Outlet } from 'react-router-dom'
import Reception from './pages/Reception'
import Booking from './pages/Booking'
import Patient from './pages/Patient'
import Doctor from './pages/Doctor'
import Emergency from './pages/Emergency'
import Notifications from './pages/Notifications'
import Admin from './pages/Admin'
import QRScanner from './pages/QRScanner'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { onSocketStatus } from './realtime'

function Layout() {
  const [connected, setConnected] = useState<boolean>(false)
  useEffect(() => onSocketStatus(setConnected), [])
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100 animate-fadeIn">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-lg transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              M
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">Medical Triage System</h1>
              <p className="text-xs text-slate-500">Smart Queue Management</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <Link to="/" className="px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all duration-200 text-sm font-medium transform hover:scale-105">Home</Link>
            <Link to="/book" className="px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all duration-200 text-sm font-medium transform hover:scale-105">Book</Link>
            <Link to="/scan" className="px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all duration-200 text-sm font-medium transform hover:scale-105">Scan QR</Link>
            <Link to="/patient" className="px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all duration-200 text-sm font-medium transform hover:scale-105">Patient</Link>
            <Link to="/reception" className="px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all duration-200 text-sm font-medium transform hover:scale-105">Reception</Link>
            <Link to="/doctor" className="px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all duration-200 text-sm font-medium transform hover:scale-105">Doctor</Link>
            <Link to="/emergency" className="px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all duration-200 text-sm font-medium transform hover:scale-105">Emergency</Link>
            <Link to="/admin" className="px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all duration-200 text-sm font-medium transform hover:scale-105">Admin</Link>
          </nav>
          <div className={`text-xs px-3 py-1.5 rounded-full font-medium ${connected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`} title={connected ? 'Real-time connected' : 'Disconnected'}>
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{backgroundColor: connected ? 'rgb(34 197 94)' : 'rgb(239 68 68)'}}></span>
            {connected ? 'Live' : 'Offline'}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8 animate-fadeIn">
        <Outlet />
      </main>
    </div>
  )
}

function Home() {
  return (
    <div className="grid gap-8 animate-fadeIn">
      <div className="p-10 rounded-3xl shadow-2xl bg-gradient-to-br from-white via-sky-50/50 to-blue-50 dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-900 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 transform hover:scale-[1.01] transition-all duration-300">
        <div className="animate-slideIn">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Welcome to Medical Triage System</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-3xl">Smart queue management for modern hospitals. Real-time updates, emergency prioritization, and automated patient flow powered by cutting-edge technology.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="group p-6 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/20 border-2 border-sky-200 dark:border-sky-800 hover:border-sky-400 dark:hover:border-sky-600 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-2xl animate-scaleIn">
            <div className="font-bold text-lg mb-2 text-sky-700 dark:text-sky-400">Easy Booking</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Schedule appointments with instant QR code confirmation and calendar integration</div>
          </div>
          <div className="group p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20 border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-2xl animate-scaleIn" style={{animationDelay: '0.1s'}}>
            <div className="font-bold text-lg mb-2 text-emerald-700 dark:text-emerald-400">Real-time Queue</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Live updates across all dashboards with WebSocket technology</div>
          </div>
          <div className="group p-6 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/30 dark:to-red-900/20 border-2 border-rose-200 dark:border-rose-800 hover:border-rose-400 dark:hover:border-rose-600 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-2xl animate-scaleIn" style={{animationDelay: '0.2s'}}>
            <div className="font-bold text-lg mb-2 text-rose-700 dark:text-rose-400">Emergency Priority</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Instant queue bypass for critical cases with automated alerts</div>
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6 animate-fadeIn" style={{animationDelay: '0.3s'}}>
        <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-xl border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300">
          <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">Key Features</h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Auto-swap absent patients after 15 minutes</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> QR code check-in for faster processing</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Multi-role dashboards (Patient, Doctor, Reception, Admin)</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Real-time notifications and alerts</li>
          </ul>
        </div>
        <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
          <h3 className="text-xl font-bold mb-3">Ready to Deploy</h3>
          <p className="text-sm text-sky-100 mb-4">Production-ready with Docker, CI/CD, and comprehensive documentation. Launch your smart hospital system today!</p>
          <div className="flex gap-2">
            <div className="px-3 py-1 rounded-lg bg-white/20 backdrop-blur text-xs font-medium">Docker Ready</div>
            <div className="px-3 py-1 rounded-lg bg-white/20 backdrop-blur text-xs font-medium">CI/CD</div>
            <div className="px-3 py-1 rounded-lg bg-white/20 backdrop-blur text-xs font-medium">Real-time</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Check for existing token on app load
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  }, [])

  const handleLogin = (userData: any, userToken: string) => {
    setUser(userData)
    setToken(userToken)
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // If not authenticated, show login page
  if (!user || !token) {
    return <Login onLogin={handleLogin} />
  }

  // If authenticated, show role-based dashboard
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <Dashboard user={user} onLogout={handleLogout} />
    </Suspense>
  )
}
