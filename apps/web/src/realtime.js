import { io } from 'socket.io-client'
import { API_BASE } from './api'

let socket = null

export function getSocket() {
  if (!socket) {
    socket = io(API_BASE, { transports: ['websocket'], autoConnect: true })
  }
  return socket
}

export function joinDoctorRoom(doctorId) {
  const s = getSocket()
  s.emit('join:doctor', { doctorId })
}

export function onSocketStatus(cb) {
  const s = getSocket()
  const onConnect = () => cb(true)
  const onDisconnect = () => cb(false)
  s.on('connect', onConnect)
  s.on('disconnect', onDisconnect)
  return () => {
    s.off('connect', onConnect)
    s.off('disconnect', onDisconnect)
  }
}

export function onEmergencyUpdate(cb) {
  const s = getSocket()
  s.emit('join:emergency')
  s.on('emergency:update', cb)
  return () => s.off('emergency:update', cb)
}
