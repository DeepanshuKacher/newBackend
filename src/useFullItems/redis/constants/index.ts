import { CronJob } from "cron";
import { Order } from "../functions";

const dayTrackerHOF_Function = () => {
  const dayTracker: { today: string; yesterday: string | null } = {
    today: new Date().toLocaleDateString(),
    yesterday: null,
  };

  new CronJob(
    "0 0 0 * * *",
    function () {
      dayTracker.yesterday = dayTracker.today;
      dayTracker.today = new Date().toLocaleDateString();
    },
    null,
    true,
    "Asia/Kolkata",
  );

  return (day: "Today" | "Yesterday") => {
    if (day === "Today") return dayTracker.today;
    else if (day === "Yesterday") return dayTracker.yesterday;
  };
};

export const dayTracker = dayTrackerHOF_Function();

export const redisConstants = {
  tablesStatusKey: (restaurantId: string) =>
    `${restaurantId}:restaurantSession`,

  tableSessionKeyForTablesStatus: (
    tableSectionId: string,
    tableNumber: number,
  ) => `${tableSectionId}:${tableNumber}:tableSession`,

  orderKey: (orderUUID: string) => `${orderUUID}:order`,

  sessionKey: (sessionUUID: string) => `${sessionUUID}:session`,

  restaurantRealtimeOrdersContainer_Today_Key: (restaurantId: string) =>
    `${restaurantId}:${dayTracker("Today")}:OrdersContainer`,

  restaurantRealtimeOrdersContainer_Yesterday_Key: (restaurantId: string) =>
    `${restaurantId}:${dayTracker("Yesterday")}:OrdersContainer`,

  cartSessionKey: (sessionUUID: string) => `${sessionUUID}:cart`,
};

export const redisKeyExpiry = {
  orderKey: 60 * 60 * 49,
  // sessionKey: 60 * 60 * 24, finish them imitiately after session is finish
  restaurantRealtimeOrdersContainerKey: 60 * 60 * 48,
  // cartSession: 60 * 60 * 24,finish them imitiately after session is finish
};

// export const redisFunctions = {
//   createOrder: (orderUUID:string) => redisClient.HSET(redisConstants.orderKey(orderUUID),[])
// };

export const orderConstants: Omit<Order, "size"> & { size: string } = {
  dishId: "dishId",
  orderId: "orderId",
  tableNumber: "tableNumber",
  tableSectionId: "tableSectionId",
  user_description: "user_description",
  orderedBy: "orderedBy",
  size: "size",
  fullQuantity: "fullQuantity",
  halfQuantity: "halfQuantity",
  chefAssign: "chefAssign",
  completed: "completed",
  createdAt: "createdAt",
};
