import { DishSize } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

class Order {
  @IsMongoId()
  @IsNotEmpty()
  dishId: string;

  @IsEnum(DishSize)
  @IsNotEmpty()
  size: DishSize;

  @IsOptional()
  @IsInt()
  fullQuantity?: number;

  @IsOptional()
  @IsInt()
  halfQuantity?: number;

  @IsString()
  @IsOptional()
  user_description?: string;
}

export class CreateParcelDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Order)
  kotOrders: Order[];
}
