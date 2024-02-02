import { Module } from '@nestjs/common';
import { GenResponceService } from './gen-responce.service';
import { GenResponceController } from './gen-responce.controller';

@Module({
  controllers: [GenResponceController],
  providers: [GenResponceService],
})
export class GenResponceModule {}
