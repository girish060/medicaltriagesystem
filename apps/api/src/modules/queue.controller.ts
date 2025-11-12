import { Controller, Get, Param, Post } from '@nestjs/common'
import { QueueService } from './queue.service'

@Controller('queue')
export class QueueController {
  constructor(private qs: QueueService) {}

  // Manually trigger the absent-swap scan
  @Get('run-swap')
  async runSwap() {
    await this.qs.runAbsentSwap()
    return { ok: true }
  }

  // Force-swap a specific appointment with the next in line (for testing)
  @Post('swap/:id')
  async swap(@Param('id') id: string) {
    return this.qs.swapWithNext(id)
  }
}
