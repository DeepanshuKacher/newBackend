import { redisClient } from "../redisClient";
import {
  orderConstants,
  redisConstants,
  redisKeyExpiry,
  dayTracker,
} from "../constants";

enum Size {
  Large = "Large",
  Medium = "Medium",
  Small = "Small",
}

export type Order = {
  dishId: string;
  orderId: string;
  tableNumber: string;
  tableSectionId: string;
  user_description?: string;
  orderedBy: string;
  size: Size;
  fullQuantity?: string;
  halfQuantity?: string;
  chefAssign?: string;
  completed?: string;
  createdAt?: string;
};

export interface OrderProps
  extends Omit<Order, "tableNumber" | "fullQuantity" | "halfQuantity"> {
  tableNumber: number;
  fullQuantity?: number;
  halfQuantity?: number;
}

export const redis_create_Functions = {
  tableSession: (sessionUUID: string, orderId: string) =>
    redisClient.RPUSH(
      redisConstants.sessionKey(sessionUUID),
      redisConstants.orderKey(orderId),
    ),

  restaurantRealtimeOrdersContainer: (restaurantId: string, orderId: string) =>
    redisClient
      .LPUSH(
        redisConstants.restaurantRealtimeOrdersContainer_Today_Key(
          restaurantId,
        ),
        redisConstants.orderKey(orderId),
      )
      .then(async (response) => {
        if (response === 1)
          await redisClient.EXPIRE(
            redisConstants.restaurantRealtimeOrdersContainer_Today_Key(
              restaurantId,
            ),
            redisKeyExpiry.restaurantRealtimeOrdersContainerKey,
            "NX",
          );

        return response;
      }),

  createOrder: (props: OrderProps) =>
    redisClient
      .HSET(redisConstants.orderKey(props.orderId), [
        orderConstants.dishId,
        props.dishId,
        orderConstants.orderId,
        props.orderId,
        orderConstants.tableNumber,
        props.tableNumber,
        orderConstants.tableSectionId,
        props.tableSectionId,
        orderConstants.user_description,
        props.user_description,
        orderConstants.orderedBy,
        props.orderedBy,
        orderConstants.size,
        props.size,
        orderConstants.fullQuantity,
        props.fullQuantity || 0,
        orderConstants.halfQuantity,
        props.halfQuantity || 0,
        orderConstants.createdAt,
        new Date().toISOString(),
      ])
      .then(() =>
        redisClient.EXPIRE(
          redisConstants.orderKey(props.orderId),
          redisKeyExpiry.orderKey,
          "NX",
        ),
      ),

  tableStatus: (
    restaurantId: string,
    tableSectionId: string,
    tableNumber: number,
    uuid: string,
  ) =>
    redisClient.HSET(
      redisConstants.tablesStatusKey(restaurantId),
      redisConstants.tableSessionKeyForTablesStatus(
        tableSectionId,
        tableNumber,
      ),
      redisConstants.sessionKey(uuid),
    ),

  cartSession: (sessionId: string, orderId: string) =>
    redisClient.RPUSH(
      redisConstants.cartSessionKey(sessionId),
      redisConstants.orderKey(orderId),
    ),
};
