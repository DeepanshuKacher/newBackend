import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsString,
  IsUUID,
} from "class-validator";

// enum OrderStatus {
//   Accept = "Accept",
//   Completed = "Completed",
//   Remove = "Remove",
// }

export class UpdateOrderStatusDto {
  @IsUUID("4")
  @IsNotEmpty()
  orderId: string;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  tableNumber: number;

  @IsMongoId()
  @IsNotEmpty()
  tableSectionId: string;

  // @IsEnum(OrderStatus)
  // @IsNotEmpty()
  // orderStatus: OrderStatus;
}
