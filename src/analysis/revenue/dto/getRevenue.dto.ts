import { IsInt, IsNotEmpty } from "class-validator";

export class RevenueDto {
  @IsNotEmpty()
  @IsInt()
  startDateTime: number;

  @IsNotEmpty()
  @IsInt()
  endDateTime: number;
}
