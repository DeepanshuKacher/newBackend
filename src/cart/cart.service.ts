import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import {
  CartItem,
  CartItemRedisReturn,
  JwtPayload_restaurantId,
} from "src/Interfaces";
import { CreateOrderDto } from "src/orders/dto/create-order.dto";
import {
  redis_create_Functions,
  constants,
  redisGetFunction,
  redisConstants,
  redisClient,
  mqttPublish,
  functionsObject,
  NewOrderType,
  OrderProps,
} from "src/useFullItems";
import { CartToOrderDTO } from "./dto/cart-to-order.dto";
import { DeleteCartOrderDTO } from "./dto/delete-cart-order.dto";
import { DateTime } from "luxon";

@Injectable()
export class CartService {
  async addToCart(
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

    // const pushOrderToCartSession = redis_create_Functions.cartSession(
    //   sessionId,
    //   orderId,
    // );

    try {
      // await Promise.all([createOrder, pushOrderToCartSession]);

      const orderId = constants.workerTokenGenerator(16);

      await redis_create_Functions.createCartOrder({
        dishId,
        fullQuantity: fullQuantity || 0,
        halfQuantity: halfQuantity || 0,
        orderedBy: payload?.userId || "self",
        orderId,
        restaurantId: payload.restaurantId,
        sessionId,
        size,
        tableNumber,
        tableSectionId,
        user_description,
        // createdAt: Date.now(),
      });

      return constants.OK;
    } catch (error) {
      if (constants.IS_DEVELOPMENT) console.log(error);
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }

  async findCardOrders(sessionUUID: string) {
    // const cartOrders = await redisGetFunction.cartSession(sessionUUID);

    return (
      await redisClient.ft.search(
        redisConstants.restaurantCartIndex,
        `@sessionId:{${sessionUUID}}`,
        {
          SORTBY: {
            BY: "createdAt",
            DIRECTION: "ASC",
          },
          LIMIT: {
            from: 0,
            size: 1000,
          },
        },
      )
    )?.documents;
  }

  async convertCartItemToOrder(
    payload: JwtPayload_restaurantId,
    dto: CartToOrderDTO,
  ) {
    const { cartOrder, tableNumber, tableSessionId, tableSectionId } = dto;

    const sessionIdFromRedis = await redisGetFunction.sessionIdFromTableInfo(
      payload.restaurantId,
      tableSectionId,
      tableNumber,
    );

    if (!sessionIdFromRedis) throw new ConflictException();

    if (sessionIdFromRedis !== redisConstants.sessionKey(tableSessionId))
      throw new ConflictException();

    try {
      const promiseContainer: Promise<{ [x: string]: string }>[] = [];

      for (const x of cartOrder) {
        promiseContainer.push(redisClient.HGETALL(x));
      }

      const temp: any = await Promise.all(promiseContainer);

      const cartContainer: CartItemRedisReturn[] = temp;

      const createdAt = Date.now();
      const kotId = constants.workerTokenGenerator(16);

      const kotCount = await redisClient.INCR(`${payload.restaurantId}:kotCount`);

      const makeOrderPromiseContainer = cartContainer.map((item) => {
        const {
          dishId,
          fullQuantity,
          halfQuantity,
          orderId,
          orderedBy,
          restaurantId,
          sessionId,
          size,
          tableNumber,
          tableSectionId,
          chefAssign,
          completed,
          user_description,
        } = item;

        return redis_create_Functions.createOrder({
          createdAt: createdAt,
          dishId,
          fullQuantity: parseInt(fullQuantity),
          halfQuantity: parseInt(halfQuantity),
          kotId,
          orderedBy,
          orderId,
          restaurantId,
          sessionId,
          size,
          tableNumber: parseInt(tableNumber),
          tableSectionId,
          chefAssign,
          completed,
          user_description,
          kotCount,
          printCount: 1,
        });
      });

      await Promise.all(makeOrderPromiseContainer);

      await redisClient.DEL(cartOrder);

      // return constants.OK;

      // --------- delete cart order ---------

      // await redisClient.DEL(redisConstants.cartSessionKey(tableSessionId));

      // const newOrder = cartOrders.filter((item) => !orderKeys.includes(item));

      // const selectedOrder: Order[] = await Promise.all(selectedOrderPromis);

      mqttPublish.dishOrder(
        cartContainer.map((item) => {
          const {
            // createdAt,
            dishId,
            fullQuantity,
            halfQuantity,
            orderId,
            orderedBy,
            restaurantId,
            sessionId,
            size,
            tableNumber,
            tableSectionId,
            chefAssign,
            completed,
            user_description,
          } = item;
          return {
            createdAt: createdAt,
            dishId,
            fullQuantity: parseInt(fullQuantity),
            halfQuantity: parseInt(halfQuantity),
            kotId,
            orderedBy,
            orderId,
            restaurantId,
            sessionId,
            size,
            tableNumber: parseInt(tableNumber),
            tableSectionId,
            chefAssign,
            completed,
            user_description,
            kotCount,
            printCount: 1,
          };
        }),
      );

      // if (newOrder.length > 0)
      //   await redisClient.RPUSH(
      //     redisConstants.cartSessionKey(tableSessionId),
      //     newOrder,
      //   );

      return constants.OK;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }

  async deleteCartOrder(dto: DeleteCartOrderDTO) {
    const { cartOrder } = dto;

    let promiseContainer = [];

    for (const x of cartOrder) {
      promiseContainer = [...promiseContainer, redisClient.DEL(x)];
    }

    try {
      await Promise.all(promiseContainer);

      return constants.OK;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}
