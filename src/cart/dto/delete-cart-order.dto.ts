import { IsArray, IsNotEmpty, IsUUID } from "class-validator";

export class DeleteCartOrderDTO {
  @IsArray()
  cartOrder: string[];
}
