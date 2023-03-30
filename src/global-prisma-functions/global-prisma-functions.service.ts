import { Injectable } from "@nestjs/common";
import { Dish, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { PrismaService } from "src/prisma/prisma.service";

interface DishInfo {
  dishId: string;
}

@Injectable()
export class GlobalPrismaFunctionsService {
  constructor(private readonly prisma: PrismaService) {}
  async updateRestaurantCommitUUID(restaurantMongoID: string) {
    await this.prisma.restaurant.update({
      where: {
        id: restaurantMongoID,
      },
      data: {
        commitToken: randomUUID(),
      },
    });
  }

  getDisheshInfo(disheshInfo: DishInfo[]) {
    const promisContainer: Prisma.Prisma__DishClient<Dish, never>[] = [];

    for (let x of disheshInfo) {
      promisContainer.push(
        this.prisma.dish.findUnique({
          where: {
            id: x.dishId,
          },
        }),
      );
    }

    return Promise.all(promisContainer);
  }
}
