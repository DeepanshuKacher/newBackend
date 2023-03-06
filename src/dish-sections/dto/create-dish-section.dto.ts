import { IsNotEmpty, IsString } from "class-validator";

export class CreateDishSectionDto {
  @IsString()
  @IsNotEmpty()
  sectionName: string;
}
