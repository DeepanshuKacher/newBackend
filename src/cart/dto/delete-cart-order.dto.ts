import { IsArray, IsNotEmpty, IsUUID } from "class-validator";

export class DeleteCartOrderDTO {
  @IsUUID(4)
  @IsNotEmpty()
  tableSessionId: string;

  @IsArray()
  cartOrder: string[];
}
