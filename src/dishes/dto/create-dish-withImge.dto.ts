import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumberString,
} from "class-validator";

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

  @IsNumberString()
  @IsOptional()
  FullLarge_Price?: string;

  @IsNumberString()
  @IsOptional()
  FullMedium_Price?: string;

  @IsNumberString()
  @IsOptional()
  FullSmall_Price?: string;

  @IsNumberString()
  @IsOptional()
  HalfLarge_Price?: string;

  @IsNumberString()
  @IsOptional()
  HalfMedium_Price?: string;

  @IsNumberString()
  @IsOptional()
  HalfSmall_Price?: string;
}
