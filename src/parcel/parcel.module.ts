import { Module } from '@nestjs/common';
import { ParcelService } from './parcel.service';
import { ParcelController } from './parcel.controller';

@Module({
  controllers: [ParcelController],
  providers: [ParcelService]
})
export class ParcelModule {}
