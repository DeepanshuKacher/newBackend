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
  // @IsString()
  // @IsNotEmpty()
  // sessionId: string;

  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  kotId: string;
}
