import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Get,
} from "@nestjs/common";
import { TablesService } from "./tables.service";
import { CreateTableDto } from "./dto/create-table.dto";
import { GetJwtPayload } from "src/decorators";
import { JwtPayload_restaurantId } from "src/Interfaces";

@Controller("tables")
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  getTables(@GetJwtPayload() payload: JwtPayload_restaurantId) {
    return this.tablesService.getTables(payload);
  }

  @Post()
  create(
    @Body() createTableDto: CreateTableDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.tablesService.create(payload, createTableDto);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateTableDto: CreateTableDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.tablesService.update(id, updateTableDto, payload);
  }

  @Delete(":id")
  remove(
    @Param("id") id: string,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.tablesService.remove(id, payload);
  }
}
