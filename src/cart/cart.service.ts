import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { JwtPayload_restaurantId } from "src/Interfaces";
import { CreateOrderDto } from "src/orders/dto/create-order.dto";
import {
  redis_create_Functions,
  constants,
  redisGetFunction,
  redisConstants,
  redisClient,
  mqttPublish,
} from "src/useFullItems";
import { CartToOrderDTO } from "./dto/cart-to-order.dto";
import { DeleteCartOrderDTO } from "./dto/delete-cart-order.dto";

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

    const orderId = randomUUID();

    const createOrder = redis_create_Functions.createOrder({
      dishId,
      orderId,
      tableNumber,
      tableSectionId,
      user_description,
      size,
      fullQuantity,
      halfQuantity,
      orderedBy: payload.userId,
    });

    const pushOrderToCartSession = redis_create_Functions.cartSession(
      sessionId,
      orderId,
    );

    // const pushOrderToRestaurantContainer = redisClient.LPUSH(
    //   redisConstants.restaurantRealtimeOrdersContainerKey(payload.restaurantId),
    //   redisConstants.orderKey(orderId),
    // );

    try {
      await Promise.all([
        createOrder,
        pushOrderToCartSession,
        // pushOrderToRestaurantContainer,
      ]);

      // mqttPublish.dishOrder({
      //   dishId,
      //   orderedBy: payload.userId,
      //   orderId,
      //   restaurantId: payload.restaurantId,
      //   sessionId,
      //   size,
      //   tableNumber,
      //   tableSectionId,
      //   fullQuantity,
      //   halfQuantity,
      //   user_description,
      // });

      return constants.OK;
    } catch (error) {
      if (constants.IS_DEVELOPMENT) console.log(error);
      throw new InternalServerErrorException(constants.InternalError, {
        cause: error,
      });
    }
  }

  async findCardOrders(sessionUUID: string) {
    const cartOrders = await redisGetFunction.cartSession(sessionUUID);

    const promises = [];

    for (let x of cartOrders) {
      promises.push(redisClient.HGETALL(x));
    }

    return Promise.all(promises);
  }

  async convertCartItemToOrder(
    payload: JwtPayload_restaurantId,
    dto: CartToOrderDTO,
  ) {
    const { cartOrder, tableNumber, tableSessionId, tableSectionId } = dto;
    const orderKeys: string[] = [];

    const selectedOrderPromis = [];

    for (let x of cartOrder) {
      selectedOrderPromis.push(redisGetFunction.getOrder(x));
    }

    for (let x of cartOrder) {
      orderKeys.push(redisConstants.orderKey(x));
    }

    const cartOrders = await redisGetFunction.cartSession(tableSessionId);

    for (let x of cartOrder) {
      if (!cartOrders.includes(redisConstants.orderKey(x)))
        throw new ConflictException();
    }

    const pushOrderToTableSessionPromis = redisClient.RPUSH(
      redisConstants.sessionKey(tableSessionId),
      orderKeys,
    );

    const pushOrderToRestaurantContainerPromis = redisClient.RPUSH(
      redisConstants.restaurantRealtimeOrdersContainer_Today_Key(
        payload.restaurantId,
      ),
      orderKeys,
    );
    try {
      await Promise.all([
        pushOrderToTableSessionPromis,
        pushOrderToRestaurantContainerPromis,
      ]);

      // console.log(selectedOrderPromis);

      await redisClient.DEL(redisConstants.cartSessionKey(tableSessionId));

      const newOrder = cartOrders.filter((item) => !orderKeys.includes(item));

      const selectedOrder = await Promise.all(selectedOrderPromis);

      mqttPublish.cardDishOrder({
        restaurantId: payload.restaurantId,
        tableNumber: tableNumber,
        tableSectionId: tableSectionId,
        orderArray: selectedOrder,
      });

      if (newOrder.length > 0)
        await redisClient.RPUSH(
          redisConstants.cartSessionKey(tableSessionId),
          newOrder,
        );

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

    const orderKeyObject = {};
    const orderKeys = cartOrder.map((orderUUID) => {
      const key = redisConstants.orderKey(orderUUID);
      orderKeyObject[key] = key;
      return key;
    });

    const preserveOrderKeys = await redisGetFunction
      .cartSession(tableSessionId)
      .then((orderKeysArray) =>
        orderKeysArray.filter((orderKey) => !orderKeyObject[orderKey]),
      )
      .catch((error) => {
        console.log(error);
        throw new InternalServerErrorException();
      });

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
