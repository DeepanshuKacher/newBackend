import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

import { Type } from "class-transformer";

type QuantityPrice = {
  half?: number;
  full?: number;
};

type SizePrice = {
  large?: QuantityPrice;
  medium?: QuantityPrice;
  small?: QuantityPrice;
};

export class CreateDishDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsMongoId()
  @IsNotEmpty()
  dishSectionId: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  FullLarge_Price?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  FullMedium_Price?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  FullSmall_Price?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  HalfLarge_Price?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  HalfMedium_Price?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  HalfSmall_Price?: number;
}
