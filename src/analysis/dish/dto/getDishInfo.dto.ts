import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
} from "class-validator";

export class DishAnalysisDto {
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  dishesId: string[];
}
