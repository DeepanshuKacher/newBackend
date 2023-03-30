import { redisConstants } from "../../constants";
import { redisClient } from "../../redisClient";
import {
  getOrdersObjectFromSessionUUID,
  getTableInfoFromSessionUUID,
} from "./getFunctions";

export const redisGetFunction = {
  getOrder: (orderUUID: string) =>
    redisClient.HGETALL(redisConstants.orderKey(orderUUID)),

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
};
