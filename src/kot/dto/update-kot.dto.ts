import { PartialType } from '@nestjs/mapped-types';
import { CreateKotDto } from './create-kot.dto';

export class UpdateKotDto extends PartialType(CreateKotDto) {}
