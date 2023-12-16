import { redisClient } from "../../redisClient";
import { redisConstants, redisKeyExpiry } from "../../constants";
import { kot, restaurantKotContainerPush } from "./functions";
import { CartItem, Order } from "../../../../Interfaces";

// enum Size {
//   Large = "large",
//   Medium = "medium",
//   Small = "small",
// }

// export type Order = {
//   dishId: string;
//   orderId: string;
//   tableNumber: string;
//   tableSectionId: string;
//   user_description?: string;
//   orderedBy: string;
//   size: Size;
//   fullQuantity?: string;
//   halfQuantity?: string;
//   chefAssign?: string;
//   completed?: string;
//   createdAt: string;
// };

export interface KotCreation {
  kotId: string;
  tableSectionId: string;
  tableNumber: number;
  restaurantId: string;
  createdAt: number;
  orderedBy: string;
  completed?: number;
  // cart: number;
  sessionId: string;
  chefAssign?: string;
  orders: NewOrderType[];
  kotNo: number;
  printCount: number;
}

export type NewOrderType = {
  size: OrderProps["size"];
  fullQuantity: number;
  halfQuantity: number;
  user_description: string;
  // cart: number;
  sessionId: string;
  createdAt: number;
  orderedBy: string;
  chefAssign: string;
  completed: number;
  tableSectionId: string;
  tableNumber: number;
  restaurantId: string;
  kotId: string;
  dishId: string;
  orderId: string;
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
      .RPUSH(
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

  createOrder: (props: Order) => {
    const {
      createdAt,
      dishId,
      kotId,
      orderId,
      orderedBy,
      restaurantId,
      sessionId,
      size,
      tableNumber,
      tableSectionId,
      chefAssign,
      fullQuantity,
      halfQuantity,
      user_description,
    } = props;
    return redisClient.hSet(`order:${props.kotId}`, [
      "dishId",
      dishId,
      "createdAt",
      createdAt,
      "kotId",
      kotId,
      "orderId",
      orderId,
      "orderedBy",
      orderedBy,
      "restaurantId",
      restaurantId,
      "sessionId",
      sessionId,
      "size",
      size,
      "tableNumber",
      tableNumber,
      "tableSectionId",
      tableSectionId,
      "chefAssign",
      chefAssign || "",
      "fullQuantity",
      fullQuantity,
      "halfQuantity",
      halfQuantity,
      "user_description",
      user_description || "",
    ]);
  },

  createCartOrder: (props: CartItem) =>
    redisClient.HSET("cartItem:" + props.orderId, [
      "size",
      props.size,
      "fullQuantity",
      props.fullQuantity,
      "halfQuantity",
      props.halfQuantity,
      "user_description",
      props.user_description,
      "sessionId",
      props.sessionId,
      "orderedBy",
      props.orderedBy,
      "tableSectionId",
      props.tableSectionId,
      "tableNumber",
      props.tableNumber,
      "restaurantId",
      props.restaurantId,
      "dishId",
      props.dishId,
      "orderId",
      props.orderId,
    ]),

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

  restaurantKotContainerPush,
  kot,
};
