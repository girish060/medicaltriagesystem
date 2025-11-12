import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaService } from '../prisma.service'
import { AppointmentController } from './appointment.controller'
import { DoctorsController } from './doctors.controller'
import { PatientsController } from './patients.controller'
import { QueueService } from './queue.service'
import { QueueController } from './queue.controller'
import { DoctorController } from './doctor.controller'
import { RealtimeGateway } from '../realtime.gateway'
import { EmergencyController } from './emergency.controller'
import { NotificationService } from '../notification.service'
import { NotificationsController } from './notifications.controller'
import { QrController } from './qr.controller'
import { WhatsAppService } from '../whatsapp.service'
import { SchedulerService } from '../scheduler.service'
import { AuthService } from '../auth.service'
import { AuthController } from './auth.controller'
import { AdminController } from './admin.controller'

@Module({
  imports: [],
  controllers: [
    AppController,
    AppointmentController,
    DoctorsController,
    PatientsController,
    QueueController,
    DoctorController,
    EmergencyController,
    NotificationsController,
    QrController,
    AuthController,
    AdminController,
  ],
  providers: [AppService, PrismaService, QueueService, RealtimeGateway, NotificationService, WhatsAppService, SchedulerService, AuthService],
})
export class AppModule {}
