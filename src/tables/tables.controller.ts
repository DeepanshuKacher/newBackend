import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { TablesService } from "./tables.service";
import { CreateTableDto } from "./dto/create-table.dto";
import { GetJwtPayload } from "src/decorators";
import { JwtPayload_restaurantId } from "src/Interfaces";

@Controller("tables")
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  create(
    @Body() createTableDto: CreateTableDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.tablesService.create(payload, createTableDto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateTableDto: CreateTableDto) {
    return this.tablesService.update(id, updateTableDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tablesService.remove(id);
  }
}
