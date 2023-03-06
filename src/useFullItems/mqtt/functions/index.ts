import { CreateOrderDto, Size } from "src/orders/dto/create-order.dto";
import { mqttClient } from "../client";

const orderStatusUpdation = {
  Accept: "Accept",
  Completed: "Completed",
  Remove: "Remove",
};

const mqttPayloadCode = {
  tableStatus: "tableStatus",
  dishOrder: "dishOrder",
  updateOrder: "updateOrder",
  cardDishOrder: "cardDishOrder",
};

const formatPayload = (code: keyof typeof mqttPayloadCode, message: any) =>
  JSON.stringify({ code, message });

const mqttMessageFunctions = {
  sendTableStatus: (
    tableSectionId: string,
    tableNumber: number,
    status: "free" | string,
  ) =>
    formatPayload("tableStatus", {
      tableSectionId,
      tableNumber,
      status,
    }),

  dishOrder: ({
    dishId,
    tableSectionId,
    user_description,
    orderedBy,
    orderId,
    tableNumber,
    fullQuantity,
    halfQuantity,
    size,
  }: {
    dishId: string;
    tableSectionId: string;
    user_description?: string;
    orderedBy: string;
    orderId: string;
    tableNumber: number;
    size: Size;
    halfQuantity: number;
    fullQuantity: number;
  }) =>
    formatPayload("dishOrder", {
      dishId,
      tableSectionId,
      user_description,
      orderedBy,
      orderId,
      tableNumber,
      fullQuantity,
      halfQuantity,
      size,
    }),

  acceptOrder: (orderId: string, chefId: string) =>
    formatPayload("updateOrder", {
      orderId,
      orderStatus: orderStatusUpdation.Accept,
      chefId,
    }),

  rejectOrder: (orderId: string) =>
    formatPayload("updateOrder", {
      orderId,
      orderStatus: orderStatusUpdation.Remove,
    }),

  completeOrder: (orderId: string) =>
    formatPayload("updateOrder", {
      orderId,
      orderStatus: orderStatusUpdation.Completed,
    }),

  cardDishOrder: (
    orderArray: {
      dishId: string;
      tableSectionId: string;
      user_description?: string;
      orderedBy: string;
      orderId: string;
      tableNumber: number;
      size: Size;
      halfQuantity: number;
      fullQuantity: number;
    }[],
  ) => formatPayload("cardDishOrder", orderArray),
};

const mqttTopicFunctions = {
  sessionStartConfirmation: (restaurantId: string, tableNumber: number) =>
    `${restaurantId}/tables/${tableNumber}`,

  orderBroadCast: (
    restaurantId: string,
    tableSectionId: string,
    tableNumber: number,
  ) => `${restaurantId}/order/${tableSectionId}/${tableNumber}`,
};

//  type DishOrderType = CreateOrderDto & {}

const mqttMessageWithTopic = {
  sessionStartConfirmation: (
    restaurantId: string,
    tableSectionId: string,
    tableNumber: number,
    bookUUID: null | string,
  ) =>
    mqttClient.publish(
      mqttTopicFunctions.sessionStartConfirmation(restaurantId, tableNumber),
      mqttMessageFunctions.sendTableStatus(
        tableSectionId,
        tableNumber,
        bookUUID,
      ),
      {
        qos: 0,
      },
    ),

  dishOrder: ({
    dishId,
    tableSectionId,
    tableNumber,
    size,
    fullQuantity,
    halfQuantity,
    restaurantId,
    user_description,
    orderId,
    orderedBy,
  }: CreateOrderDto & {
    restaurantId: string;
    orderedBy: string;
    orderId: string;
  }) =>
    mqttClient.publish(
      mqttTopicFunctions.orderBroadCast(
        restaurantId,
        tableSectionId,
        tableNumber,
      ),
      mqttMessageFunctions.dishOrder({
        dishId,
        tableSectionId,
        user_description,
        orderedBy,
        orderId,
        tableNumber,
        fullQuantity,
        halfQuantity,
        size,
      }),
    ),

  acceptOrder: (
    restaurantId: string,
    tableNumber: number,
    tableSectionId: string,
    orderId: string,
    chefId: string,
  ) => {
    mqttClient.publish(
      mqttTopicFunctions.orderBroadCast(
        restaurantId,
        tableSectionId,
        tableNumber,
      ),
      mqttMessageFunctions.acceptOrder(orderId, chefId),
    );
  },

  rejectOrder: (
    restaurantId: string,
    tableNumber: number,
    tableSectionId: string,
    orderId: string,
  ) => {
    mqttClient.publish(
      mqttTopicFunctions.orderBroadCast(
        restaurantId,
        tableSectionId,
        tableNumber,
      ),
      mqttMessageFunctions.rejectOrder(orderId),
    );
  },

  completeOrder: (
    restaurantId: string,
    tableNumber: number,
    tableSectionId: string,
    orderId: string,
  ) => {
    mqttClient.publish(
      mqttTopicFunctions.orderBroadCast(
        restaurantId,
        tableSectionId,
        tableNumber,
      ),
      mqttMessageFunctions.completeOrder(orderId),
    );
  },

  cardDishOrder: (props: CardDishOrderProps) =>
    mqttClient.publish(
      mqttTopicFunctions.orderBroadCast(
        props.restaurantId,
        props.tableSectionId,
        props.tableNumber,
      ),
      mqttMessageFunctions.cardDishOrder(props.orderArray),
    ),
};

export { mqttMessageWithTopic as mqttPublish };

interface CardDishOrderProps {
  restaurantId: string;
  tableSectionId: string;
  tableNumber: number;
  orderArray: {
    dishId: string;
    tableSectionId: string;
    user_description?: string;
    orderedBy: string;
    orderId: string;
    tableNumber: number;
    size: Size;
    halfQuantity: number;
    fullQuantity: number;
  }[];
}
