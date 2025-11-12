import { Controller, Get } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { Param } from '@nestjs/common'

@Controller('patients')
export class PatientsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.patient.findMany({ orderBy: { name: 'asc' } })
  }

  @Get(':id/upcoming')
  async upcoming(@Param('id') id: string) {
    const now = new Date()
    const appt = await this.prisma.appointment.findFirst({
      where: { patientId: id, scheduledAt: { gte: now }, status: { in: ['BOOKED', 'ON_WAY', 'ARRIVED'] } },
      orderBy: { scheduledAt: 'asc' },
      include: { queuePosition: true, doctor: true },
    })
    if (!appt) return null
    // Compute effective queue position order for the doctor's queue
    const ahead = await this.prisma.queuePosition.count({
      where: {
        appointment: { doctorId: appt.doctorId },
        OR: [
          { priority: { lt: appt.queuePosition?.priority ?? 10 } },
          {
            AND: [
              { priority: appt.queuePosition?.priority ?? 10 },
              { position: { lt: appt.queuePosition?.position ?? 0 } },
            ],
          },
        ],
        state: { in: ['BOOKED', 'ON_WAY', 'ARRIVED'] },
      },
    })
    return {
      id: appt.id,
      scheduledAt: appt.scheduledAt,
      department: appt.department,
      doctor: { id: appt.doctor.id, name: appt.doctor.name },
      status: appt.status,
      emergency: appt.emergency,
      queue: {
        position: (appt.queuePosition?.position ?? 0),
        priority: appt.queuePosition?.priority ?? 10,
        ahead,
      },
    }
  }
}
