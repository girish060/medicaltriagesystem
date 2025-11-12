import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Injectable()
export class WhatsAppService {
  private logger = new Logger('SMSService')
  
  // Twilio credentials - should be in environment variables
  private accountSid = process.env.TWILIO_ACCOUNT_SID
  private authToken = process.env.TWILIO_AUTH_TOKEN
  private smsNumber = process.env.TWILIO_SMS_NUMBER // e.g., '+14155238886'

  constructor(private prisma: PrismaService) {}

  async sendConfirmation(appointmentId: string) {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { patient: true, doctor: true },
      })

      if (!appointment || !appointment.patient.phone) {
        this.logger.warn(`Cannot send confirmation: appointment ${appointmentId} or patient phone missing`)
        return
      }

      const formattedDate = new Date(appointment.scheduledAt).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

      // Check if appointment is more than 30 minutes away
      const now = new Date()
      const appointmentTime = new Date(appointment.scheduledAt)
      const timeDifference = appointmentTime.getTime() - now.getTime()
      const thirtyMinutesInMs = 30 * 60 * 1000
      
      // Create shorter message for SMS trial limits (160 chars max)
      const shortDate = new Date(appointment.scheduledAt).toLocaleDateString('en-IN')
      const shortTime = new Date(appointment.scheduledAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })

      let message = `✅ Appointment Confirmed\n` +
        `${appointment.patient.name}\n` +
        `📅 ${shortDate} ${shortTime}\n` +
        `👨‍⚕️ Dr. ${appointment.doctor.name}\n` +
        `🏥 ${appointment.department}`

      if (timeDifference <= thirtyMinutesInMs) {
        message += `\nComing up soon!`
      }

      // If Twilio credentials are configured, send via Twilio SMS
      if (this.accountSid && this.authToken && this.smsNumber) {
        await this.sendViaTwilio(appointment.patient.phone, message)
        this.logger.log(`✅ IMMEDIATE confirmation SMS sent to ${appointment.patient.phone}`)
      } else {
        // Log the message for development/testing
        this.logger.log(`[SMS CONFIRMATION] To: ${appointment.patient.phone}`)
        this.logger.log(`Message: ${message}`)
      }

      // Record notification in database
      await this.prisma.notification.create({
        data: {
          channel: 'SMS',
          templateKey: 'APPOINTMENT_CONFIRMATION',
          payload: JSON.stringify({ appointmentId, phone: appointment.patient.phone }),
          status: 'SENT',
          sentAt: new Date(),
          patientId: appointment.patientId,
        },
      })
    } catch (error: any) {
      this.logger.error(`Failed to send WhatsApp confirmation: ${error.message}`)
      throw error
    }
  }

  async sendReminder(appointmentId: string) {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { patient: true, doctor: true },
      })

      if (!appointment || !appointment.patient.phone) {
        this.logger.warn(`Cannot send WhatsApp: appointment ${appointmentId} or patient phone missing`)
        return
      }

      const message = this.formatReminderMessage(appointment)
      
      // If Twilio credentials are configured, send via Twilio SMS
      if (this.accountSid && this.authToken && this.smsNumber) {
        await this.sendViaTwilio(appointment.patient.phone, message)
        this.logger.log(`✅ 30-MINUTE reminder SMS sent to ${appointment.patient.phone}`)
      } else {
        // Log the message for development/testing
        this.logger.log(`[SMS REMINDER] To: ${appointment.patient.phone}`)
        this.logger.log(`Message: ${message}`)
      }

      // Record notification in database
      await this.prisma.notification.create({
        data: {
          channel: 'SMS', // Using SMS channel for WhatsApp
          templateKey: 'APPOINTMENT_REMINDER_30MIN',
          payload: JSON.stringify({ appointmentId, phone: appointment.patient.phone }),
          status: 'SENT',
          sentAt: new Date(),
          patientId: appointment.patientId,
        },
      })
    } catch (error: any) {
      this.logger.error(`Failed to send WhatsApp reminder: ${error.message}`)
    }
  }

  private formatReminderMessage(appointment: any): string {
    const time = new Date(appointment.scheduledAt).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const date = new Date(appointment.scheduledAt).toLocaleDateString('en-IN')
    
    // Shorter message for SMS trial limits (160 chars max)
    return `🏥 Reminder - 30 mins\n` +
      `${appointment.patient.name}\n` +
      `📅 ${date} ${time}\n` +
      `👨‍⚕️ Dr. ${appointment.doctor.name}\n` +
      `🏥 ${appointment.department}\n` +
      `Please arrive on time!`
  }

  private async sendViaTwilio(phoneNumber: string, message: string) {
    try {
      // Ensure phone number is in E.164 format (e.g., +919876543210)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`
      
      this.logger.log(`Attempting to send SMS to: ${formattedPhone}`)
      this.logger.log(`From: ${this.smsNumber}`)
      this.logger.log(`Message length: ${message.length} chars`)
      this.logger.log(`Message: ${message}`)
      
      // Twilio SMS API call
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: this.smsNumber!,
            To: formattedPhone,
            Body: message,
          }),
        }
      )

      this.logger.log(`Twilio API response status: ${response.status}`)
      
      if (!response.ok) {
        const error = await response.text()
        this.logger.error(`Twilio API error response: ${error}`)
        throw new Error(`Twilio API error: ${error}`)
      }

      const responseData = await response.json()
      this.logger.log(`Twilio API success response: ${JSON.stringify(responseData)}`)
      this.logger.log(`SMS sent successfully to ${formattedPhone}`)
    } catch (error: any) {
      this.logger.error(`Twilio SMS send failed: ${error.message}`)
      throw error
    }
  }
}
