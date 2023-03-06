import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateWaiterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  MobileNumber?: number;

  @IsString()
  @IsOptional()
  address?: string;
}
