import {
  IsBoolean,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class DeleteDishDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
