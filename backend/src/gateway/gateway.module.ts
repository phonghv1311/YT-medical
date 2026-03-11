import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChatGateway } from './chat.gateway.js';
import { ChatMessage } from '../database/models/chat-message.model.js';

@Module({
  imports: [
    JwtModule.register({}),
    SequelizeModule.forFeature([ChatMessage]),
  ],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class GatewayModule { }
