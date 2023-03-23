import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "src/prisma/prisma.service";

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
}
