import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { PrismaService } from '../prisma.service'
import { RealtimeGateway } from '../realtime.gateway'
import { NotificationService } from '../notification.service'

const FIFTEEN_MIN = 15 * 60 * 1000

@Injectable()
export class QueueService implements OnModuleInit {
  private logger = new Logger('QueueService')
  private timer?: NodeJS.Timeout

  constructor(
    private prisma: PrismaService,
    private rt: RealtimeGateway,
    private notify: NotificationService,
  ) {}

  onModuleInit() {
    // Run every minute
    this.timer = setInterval(() => this.runAbsentSwap().catch(() => {}), 60 * 1000)
  }

  async runAbsentSwap() {
    const now = new Date()
    const threshold = new Date(now.getTime() - FIFTEEN_MIN)

    // Find candidates: scheduled < now-15m and not arrived/being treated/completed/absent
    const overdue = await this.prisma.appointment.findMany({
      where: {
        scheduledAt: { lt: threshold },
        emergency: false,
        status: { in: ['BOOKED', 'ON_WAY'] },
      },
      include: { queuePosition: true },
      orderBy: { scheduledAt: 'asc' },
    })

    for (const appt of overdue) {
      if (!appt.queuePosition) continue
      await this.swapWithNext(appt.id).catch((e) => this.logger.warn(e.message))
    }
  }

  async swapWithNext(appointmentId: string) {
    return this.prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: { queuePosition: true },
      })
      if (!appt || !appt.queuePosition) throw new Error('No queue position')

      // Mark absent if not already
      if (!['ARRIVED', 'BEING_TREATED', 'COMPLETED', 'ABSENT'].includes(appt.status)) {
        await tx.appointment.update({ where: { id: appt.id }, data: { status: 'ABSENT' } })
        await tx.queuePosition.update({
          where: { appointmentId: appt.id },
          data: { state: 'ABSENT', absentAt: new Date() },
        })
      }

      // Find next available non-emergency after this position for the same doctor
      const currentPos = appt.queuePosition.position
      const next = await tx.queuePosition.findFirst({
        where: {
          position: { gt: currentPos },
          appointment: { doctorId: appt.doctorId, emergency: false },
        },
        orderBy: { position: 'asc' },
        include: { appointment: true },
      })
      if (!next) return { swapped: false }

      // Swap positions
      await tx.queuePosition.update({
        where: { appointmentId: appt.id },
        data: { position: next.position, swappedWith: next.appointmentId },
      })
      await tx.queuePosition.update({
        where: { appointmentId: next.appointmentId },
        data: { position: currentPos, swappedWith: appt.id },
      })

      // Log swap
      const entry = {
        at: new Date().toISOString(),
        fromPos: currentPos,
        toPos: next.position,
        with: next.appointmentId,
        reason: 'ABSENT_15_MIN_AUTO_SWAP',
      }
      const a1 = await tx.appointment.findUnique({ where: { id: appt.id } })
      const a2 = await tx.appointment.findUnique({ where: { id: next.appointmentId } })
      const h1 = a1?.swap_history ? JSON.parse(a1.swap_history) : []
      const h2 = a2?.swap_history ? JSON.parse(a2.swap_history) : []
      h1.push(entry)
      h2.push({ ...entry, with: appt.id, fromPos: next.position, toPos: currentPos })
      await tx.appointment.update({ where: { id: appt.id }, data: { swap_history: JSON.stringify(h1) } })
      await tx.appointment.update({ where: { id: next.appointmentId }, data: { swap_history: JSON.stringify(h2) } })
      await tx.auditLog.create({
        data: {
          actor: 'system',
          action: 'QUEUE_SWAP',
          entityType: 'Appointment',
          entityId: appt.id,
          metadata: JSON.stringify({ with: next.appointmentId, reason: 'ABSENT_15_MIN_AUTO_SWAP' }),
        },
      })

      this.logger.log(`Swapped ${appt.id} with ${next.appointmentId}`)
      this.rt.emitQueueUpdate(appt.doctorId)
      await this.notify.emit({
        channel: 'PUSH',
        templateKey: 'QUEUE_SWAPPED',
        payload: { appointmentId: appt.id, with: next.appointmentId },
        patientId: appt.patientId,
      })
      return { swapped: true }
    })
  }
}
