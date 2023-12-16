import { OrderProps } from "src/useFullItems";

export * from "./ownerJwtPayload.interface";
export * from "./OrdersStuff";

interface RetreveOrderFromJson {
  completed: number;
  createdAt: number;
  dishId: string;
  fullQuantity: number;
  halfQuantity: number;
  kotId: string;
  orderedBy: string;
  orderId: string;
  restaurantId: string;
  size: OrderProps["size"];
  tableNumber: number;
  tableSectionId: string;
  user_description: string;
  sessionId: string;
  chefAssign: string;
}

// interface MqttKotPublish{

// }

export interface RetreveKotJson {
  id: `kot:${string}`;
  value: {
    completed: number;
    tableNumber: number;
    createdAt: number;
    kotId: string;
    tableSectionId: string;
    restaurantId: string;
    orderedBy: string;
    sessionId: string;
    chefAssign: string;
    orders: RetreveOrderFromJson[];
    kotNo: number;
    printCount: number;
  };
}
