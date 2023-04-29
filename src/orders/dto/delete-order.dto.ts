import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from "class-validator";

export class DeleteOrderDto {
  @IsUUID("4")
  @IsNotEmpty()
  sessionId: string;

  @IsUUID("4")
  @IsNotEmpty()
  orderId: string;
}
