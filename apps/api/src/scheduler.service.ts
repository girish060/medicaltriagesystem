import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { WhatsAppService } from './whatsapp.service'

@Injectable()
export class SchedulerService implements OnModuleInit {
  private logger = new Logger('SchedulerService')
  private timer?: NodeJS.Timeout

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsAppService,
  ) {}

  onModuleInit() {
    // Check every minute for appointments that need reminders
    this.timer = setInterval(() => this.checkReminders().catch(() => {}), 60 * 1000)
    this.logger.log('Scheduler service started - checking for reminders every minute')
  }

  async checkReminders() {
    const now = new Date()
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000)
    const thirtyOneMinutesFromNow = new Date(now.getTime() + 31 * 60 * 1000)

    this.logger.log(`Checking for reminders at ${now.toLocaleTimeString()} - looking for appointments between ${thirtyMinutesFromNow.toLocaleTimeString()} and ${thirtyOneMinutesFromNow.toLocaleTimeString()}`)

    // Find appointments scheduled between 30-31 minutes from now
    // This gives us a 1-minute window to catch appointments
    const upcomingAppointments = await this.prisma.appointment.findMany({
      where: {
        scheduledAt: {
          gte: thirtyMinutesFromNow,
          lt: thirtyOneMinutesFromNow,
        },
        status: { in: ['BOOKED', 'ON_WAY'] },
      },
      include: { patient: true },
    })

    this.logger.log(`Found ${upcomingAppointments.length} appointments needing reminders`)

    for (const appointment of upcomingAppointments) {
      // Check if reminder was already sent
      const existingNotification = await this.prisma.notification.findFirst({
        where: {
          templateKey: 'APPOINTMENT_REMINDER_30MIN',
          patientId: appointment.patientId,
          payload: { contains: appointment.id },
        },
      })

      if (!existingNotification && appointment.patient.phone) {
        this.logger.log(`Sending reminder for appointment ${appointment.id} to ${appointment.patient.name}`)
        await this.whatsapp.sendReminder(appointment.id)
      }
    }
  }
}
