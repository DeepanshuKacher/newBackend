import { CronJob } from "cron";
// import { Order } from "../functions";
import { DateTime } from "luxon";
import { constants } from "src/useFullItems/constants";

const dayTrackerHOF_Function = () => {
  const dayTracker: { today: number; yesterday: number } = {
    today: DateTime.now().setZone(constants.IndiaTimeZone).get("day"),
    yesterday: DateTime.now()
      .setZone(constants.IndiaTimeZone)
      .minus({ day: 1 })
      .get("day"),
  };

  new CronJob(
    "0 0 0 * * *",
    function () {
      dayTracker.yesterday = dayTracker.today;
      dayTracker.today = DateTime.now()
        .setZone(constants.IndiaTimeZone)
        .get("day");
    },
    null,
    true,
    constants.IndiaTimeZone,
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

  restaurant_KOT_Container_Today_Key: (restaurantId: string) =>
    `${restaurantId}:${dayTracker("Today")}:KotContainer`,

  restaurant_KOT_Container_Yesterday_Key: (restaurantId: string) =>
    `${restaurantId}:${dayTracker("Yesterday")}:KotContainer`,

  kot_key: (kotUUID: string) => `${kotUUID}:kot`,

  restaurantOrderIndex: "restaurantOrder",
  restaurantCartIndex: "restaurantCartItem",
};

export const redisKeyExpiry = {
  orderKey: 60 * 60 * 49,
  // sessionKey: 60 * 60 * 24, finish them imitiately after session is finish
  restaurantRealtimeOrdersContainerKey: 60 * 60 * 48,
  // cartSession: 60 * 60 * 24,finish them imitiately after session is finish
};

// export const orderConstants: Omit<Order, "size"> & { size: string } = {
//   dishId: "dishId",
//   orderId: "orderId",
//   tableNumber: "tableNumber",
//   tableSectionId: "tableSectionId",
//   user_description: "user_description",
//   orderedBy: "orderedBy",
//   size: "size",
//   fullQuantity: "fullQuantity",
//   halfQuantity: "halfQuantity",
//   chefAssign: "chefAssign",
//   completed: "completed",
//   createdAt: "createdAt",
// };
