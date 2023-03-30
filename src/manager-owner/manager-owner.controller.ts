import { Controller } from '@nestjs/common';
import { ManagerOwnerService } from './manager-owner.service';

@Controller('manager-owner')
export class ManagerOwnerController {
  constructor(private readonly managerOwnerService: ManagerOwnerService) {}


  getInfo(){}
}
