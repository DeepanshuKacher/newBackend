import { redisGetFunction } from ".";
import { redisConstants } from "../..";
import { redisClient } from "../../redisClient";
// import { OrderProps } from "../create";
import { OrderReturnFromRedis, RetreveCartItemFromRedisIndex, RetreveKotJson } from "../../../../Interfaces";

export const getOrdersObjectFromSessionUUID = async (
  sessionUUID: string,
): Promise<OrderReturnFromRedis[]> => {
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

export const kotContainerItemsKey_Today = (restaurantId: string) =>
  redisClient.lRange(
    redisConstants.restaurant_KOT_Container_Today_Key(restaurantId),
    0,
    -1,
  );
export const kotContainerItemsKey_YesterDay = (restaurantId: string) =>
  redisClient.lRange(
    redisConstants.restaurant_KOT_Container_Yesterday_Key(restaurantId),
    0,
    -1,
  );

export const orderKeysFromKot = (
  kotKeyOrKotUUID: "key" | "uuid",
  kotId: string,
) => {
  switch (kotKeyOrKotUUID) {
    case "key":
      return redisClient.lRange(kotId, 0, -1);
    case "uuid":
      return redisClient.lRange(redisConstants.kot_key(kotId), 0, -1);
  }
};

export const ordersKeyFromKotContainer = async (
  restaurantId: string,
  includeYesterday: boolean,
) => {
  let kotKeys = await kotContainerItemsKey_Today(restaurantId);

  if (includeYesterday === true) {
    const yesterdayKotKeys = await kotContainerItemsKey_YesterDay(restaurantId);

    kotKeys = [...yesterdayKotKeys, ...kotKeys];
  }

  // console.log({ kotKeys });

  const promisContainer = [];

  for (const iterator of kotKeys) {
    const arrayOfOrderKeysPromis = orderKeysFromKot("key", iterator);

    promisContainer.push(arrayOfOrderKeysPromis);
  }

  return await Promise.all(promisContainer); // sending order key array
};

export const getCartItemsFromSessionId = (sessionId: string): Promise<{
  total: number;
  documents: RetreveCartItemFromRedisIndex[];
}> => {
  const temp: any = redisClient.ft.search(
    redisConstants.restaurantCartIndex,
    `@sessionId:{${sessionId}}`
  )

  return temp
}

export const getOrdersFromSessionId = (sessionId: string): Promise<{
  total: number;
  documents: RetreveKotJson[];
}> => {
  const temp: any = redisClient.ft.search(
    redisConstants.restaurantOrderIndex,
    `@sessionId:{${sessionId}}`
  )

  return temp
}



// export const getOrdersFromRestaurantId = (restaurantId)=>{
//   const temp = redisClient.ft.search(redisConstants.restaurantOrderIndex,)
// }