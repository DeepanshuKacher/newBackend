import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { RevenueDto } from "./dto/getRevenue.dto";
import { JwtPayload_restaurantId } from "src/Interfaces";


@Injectable()
export class RevenueService {
  constructor(private readonly prisma: PrismaService) { }

  async getRevenueData(data: RevenueDto, payload: JwtPayload_restaurantId) {
    const { endDateTime, startDateTime } = data;
    const { restaurantId, userType } = payload;

    if (!(userType === "Owner" || userType === "Manager"))
      throw new UnauthorizedException();

    return this.prisma.restaurantRevenue.findMany({
      where: {
        restaurantId: restaurantId,
        dateTime: {
          gte: new Date(startDateTime),
          lte: new Date(endDateTime),
        },
      }, select: {
        dateTime: true,
        modeOfIncome: true,
        parcelRevenue: true,
        revenueGenerated: true
      }
    });
  }
}
