import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateRestaurantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsNumber()
  @IsNotEmpty()
  latitude: string;

  @IsNumber()
  @IsNotEmpty()
  longitude: string;
}
