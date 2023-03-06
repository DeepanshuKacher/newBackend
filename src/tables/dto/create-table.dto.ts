import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateTableDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  prefix?: string;

  @IsString()
  @IsOptional()
  suffix?: string;

  @IsInt()
  @IsNotEmpty()
  startNumber: number;

  @IsInt()
  @IsNotEmpty()
  endNumber: number;
}
