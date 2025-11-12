import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Injectable()
export class NotificationService {
  private logger = new Logger('NotificationService')
  constructor(private prisma: PrismaService) {}

  async emit(opts: {
    channel: 'PUSH' | 'SMS' | 'EMAIL'
    templateKey: string
    payload: Record<string, any>
    patientId?: string
  }) {
    this.logger.log(`${opts.templateKey} -> ${opts.patientId ?? 'broadcast'}`)
    await this.prisma.notification.create({
      data: {
        channel: opts.channel,
        templateKey: opts.templateKey,
        payload: JSON.stringify(opts.payload),
        status: 'PENDING',
        patientId: opts.patientId,
      },
    })
  }
}
