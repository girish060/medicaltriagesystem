import { Body, Controller, Get, Post } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { RealtimeGateway } from '../realtime.gateway'
import { NotificationService } from '../notification.service'

@Controller('emergency')
export class EmergencyController {
  constructor(
    private prisma: PrismaService,
    private rt: RealtimeGateway,
    private notify: NotificationService,
  ) {}

  @Get()
  async list() {
    return this.prisma.appointment.findMany({
      where: { emergency: true, status: { in: ['BOOKED', 'ON_WAY', 'ARRIVED', 'BEING_TREATED'] } },
      orderBy: { createdAt: 'desc' },
      include: { doctor: true, patient: true, queuePosition: true },
    })
  }

  @Post()
  async raise(
    @Body()
    body: {
      patientId: string
      doctorId: string
      department: string
      notes?: string
    },
  ) {
    const appt = await this.prisma.appointment.create({
      data: {
        patientId: body.patientId,
        doctorId: body.doctorId,
        department: body.department,
        scheduledAt: new Date(),
        emergency: true,
        status: 'BOOKED',
        locationInfo: body.notes || undefined,
      },
    })

    const last = await this.prisma.queuePosition.findFirst({
      where: { appointment: { doctorId: body.doctorId } },
      orderBy: { position: 'desc' },
    })
    await this.prisma.queuePosition.create({
      data: {
        appointmentId: appt.id,
        // keep numeric order but priority guarantees emergency comes first
        position: (last?.position ?? 0) + 1,
        priority: 0,
        state: 'BOOKED',
      },
    })

    this.rt.emitQueueUpdate(body.doctorId)
    this.rt.emitEmergencyUpdate()
    await this.notify.emit({
      channel: 'PUSH',
      templateKey: 'EMERGENCY_RAISED',
      payload: { appointmentId: appt.id, doctorId: body.doctorId },
      patientId: appt.patientId,
    })
    return appt
  }
}
