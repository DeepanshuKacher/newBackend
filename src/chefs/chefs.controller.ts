import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { GetJwtPayload, Public } from "src/decorators";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { ChefsService } from "./chefs.service";
import { CreateChefDto } from "./dto/create-chef.dto";
import { UpdateChefDto } from "./dto/update-chef.dto";

@Controller("chefs")
export class ChefsController {
  constructor(private readonly chefsService: ChefsService) {}

  @Get("restaurantDetail")
  getRestaurantDetail_for_chef(
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.chefsService.getRestaurantDetail_For_Chef(payload.userId);
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "passportImage", maxCount: 1 },
      { name: "idProof", maxCount: 1 },
    ]),
  )
  create(
    @Body() dto: CreateChefDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
    @UploadedFiles()
    files: {
      passportImage?: Express.Multer.File[];
      idProof?: Express.Multer.File[];
    },
  ) {
    return this.chefsService.create(
      dto,
      payload,
      files.passportImage?.[0],
      files.idProof?.[0],
    );
  }

  @Public()
  @Get(":token")
  checkToken(@Param("token") token: string) {
    return this.chefsService.checkToken(token);
  }

  @Delete(":id")
  remove(
    @Param("id") id: string,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.chefsService.remove(id, payload);
  }
}
