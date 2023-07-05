import {
  IsBoolean,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
} from "class-validator";

export class UpdateDishDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsMongoId()
  @IsOptional()
  dishSectionId?: string;

  @IsMongoId()
  @IsOptional()
  restaurantId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  FullLarge_Price?: number;

  @IsInt()
  @IsOptional()
  FullMedium_Price?: number;

  @IsInt()
  @IsOptional()
  FullSmall_Price?: number;

  @IsInt()
  @IsOptional()
  HalfLarge_Price?: number;

  @IsInt()
  @IsOptional()
  HalfMedium_Price?: number;

  @IsInt()
  @IsOptional()
  HalfSmall_Price?: number;

  @IsBoolean()
  @IsOptional()
  available?: boolean;

  @IsOptional()
  @IsInt()
  dishCode?: number;
}
