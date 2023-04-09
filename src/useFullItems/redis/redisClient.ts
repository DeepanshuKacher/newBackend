import { ConfigService } from "@nestjs/config";
import { createClient, createCluster } from "redis";

const config = new ConfigService();

const client = createClient({
  url: config.get("REDIS_URL"),
  password: config.get("REDIS_PASSWORD"),
});

/* const client = createCluster({
  rootNodes: [
    {
      url: "redis3.eatrofoods.com",
      password: "2$7{-WO^d_aAsJW.redis3",
    },
    {
      url: "redis4.eatrofoods.com",
      password: "2$7{-WO^d_aAsJW.redis4",
      readonly: true,
    },
    {
      url: "redis5.eatrofoods.com",
      password: "2$7{-WO^d_aAsJW.redis5",
      readonly: true,
    },
  ],
  useReplicas: true,
  nodeAddressMap: {
    "redis3.eatrofoods.com:6379": {
      host: "redis3.eatrofoods.com",
      port: 6379,
    },
    "redis4.eatrofoods.com:6379": {
      host: "redis4.eatrofoods.com",
      port: 6379,
    },
    "redis5.eatrofoods.com:6379": {
      host: "redis5.eatrofoods.com",
      port: 6379,
    },
  },
}); */

client.on("error", (err) => console.log("Redis Client Error", err));

client.connect(); // if causing problem connect it in main async function bootstrap

client.on("connect", () => console.log("Redis is connected"));

export { client as redisClient };
