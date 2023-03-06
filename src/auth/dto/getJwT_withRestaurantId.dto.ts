import { IsNotEmpty, IsString } from "class-validator";

export class GetJwtDto{
  @IsString()
  @IsNotEmpty()
  restaurantId: string;
}
