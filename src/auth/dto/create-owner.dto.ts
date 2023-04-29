import {
    IsEmail,
    IsNotEmpty,
    IsNumberString,
    IsOptional,
    IsString,
  } from "class-validator";
  
  export class CreateOwnerDto {
    @IsString()
    @IsNotEmpty()
    firstName: string;
  
    @IsString()
    @IsOptional()
    middleName?: string;
  
    @IsString()
    @IsNotEmpty()
    lastName: string;
  
    @IsString()
    @IsNotEmpty()
    password: string;
  
    @IsEmail()
    @IsNotEmpty()
    email: string;
  
    @IsNumberString()
    @IsNotEmpty()
    otp: string;
  }
  