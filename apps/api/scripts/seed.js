// Seed demo data for Medical triage system
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding demo data...')

  // Clean
  await prisma.queuePosition.deleteMany({})
  await prisma.notification.deleteMany({})
  await prisma.appointment.deleteMany({})
  await prisma.deviceToken.deleteMany({})
  await prisma.patient.deleteMany({})
  await prisma.doctor.deleteMany({})

  // Doctors
  const doctors = await prisma.$transaction([
    prisma.doctor.create({ data: { name: 'Dr. Alice Shah', department: 'Cardiology' } }),
    prisma.doctor.create({ data: { name: 'Dr. Vikram Rao', department: 'Orthopedics' } }),
    prisma.doctor.create({ data: { name: 'Dr. Meera Iyer', department: 'General Medicine' } }),
  ])

  // Patients
  const patients = await prisma.$transaction([
    prisma.patient.create({ data: { name: 'John Doe', email: 'john@example.com', phone: '9000000010' } }),
    prisma.patient.create({ data: { name: 'Jane Smith', email: 'jane@example.com', phone: '9000000011' } }),
    prisma.patient.create({ data: { name: 'Rahul Verma', email: 'rahul@example.com', phone: '9000000012' } }),
    prisma.patient.create({ data: { name: 'Anita Nair', email: 'anita@example.com', phone: '9000000013' } }),
  ])

  // Appointments today for Dr. Alice (Cardiology)
  const base = new Date()
  base.setMinutes(0, 0, 0)
  const slots = [0, 15, 30, 45].map((m) => new Date(base.getTime() + m * 60000))

  const appts = []
  for (let i = 0; i < 4; i++) {
    const a = await prisma.appointment.create({
      data: {
        patientId: patients[i % patients.length].id,
        doctorId: doctors[0].id,
        department: doctors[0].department,
        scheduledAt: slots[i],
        emergency: i === 2 ? true : false, // one emergency
        status: 'BOOKED',
      },
    })
    appts.push(a)
  }

  // Queue positions for those appointments
  for (let i = 0; i < appts.length; i++) {
    await prisma.queuePosition.create({
      data: {
        appointmentId: appts[i].id,
        position: i + 1,
        priority: appts[i].emergency ? 0 : 10,
        state: 'BOOKED',
      },
    })
  }

  console.log('Seed complete:', {
    doctors: doctors.length,
    patients: patients.length,
    appointments: appts.length,
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
