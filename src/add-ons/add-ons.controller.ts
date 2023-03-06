import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { Public } from "src/decorators";
import { AddOnsService } from "./add-ons.service";
import { CreateAddOnDto } from "./dto/create-add-on.dto";
import { UpdateAddOnDto } from "./dto/update-add-on.dto";

@Public() //--------------remove it
@Controller("add-ons")
export class AddOnsController {
  constructor(private readonly addOnsService: AddOnsService) {}

  // @Post()
  // create(@Body() createAddOnDto: CreateAddOnDto) {
  //   return this.addOnsService.create(createAddOnDto);
  // }

  @Get()
  findAll() {
    return this.addOnsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.addOnsService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateAddOnDto: UpdateAddOnDto) {
    return this.addOnsService.update(+id, updateAddOnDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.addOnsService.remove(+id);
  }
}
