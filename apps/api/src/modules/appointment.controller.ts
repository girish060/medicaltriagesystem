import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { RealtimeGateway } from '../realtime.gateway'
import { NotificationService } from '../notification.service'
import { WhatsAppService } from '../whatsapp.service'
import * as QRCode from 'qrcode'

@Controller('appointments')
export class AppointmentController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly whatsapp: WhatsAppService,
    private readonly notify: NotificationService,
  ) {}

  @Post()
  async create(
    @Body()
    body: {
      patientId: string
      doctorId: string
      department: string
      scheduledAt: string
      emergency?: boolean
      phoneNumber?: string
    },
  ) {
    // Check if patientId is a valid UUID/CUID or a custom name
    let patientId = body.patientId
    
    // If patientId doesn't look like a CUID (starts with 'c'), treat it as a new patient name
    if (!patientId.startsWith('c')) {
      // Try to find existing patient by phone if provided
      let newPatient
      if (body.phoneNumber) {
        const existingPatient = await this.prisma.patient.findUnique({
          where: { phone: body.phoneNumber },
        })
        if (existingPatient) {
          newPatient = existingPatient
        } else {
          // Create a new patient with the provided name
          newPatient = await this.prisma.patient.create({
            data: {
              name: patientId, // Use the custom name
              phone: body.phoneNumber,
            },
          })
        }
      } else {
        // Create a new patient without phone
        newPatient = await this.prisma.patient.create({
          data: {
            name: patientId, // Use the custom name
          },
        })
      }
      patientId = newPatient.id
    } else if (body.phoneNumber) {
      // Update existing patient's phone number if provided, but handle duplicates
      try {
        await this.prisma.patient.update({
          where: { id: patientId },
          data: { phone: body.phoneNumber },
        })
      } catch (error: any) {
        // If phone already exists, just skip the update
        if (error.code !== 'P2002') {
          throw error
        }
      }
    }

    // Create appointment first
    const appointment = await this.prisma.appointment.create({
      data: {
        patientId,
        doctorId: body.doctorId,
        department: body.department,
        scheduledAt: new Date(body.scheduledAt),
        emergency: !!body.emergency,
        status: 'BOOKED',
      },
      include: {
        patient: true,
        doctor: true,
      },
    })

    // Send immediate confirmation
    if (appointment.patient.phone) {
      try {
        await this.whatsapp.sendConfirmation(appointment.id)
      } catch (error) {
        console.error('Failed to send immediate confirmation:', error)
        // Don't fail the appointment creation if WhatsApp fails
      }
    }

    // Generate QR code with the actual appointment ID
    const qrData = `APPT:${appointment.id}`
    const qrCode = await QRCode.toDataURL(qrData)

    // Update appointment with QR code and get the updated appointment
    const updatedAppt = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { qrCode },
    })

    // position: max+1 among non-completed for doctor
    const last = await this.prisma.queuePosition.findFirst({
      where: { appointment: { doctorId: body.doctorId } },
      orderBy: { position: 'desc' },
    })
    await this.prisma.queuePosition.create({
      data: {
        appointmentId: updatedAppt.id,
        position: (last?.position ?? 0) + 1,
        priority: updatedAppt.emergency ? 0 : 10,
      },
    })
    this.realtime.emitQueueUpdate(body.doctorId)
    // Notification stub
    await this.notify.emit({
      channel: 'PUSH',
      templateKey: 'BOOKED_CONFIRMATION',
      payload: {
        appointmentId: updatedAppt.id,
        doctorId: body.doctorId,
        when: updatedAppt.scheduledAt,
      },
      patientId: updatedAppt.patientId,
    })
    return updatedAppt
  }

  @Get('queue')
  async queue(
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @Query('userId') userId?: string
  ) {
    const now = new Date()
    
    // Build where clause based on provided filters
    const whereClause: any = {}
    
    if (doctorId) {
      whereClause.appointment = { doctorId }
      // Only filter by active states for doctor view
      whereClause.state = { in: ['BOOKED', 'ON_WAY', 'ARRIVED', 'BEING_TREATED'] }
    } else if (patientId) {
      whereClause.appointment = { patientId }
      // Show all appointments for patient view (including completed)
    } else if (userId) {
      // Find appointments for user who is a patient
      // First get the user's patientId, then filter appointments
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { patientId: true }
      })
      
      if (user?.patientId) {
        whereClause.appointment = { patientId: user.patientId }
      } else {
        // If user has no patientId, return empty results
        whereClause.appointmentId = 'non-existent-id'
      }
      // Show all appointments for patient view (including completed)
    } else {
      // Show all appointments if no specific filter
    }
    
    const queueItems = await this.prisma.queuePosition.findMany({
      where: whereClause,
      include: { 
        appointment: {
          include: {
            patient: {
              select: { id: true, name: true, phone: true, email: true }
            },
            doctor: {
              select: { id: true, name: true, department: true }
            }
          }
        }
      },
    })

    // Sort queue with custom logic:
    // 1. Emergency patients (priority 0) always first
    // 2. ARRIVED patients come before late patients
    // 3. ON_WAY/BOOKED patients who are on time
    // 4. Late patients (ON_WAY/BOOKED past scheduled time)
    return queueItems.sort((a, b) => {
      // Emergency always first
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }

      // Within same priority level (non-emergency)
      if (a.priority === 10) {
        const aArrived = a.state === 'ARRIVED'
        const bArrived = b.state === 'ARRIVED'
        const aLate = a.appointment.scheduledAt < now && !aArrived
        const bLate = b.appointment.scheduledAt < now && !bArrived

        // ARRIVED patients before late patients
        if (aArrived && bLate) return -1
        if (bArrived && aLate) return 1

        // Both arrived or both not late: use original position
        if (aArrived === bArrived && aLate === bLate) {
          return a.position - b.position
        }

        // On-time patients before late patients
        if (!aLate && bLate) return -1
        if (!bLate && aLate) return 1
      }

      // Default: use position
      return a.position - b.position
    })
  }

  @Post(':id/arrive')
  async arrive(@Param('id') id: string) {
    const appt = await this.prisma.appointment.update({
      where: { id },
      data: { status: 'ARRIVED' },
    })
    await this.prisma.queuePosition.update({
      where: { appointmentId: id },
      data: { state: 'ARRIVED', lastSeenAt: new Date() },
    })
    this.realtime.emitQueueUpdate(appt.doctorId)
    await this.notify.emit({
      channel: 'PUSH',
      templateKey: 'ARRIVAL_ACK',
      payload: { appointmentId: appt.id },
      patientId: appt.patientId,
    })
    return appt
  }

  @Post(':id/on-way')
  async onWay(@Param('id') id: string, @Body() body: { latitude: number; longitude: number }) {
    const locationInfo = JSON.stringify({
      latitude: body.latitude,
      longitude: body.longitude,
      timestamp: new Date().toISOString(),
    })
    
    const appt = await this.prisma.appointment.update({
      where: { id },
      data: { 
        status: 'ON_WAY',
        locationInfo,
      },
    })
    
    await this.prisma.queuePosition.update({
      where: { appointmentId: id },
      data: { state: 'ON_WAY', lastSeenAt: new Date() },
    })
    
    this.realtime.emitQueueUpdate(appt.doctorId)
    return appt
  }

  @Post(':id/update-location')
  async updateLocation(@Param('id') id: string, @Body() body: { latitude: number; longitude: number }) {
    const locationInfo = JSON.stringify({
      latitude: body.latitude,
      longitude: body.longitude,
      timestamp: new Date().toISOString(),
    })
    
    const appt = await this.prisma.appointment.update({
      where: { id },
      data: { locationInfo },
    })
    
    this.realtime.emitQueueUpdate(appt.doctorId)
    return appt
  }
}
