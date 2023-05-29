import { redisConstants } from "../../constants";
import { redisClient } from "../../redisClient";

export const redis_update_functions = {
  updateOrderQuantity: (
    orderId: string,
    quantityType: "fullQuantity" | "halfQuantity",
    newQuantity: number,
  ) =>
    redisClient.hSet(
      redisConstants.orderKey(orderId),
      quantityType,
      newQuantity,
    ),
};
