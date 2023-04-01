import { Body, Controller, Post } from "@nestjs/common";
import { DishService } from "./dish.service";
import { RevenueDto } from "../revenue/dto/getRevenue.dto";
import { GetJwtPayload } from "src/decorators";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { DishAnalysisDto } from "./dto/getDishInfo.dto";

@Controller("analysis/dish")
export class DishController {
  constructor(private readonly dishService: DishService) {}

  @Post("getData")
  getDishData(
    @Body() body: DishAnalysisDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.dishService.getDishData(body, payload);
  }
}
