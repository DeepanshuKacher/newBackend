import { redisClient } from "../../redisClient";
import { redisConstants, redisKeyExpiry } from "../../constants";
import { kot, restaurantKotContainerPush } from "./functions";

enum Size {
  Large = "large",
  Medium = "medium",
  Small = "small",
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
  createdAt: string;
};

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

  createOrder: (props: KotCreation) => {
    return redisClient.json.set(`kot:${props.kotId}`, "$", {
      kotId: props.kotId,
      tableSectionId: props.tableSectionId,
      tableNumber: props.tableNumber,
      restaurantId: props.restaurantId,
      createdAt: props.createdAt,
      orderedBy: props.orderedBy,
      completed: 0,
      // cart: props.cart,
      sessionId: props.sessionId,
      chefAssign: "",
      orders: props.orders,
      kotNo: props.kotNo,
      printCount: props.printCount,
    });
  },

  createCartOrder: (
    props: Omit<
      NewOrderType,
      "createdAt" | "kotId" | "completed" | "chefAssign"
    >,
  ) =>
    redisClient.HSET("cart:" + props.orderId, [
      "size",
      props.size,
      "fullQuantity",
      props.fullQuantity,
      "halfQuantity",
      props.halfQuantity,
      "user_description",
      props.user_description,
      // "cart",
      // props.cart,
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
  // createOrder: (props: NewOrderType) => {
  //   const orderId = constants.workerTokenGenerator(16);
  //   return redisClient.HSET(`order:${orderId}`, [
  //     "size",
  //     props.size,
  //     "fullQuantity",
  //     props.fullQuantity,
  //     "halfQuantity",
  //     props.halfQuantity,
  //     "user_description",
  //     props.user_description,
  //     "cart",
  //     props.cart,
  //     "sessionId",
  //     props.sessionId,
  //     "createdAt",
  //     props.createdAt,
  //     "orderedBy",
  //     props.orderedBy,
  //     "chefAssign",
  //     props.chefAssign,
  //     "completed",
  //     props.completed,
  //     "tableSectionId",
  //     props.tableSectionId,
  //     "tableNumber",
  //     props.tableNumber,
  //     "restaurantId",
  //     props.restaurantId,
  //     "kotNo",
  //     props.kotNo,
  //     "dishId",
  //     props.dishId,
  //     "orderNumber",
  //     props.orderNumber,
  //     "orderId",
  //     orderId,
  //   ]);
  // },
  // .then(() =>
  //   redisClient.EXPIRE(
  //     redisConstants.orderKey(props.orderId),
  //     redisKeyExpiry.orderKey,
  //     "NX",
  //   ),
  // ),

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
