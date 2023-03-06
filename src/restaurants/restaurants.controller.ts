import { Body, Controller, Get, Param, Post, Req, Res } from "@nestjs/common";
import { GetJwtPayload, Public } from "src/decorators";
import { CreateRestaurantDto } from "./dto";
import { RestaurantsService } from "./restaurants.service";
import { JwtPayload_restaurantId } from "../Interfaces";
import { Request, Response } from "express";
import { constants } from "../useFullItems";
import { JwtStrategy } from "src/strategy";
import { GetJwtDto } from "src/auth/dto";

@Controller("restaurants")
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  /* it is important that @Public is not on adjusent side */
  @Get(":restaurantId")
  getRestaurantDetail(
    @GetJwtPayload() payload: JwtPayload_restaurantId,
    @Param("restaurantId") id: string,
  ) {
    return this.restaurantsService.restaurantDetail(payload, id);
  }

  @Get("states")
  sendStates() {
    return this.restaurantsService.allStates();
  }

  @Get(":stateName")
  sendCities(@Param("stateName") stateName: string) {
    return this.restaurantsService.allCities(stateName);
  }

  @Public()
  @Get()
  getall(@Req() req: Request) {
    return this.restaurantsService.findAllRestaurants(req);
  }

  @Post()
  create(
    @Body() dto: CreateRestaurantDto,
    @GetJwtPayload() userData: JwtPayload_restaurantId,
  ) {
    return this.restaurantsService.create(userData.userId, dto);
  }
}
