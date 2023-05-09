import { ConfigService } from "@nestjs/config";
import { createClient, createCluster } from "redis";

const config = new ConfigService();

// const client = createClient({
//   url: config.get("REDIS_URL"),
//   password: config.get("REDIS_PASSWORD"),
// });

const client = createCluster({
  defaults: { password: "2$7{-WO^d_aAsJW" },
  rootNodes: [
    {
      url: "redis://redis1.eatrofoods.com:6379",
      readonly: true,
    },
    {
      url: "redis://redis2.eatrofoods.com:6379",
      readonly: true,
    },
    {
      url: "redis://redis3.eatrofoods.com:6379",
    },
    {
      url: "redis://redis4.eatrofoods.com:6379",
    },
    {
      url: "redis://redis5.eatrofoods.com:6379",
    },
    {
      url: "redis://redis6.eatrofoods.com:6379",
      readonly: true,
    },
  ],
  useReplicas: true,
});

client.on("error", (err) => console.log("Redis Client Error", err));

client.connect(); // if causing problem connect it in main async function bootstrap

client.on("connect", () => console.log("Redis is connected"));

export { client as redisClient };
