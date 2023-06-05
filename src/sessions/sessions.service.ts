import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotImplementedException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { JwtPayload_restaurantId } from "src/Interfaces";
import {
  constants,
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
        uuid: true,
        Order_Logs: true,
        tableNumber: true,
        tableId: true,
        sessionCreationTime: true,
        restaurantId: true,
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
    const uuid = randomUUID();

    const prismaSessionCreationPromis = this.prisma.sessionLogs.create({
      data: {
        tableNumber,
        uuid,
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
      redisConstants.sessionKey(uuid),
    );

    await Promise.all([
      redisSessionCreationPromis,
      prismaSessionCreationPromis,
    ]);

    mqttPublish.sessionStartConfirmation(
      restaurantId,
      tableSectionId,
      tableNumber,
      uuid,
    );

    return uuid;
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
      return redisGetFunction.getOrdersObjectFromSessionUUID(sessionUUID);
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

    // save orders to prisma

    const orderObjects = await redisGetFunction.getOrdersObjectFromSessionUUID(
      sessionId,
    );

    // const [orderObjects] = await Promise.all([
    //   orderObjectsPromis,
    //   // DisheshInfoPromis,
    // ]);

    const disheshInfo = await this.prisma.dish.findMany({
      where: {
        restaurantId: payload.restaurantId,
        id: {
          in: orderObjects.map((order) => order.dishId),
        },
      },
      select: {
        id: true,
        price: true,
      },
    });

    const getOrderPrice = (order: Order) => {
      const dish = disheshInfo.find((dish) => dish.id === order.dishId);

      const fullQuantity = parseInt(order.fullQuantity),
        halfQuantity = parseInt(order.halfQuantity),
        size = order?.size;

      let returnPrice = 0;

      returnPrice = (fullQuantity || 0) * (dish?.price?.[size]?.full || 0);
      returnPrice += (halfQuantity || 0) * (dish?.price?.[size]?.half || 0);

      // if (size === "Large") {
      //   returnPrice = (fullQuantity || 0) * (dish?.price.large?.full || 0);
      //   returnPrice += (halfQuantity || 0) * (dish?.price.large?.half || 0);
      // } else if (size === "Medium") {
      //   returnPrice = (fullQuantity || 0) * (dish?.price.medium?.full || 0);
      //   returnPrice += (halfQuantity || 0) * (dish?.price?.medium?.half || 0);
      // } else if (size === "Small") {
      //   returnPrice = (fullQuantity || 0) * (dish?.price?.small?.full || 0);
      //   returnPrice += (halfQuantity || 0) * (dish?.price?.small?.half || 0);
      // }
      return returnPrice;
    };

    let saveOrdersLogsToPrismaPromis:
      | Prisma.PrismaPromise<Prisma.BatchPayload>
      | undefined;
    if (orderObjects.length > 0)
      saveOrdersLogsToPrismaPromis = this.prisma.ordersLogs.createMany({
        data: orderObjects.map((item) => ({
          chefId: item.chefAssign,
          dishId: item.dishId,
          size: item.size,
          waiterId: item.orderedBy === "self" ? null : item.orderedBy,
          fullQuantity: parseInt(item.fullQuantity),
          halfQuantity: parseInt(item.halfQuantity),
          user_description: item.user_description,
          orderTimeStamp: item.createdAt,
          sessionLogsUuid: sessionId,
          cost: getOrderPrice(item),
        })),
      });

    let saveOrderDataToPrismaPromis:
      | Prisma.PrismaPromise<Prisma.BatchPayload>
      | undefined;
    if (orderObjects.length > 0)
      saveOrderDataToPrismaPromis = this.prisma.ordersData.createMany({
        data: orderObjects.map((item) => ({
          dishId: item.dishId,
          DishSize: item.size,
          fullQuantity: parseInt(item.fullQuantity),
          halfQuantity: parseInt(item.halfQuantity),
          cost: getOrderPrice(item),
          restaurantId: payload.restaurantId,
          dateOfOrder: DateTime.now()
            .setZone(constants.IndiaTimeZone)
            .startOf("day")
            .toISO(),
        })),
      });

    const detachSessionFromTable = redisClient.HDEL(
      redisConstants.tablesStatusKey(payload.restaurantId),
      redisConstants.tableSessionKeyForTablesStatus(
        tableSectionId,
        tableNumber,
      ),
    );

    const deleteSession = redisClient.DEL(redisConstants.sessionKey(sessionId));

    const deleteCart = redisClient.DEL(
      redisConstants.cartSessionKey(sessionId),
    );

    try {
      await Promise.all([
        saveOrdersLogsToPrismaPromis,
        saveOrderDataToPrismaPromis,
        detachSessionFromTable,
        deleteSession,
        deleteCart,
      ]);

      mqttPublish.sessionStartConfirmation(
        payload.restaurantId,
        createSessionDto.tableSectionId,
        createSessionDto.tableNumber,
        null,
      );

      const setOrderExpiryPromis: Promise<boolean>[] = [];

      orderObjects.forEach((order) =>
        setOrderExpiryPromis.push(
          redisClient.EXPIRE(
            redisConstants.orderKey(order.orderId),
            redisKeyExpiry.orderKey,
            "NX",
          ),
        ),
      );

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
