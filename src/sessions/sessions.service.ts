import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotImplementedException,
} from "@nestjs/common";
import { CartItemRedisReturn, JwtPayload_restaurantId, Order, OrderReturnFromRedis, RetreveCartItemFromRedisIndex, RetreveKotJson } from "src/Interfaces";
import {
  constants,
  NewOrderType,
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
import { DeleteSessionDto } from "./dto/delete-session.dto";

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) { }

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
        // KotLog: true,
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

      const jsonOrders = await redisClient.ft.search(
        redisConstants.restaurantOrderIndex,
        `@sessionId:{${sessionUUID}}`,
        {
          SORTBY: {
            BY: "createdAt",
            DIRECTION: "ASC",
          },
        },
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
  /* 
    async clearSession(
      createSessionDto: CreateSessionDto,
      payload: JwtPayload_restaurantId,
      sessionId: string,
    ) {
      const { tableNumber, tableSectionId } = createSessionDto;
  
      // const startTime = Date.now();
  
      const tableSessionIdFromTableInfo =
        await redisGetFunction.sessionIdFromTableInfo(
          payload.restaurantId,
          tableSectionId,
          tableNumber,
        );
  
      // console.log(Date.now() - startTime);
  
      if (tableSessionIdFromTableInfo !== redisConstants.sessionKey(sessionId))
        throw new ConflictException("Invalid Session");
  
      const jsonOrders: any = (
        await redisClient.ft.search(
          redisConstants.restaurantOrderIndex,
          `@sessionId:{${sessionId}}`
        )
      ).documents;
  
      // console.log(Date.now() - startTime);
  
      const jsonOrdersType: RetreveKotJson[] = jsonOrders;
  
      const disheshInfo = (
        await this.prisma.restaurant.findUnique({
          where: {
            id: payload.restaurantId,
          },
          select: {
            dishesh: true,
          },
        })
      )?.dishesh;
  
      // console.log(Date.now() - startTime);
  
      const getOrderPrice_impure = (order: NewOrderType) => {
        const dish = disheshInfo.find((dish) => dish.id === order.dishId);
  
        const fullQuantity = order.fullQuantity,
          halfQuantity = order.halfQuantity,
          size = order?.size;
  
        let returnPrice = 0;
  
        returnPrice = (fullQuantity || 0) * (dish?.price?.[size]?.full || 0);
        returnPrice += (halfQuantity || 0) * (dish?.price?.[size]?.half || 0);
  
        return returnPrice;
      };
  
      let promiseContainer = [];
  
      let totalBilled = 0;
  
      for (const kot of jsonOrdersType) {
        const { id, value } = kot;
  
        const kotLogPromise = this.prisma.kotLog.create({
          data: {
            createdAt: new Date(parseInt(value.createdAt)),
            orderedBy: value.orderedBy === "self" ? "self" : "waiter",
            tableNumber: parseInt(value.tableNumber),
            chefId: value?.chefAssign || null,
            sessionLogsId: value.sessionId,
            waiterId: value?.orderedBy === "self" ? null : value?.orderedBy,
            tableId: value.tableSectionId,
            restaurantId: payload.restaurantId,
          },
          select: {
            id: true,
          },
        });
  
        const deleteKotPromise = redisClient.DEL(kot.id);
  
        const [kotLog, expireKot] = await Promise.all([
          kotLogPromise,
          deleteKotPromise,
        ]);
  
        // console.log(Date.now() - startTime);
  
        for (const order of kot.value.orders) {
          const createKotOrderPromise = this.prisma.kotOrder.create({
            data: {
              dateTime: new Date(order.createdAt),
              dishId: order.dishId,
              kotLogId: kotLog.id,
              size: order.size,
              cost: getOrderPrice_impure(order),
              fullQuantity: order?.fullQuantity || null,
              halfQuantity: order?.halfQuantity || null,
              restaurantId: order.restaurantId,
              tableId: order.tableSectionId,
              tableNumber: order.tableNumber,
              user_description: order.user_description,
              orderBy: value.orderedBy === "self" ? "self" : "waiter",
              waiterId: value?.orderedBy === "self" ? null : value?.orderedBy,
              chefId: value?.chefAssign || null,
              sessionLogsId: value.sessionId,
            },
          });
          const createDishDataPromise = this.prisma.dishData.create({
            data: {
              dishId: order.dishId,
              DishSize: order.size,
              cost: getOrderPrice_impure(order),
              fullQuantity: order?.fullQuantity || null,
              halfQuantity: order?.halfQuantity || null,
              dateOfOrder: new Date(order.createdAt),
              restaurantId: order.restaurantId,
            },
          });
  
          totalBilled += getOrderPrice_impure(order);
  
          promiseContainer = [
            ...promiseContainer,
            createDishDataPromise,
            createKotOrderPromise,
            // restaurantRevenueCreatePromise,
          ];
        }
      }
  
      const restaurantRevenueCreatePromise = this.prisma.restaurantRevenue.create(
        {
          data: {
            restaurantId: payload.restaurantId,
            revenueGenerated: totalBilled,
          },
        },
      );
  
      promiseContainer = [...promiseContainer, restaurantRevenueCreatePromise];
  
      // let deleteCartPromiseContainer = [];
  
      // delete cart
      const cartData = (
        await redisClient.ft.search(
          redisConstants.restaurantCartIndex,
          `@sessionId:{${sessionId}}`,
          {
            LIMIT: {
              from: 0,
              size: 1000,
            },
          },
        )
      ).documents;
  
      // console.log(Date.now() - startTime);
  
      for (const x of cartData) {
        promiseContainer = [...promiseContainer, redisClient.DEL(x.id)];
      }
  
      // await Promise.all(deleteCartPromiseContainer);
  
      // detach session from table
      const detachSessionFromTablePromise = redisClient.HDEL(
        redisConstants.tablesStatusKey(payload.restaurantId),
        redisConstants.tableSessionKeyForTablesStatus(
          tableSectionId,
          tableNumber,
        ),
      );
  
      promiseContainer = [...promiseContainer, detachSessionFromTablePromise];
  
      await Promise.all(promiseContainer);
  
      // console.log(Date.now() - startTime);
  
      // mqtt publish
      mqttPublish.sessionStartConfirmation(
        payload.restaurantId,
        createSessionDto.tableSectionId,
        createSessionDto.tableNumber,
        null,
      );
      // delete kot
  
      // console.log(Date.now() - startTime);
  
      return constants.OK;
    } */

  async clearSession(
    deleteSessionDto: DeleteSessionDto,
    payload: JwtPayload_restaurantId,
    sessionId: string,
  ) {
    const { tableNumber, tableSectionId, modeOfIncome } = deleteSessionDto;

    const tableSessionIdFromTableInfo =
      await redisGetFunction.sessionIdFromTableInfo(
        payload.restaurantId,
        tableSectionId,
        tableNumber,
      );

    if (tableSessionIdFromTableInfo !== redisConstants.sessionKey(sessionId))
      throw new ConflictException("Invalid Session");

    /*  all checks completed  */


    /* below code is loading required data */

    let totalRevenue = 0;


    const allDish = (await this.prisma.restaurant.findUnique({
      where: {
        id: payload.restaurantId
      },
      select: {
        dishesh: {
          select: {
            id: true, price: true
          }
        }
      }
    }))?.dishesh;

    const jsonOrders = (
      await redisGetFunction.getOrdersFromSessionId(sessionId)
    ).documents;


    const cartItemRedisKey: string[] = [];
    // (async () => {
    const cartItems = (await redisGetFunction.getCartItemsFromSessionId(sessionId)).documents


    cartItems.forEach(item => {
      cartItemRedisKey.push(item.id)
    })
    // })()


    /* all informatin is loaded now action performance code below */


    const getDishCost_Impure = (order: OrderReturnFromRedis, halfOrFull: 'half' | 'full') => {
      const { dishId, size } = order

      const selectDish = allDish.find(dish => dish.id === dishId)

      const price = selectDish.price[size][halfOrFull]

      switch (halfOrFull) {
        case 'full':
          totalRevenue = totalRevenue + price * parseInt(order?.['fullQuantity'] || '0')
          break;

        case 'half':
          totalRevenue = totalRevenue + price * parseInt(order?.['halfQuantity'] || '0')
          break
      }

      return price

    }

    const orderRedisKey: string[] = []

    let dishDataCreateManyPromise: Prisma.PrismaPromise<Prisma.BatchPayload> | undefined;

    if (jsonOrders.length > 0) {
      dishDataCreateManyPromise = this.prisma.dishData.createMany({
        data: jsonOrders.map(item => {
          orderRedisKey.push(item.id)
          return {
            dishId: item.value.dishId,
            fullQuantity: parseInt(item?.value?.fullQuantity || '0'),
            halfQuantity: parseInt(item?.value?.halfQuantity || '0'),
            dateOfOrder: new Date(parseInt(item.value.createdAt)),
            restaurantId: payload.restaurantId,
            dishSize: item.value.size,
            revenueFull: getDishCost_Impure(item.value, 'full'),
            revenueHalf: getDishCost_Impure(item.value, 'half')
          }
        })
      })
    }




    let createRestaurantRevenue;
    if (totalRevenue > 0) {
      createRestaurantRevenue = this.prisma.restaurantRevenue.create({
        data: {
          revenueGenerated: totalRevenue,
          restaurantId: payload.restaurantId,
          modeOfIncome
        }
      })
    }



    const redisDeleteKey = redisClient.del([...cartItemRedisKey, ...orderRedisKey])

    const removeTableStatus = redisClient.HDEL(redisConstants.tablesStatusKey(payload.restaurantId), redisConstants.tableSessionKeyForTablesStatus(tableSectionId, tableNumber))


    try {
      await Promise.all([dishDataCreateManyPromise, createRestaurantRevenue, redisDeleteKey, removeTableStatus])

      mqttPublish.sessionStartConfirmation(
        payload.restaurantId,
        tableSectionId,
        tableNumber,
        null,
      );
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException()
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
