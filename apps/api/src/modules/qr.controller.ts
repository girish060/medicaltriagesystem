import { Controller, Post, Body } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { RealtimeGateway } from '../realtime.gateway'

@Controller('qr')
export class QrController {
  constructor(private prisma: PrismaService, private rt: RealtimeGateway) {}

  @Post('scan')
  async scan(@Body() body: { qrData: string }) {
    // Parse QR data format: APPT:appointmentId
    const parts = body.qrData.split(':')
    if (parts[0] !== 'APPT' || !parts[1]) {
      return { success: false, message: 'Invalid QR code format' }
    }

    const appointmentId = parts[1]

    // Find appointment by ID
    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true },
    })

    if (!appt) {
      return { success: false, message: 'Appointment not found' }
    }

    if (!['BOOKED', 'ON_WAY'].includes(appt.status)) {
      return { success: false, message: 'Appointment already processed' }
    }

    // Mark as arrived
    await this.prisma.appointment.update({
      where: { id: appt.id },
      data: { status: 'ARRIVED' },
    })

    await this.prisma.queuePosition.update({
      where: { appointmentId: appt.id },
      data: { state: 'ARRIVED', lastSeenAt: new Date() },
    })

    this.rt.emitQueueUpdate(appt.doctorId)

    return {
      success: true,
      message: 'Patient checked in successfully',
      appointment: {
        id: appt.id,
        patient: appt.patient.name,
        doctor: appt.doctor.name,
        department: appt.department,
        scheduledAt: appt.scheduledAt,
      },
    }
  }
}
