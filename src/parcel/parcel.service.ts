import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { CreateParcelDto } from "./dto/create-parcel.dto";
import { UpdateParcelDto } from "./dto/update-parcel.dto";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { PrismaService } from "src/prisma/prisma.service";
import { DishSize } from "@prisma/client";
import { DateTime } from "luxon";
import {
  OrderProps,
  constants,
  mqttPublish,
  redisClient,
} from "src/useFullItems";

@Injectable()
export class ParcelService {
  constructor(private readonly prisma: PrismaService) {}
  async create(
    createParcelDto: CreateParcelDto,
    payload: JwtPayload_restaurantId,
  ) {
    const disheshInfoPromise = this.prisma.restaurant.findUnique({
      where: {
        id: payload.restaurantId,
      },
      select: {
        dishesh: true,
      },
    });

    const createKotLogPromise = this.prisma.kotLog.create({
      data: {
        parcel: true,
        orderedBy: "manager",
        waiterId: payload.userId,
        createdAt: DateTime.now().setZone(constants.IndiaTimeZone).toISO(),
        restaurantId: payload.restaurantId,
      },
      select: {
        id: true,
      },
    });

    const [disheshInfo, createKotLog] = await Promise.all([
      disheshInfoPromise,
      createKotLogPromise,
    ]);

    const getOrderPrice_impure = (order: {
      dishId: string;
      fullQuantity?: number;
      halfQuantity?: number;
      size: DishSize;
    }) => {
      const dish = disheshInfo?.dishesh?.find(
        (dish) => dish.id === order.dishId,
      );

      const fullQuantity = order.fullQuantity,
        halfQuantity = order.halfQuantity,
        size = order?.size;

      let returnPrice = 0;

      returnPrice = (fullQuantity || 0) * (dish?.price?.[size]?.full || 0);
      returnPrice += (halfQuantity || 0) * (dish?.price?.[size]?.half || 0);

      return returnPrice;
    };

    const storeDishDataPromise = this.prisma.dishData.createMany({
      data: createParcelDto.kotOrders.map((order) => ({
        dishId: order.dishId,
        DishSize: order.size,
        cost: getOrderPrice_impure(order),
        fullQuantity: order.fullQuantity,
        halfQuantity: order.halfQuantity,
        dateOfOrder: DateTime.now().setZone(constants.IndiaTimeZone).toISO(),
        restaurantId: payload.restaurantId,
      })),
    });

    const storeOrderPromise = this.prisma.kotOrder.createMany({
      data: createParcelDto.kotOrders.map((order) => ({
        dateTime: DateTime.now().setZone(constants.IndiaTimeZone).toISO(),
        dishId: order.dishId,
        kotLogId: createKotLog.id,
        size: order.size,
        cost: getOrderPrice_impure(order),
        fullQuantity: order.fullQuantity,
        halfQuantity: order.halfQuantity,
        restaurantId: payload.restaurantId,
        user_description: order.user_description,
        orderBy: "manager",
        waiterId: payload.userId,
      })),
    });

    const restaurantRevenuePromise = this.prisma.restaurantRevenue.create({
      data: {
        restaurantId: payload.restaurantId,
        revenueGenerated: createParcelDto.kotOrders.reduce(
          (total, order) => total + getOrderPrice_impure(order),
          0,
        ),
        date: DateTime.now().setZone(constants.IndiaTimeZone).toISO(),
        parcelRevenue: true,
      },
    });

    const kotNoPromise = redisClient.INCR(`${payload.restaurantId}:kotCount`);

    try {
      const [kotNumber] = await Promise.all([
        kotNoPromise,
        storeDishDataPromise,
        storeOrderPromise,
        restaurantRevenuePromise,
      ]);

      const kotId: any = createKotLog.id;
      // const temp: `kot:${string}` = kotId;

      const createdAt = Date.now();

      mqttPublish.dishOrder({
        id: kotId,
        value: {
          chefAssign: "",
          completed: 0,
          createdAt,
          kotId,
          orderedBy: payload?.userId || "self",
          restaurantId: payload.restaurantId,
          sessionId: "parcel",
          tableNumber: 0,
          tableSectionId: "parcel",
          kotNo: kotNumber,
          printCount: 0,
          orders: createParcelDto.kotOrders.map((cartItem) => {
            const temp: any = cartItem.size;
            const dishSize: OrderProps["size"] = temp;
            return {
              tableSectionId: constants.parcel,
              sessionId: constants.parcel,
              createdAt,
              chefAssign: "",
              kotId,
              completed: 0,
              fullQuantity: cartItem.fullQuantity,
              halfQuantity: cartItem.halfQuantity,
              tableNumber: 0,
              dishId: cartItem.dishId,
              orderedBy: payload.userId,
              restaurantId: payload.restaurantId,
              size: dishSize,
              user_description: cartItem.user_description,
              orderId: constants.parcel,
            };
          }),
        },
      });

      return { kotNumber };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  findAll() {
    return `This action returns all parcel`;
  }

  findOne(id: number) {
    return `This action returns a #${id} parcel`;
  }

  update(id: number, updateParcelDto: UpdateParcelDto) {
    return `This action updates a #${id} parcel`;
  }

  remove(id: number) {
    return `This action removes a #${id} parcel`;
  }
}
