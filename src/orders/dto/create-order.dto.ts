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
  Large = "large",
  Medium = "medium",
  Small = "small",
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

  @IsString()
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
