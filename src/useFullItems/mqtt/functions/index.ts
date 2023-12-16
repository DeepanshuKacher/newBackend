import { mqttClient } from "../client";
import type { Order } from "../../../Interfaces";

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
  sessionClose: "sessionClose",
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

  dishOrder: (kot: Order[]) => formatPayload("dishOrder", kot),

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

  cardDishOrder: (orderArray: Order[], orderNo: number) =>
    formatPayload("cardDishOrder", { orderArray, orderNo }),

  generateBillNotification: (tableSectionId: string, tableNumber: number) =>
    formatPayload("sessionClose", { tableSectionId, tableNumber }),
};

const mqttTopicFunctions = {
  sessionStartConfirmation: (restaurantId: string, tableNumber: number) =>
    `${restaurantId}/tables/${tableNumber}`,

  orderBroadCast: (
    restaurantId: string,
    tableSectionId: string,
    tableNumber: number,
  ) => `${restaurantId}/order/${tableSectionId}/${tableNumber}`,

  broadCardForKitchenManager: (restaurantId: string) =>
    `${restaurantId}/order/`,
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

  dishOrder: (kot: Order[]) =>
    mqttClient.publish(
      mqttTopicFunctions.orderBroadCast(
        kot[0].restaurantId,
        kot[0].tableSectionId,
        kot[0].tableNumber,
      ),
      mqttMessageFunctions.dishOrder(kot),
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

  // cardDishOrder: (props: CardDishOrderProps) =>
  //   mqttClient.publish(
  //     mqttTopicFunctions.orderBroadCast(
  //       props.restaurantId,
  //       props.tableSectionId,
  //       props.tableNumber,
  //     ),
  //     mqttMessageFunctions.cardDishOrder(props.orderArray, props.orderNo),
  //   ),

  generateBillNotification: (
    restaurantId: string,
    tableNumber: number,
    tableSectionId: string,
  ) => {
    mqttClient.publish(
      mqttTopicFunctions.broadCardForKitchenManager(restaurantId),
      mqttMessageFunctions.generateBillNotification(
        tableSectionId,
        tableNumber,
      ),
    );
  },
};

export { mqttMessageWithTopic as mqttPublish };

// interface CardDishOrderProps {
//   restaurantId: string;
//   tableSectionId: string;
//   tableNumber: number;
//   orderNo: number;
//   orderArray: {
//     dishId: string;
//     orderId: string;
//     tableNumber: string;
//     tableSectionId: string;
//     user_description?: string;
//     orderedBy: string;
//     size: Size;
//     fullQuantity?: string;
//     halfQuantity?: string;
//     chefAssign?: string;
//     completed?: string;
//     createdAt: string;
//   }[];
// }
