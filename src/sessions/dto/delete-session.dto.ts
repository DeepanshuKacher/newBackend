import { IsEnum, IsInt, IsMongoId, IsNotEmpty } from "class-validator";
import { CreateSessionDto } from "./create-session.dto";
import { ModeOfIncome } from "@prisma/client";

export class DeleteSessionDto extends CreateSessionDto {

    @IsEnum(ModeOfIncome)
    @IsNotEmpty()
    modeOfIncome: ModeOfIncome

}
