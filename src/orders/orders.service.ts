import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { JwtPayload_restaurantId } from "src/Interfaces";
import {
  constants,
  mqttPublish,
  orderConstants,
  redisClient,
  redisConstants,
  redisGetFunction,
  redis_create_Functions,
  redis_update_functions,
} from "src/useFullItems";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-orderStatus.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { DateTime } from "luxon";
import { DeleteOrderDto } from "./dto/delete-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createOrderDto: CreateOrderDto,
    payload: JwtPayload_restaurantId,
  ) {
    const {
      dishId,
      tableNumber,
      tableSectionId,
      user_description,
      sessionId,
      size,
      fullQuantity,
      halfQuantity,
    } = createOrderDto;

    if (!(fullQuantity || halfQuantity)) throw new ForbiddenException();

    const sessionIdFromRedis = await redisGetFunction.sessionIdFromTableInfo(
      payload.restaurantId,
      tableSectionId,
      tableNumber,
    );

    if (!sessionIdFromRedis) throw new ConflictException();

    if (sessionIdFromRedis !== redisConstants.sessionKey(sessionId))
      throw new ConflictException();

    const orderId = randomUUID(),
      currentDate = DateTime.now().setZone(constants.IndiaTimeZone).toISO();

    const createOrderPromis = redis_create_Functions.createOrder({
      dishId,
      orderedBy: payload.userId,
      orderId,
      size,
      tableNumber,
      tableSectionId,
      fullQuantity,
      halfQuantity,
      user_description,
      createdAt: currentDate,
    });

    const pushOrderToTableSessionPromis = redis_create_Functions.tableSession(
      sessionId,
      orderId,
    );

    const pushOrderToRestaurantContainerPromis =
      redis_create_Functions.restaurantRealtimeOrdersContainer(
        payload.restaurantId,
        orderId,
      );

    const createKotPromise = redis_create_Functions.kot(orderId, [
      redisConstants.orderKey(orderId),
    ]);

    const pushKotToRestaurantContainerPromise =
      redis_create_Functions.restaurantKotContainerPush(
        payload.restaurantId,
        redisConstants.kot_key(orderId),
      );

    try {
      const [
        createOrder,
        pushOrderToTableSession,
        pushOrderToRestaurantContainer,
      ] = await Promise.all([
        createOrderPromis,
        pushOrderToTableSessionPromis,
        pushOrderToRestaurantContainerPromis,
        createKotPromise,
        pushKotToRestaurantContainerPromise,
      ]);

      mqttPublish.dishOrder({
        dishId,
        orderedBy: payload.userId,
        orderId,
        restaurantId: payload.restaurantId,
        sessionId,
        size,
        tableNumber,
        tableSectionId,
        fullQuantity,
        halfQuantity,
        user_description,
        createdAt: currentDate,
        orderNo: pushOrderToRestaurantContainer,
      });

      return constants.OK;
    } catch (error) {
      if (constants.IS_DEVELOPMENT) console.log(error);
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }

  async findAll(payload: JwtPayload_restaurantId) {
    const restaurantOrderPromisYesterday = redisClient.LRANGE(
      redisConstants.restaurantRealtimeOrdersContainer_Yesterday_Key(
        payload.restaurantId,
      ),
      0,
      -1,
    );

    const restaurantOrderPromisToday = redisClient.LRANGE(
      redisConstants.restaurantRealtimeOrdersContainer_Today_Key(
        payload.restaurantId,
      ),
      0,
      -1,
    );

    // console.log({
    //   key: redisConstants.restaurantRealtimeOrdersContainer_Today_Key(
    //     payload.restaurantId,
    //   ),
    // });

    const [restaurantOrderDataToday, restaurantOrderDataYesterday] =
      await Promise.all([
        restaurantOrderPromisToday,
        restaurantOrderPromisYesterday,
      ]);

    const todaysOrdersPromis = [];
    const yesterDaysOrdersPromis = [];

    for (let x of restaurantOrderDataToday) {
      todaysOrdersPromis.push(redisClient.HGETALL(x));
    }
    for (let x of restaurantOrderDataYesterday) {
      yesterDaysOrdersPromis.push(redisClient.HGETALL(x));
    }

    const todaysOrders = await Promise.all(todaysOrdersPromis);
    const yesterDaysOrders = await Promise.all(yesterDaysOrdersPromis);

    return yesterDaysOrders.concat(todaysOrders);
  }

  async acceptOrder(
    payload: JwtPayload_restaurantId,
    dto: UpdateOrderStatusDto,
  ) {
    const setChef = await redisClient.HSETNX(
      redisConstants.orderKey(dto.orderId),
      orderConstants.chefAssign,
      payload.userId,
    );

    if (!setChef) throw new ConflictException();

    mqttPublish.acceptOrder(
      payload.restaurantId,
      dto.tableNumber,
      dto.tableSectionId,
      dto.orderId,
      payload.userId,
    );

    return constants.OK;
  }

  async rejectOrder(
    payload: JwtPayload_restaurantId,
    dto: UpdateOrderStatusDto,
  ) {
    const chefAssign = await redisClient.HGET(
      redisConstants.orderKey(dto.orderId),
      orderConstants.chefAssign,
    );

    if (chefAssign !== payload.userId) throw new ForbiddenException();

    await redisClient.HDEL(
      redisConstants.orderKey(dto.orderId),
      orderConstants.chefAssign,
    );

    mqttPublish.rejectOrder(
      payload.restaurantId,
      dto.tableNumber,
      dto.tableSectionId,
      dto.orderId,
    );
  }
  async completeOrder(
    payload: JwtPayload_restaurantId,
    dto: UpdateOrderStatusDto,
  ) {
    const chefAssign = await redisClient.HGET(
      redisConstants.orderKey(dto.orderId),
      orderConstants.chefAssign,
    );

    if (chefAssign !== payload.userId) throw new ForbiddenException();

    const value = await redisClient.HSETNX(
      redisConstants.orderKey(dto.orderId),
      orderConstants.completed,
      orderConstants.completed,
    );

    if (!value) throw new ConflictException("Already Completed");

    mqttPublish.completeOrder(
      payload.restaurantId,
      dto.tableNumber,
      dto.tableSectionId,
      dto.orderId,
    );
  }

  getOrder_logs(payload: JwtPayload_restaurantId) {
    switch (payload.userType) {
      case "Waiter":
        return this.prisma.ordersLogs.findMany({
          where: {
            waiterId: payload.userId,
          },
          include: {
            SessionLogs: {
              select: {
                tableNumber: true,
                tableId: true,
              },
            },
          },
          orderBy: {
            orderTimeStamp: "desc",
          },
        });

      case "Chef":
        return this.prisma.ordersLogs.findMany({
          where: {
            chefId: payload.userId,
          },
          include: {
            SessionLogs: {
              select: {
                tableNumber: true,
                tableId: true,
              },
            },
          },
          orderBy: {
            orderTimeStamp: "desc",
          },
        });
    }
  }

  async deleteOrder(dto: DeleteOrderDto) {
    const { orderId, sessionId } = dto;
    // const sessionOrders = await redisGetFunction.orderKeysArrayFromSessionUUID(
    //   sessionId,
    // );

    await redisClient.lRem(
      redisConstants.sessionKey(sessionId),
      1,
      redisConstants.orderKey(orderId),
    );

    return constants.OK;

    // console.log({ sessionOrders, orderId: redisConstants.orderKey(orderId) });
  }
  async updateOrder(dto: UpdateOrderDto) {
    const { orderId, fullQuantity, halfQuantity } = dto;

    if (fullQuantity)
      // const fullQuantityUpdate =
      await redis_update_functions.updateOrderQuantity(
        orderId,
        "fullQuantity",
        fullQuantity,
      );

    if (halfQuantity)
      // const halfQuantityUpdate =
      await redis_update_functions.updateOrderQuantity(
        orderId,
        "halfQuantity",
        halfQuantity,
      );

    // await Promise.all([fullQuantityUpdatePromis, halfQuantityUpdatePromis]);

    return constants.OK;
  }
}
