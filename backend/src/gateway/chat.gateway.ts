import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { ChatMessage } from '../database/models/chat-message.model.js';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/ws' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private userSockets = new Map<number, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(ChatMessage) private readonly chatMessageModel: typeof ChatMessage,
  ) { }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      });
      (client as Socket & { userId: number }).userId = payload.sub;
      this.userSockets.set(payload.sub, client.id);
      await client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as Socket & { userId?: number }).userId;
    if (userId) this.userSockets.delete(userId);
  }

  @SubscribeMessage('joinAppointment')
  handleJoinAppointment(@ConnectedSocket() client: Socket, @MessageBody() data: { appointmentId: number }) {
    client.join(`appointment:${data.appointmentId}`);
  }

  @SubscribeMessage('leaveAppointment')
  handleLeaveAppointment(@ConnectedSocket() client: Socket, @MessageBody() data: { appointmentId: number }) {
    client.leave(`appointment:${data.appointmentId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { appointmentId: number; message: string }) {
    const userId = (client as Socket & { userId?: number }).userId;
    if (!userId) return;

    const msg = await this.chatMessageModel.create({
      appointmentId: data.appointmentId,
      senderId: userId,
      message: data.message,
    } as Partial<ChatMessage>);

    this.server.to(`appointment:${data.appointmentId}`).emit('newMessage', {
      id: msg.id,
      appointmentId: data.appointmentId,
      senderId: userId,
      message: data.message,
      createdAt: msg.createdAt,
    });
  }

  sendNotification(userId: number, notification: Record<string, unknown>) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }
}
