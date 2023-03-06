import { redisGetFunction } from ".";
import { Order, orderConstants, redisConstants } from "../..";
import { redisClient } from "../../redisClient";
// import { OrderProps } from "../create";

export const getOrdersObjectFromSessionUUID = async (
  sessionUUID: string,
): Promise<Order[]> => {
  const orderKeysArray = await redisGetFunction.orderKeysArrayFromSessionUUID(
    sessionUUID,
  );

  const orderObjectPromis = [];

  for (let x of orderKeysArray) {
    orderObjectPromis.push(redisClient.HGETALL(x));
  }

  return Promise.all(orderObjectPromis);
};

export const getTableInfoFromSessionUUID = async (
  restaurantId: string,
  sessionUUID: string,
) => {
  const restaurantTableStatus = await redisGetFunction.restaurantTableStatus(
    restaurantId,
  );

  for (let x in restaurantTableStatus) {
    if (restaurantTableStatus[x] === redisConstants.sessionKey(sessionUUID)) {
      const [tableSectionId, tableNumber] = x.split(":");
      return { tableSectionId, tableNumber: parseInt(tableNumber) };
    }
  }
};
