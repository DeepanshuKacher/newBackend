import { ConfigService } from "@nestjs/config";
import { createClient, createCluster } from "redis";

const config = new ConfigService();

const client = createClient({
  url: "redis://redis1.eatrofoods.com",
  password: "2$7{-WO^d_aAsJW",
});
// const client = createCluster({
//   rootNodes: [
//     { url: "redis://redis1.eatrofoods.com", password: "2$7{-WO^d_aAsJW" },
//     {
//       url: "redis://redis2.eatrofoods.com",
//       password: "2$7{-WO^d_aAsJW",
//       readonly: true,
//     },
//   ],
//   useReplicas: true,
// });

client.on("error", (err) => console.log("Redis Client Error", err));

client.connect(); // if causing problem connect it in main async function bootstrap

client.on("connect", () => console.log("Redis is connected"));

export { client as redisClient };
