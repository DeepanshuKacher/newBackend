import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { GetJwtPayload } from "src/decorators";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { DishSectionsService } from "./dish-sections.service";
import { CreateDishSectionDto } from "./dto/create-dish-section.dto";
import { UpdateDishSectionDto } from "./dto/update-dish-section.dto";

@Controller("dish-sections")
export class DishSectionsController {
  constructor(private readonly dishSectionsService: DishSectionsService) {}

  @Post()
  create(
    @Body() createDishSectionDto: CreateDishSectionDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.dishSectionsService.create(createDishSectionDto, payload);
  }

  @Get(":id")
  dishSections(@Param("id") restaurantId: string) {
    return this.dishSectionsService.getDishSections(restaurantId);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateDishSectionDto: UpdateDishSectionDto,
  ) {
    return this.dishSectionsService.update(id, updateDishSectionDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.dishSectionsService.remove(id);
  }
}
