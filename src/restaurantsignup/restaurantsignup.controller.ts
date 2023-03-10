import { Controller, Get, Param } from '@nestjs/common';
import { RestaurantsignupService } from './restaurantsignup.service';
import { Public } from 'src/decorators';

/* this is temporary and delete solving problem on making states and city route public delete it after you got solution */
@Public()
@Controller('restaurantsignup')
export class RestaurantsignupController {
  constructor(
    private readonly restaurantsignupService: RestaurantsignupService,
  ) {}

  @Get('states')
  sendStates() {
    return this.restaurantsignupService.allStates();
  }

  @Get(':stateName')
  sendCities(@Param('stateName') stateName: string) {
    return this.restaurantsignupService.allCities(stateName);
  }
}
