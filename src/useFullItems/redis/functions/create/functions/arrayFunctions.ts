import {
  redisConstants,
  redisKeyExpiry,
} from "src/useFullItems/redis/constants";
import { redisClient } from "src/useFullItems/redis/redisClient";

const restaurantKotContainerPush = (
  restaurantID: string,
  orderKot_key: string,
) =>
  redisClient
    .rPush(
      redisConstants.restaurant_KOT_Container_Today_Key(restaurantID),
      orderKot_key,
    )
    .then(async (response) => {
      if (response === 1)
        await redisClient.EXPIRE(
          redisConstants.restaurant_KOT_Container_Today_Key(restaurantID),
          redisKeyExpiry.restaurantRealtimeOrdersContainerKey,
          "NX",
        );
      return response;
    });

const kot = (kotUUID: string, ordersArray: string[]) =>
  redisClient
    .rPush(redisConstants.kot_key(kotUUID), ordersArray)
    .then(async (response) => {
      await redisClient.EXPIRE(
        redisConstants.kot_key(kotUUID),
        redisKeyExpiry.orderKey,
        "NX",
      );

      return response;
    });

export { kot, restaurantKotContainerPush };
