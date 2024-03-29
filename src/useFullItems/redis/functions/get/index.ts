import { OrderReturnFromRedis } from "src/Interfaces";
import { redisConstants } from "../../constants";
import { redisClient } from "../../redisClient";
import {
  getCartItemsFromSessionId,
  getOrdersFromSessionId,
  getOrdersObjectFromSessionUUID,
  getTableInfoFromSessionUUID,
  kotContainerItemsKey_Today,
  kotContainerItemsKey_YesterDay,
  orderKeysFromKot,
  ordersKeyFromKotContainer,
} from "./getFunctions";

export const redisGetFunction = {
  getOrder: (orderId: string): Promise<OrderReturnFromRedis | undefined> => {
    const temp: any = redisClient.HGETALL(redisConstants.orderKey(orderId));
    return temp
  },

  restaurantTableStatus: (restaurantId: string) =>
    redisClient.HGETALL(redisConstants.tablesStatusKey(restaurantId)),

  cartSession: (tableSessionId: string) =>
    redisClient.LRANGE(redisConstants.cartSessionKey(tableSessionId), 0, -1),

  orderKeysArrayFromSessionUUID: (sessionUUID: string) =>
    redisClient.LRANGE(redisConstants.sessionKey(sessionUUID), 0, -1),

  sessionIdFromTableInfo: (
    restaurantId: string,
    tableSectionId: string,
    tableNumber: number,
  ) =>
    redisClient.HGET(
      redisConstants.tablesStatusKey(restaurantId),
      redisConstants.tableSessionKeyForTablesStatus(
        tableSectionId,
        tableNumber,
      ),
    ),

  getOrdersObjectFromSessionUUID,

  getTableInfoFromSessionUUID,

  orderKeysFromKot,

  ordersKeyFromKotContainer,

  kotContainerItemsKey_Today,

  kotContainerItemsKey_YesterDay,

  getCartItemsFromSessionId,

  getOrdersFromSessionId

};
