import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  ParseFilePipeBuilder,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from "@nestjs/common";
import { WaitersService } from "./waiters.service";
import { CreateWaiterDto } from "./dto/create-waiter.dto";
import { UpdateWaiterDto } from "./dto/update-waiter.dto";
import { GetJwtPayload, Public } from "src/decorators";
import { JwtPayload_restaurantId } from "src/Interfaces";
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from "@nestjs/platform-express";
import { AuthService } from "src/auth/auth.service";

@Controller("waiters")
export class WaitersController {
  constructor(private readonly waitersService: WaitersService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "passportImage", maxCount: 1 },
      { name: "idProof", maxCount: 1 },
    ]),
  )
  create(
    @Body() createWaiterDto: CreateWaiterDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
    @UploadedFiles()
    files: {
      passportImage?: Express.Multer.File[];
      idProof?: Express.Multer.File[];
    },
  ) {
    return this.waitersService.create(
      createWaiterDto,
      payload,
      files.passportImage?.[0],
      files.idProof?.[0],
    );
  }

  @Public()
  @Get(":token")
  checkToken(@Param("token") token: string) {
    return this.waitersService.checkToken(token);
  }

  @Get()
  findAll() {
    return this.waitersService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.waitersService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateWaiterDto: UpdateWaiterDto) {
    return this.waitersService.update(+id, updateWaiterDto);
  }

  @Delete(":id")
  remove(
    @Param("id") id: string,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.waitersService.remove(id, payload);
  }
}
