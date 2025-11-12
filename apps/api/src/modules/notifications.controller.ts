import { Controller, Get, Query } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Controller('notifications')
export class NotificationsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@Query('limit') limit = '50') {
    const take = Math.min(Number(limit) || 50, 200)
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: { patient: true },
    })
  }
}
