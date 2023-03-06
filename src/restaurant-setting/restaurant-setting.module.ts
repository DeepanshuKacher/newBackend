import { Module } from '@nestjs/common';
import { RestaurantSettingService } from './restaurant-setting.service';
import { RestaurantSettingController } from './restaurant-setting.controller';

@Module({
  controllers: [RestaurantSettingController],
  providers: [RestaurantSettingService]
})
export class RestaurantSettingModule {}
