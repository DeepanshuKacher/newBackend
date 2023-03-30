import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { RevenueService } from "./revenue.service";
import { RevenueDto } from "./dto/getRevenue.dto";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { GetJwtPayload } from "src/decorators";

@Controller("analysis/revenue")
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Post()
  getRevenueInfo(
    @Body() dto: RevenueDto,
    @GetJwtPayload() payload: JwtPayload_restaurantId,
  ) {
    return this.revenueService.getRevenueData(dto, payload);
  }
}
