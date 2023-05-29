import { Controller, Get, Post, Body } from "@nestjs/common";
import { TemplatesService } from "./templates.service";
import { CreateTemplateDto } from "./dto/create-template.dto";
import { GetJwtPayload } from "src/decorators";
import { JwtPayload_restaurantId } from "src/Interfaces";

@Controller("templates")
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  upsert(
    @GetJwtPayload() payload: JwtPayload_restaurantId,
    @Body() createTemplateDto: CreateTemplateDto,
  ) {
    return this.templatesService.upsert(createTemplateDto, payload);
  }

  @Get()
  get(@GetJwtPayload() payload: JwtPayload_restaurantId) {
    return this.templatesService.get(payload);
  }
}
