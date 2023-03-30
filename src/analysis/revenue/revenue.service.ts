import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { RevenueDto } from "./dto/getRevenue.dto";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { constants } from "src/useFullItems";

@Injectable()
export class RevenueService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueData(data: RevenueDto, payload: JwtPayload_restaurantId) {
    const { endDate, startDate } = data;
    const { restaurantId, userId, userType } = payload;

    if (!(userType === "Owner" || userType === "Manager"))
      throw new UnauthorizedException();

    return this.prisma.ordersData.groupBy({
      by: ["dateOfOrder"],
      where: {
        restaurantId: payload.restaurantId,
        dateOfOrder: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        cost: true,
      },
      orderBy: {
        dateOfOrder: "asc",
      },
    });
  }
}
