import { Injectable } from '@nestjs/common';
import { cacheFunction, constants, redisClient } from 'src/useFullItems';

@Injectable()
export class RestaurantsignupService {
  async allStates() {
    const data = cacheFunction('get', constants.States);

    if (data) return data;

    const allState = await redisClient.zRange(constants.States, 0, -1);

    return cacheFunction('add', constants.States, allState);
  }

  async allCities(stateName: string) {
    const data = cacheFunction('get', stateName);

    if (data) return data;

    const cities = redisClient.zRange(stateName, 0, -1);

    return cacheFunction('add', stateName, cities);
  }
}
