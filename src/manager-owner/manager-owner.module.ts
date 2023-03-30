import { Module } from '@nestjs/common';
import { ManagerOwnerService } from './manager-owner.service';
import { ManagerOwnerController } from './manager-owner.controller';

@Module({
  controllers: [ManagerOwnerController],
  providers: [ManagerOwnerService]
})
export class ManagerOwnerModule {}
