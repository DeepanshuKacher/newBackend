import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotImplementedException,
} from "@nestjs/common";
import { JwtPayload_restaurantId, RetreveKotJson } from "src/Interfaces";
import {
  constants,
  NewOrderType,
  Order,
  redisClient,
  redisConstants,
  redisGetFunction,
  redisKeyExpiry,
} from "src/useFullItems";

import { mqttPublish } from "../useFullItems";
import { CreateSessionDto } from "./dto/create-session.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { DateTime } from "luxon";
import { Prisma } from "@prisma/client";

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  sessionLog(payload: JwtPayload_restaurantId) {
    return this.prisma.sessionLogs.findMany({
      where: {
        restaurantId: payload.restaurantId,
      },
      select: {
        tableNumber: true,
        tableId: true,
        sessionCreationTime: true,
        restaurantId: true,
        id: true,
        KotLog: true,
      },
      orderBy: {
        sessionCreationTime: "asc",
      },
    });
  }

  async createSession(
    restaurantId: string,
    tableSectionId: string,
    tableNumber: number,
  ) {
    const prismaSessionCreation = await this.prisma.sessionLogs.create({
      data: {
        tableNumber,
        tableId: tableSectionId,
        restaurantId,
      },
    });

    const redisSessionCreationPromis = redisClient.HSET(
      redisConstants.tablesStatusKey(restaurantId),
      redisConstants.tableSessionKeyForTablesStatus(
        tableSectionId,
        tableNumber,
      ),
      redisConstants.sessionKey(prismaSessionCreation.id),
    );

    await Promise.all([
      redisSessionCreationPromis,
      // prismaSessionCreationPromis,
    ]);

    mqttPublish.sessionStartConfirmation(
      restaurantId,
      tableSectionId,
      tableNumber,
      prismaSessionCreation.id,
    );

    return prismaSessionCreation.id;
  }

  async create(
    createSessionDto: CreateSessionDto,
    payload: JwtPayload_restaurantId,
  ) {
    const onGoingSession = await redisClient.HGET(
      redisConstants.tablesStatusKey(payload.restaurantId),
      redisConstants.tableSessionKeyForTablesStatus(
        createSessionDto.tableSectionId,
        createSessionDto.tableNumber,
      ),
    );

    if (onGoingSession) throw new NotImplementedException();

    await this.createSession(
      payload.restaurantId,
      createSessionDto.tableSectionId,
      createSessionDto.tableNumber,
    );

    return constants.OK;
  }

  findAll(payload: JwtPayload_restaurantId) {
    return redisClient.HGETALL(
      redisConstants.tablesStatusKey(payload.restaurantId),
    );
  }

  async getTableOrders(sessionUUID: string) {
    try {
      // return redisGetFunction.getOrdersObjectFromSessionUUID(sessionUUID);
      // console.log(sessionUUID);

      const jsonOrders = await redisClient.ft.search(
        redisConstants.restaurantOrderIndex,
        `@sessionId:{${sessionUUID}}`,
      );

      // console.log(jsonOrders.documents[0]);
      // console.log(jsonOrders.documents[0].value.orders);

      // console.log(jsonOrders.documents[0]);
      // console.log(jsonOrders.documents[0].value.orders);

      return jsonOrders.documents;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }

  async clearSession(
    createSessionDto: CreateSessionDto,
    payload: JwtPayload_restaurantId,
    sessionId: string,
  ) {
    const { tableNumber, tableSectionId } = createSessionDto;

    const tableSessionIdFromTableInfo =
      await redisGetFunction.sessionIdFromTableInfo(
        payload.restaurantId,
        tableSectionId,
        tableNumber,
      );

    if (tableSessionIdFromTableInfo !== redisConstants.sessionKey(sessionId))
      throw new ConflictException("Invalid Session");

    // save logs to prisma

    // detach session from table
    // mqtt publish
    // set expiry to kot

    const jsonOrders: any = (
      await redisClient.ft.search(
        redisConstants.restaurantOrderIndex,
        `@sessionId:{${sessionId}}`,
      )
    ).documents;

    const jsonOrdersType: RetreveKotJson[] = jsonOrders;

    console.log(jsonOrdersType);
    return "ok";

    // const orderObjects: NewOrderType[] = [];

    // for (let x of jsonOrdersType) {
    //   for (let y of x.value.orders) {
    //     orderObjects.push(y);
    //   }
    // }

    // const [orderObjects] = await Promise.all([
    //   orderObjectsPromis,
    //   // DisheshInfoPromis,
    // ]);

    // const disheshInfo = await this.prisma.dish.findMany({
    //   where: {
    //     restaurantId: payload.restaurantId,
    //     id: {
    //       in: orderObjects.map((order) => order.dishId),
    //     },
    //   },
    //   select: {
    //     id: true,
    //     price: true,
    //   },
    // });

    // const getOrderPrice = (order: NewOrderType) => {
    //   const dish = disheshInfo.find((dish) => dish.id === order.dishId);

    //   const fullQuantity = order.fullQuantity,
    //     halfQuantity = order.halfQuantity,
    //     size = order?.size;

    //   let returnPrice = 0;

    //   returnPrice = (fullQuantity || 0) * (dish?.price?.[size]?.full || 0);
    //   returnPrice += (halfQuantity || 0) * (dish?.price?.[size]?.half || 0);

    //   return returnPrice;
    // };

    // let saveOrdersLogsToPrismaPromis:
    //   | Prisma.PrismaPromise<Prisma.BatchPayload>
    //   | undefined;
    // if (orderObjects.length > 0)
    //   saveOrdersLogsToPrismaPromis = this.prisma.ordersLogs.createMany({
    //     data: orderObjects.map((item) => ({
    //       chefId: item.chefAssign,
    //       dishId: item.dishId,
    //       size: item.size,
    //       waiterId: item.orderedBy === "self" ? null : item.orderedBy,
    //       fullQuantity: item.fullQuantity,
    //       halfQuantity: item.halfQuantity,
    //       user_description: item.user_description,
    //       orderTimeStamp: new Date(item.createdAt),
    //       sessionLogsUuid: sessionId,
    //       cost: getOrderPrice(item),
    //     })),
    //   });

    // let saveOrderDataToPrismaPromis:
    //   | Prisma.PrismaPromise<Prisma.BatchPayload>
    //   | undefined;
    // if (orderObjects.length > 0)
    //   saveOrderDataToPrismaPromis = this.prisma.ordersData.createMany({
    //     data: orderObjects.map((item) => ({
    //       dishId: item.dishId,
    //       DishSize: item.size,
    //       fullQuantity: item.fullQuantity,
    //       halfQuantity: item.halfQuantity,
    //       cost: getOrderPrice(item),
    //       restaurantId: payload.restaurantId,
    //       dateOfOrder: DateTime.now()
    //         .setZone(constants.IndiaTimeZone)
    //         .startOf("day")
    //         .toISO(),
    //     })),
    //   });

    const detachSessionFromTable = await redisClient.HDEL(
      redisConstants.tablesStatusKey(payload.restaurantId),
      redisConstants.tableSessionKeyForTablesStatus(
        tableSectionId,
        tableNumber,
      ),
    );

    // const deleteSession = redisClient.DEL(redisConstants.sessionKey(sessionId));

    // const deleteCart = redisClient.DEL(
    //   redisConstants.cartSessionKey(sessionId),
    // );

    try {
      // await Promise.all([
      //   saveOrdersLogsToPrismaPromis,
      //   saveOrderDataToPrismaPromis,
      //   detachSessionFromTable,
      //   deleteSession,
      //   deleteCart,
      // ]);

      mqttPublish.sessionStartConfirmation(
        payload.restaurantId,
        createSessionDto.tableSectionId,
        createSessionDto.tableNumber,
        null,
      );

      const setOrderExpiryPromis: Promise<boolean>[] = [];

      // orderObjects.forEach((order) =>
      //   setOrderExpiryPromis.push(
      //     redisClient.EXPIRE(
      //       redisConstants.orderKey(order.orderId),
      //       redisKeyExpiry.orderKey,
      //       "NX",
      //     ),
      //   ),
      // );

      await Promise.all(setOrderExpiryPromis);

      return constants.OK;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }

  async closeSessionNotificationGenerator(
    createSessionDto: CreateSessionDto,
    payload: JwtPayload_restaurantId,
  ) {
    try {
      mqttPublish.generateBillNotification(
        payload.restaurantId,
        createSessionDto.tableNumber,
        createSessionDto.tableSectionId,
      );

      return constants.OK;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}
