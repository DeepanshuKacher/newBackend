import { Type } from "class-transformer";
import { Order as OrderItem } from "../../Interfaces";
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
import { DishSize, ModeOfIncome } from "@prisma/client";

class Order {
  @IsMongoId()
  @IsNotEmpty()
  dishId: string;

  @IsEnum(DishSize)
  @IsNotEmpty()
  size: OrderItem["size"];

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

  @IsEnum(ModeOfIncome)
  @IsNotEmpty()
  modeOfIncome: ModeOfIncome
}
