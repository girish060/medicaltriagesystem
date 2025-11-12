import { Body, Controller, Param, Post } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { RealtimeGateway } from '../realtime.gateway'
import { NotificationService } from '../notification.service'

@Controller('doctor')
export class DoctorController {
  constructor(
    private prisma: PrismaService,
    private rt: RealtimeGateway,
    private notify: NotificationService,
  ) {}

  @Post(':appointmentId/start')
  async start(@Param('appointmentId') appointmentId: string) {
    const appt = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'BEING_TREATED' },
    })
    await this.prisma.queuePosition.update({
      where: { appointmentId },
      data: { state: 'BEING_TREATED' },
    })
    this.rt.emitQueueUpdate(appt.doctorId)
    await this.notify.emit({
      channel: 'PUSH',
      templateKey: 'TREATMENT_STARTED',
      payload: { appointmentId: appt.id },
      patientId: appt.patientId,
    })
    return appt
  }

  @Post(':appointmentId/complete')
  async complete(@Param('appointmentId') appointmentId: string) {
    const appt = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'COMPLETED' },
    })
    await this.prisma.queuePosition.update({
      where: { appointmentId },
      data: { state: 'COMPLETED' },
    })
    this.rt.emitQueueUpdate(appt.doctorId)
    await this.notify.emit({
      channel: 'PUSH',
      templateKey: 'TREATMENT_COMPLETED',
      payload: { appointmentId: appt.id },
      patientId: appt.patientId,
    })
    return appt
  }
}
