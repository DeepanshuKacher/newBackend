import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

enum OperationType {
  Plus = "Plus",
  Minus = "Minus",
  Multiply = "Multiply",
  Divide = "Divide",
  Percentage = "Percentage",
}

enum GainLoss {
  gain = "gain",
  loss = "loss",
}

class Operations {
  @IsString()
  label: string;

  @IsNumber()
  number: number;

  @IsEnum(OperationType)
  operation: OperationType;

  @IsEnum(GainLoss)
  gainLoss: GainLoss;
}

export class CreateTemplateDto {
  @IsOptional()
  @IsString()
  upperSectionText?: string;

  @IsOptional()
  // @ValidateNested()
  operations?: Operations;
}
