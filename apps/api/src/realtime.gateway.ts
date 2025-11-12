import { Logger } from '@nestjs/common'
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway {
  @WebSocketServer() server!: Server
  private logger = new Logger('RealtimeGateway')

  handleConnection(client: Socket) {
    this.logger.log(`Client connected ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected ${client.id}`)
  }

  @SubscribeMessage('join:doctor')
  handleJoinDoctor(@MessageBody() payload: { doctorId: string }, @ConnectedSocket() client: Socket) {
    const room = this.roomForDoctor(payload.doctorId)
    client.join(room)
    this.logger.log(`Client ${client.id} joined ${room}`)
  }

  emitQueueUpdate(doctorId: string) {
    const room = this.roomForDoctor(doctorId)
    this.server.to(room).emit('queue:update', { doctorId, at: new Date().toISOString() })
  }

  private roomForDoctor(doctorId: string) {
    return `doctor:${doctorId}`
  }

  @SubscribeMessage('join:emergency')
  handleJoinEmergency(@ConnectedSocket() client: Socket) {
    client.join('emergency')
    this.logger.log(`Client ${client.id} joined emergency room`)
  }

  emitEmergencyUpdate() {
    this.server.to('emergency').emit('emergency:update', { at: new Date().toISOString() })
  }
}
