import { Controller, Get, Post, Param } from '@nestjs/common'
import { WhatsAppService } from '../whatsapp.service'
import { SchedulerService } from '../scheduler.service'

@Controller()
export class AppController {
  constructor(
    private whatsappService: WhatsAppService,
    private schedulerService: SchedulerService
  ) {}

  @Get('/health')
  health() {
    return { ok: true }
  }

  @Post('/test-sms/:appointmentId')
  async testSMS(@Param('appointmentId') appointmentId: string) {
    try {
      await this.whatsappService.sendReminder(appointmentId)
      return { success: true, message: 'SMS reminder sent' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  @Post('/test-confirmation/:appointmentId')
  async testConfirmation(@Param('appointmentId') appointmentId: string) {
    try {
      await this.whatsappService.sendConfirmation(appointmentId)
      return { success: true, message: 'SMS confirmation sent' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  @Post('/test-scheduler')
  async testScheduler() {
    try {
      await this.schedulerService.checkReminders()
      return { success: true, message: 'Scheduler check completed' }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  @Get('/debug-env')
  debugEnv() {
    return {
      hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasSmsNumber: !!process.env.TWILIO_SMS_NUMBER,
      twilioSid: process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...',
      smsNumber: process.env.TWILIO_SMS_NUMBER
    }
  }
}
