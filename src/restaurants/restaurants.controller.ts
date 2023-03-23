import { Body, Controller, Get, Param, Post, Req, Res } from "@nestjs/common";
import { GetJwtPayload, Public } from "src/decorators";
import { CreateRestaurantDto } from "./dto";
import { RestaurantsService } from "./restaurants.service";
import { JwtPayload_restaurantId } from "../Interfaces";
import { Request, Response } from "express";

// @Public() /* until development try to make different sub-domain & route for modify-restaurant */
@Controller("restaurants")
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  /* it is important that @Public is not on adjusent side */

  @Get("checkCommit")
  getCommitToken(@GetJwtPayload() payload: JwtPayload_restaurantId) {
    return this.restaurantsService.commitToken(payload);
  }

  @Public()
  @Get()
  getall(@Req() req: Request) {
    return this.restaurantsService.findAllRestaurants(req);
  }

  @Get(":restaurantId")
  getRestaurantDetail(
    @GetJwtPayload() payload: JwtPayload_restaurantId,
    @Param("restaurantId") id: string,
  ) {
    return this.restaurantsService.restaurantDetail(payload, id);
  }

  @Public()
  @Post()
  create(
    @Body() dto: CreateRestaurantDto,
    @Req() req: Request,
    // @GetJwtPayload() userData: JwtPayload_restaurantId,
  ) {
    return this.restaurantsService.create(req, dto);
  }
}
