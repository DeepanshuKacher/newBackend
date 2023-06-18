import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { CreateOrderDto } from "src/orders/dto/create-order.dto";
import {
  redis_create_Functions,
  constants,
  redisGetFunction,
  redisConstants,
  redisClient,
  mqttPublish,
  Order,
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

    const orderId = constants.workerTokenGenerator(16);

    // const createOrder = redis_create_Functions.createOrder({
    //   dishId,
    //   orderId,
    //   tableNumber,
    //   tableSectionId,
    //   user_description,
    //   size,
    //   fullQuantity,
    //   halfQuantity,
    //   orderedBy: payload.userId,
    //   createdAt: DateTime.now().setZone(constants.IndiaTimeZone).toISO(),
    // });

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
        // cart: 1,
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

    // console.log(cartOrders);

    // const promises = [];

    // for (let x of cartOrders) {
    //   promises.push(redisClient.HGETALL(x));
    // }

    // return Promise.all(promises);
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

    // const orderKeys: string[] = [];

    // const selectedOrderPromis = [];

    // for (let x of cartOrder) {
    //   selectedOrderPromis.push(redisGetFunction.getOrder(x));
    // }

    // for (let x of cartOrder) {
    //   orderKeys.push(redisConstants.orderKey(x));
    // }

    // const cartOrders = await redisGetFunction.cartSession(tableSessionId);

    // for (let x of cartOrder) {
    //   if (!cartOrders.includes(redisConstants.orderKey(x)))
    //     throw new ConflictException();
    // }

    // const pushOrderToTableSessionPromis = redisClient.RPUSH(
    //   redisConstants.sessionKey(tableSessionId),
    //   orderKeys,
    // );

    // const pushOrderToRestaurantContainerPromis = redisClient.RPUSH(
    //   redisConstants.restaurantRealtimeOrdersContainer_Today_Key(
    //     payload.restaurantId,
    //   ),
    //   orderKeys,
    // );

    // const randomUUID_forKot = constants.workerTokenGenerator(16);

    // const createKotPromise = redis_create_Functions.kot(
    //   randomUUID_forKot,
    //   cartOrders,
    // );

    // const pushKotToRestaurantContainerPromise =
    //   redis_create_Functions.restaurantKotContainerPush(
    //     payload.restaurantId,
    //     redisConstants.kot_key(randomUUID_forKot),
    //   );

    try {
      // const [pushOrderToTableSession, pushOrderToRestaurantContainer] =
      //   await Promise.all([
      //     pushOrderToTableSessionPromis,
      //     pushOrderToRestaurantContainerPromis,
      //     createKotPromise,
      //     pushKotToRestaurantContainerPromise,
      //   ]);

      // console.log({ cartOrder });

      const promiseContainer: Promise<{ [x: string]: string }>[] = [];

      for (let x of cartOrder) {
        promiseContainer.push(redisClient.HGETALL(x));
      }

      const temp: any = await Promise.all(promiseContainer);

      const cartContainer: {
        size: OrderProps["size"];
        fullQuantity: string;
        halfQuantity: string;
        user_description: string;
        // cart: string;
        sessionId: string;
        orderedBy: string;
        tableSectionId: string;
        tableNumber: string;
        restaurantId: string;
        dishId: string;
        orderId: string;
      }[] = temp;

      const createdAt = Date.now();
      const kotId = constants.workerTokenGenerator(16);

      const createOrderFromCartPromise = redis_create_Functions.createOrder({
        createdAt,
        kotId,
        orderedBy: cartContainer[0].orderedBy,
        restaurantId: cartContainer[0].restaurantId,
        sessionId: cartContainer[0].sessionId,
        tableNumber,
        tableSectionId,
        chefAssign: "",
        orders: cartContainer.map((cartItem) => ({
          ...cartItem,
          createdAt,
          chefAssign: "",
          kotId,
          completed: 0,
          fullQuantity: parseInt(cartItem.fullQuantity),
          halfQuantity: parseInt(cartItem.halfQuantity),
          tableNumber: parseInt(cartItem.tableNumber),
        })),
      });

      const deleteItemsPromise = redisClient.DEL(cartOrder);

      await Promise.all([createOrderFromCartPromise, deleteItemsPromise]);

      // return constants.OK;

      // --------- delete cart order ---------

      // await redisClient.DEL(redisConstants.cartSessionKey(tableSessionId));

      // const newOrder = cartOrders.filter((item) => !orderKeys.includes(item));

      // const selectedOrder: Order[] = await Promise.all(selectedOrderPromis);

      mqttPublish.dishOrder({
        id: `kot:${kotId}`,
        value: {
          chefAssign: "",
          completed: 0,
          createdAt,
          kotId,
          orderedBy: payload?.userId || "self",
          restaurantId: payload.restaurantId,
          sessionId: tableSessionId,
          tableNumber,
          tableSectionId,
          orders: cartContainer.map((cartItem) => ({
            ...cartItem,
            createdAt,
            chefAssign: "",
            kotId,
            completed: 0,
            fullQuantity: parseInt(cartItem.fullQuantity),
            halfQuantity: parseInt(cartItem.halfQuantity),
            tableNumber: parseInt(cartItem.tableNumber),
          })),
        },
      });

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
    const { cartOrder, tableSessionId } = dto;

    const deleteOrderKeyObject = {};
    const orderKeys = cartOrder.map((orderUUID) => {
      const key = redisConstants.orderKey(orderUUID);
      deleteOrderKeyObject[key] = key;
      return key;
    });

    const ordersInCart = await redisGetFunction
      .cartSession(tableSessionId)
      // .then((orderKeysArray) =>
      // orderKeysArray.filter((orderKey) => !orderKeyObject[orderKey]),
      // )
      .catch((error) => {
        console.log(error);
        throw new InternalServerErrorException();
      });

    const ordersInCartObject =
      functionsObject.arrayToObject<string>(ordersInCart);

    for (let x in deleteOrderKeyObject) {
      if (!ordersInCartObject[x]) throw new ConflictException();
    }

    const preserveOrderKeys: string[] = [];

    for (let x in ordersInCartObject) {
      if (!deleteOrderKeyObject[x]) preserveOrderKeys.push(x);
    }

    const deleteCart = redisClient.DEL(
      redisConstants.cartSessionKey(tableSessionId),
    );

    const deleteOrders = redisClient.DEL(orderKeys);

    try {
      if (preserveOrderKeys.length > 0) {
        const createCartSession = redisClient.RPUSH(
          redisConstants.cartSessionKey(tableSessionId),
          preserveOrderKeys,
        );
        await Promise.all([deleteCart, deleteOrders, createCartSession]);
      } else {
        await Promise.all([deleteCart, deleteOrders]);
      }
      return constants.OK;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}
