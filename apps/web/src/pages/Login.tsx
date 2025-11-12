import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../api'

export default function Login({ onLogin }: { onLogin: (user: any, token: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN'>('PATIENT')
  const [phone, setPhone] = useState('')

  const login = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      fetch(`http://localhost:3001/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: (data) => {
      if (data.user && data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        onLogin(data.user, data.token)
      }
    },
  })

  const register = useMutation({
    mutationFn: (data: { email: string; password: string; name: string; role: string; phone?: string }) =>
      fetch(`http://localhost:3001/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: (data) => {
      if (data.user && data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        onLogin(data.user, data.token)
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isRegister) {
      register.mutate({ email, password, name, role, phone })
    } else {
      login.mutate({ email, password })
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6">
      <div className="max-w-md w-full">
        <div className="p-8 rounded-lg bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Medical Triage System
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {isRegister ? 'Create your account' : 'Sign in to your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            {isRegister && (
              <>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="px-4 py-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all duration-200"
                    required
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900 transition-all duration-200"
                  >
                    <option value="PATIENT">Patient</option>
                    <option value="DOCTOR">Doctor</option>
                    <option value="NURSE">Nurse</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone (Optional)</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900 transition-all duration-200"
                  />
                </label>
              </>
            )}

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900 transition-all duration-200"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900 transition-all duration-200"
                required
              />
            </label>

            <button
              type="submit"
              disabled={login.isPending || register.isPending}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-sky-600 hover:to-blue-700 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {login.isPending || register.isPending 
                ? 'Please wait...' 
                : isRegister ? 'Create Account' : 'Sign In'
              }
            </button>

            {(login.error || register.error) && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                {(login.error as any)?.message || (register.error as any)?.message || 'An error occurred'}
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium transition-colors"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
