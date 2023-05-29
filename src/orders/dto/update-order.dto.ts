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

export enum Size {
  Large = "Large",
  Medium = "Medium",
  Small = "Small",
}

export class UpdateOrderDto {
  @IsUUID("4")
  @IsNotEmpty()
  orderId: string;

  @IsInt()
  // @IsPositive()
  @Type(() => Number)
  @IsOptional()
  halfQuantity?: number;

  @IsInt()
  // @IsPositive()
  @Type(() => Number)
  @IsOptional()
  fullQuantity?: number;
}
