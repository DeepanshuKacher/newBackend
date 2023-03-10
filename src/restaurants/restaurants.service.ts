import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRestaurantDto } from './dto';
import * as argon from 'argon2';
import type { Request, Response } from 'express';
import { constants, redisClient, cacheFunction } from '../useFullItems';
import { AuthService } from 'src/auth/auth.service';
import { JwtPayload_restaurantId } from 'src/Interfaces';

@Injectable()
export class RestaurantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async create(request: Request, dto: CreateRestaurantDto) {
    const userId = request.signedCookies[constants.sessionId];

    try {
      await this.prisma.restaurant.create({
        data: {
          ownerId: userId,
          city: dto.city,
          latitude: parseFloat(dto.latitude),
          longitude: parseFloat(dto.longitude),
          name: dto.name,
          state: dto.state,
        },
      });

      return 'OK';
    } catch (error) {
      console.log({ error });
      throw new InternalServerErrorException('Internal Server Error', {
        cause: error,
      });
    }
  }

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

  async findAllRestaurants(request: Request) {
    const userId = request.signedCookies?.[constants.sessionId];

    if (!userId) throw new ForbiddenException();

    return this.prisma.owner.findUnique({
      where: { id: userId },
      select: { restaurants: { select: { city: true, name: true, id: true } } },
    });
  }

  async restaurantDetail(
    payload: JwtPayload_restaurantId,
    restaurantId: string,
  ) {
    // const userId = dto.userId;
    // const userType = dto.userType;

    // if (!(userType || userId)) throw new ForbiddenException();

    try {
      const restaurantInfo = this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          name: true,
          city: true,
          id: true,
          tables: {
            select: {
              name: true,
              endNumber: true,
              id: true,
              prefix: true,
              startNumber: true,
              suffix: true,
            },
          },
          dishesh: true,
        },
      });

      if (payload?.userType === 'Owner' || payload?.userId === 'Manager') {
        const restaurantPrivateInfo = this.prisma.restaurant.findUnique({
          where: { id: restaurantId },
          select: {
            waiters: {
              select: {
                id: true,
                name: true,
                MobileNumber: true,
                passportPhoto: true,
                verified: true,
                available: true,
              },
            },
            chefs: {
              select: {
                id: true,
                name: true,
                MobileNumber: true,
                passportPhoto: true,
                verified: true,
                available: true,
              },
            },
          },
        });

        const [restaurantDetails, restaurantPrivateDetails] = await Promise.all(
          [restaurantInfo, restaurantPrivateInfo],
        );

        restaurantDetails['waiters'] = restaurantPrivateDetails.waiters;
        restaurantDetails['chefs'] = restaurantPrivateDetails.chefs;
        return restaurantDetails;
      }

      return restaurantInfo;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }
}
