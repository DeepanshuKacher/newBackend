import { PartialType } from "@nestjs/mapped-types";
import { IsNotEmpty, IsString } from "class-validator";
import { CreateDishSectionDto } from "./create-dish-section.dto";

export class UpdateDishSectionDto extends PartialType(CreateDishSectionDto) {}
