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
} from "src/useFullItems";

import { mqttPublish } from "../useFullItems";
import { CreateSessionDto } from "./dto/create-session.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { GlobalPrismaFunctionsService } from "src/global-prisma-functions/global-prisma-functions.service";

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prismaGlobalFunction: GlobalPrismaFunctionsService,
  ) {}
  async createSession(
    restaurantId: string,
    tableSectionId: string,
    tableNumber: number,
  ) {
    const uuid = randomUUID();

    const prismaSessionCreationPromis = this.prisma.sessionLogs.create({
      data: { tableNumber, uuid, tableId: tableSectionId },
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

  // async createSessionByFoodie() {
  //   const sessionId = request.signedCookies[constants.sessionId];
  //   const userType = request.signedCookies[constants.userType];

  //   const onGoingSession = await redisClient.HGET(
  //     redisConstants.tablesStatusKey(payload.restaurantId),
  //     redisConstants.tableSessionKeyForTablesStatus(
  //       createSessionDto.tableSectionId,
  //       createSessionDto.tableNumber,
  //     ),
  //   );

  //   if (onGoingSession) throw new NotImplementedException();

  //   const uuid = randomUUID();

  //   await redisClient.HSET(
  //     redisConstants.tablesStatusKey(payload.restaurantId),
  //     redisConstants.tableSessionKeyForTablesStatus(
  //       createSessionDto.tableSectionId,
  //       createSessionDto.tableNumber,
  //     ),
  //     redisConstants.sessionKey(uuid),
  //   );

  //   mqttPublish.sessionStartConfirmation(
  //     payload.restaurantId,
  //     createSessionDto.tableSectionId,
  //     createSessionDto.tableNumber,
  //     uuid,
  //   );

  //   return constants.OK;
  // }

  // async findAll(payload: JwtPayload_restaurantId) {
  //   const tableSessions: any = await redisClient.HGETALL(
  //     redisConstants.restaurantTablesSessionKey(payload.restaurantId),
  //   );

  //   const sessionPromises = [];
  //   for (let x in tableSessions) {
  //     // tableSessions[x] = await redisClient.LRANGE(tableSessions[x], 0, -1);
  //     sessionPromises.push(redisClient.LRANGE(tableSessions[x], 0, -1));
  //   }
  //   const ordersKeys = await Promise.all(sessionPromises);

  //   const numberOfOrderKeys = ordersKeys.length;
  //   let variableOfOrderKeys = numberOfOrderKeys;
  //   for (let x in tableSessions) {
  //     tableSessions[x] =
  //       ordersKeys[numberOfOrderKeys - variableOfOrderKeys].length;

  //     variableOfOrderKeys--;
  //   }

  //   const ordersPromis = [];
  //   for (let x of ordersKeys) {
  //     for (let y of x) {
  //       ordersPromis.push(redisClient.HGETALL(y));
  //     }
  //   }
  //   const orders = await Promise.all(ordersPromis);

  //   // return orders;

  //   let startNumber = 0;
  //   for (let x in tableSessions) {
  //     const storeNumber = tableSessions[x];
  //     tableSessions[x] = orders.slice(startNumber, storeNumber);
  //     startNumber = storeNumber;
  //   }

  //   return tableSessions;

  //   // for (let x in tableSessions) {
  //   //   const temp = [];
  //   //   for (let y of tableSessions[x]) {
  //   //     temp.push(await redisClient.HGETALL(y));
  //   //   }
  //   //   tableSessions[x] = temp;
  //   // }
  //   // return tableSessions;
  // }

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

    const orderObjectsPromis =
      redisGetFunction.getOrdersObjectFromSessionUUID(sessionId);

    const DisheshInfoPromis = this.prisma.dish.findMany({
      where: {
        restaurantId: payload.restaurantId,
      },
      select: {
        id: true,
        FullLarge_Price: true,
        FullMedium_Price: true,
        FullSmall_Price: true,
        HalfLarge_Price: true,
        HalfMedium_Price: true,
        HalfSmall_Price: true,
      },
    });

    const [orderObjects, dishInfo] = await Promise.all([
      orderObjectsPromis,
      DisheshInfoPromis,
    ]);

    const saveOrdersLogsToPrismaPromis = this.prisma.order_Logs.createMany({
      data: orderObjects.map((item) => ({
        chefId: item.chefAssign,
        dishId: item.dishId,
        size: item.size,
        waiterId: item.orderedBy,
        fullQuantity: parseInt(item.fullQuantity),
        halfQuantity: parseInt(item.halfQuantity),
        user_description: item.user_description,
        orderTimeStamp: item.createdAt,
        sessionLogsUuid: sessionId,
      })),
    });

    const getOrderPrice = (order: Order) => {
      const dish = dishInfo.find((dish) => dish.id === order.dishId);

      const fullQuantity = parseInt(order.fullQuantity),
        halfQuantity = parseInt(order.halfQuantity),
        size = order.size;

      let returnPrice = 0;

      if (size === "Large") {
        returnPrice = (fullQuantity || 0) * (dish?.FullLarge_Price || 0);
        returnPrice += (halfQuantity || 0) * (dish?.HalfLarge_Price || 0);
      } else if (size === "Medium") {
        returnPrice = (fullQuantity || 0) * (dish?.FullMedium_Price || 0);
        returnPrice += (halfQuantity || 0) * (dish?.HalfMedium_Price || 0);
      } else if (size === "Small") {
        returnPrice = (fullQuantity || 0) * (dish?.FullSmall_Price || 0);
        returnPrice += (halfQuantity || 0) * (dish?.HalfSmall_Price || 0);
      }
      return returnPrice;
    };

    const dateObje = new Date();
    const currentDate = new Date(
      dateObje.getFullYear(),
      dateObje.getMonth(),
      dateObje.getDate(),
      5,
      30,
    );


    const saveOrderDataToPrisma = this.prisma.ordersData.createMany({
      data: orderObjects.map((item) => ({
        dishId: item.dishId,
        DishSize: item.size,
        fullQuantity: parseInt(item.fullQuantity),
        halfQuantity: parseInt(item.halfQuantity),
        cost: getOrderPrice(item),
        restaurantId: payload.restaurantId,
        dateOfOrder: currentDate,
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
        saveOrderDataToPrisma,
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

      return constants.OK;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }
}
