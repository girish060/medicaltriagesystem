import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../api'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export default function Booking() {
  const { data: doctors } = useQuery({ queryKey: ['doctors'], queryFn: api.doctors })
  const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: api.patients })
  const [doctorId, setDoctorId] = useState('')
  const [patientId, setPatientId] = useState('')
  const [patientName, setPatientName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<Date>(new Date())
  const [emergency, setEmergency] = useState(false)
  const [success, setSuccess] = useState<{ id: string; qrCode?: string } | null>(null)

  useEffect(() => {
    if (!doctorId && doctors && doctors.length) setDoctorId(doctors[0].id)
  }, [doctors, doctorId])

  const create = useMutation({
    mutationFn: () => {
      // Compose date and time into ISO string
      const combined = new Date(selectedDate)
      combined.setHours(selectedTime.getHours())
      combined.setMinutes(selectedTime.getMinutes())
      const scheduledAt = combined.toISOString()
      
      // Use patientId if selected from list, otherwise use custom name
      const finalPatientId = patientId || patientName
      
      return api.createAppointment({
        patientId: finalPatientId,
        doctorId,
        department: doctors?.find((d) => d.id === doctorId)?.department || '',
        scheduledAt,
        emergency,
        phoneNumber,
      })
    },
    onSuccess: (data: any) => {
      setSuccess({ id: data.id, qrCode: data.qrCode })
      setPatientName('')
      setPatientId('')
      setPhoneNumber('')
    },
  })

  if (success)
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-sky-50 to-white dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 p-6">
        <div className="max-w-md w-full animate-scaleIn">
          <div className="p-10 rounded-3xl bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 dark:from-emerald-900/30 dark:via-green-900/20 dark:to-emerald-900/30 border-2 border-emerald-300 dark:border-emerald-700 shadow-2xl">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-3">Appointment Confirmed!</div>
              <div className="text-base text-slate-700 dark:text-slate-300 mb-8">Your appointment has been successfully booked. See you soon!</div>
              {success.qrCode && (
                <div className="inline-block p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl mb-6 transform hover:scale-105 transition-transform duration-300">
                  <img src={success.qrCode} alt="Appointment QR Code" className="w-56 h-56 mx-auto" />
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-4">Show this QR code at reception</div>
                </div>
              )}
              <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl backdrop-blur">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Appointment ID</div>
                <div className="font-mono font-bold text-lg text-slate-800 dark:text-slate-200">{success.id?.slice(0, 8)}</div>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Book Another Appointment
              </button>
            </div>
          </div>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 animate-fadeIn">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6 animate-slideIn">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent mb-2">Book Appointment</h2>
          <p className="text-slate-600 dark:text-slate-400">Schedule your visit with instant QR confirmation</p>
        </div>
        <div className="grid gap-6 p-8 rounded-2xl bg-white/90 dark:bg-slate-800/90 shadow-2xl backdrop-blur border border-slate-200 dark:border-slate-700 animate-scaleIn">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Patient Name</span>
            <input
              type="text"
              list="patients-list"
              placeholder="Enter patient name or select from list"
              className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900 transition-all duration-200 font-medium"
              value={patientName || (patientId ? patients?.find(p => p.id === patientId)?.name || '' : '')}
              onChange={(e) => {
                const value = e.target.value
                // Check if it matches an existing patient name
                const existingPatient = patients?.find(p => p.name === value)
                if (existingPatient) {
                  setPatientId(existingPatient.id)
                  setPatientName('')
                } else {
                  setPatientId('')
                  setPatientName(value)
                }
              }}
              required
            />
            <datalist id="patients-list">
              {patients?.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number (for WhatsApp reminders)</span>
            <input
              type="tel"
              placeholder="Enter phone number (e.g., 9876543210)"
              className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900 transition-all duration-200 font-medium"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">You'll receive a WhatsApp reminder 30 minutes before your appointment</span>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Doctor</span>
            <select
              className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900 transition-all duration-200 cursor-pointer"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              {doctors?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.department}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</span>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => date && setSelectedDate(date)}
                dateFormat="MM/dd/yyyy"
                minDate={new Date()}
                className="w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-400 focus:border-sky-500 transition-colors text-base cursor-pointer"
                calendarClassName="custom-calendar"
                required
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Time</span>
              <DatePicker
                selected={selectedTime}
                onChange={(time) => time && setSelectedTime(time)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={1}
                timeCaption="Time"
                dateFormat="h:mm aa"
                timeInputLabel="Custom time:"
                showTimeInput
                className="w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-400 focus:border-sky-500 transition-colors text-base cursor-pointer"
                required
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 transition-all duration-200 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={emergency} 
              onChange={(e) => setEmergency(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-rose-600 focus:ring-2 focus:ring-rose-200 transition-all duration-200 cursor-pointer"
            />
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Emergency Appointment</span>
              <div className="text-xs text-slate-500">Priority queue bypass</div>
            </div>
          </label>

          <button
            onClick={() => create.mutate()}
            disabled={!doctorId || (!patientId && !patientName) || !phoneNumber || !selectedDate || !selectedTime || create.isPending}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-sky-600 hover:to-blue-700 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {create.isPending ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border border-sky-200 dark:border-sky-800 shadow-lg">
          <h3 className="text-lg font-bold text-sky-700 dark:text-sky-400 mb-3">Hospital Location</h3>
          <div className="rounded-xl overflow-hidden border-2 border-sky-200 dark:border-sky-800 shadow-md">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.2412648750455!2d-73.98823492346368!3d40.74844097138558!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b3117469%3A0xd134e199a405a163!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1699999999999!5m2!1sen!2sus"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Hospital Location"
            ></iframe>
          </div>
          <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            <p className="font-medium">Medical Triage Center</p>
            <p>123 Healthcare Avenue, Medical District</p>
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=40.748817,-73.985428"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 px-4 py-2 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 transition-colors"
            >
              Get Directions
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
