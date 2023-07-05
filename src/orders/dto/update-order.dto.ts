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

enum HalfFull {
  half = "fullQuantity",
  full = "halfQuantity",
}

export class UpdateOrderDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  kotId: string;

  @IsEnum(HalfFull)
  @IsNotEmpty()
  halfFull: HalfFull;

  @IsInt()
  @IsNotEmpty()
  newQuantity: number;

  // @IsInt()
  // // @IsPositive()
  // @Type(() => Number)
  // @IsOptional()
  // halfQuantity?: number;

  // @IsInt()
  // // @IsPositive()
  // @Type(() => Number)
  // @IsOptional()
  // fullQuantity?: number;
}
