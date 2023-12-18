import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
} from "@nestjs/common";
import { WaitersService } from "./waiters.service";
import { CreateWaiterDto } from "./dto/create-waiter.dto";
import { GetJwtPayload, Public } from "src/decorators";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { FileFieldsInterceptor } from "@nestjs/platform-express";

@Controller("waiters")
export class WaitersController {
  constructor(private readonly waitersService: WaitersService) {}

  @Get("restaurantDetail")
  getRestaurantDetail_For_Waiter(
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.waitersService.getRestaurantDetail_For_Waiter(payload.userId);
  }

/*   @Get("logs")
  getLogs(@GetJwtPayload() payload: JwtPayload_restaurantId) {
    return this.waitersService.getLogs(payload);
  } */

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

  @Delete(":id")
  remove(
    @Param("id") id: string,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.waitersService.remove(id, payload);
  }
}
