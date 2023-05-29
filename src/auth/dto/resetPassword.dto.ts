import { IsEmail, IsEnum, IsNotEmpty, IsString } from "class-validator";

export enum UserType {
  Owner = "Owner",
  Manager = "Manager",
}

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(UserType)
  @IsNotEmpty()
  userType: string;
}

export class ResetPasswordFinal {
  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(UserType)
  @IsNotEmpty()
  userType: string;
}
