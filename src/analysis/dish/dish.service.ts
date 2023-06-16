import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { PrismaService } from "src/prisma/prisma.service";
import { DishAnalysisDto } from "./dto/getDishInfo.dto";

@Injectable()
export class DishService {
  constructor(private readonly prisma: PrismaService) {}

  async getDishData(data: DishAnalysisDto, payload: JwtPayload_restaurantId) {
    const { endDate, startDate, dishesId } = data;
    const { restaurantId, userId, userType } = payload;

    if (!(userType === "Owner" || userType === "Manager"))
      throw new UnauthorizedException();

    return this.prisma.dishData.groupBy({
      by: ["dateOfOrder", "dishId"],
      where: {
        restaurantId: payload.restaurantId,
        dishId: {
          in: dishesId,
        },
        dateOfOrder: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        dateOfOrder: "asc",
      },
      _sum: {
        cost: true,
      },
    });
    //   const dishesh = [
    //       "64086dc53a098ad9ddae8769",
    //       "640871cd3a098ad9ddae876a",
    //       "640871ce3a098ad9ddae876b",
    //       "640872343a098ad9ddae876d",
    //       "640872343a098ad9ddae876e",
    //       "640872343a098ad9ddae876f",
    //       "641862e0829e5d7f68585559",
    //       "6419a7f6829e5d7f6858555d",
    //       "6419a94c829e5d7f6858555f",
    //       "6419ab58ae8207167815320c",
    //       "6419b747cf13619712ca4a03",
    //       "6419b84acf13619712ca4a04",
    //       "641bfcb5829e5d7f68585564",
    //       "641bfe4b829e5d7f68585565",
    //       "641bfefb829e5d7f68585566",
    //     ],
    //     dates = [
    //       new Date(2023, 3, 1, 5, 30),
    //       new Date(2023, 3, 2, 5, 30),
    //       new Date(2023, 3, 3, 5, 30),
    //       new Date(2023, 3, 4, 5, 30),
    //       new Date(2023, 3, 5, 5, 30),
    //       new Date(2023, 3, 6, 5, 30),
    //     ],
    //     quantitys = [1, 2, 0, 3, 4],
    //     randomIntFun = (itemArray: any[]) =>
    //       itemArray[randomInt(itemArray.length)],
    //     costesItems = [200, 100, 50, 20, 300, 420, 625];

    //   for (let i = 0; i < 40; i++) {
    //     await this.prisma.ordersData.create({
    //       data: {
    //         cost: costesItems[randomInt(costesItems.length)],
    //         DishSize: "Large",
    //         dateOfOrder: dates[randomInt(dates.length)],
    //         dishId: dishesh[randomInt(dishesh.length)],
    //         fullQuantity: randomIntFun(quantitys),
    //         halfQuantity: randomIntFun(quantitys),
    //         restaurantId: "640818f372ca6af50de8a4c8",
    //       },
    //     });
    //   }

    //   return constants.OK;
    // }

    // return this.prisma.ordersData.groupBy({
    //   by: ["dateOfOrder"],
    //   where: {
    //     restaurantId: payload.restaurantId,
    //     dishId: "640871cd3a098ad9ddae876a",
    //   },
    //   _count: {

    //   },
    // });
  }
}
