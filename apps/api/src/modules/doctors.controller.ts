import { Controller, Get } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Controller('doctors')
export class DoctorsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.doctor.findMany({ orderBy: { name: 'asc' } })
  }
}
