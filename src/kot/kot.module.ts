import { Module } from '@nestjs/common';
import { KotService } from './kot.service';
import { KotController } from './kot.controller';

@Module({
  controllers: [KotController],
  providers: [KotService]
})
export class KotModule {}
