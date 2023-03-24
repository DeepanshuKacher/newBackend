import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Redirect,
  Req,
  Res,
} from "@nestjs/common";
import { constants } from "src/useFullItems";
import { FoodieService } from "./foodie.service";
import type { Request, Response } from "express";
import { Public } from "src/decorators";

@Public()
@Controller("foodie")
export class FoodieController {
  constructor(private readonly foodieService: FoodieService) {}

  @Get()
  getJwt(@Req() req: Request) {
    return this.foodieService.getJwt(req);
  }

  @Get("verify")
  checkForRestaurantIdAndSessionId(@Req() request: Request) {
    return this.foodieService.checkForRestaurantIdAndSessionId(request);
  }

  @Get(":restaurantId/:tableSectionId/:tableNumber")
  @Redirect(
    constants.IS_DEVELOPMENT
      ? "http://192.168.43.48:3000"
      : "https://foodie.eatrofoods.com",
  )
  createSession(
    @Param("restaurantId") restaurantId: string,
    @Param("tableSectionId") tableSectionId: string,
    @Param("tableNumber", ParseIntPipe) tableNumber: number,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    return this.foodieService.createSession(
      restaurantId,
      tableSectionId,
      tableNumber,
      req,
      res,
    );
  }
}
