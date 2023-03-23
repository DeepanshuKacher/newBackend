import { Controller, Get } from "@nestjs/common";
import { RestaurantSettingService } from "./restaurant-setting.service";
import { GetJwtPayload } from "src/decorators";
import { JwtPayload_restaurantId } from "src/Interfaces";

@Controller("restaurant-setting")
export class RestaurantSettingController {
  constructor(
    private readonly restaurantSettingService: RestaurantSettingService,
  ) {}

  @Get("allow_waiter_clear_session")
  waiterClearSession_allow(@GetJwtPayload() payload: JwtPayload_restaurantId) {
    return this.restaurantSettingService.allow_witer_ClearSession(
      payload.restaurantId,
    );
  }

  @Get("forbid_waiter_clear_session")
  waiterClearSession_forbid(@GetJwtPayload() payload: JwtPayload_restaurantId) {
    return this.restaurantSettingService.forbid_waiter_to_clearSession(
      payload.restaurantId,
    );
  }
}
