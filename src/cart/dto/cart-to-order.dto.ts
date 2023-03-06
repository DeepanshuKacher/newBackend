import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsString,
  IsUUID,
  isUUID,
} from "class-validator";

export class CartToOrderDTO {
  @IsUUID(4)
  @IsNotEmpty()
  tableSessionId: string;

  @IsMongoId()
  @IsNotEmpty()
  tableSectionId: string;

  @IsArray()
  cartOrder: string[];

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  tableNumber: number;
}
