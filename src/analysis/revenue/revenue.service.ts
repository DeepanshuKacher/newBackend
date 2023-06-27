import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { RevenueDto } from "./dto/getRevenue.dto";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { DateTime } from "luxon";
import { constants } from "src/useFullItems";

@Injectable()
export class RevenueService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueData(data: RevenueDto, payload: JwtPayload_restaurantId) {
    const { endDate, startDate } = data;
    const { restaurantId, userId, userType } = payload;

    if (!(userType === "Owner" || userType === "Manager"))
      throw new UnauthorizedException();

    return this.prisma.restaurantRevenue.groupBy({
      where: {
        restaurantId: payload.restaurantId,
        date: {
          gte: DateTime.fromISO(startDate)
            .setZone(constants.IndiaTimeZone)
            .startOf("day")
            .toISO(),

          lte: DateTime.fromISO(endDate)
            .setZone(constants.IndiaTimeZone)
            .endOf("day")
            .toISO(),
        },
      },
      by: ["date"],
      _sum: {
        revenueGenerated: true,
      },
    });

    return this.prisma.restaurantRevenue.groupBy({
      by: ["date"],
      where: {
        id: payload.restaurantId,
        date: {
          gte: DateTime.fromISO(startDate)
            .setZone(constants.IndiaTimeZone)
            .startOf("day")
            .toISO(),
          lte: DateTime.fromISO(endDate)
            .setZone(constants.IndiaTimeZone)
            .endOf("day")
            .toISO(),
        },
      },
      _sum: {
        revenueGenerated: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    return this.prisma.dishData.groupBy({
      by: ["dateOfOrder"],
      where: {
        restaurantId: payload.restaurantId,
        dateOfOrder: {
          gte: DateTime.fromISO(startDate).startOf("day").toISO(),
          lte: DateTime.fromISO(endDate).startOf("day").toISO(),
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
