import { IsInt, IsMongoId, IsNotEmpty, IsString } from "class-validator";

export class CreateAddOnDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsNotEmpty()
  price: number;

  @IsMongoId()
  @IsNotEmpty()
  dishId: string;
}
