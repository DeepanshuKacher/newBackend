import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTableDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1)
  prefix?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1)
  suffix?: string;

  @IsInt()
  @IsNotEmpty()
  startNumber: number;

  @IsInt()
  @IsNotEmpty()
  endNumber: number;
}
