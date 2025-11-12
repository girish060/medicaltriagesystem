import { Controller, Get, Query, Headers, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { AuthService } from '../auth.service'

@Controller('admin')
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService
  ) {}

  private async validateAdmin(authorization?: string) {
    if (!authorization) {
      throw new UnauthorizedException('No token provided')
    }
    const token = authorization.replace('Bearer ', '')
    const user = await this.authService.validateToken(token)
    if (user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access required')
    }
    return user
  }

  @Get('stats')
  async getStats(@Headers('authorization') authorization?: string) {
    await this.validateAdmin(authorization)

    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
      activeQueue,
      notifications
    ] = await Promise.all([
      this.prisma.patient.count(),
      this.prisma.doctor.count(),
      this.prisma.appointment.count(),
      this.prisma.appointment.count({
        where: {
          scheduledAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      this.prisma.queuePosition.count({
        where: { state: { in: ['BOOKED', 'ON_WAY'] } }
      }),
      this.prisma.notification.count({
        where: {
          sentAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ])

    return {
      totalPatients,
      totalDoctors,
      totalAppointments,
      todayAppointments,
      activeQueue,
      notifications
    }
  }

  @Get('logs')
  async getLogs(
    @Headers('authorization') authorization?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string
  ) {
    await this.validateAdmin(authorization)

    const limitNum = parseInt(limit || '100')
    
    // Get recent notifications as logs
    const notifications = await this.prisma.notification.findMany({
      take: limitNum,
      orderBy: { sentAt: 'desc' },
      where: type ? { channel: type } : undefined,
      include: {
        patient: {
          select: { name: true, phone: true }
        }
      }
    })

    return notifications.map(notif => ({
      id: notif.id,
      timestamp: notif.sentAt,
      type: notif.channel,
      message: `${notif.templateKey} sent to ${notif.patient?.name || 'Unknown'} (${notif.patient?.phone || 'No phone'})`,
      status: notif.status,
      details: notif.payload
    }))
  }

  @Get('users')
  async getUsers(@Headers('authorization') authorization?: string) {
    await this.validateAdmin(authorization)

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        patient: {
          select: { id: true, name: true }
        },
        doctor: {
          select: { id: true, name: true, department: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return users
  }

  @Get('appointments')
  async getAllAppointments(
    @Headers('authorization') authorization?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('doctorId') doctorId?: string
  ) {
    await this.validateAdmin(authorization)

    const limitNum = parseInt(limit || '50')
    
    const appointments = await this.prisma.appointment.findMany({
      take: limitNum,
      orderBy: { scheduledAt: 'desc' },
      where: {
        ...(status ? { status } : {}),
        ...(doctorId ? { doctorId } : {})
      },
      include: {
        patient: {
          select: { id: true, name: true, phone: true, email: true }
        },
        doctor: {
          select: { id: true, name: true, department: true }
        }
      }
    })

    return appointments
  }

  @Get('queue')
  async getFullQueue(@Headers('authorization') authorization?: string) {
    await this.validateAdmin(authorization)

    const queue = await this.prisma.queuePosition.findMany({
      orderBy: { position: 'asc' },
      include: {
        appointment: {
          include: {
            patient: {
              select: { id: true, name: true, phone: true }
            },
            doctor: {
              select: { id: true, name: true, department: true }
            }
          }
        }
      }
    })

    return queue
  }

  @Get('system-health')
  async getSystemHealth(@Headers('authorization') authorization?: string) {
    await this.validateAdmin(authorization)

    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    const [
      recentNotifications,
      failedNotifications,
      upcomingAppointments,
      overdueAppointments
    ] = await Promise.all([
      this.prisma.notification.count({
        where: {
          sentAt: { gte: oneHourAgo },
          status: 'SENT'
        }
      }),
      this.prisma.notification.count({
        where: {
          sentAt: { gte: oneHourAgo },
          status: 'FAILED'
        }
      }),
      this.prisma.appointment.count({
        where: {
          scheduledAt: { gte: now },
          status: { in: ['BOOKED', 'ON_WAY'] }
        }
      }),
      this.prisma.appointment.count({
        where: {
          scheduledAt: { lt: now },
          status: { in: ['BOOKED', 'ON_WAY'] }
        }
      })
    ])

    return {
      notifications: {
        sent: recentNotifications,
        failed: failedNotifications,
        successRate: recentNotifications + failedNotifications > 0 
          ? (recentNotifications / (recentNotifications + failedNotifications) * 100).toFixed(1)
          : '100'
      },
      appointments: {
        upcoming: upcomingAppointments,
        overdue: overdueAppointments
      },
      timestamp: now
    }
  }
}
