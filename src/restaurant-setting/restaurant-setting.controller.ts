import { Controller } from "@nestjs/common";
import { RestaurantSettingService } from "./restaurant-setting.service";

@Controller("restaurant-setting")
export class RestaurantSettingController {
  constructor(
    private readonly restaurantSettingService: RestaurantSettingService,
  ) {}
}
