import { IsEmail, IsEnum, IsNotEmpty, IsString } from "class-validator";

export enum UserType {
  Owner = "Owner",
  Manager = "Manager",
  Waiter = "Waiter",
  Chef = "Chef",
  FOODIE = "FOODIE",
  MACHINE = "MACHINE",
}

export class SignInDto {
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(UserType)
  @IsNotEmpty()
  userType: string;
}
