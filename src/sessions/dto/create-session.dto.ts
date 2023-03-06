import { IsInt, IsMongoId, IsNotEmpty } from "class-validator";

export class CreateSessionDto {
  @IsMongoId()
  @IsNotEmpty()
  tableSectionId: string;

  @IsInt()
  @IsNotEmpty()
  tableNumber: number;
}
