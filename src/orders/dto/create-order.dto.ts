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

export class CreateOrderDto {
  @IsMongoId()
  @IsNotEmpty()
  dishId: string;

  @IsMongoId()
  @IsNotEmpty()
  tableSectionId: string;

  @IsInt()
  @IsNotEmpty()
  tableNumber: number;

  @IsUUID("4")
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsOptional()
  user_description?: string;

  @IsEnum(Size)
  @IsNotEmpty()
  size: Size;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  halfQuantity?: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  fullQuantity?: number;
}
