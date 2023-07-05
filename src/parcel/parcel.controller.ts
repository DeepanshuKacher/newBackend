import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { ParcelService } from "./parcel.service";
import { CreateParcelDto } from "./dto/create-parcel.dto";
import { UpdateParcelDto } from "./dto/update-parcel.dto";
import { GetJwtPayload } from "src/decorators";
import { JwtPayload_restaurantId } from "src/Interfaces";

@Controller("parcel")
export class ParcelController {
  constructor(private readonly parcelService: ParcelService) {}

  @Post()
  create(
    @Body() createParcelDto: CreateParcelDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.parcelService.create(createParcelDto, payload);
  }

  @Get()
  findAll() {
    return this.parcelService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.parcelService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateParcelDto: UpdateParcelDto) {
    return this.parcelService.update(+id, updateParcelDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.parcelService.remove(+id);
  }
}
