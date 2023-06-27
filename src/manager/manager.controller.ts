import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { ManagerService } from "./manager.service";
import { CreateManagerDto } from "./dto/create-manager.dto";
import { UpdateManagerDto } from "./dto/update-manager.dto";
import { GetJwtPayload } from "src/decorators";
import { JwtPayload_restaurantId } from "src/Interfaces";

@Controller("manager")
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Post()
  create(
    @Body() createManagerDto: CreateManagerDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.managerService.create(createManagerDto, payload);
  }

  @Get()
  findAll(@GetJwtPayload() payload: JwtPayload_restaurantId) {
    return this.managerService.findAll(payload);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.managerService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateManagerDto: UpdateManagerDto) {
    return this.managerService.update(+id, updateManagerDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.managerService.remove(+id);
  }
}
