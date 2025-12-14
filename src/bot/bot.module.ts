import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [BotService, PrismaService],
})
export class BotModule {}
