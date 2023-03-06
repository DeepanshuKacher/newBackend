import { PartialType } from '@nestjs/mapped-types';
import { CreateWaiterDto } from './create-waiter.dto';

export class UpdateWaiterDto extends PartialType(CreateWaiterDto) {}
