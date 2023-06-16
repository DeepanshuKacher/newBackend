import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsString,
} from "class-validator";

export class CartToOrderDTO {
  @IsString()
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
