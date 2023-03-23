import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "src/prisma/prisma.service";
import { constants } from "src/useFullItems";

@Injectable()
export class RestaurantSettingService {
  constructor(private readonly prisma: PrismaService) {}
  async allow_witer_ClearSession(restaurantMongoId: string) {
    await this.prisma.restaurant.update({
      where: {
        id: restaurantMongoId,
      },
      data: {
        restaurantSettingForWaiter: {
          allowWaiterToClearSession: true,
        },
        commitToken: randomUUID(),
      },
    });

    return constants.OK;
  }

  async forbid_waiter_to_clearSession(restaurantMongoId: string) {
    await this.prisma.restaurant.update({
      where: {
        id: restaurantMongoId,
      },
      data: {
        restaurantSettingForWaiter: {
          allowWaiterToClearSession: false,
        },
        commitToken: randomUUID(),
      },
    });

    return constants.OK;
  }
}
