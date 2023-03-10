import { Module } from '@nestjs/common';
import { RestaurantsignupService } from './restaurantsignup.service';
import { RestaurantsignupController } from './restaurantsignup.controller';

@Module({
  controllers: [RestaurantsignupController],
  providers: [RestaurantsignupService]
})
export class RestaurantsignupModule {}
