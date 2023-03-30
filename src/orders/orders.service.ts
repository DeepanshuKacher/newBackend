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
} from "src/useFullItems";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-orderStatus.dto";
import { PrismaService } from "src/prisma/prisma.service";

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
      currentDate = new Date().toISOString();

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

    try {
      const [
        createOrder,
        pushOrderToTableSession,
        pushOrderToRestaurantContainer,
      ] = await Promise.all([
        createOrderPromis,
        pushOrderToTableSessionPromis,
        pushOrderToRestaurantContainerPromis,
      ]);

      console.log({ pushOrderToRestaurantContainer });

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
        return this.prisma.order_Logs.findMany({
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
        return this.prisma.order_Logs.findMany({
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
}
