import { IsDateString, IsNotEmpty } from "class-validator";

export class RevenueDto {
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}
