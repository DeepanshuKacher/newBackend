import { Module } from '@nestjs/common';
import { AddOnsService } from './add-ons.service';
import { AddOnsController } from './add-ons.controller';

@Module({
  controllers: [AddOnsController],
  providers: [AddOnsService]
})
export class AddOnsModule {}
