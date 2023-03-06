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
  redis_create_Functions,
} from "src/useFullItems";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-orderStatus.dto";

@Injectable()
export class OrdersService {
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

    const orderId = randomUUID();

    const createOrder = redis_create_Functions.createOrder({
      dishId,
      orderedBy: payload.userId,
      orderId,
      size,
      tableNumber,
      tableSectionId,
      fullQuantity,
      halfQuantity,
      user_description,
    });

    const pushOrderToTableSession = redis_create_Functions.tableSession(
      sessionId,
      orderId,
    );

    const pushOrderToRestaurantContainer =
      redis_create_Functions.restaurantRealtimeOrdersContainer(
        payload.restaurantId,
        orderId,
      );

    try {
      await Promise.all([
        createOrder,
        pushOrderToTableSession,
        pushOrderToRestaurantContainer,
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
    const restaurantOrderPromisToday = redisClient.LRANGE(
      redisConstants.restaurantRealtimeOrdersContainer_Yesterday_Key(
        payload.restaurantId,
      ),
      0,
      -1,
    );

    const restaurantOrderPromisYesterday = redisClient.LRANGE(
      redisConstants.restaurantRealtimeOrdersContainer_Today_Key(
        payload.restaurantId,
      ),
      0,
      -1,
    );

    const [restaurantOrderDataToday, restaurantOrderDataYesterday] =
      await Promise.all([
        restaurantOrderPromisToday,
        restaurantOrderPromisYesterday,
      ]);

    const restaurantOrder = [
      ...restaurantOrderDataToday,
      ...restaurantOrderDataYesterday,
    ];

    const ordersPromis = [];

    for (let x of restaurantOrder) {
      ordersPromis.push(redisClient.HGETALL(x));
    }

    return Promise.all(ordersPromis);
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
}
