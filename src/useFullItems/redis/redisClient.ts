import { ConfigService } from "@nestjs/config";
import { createClient } from "redis";

const config = new ConfigService();

const client = createClient({
  url: "redis://redis1.eatrofoods.com",
  password: "2$7{-WO^d_aAsJW",
});

// const client = createClient({
//   password: "1ifKVAoxmOZwkX5cqfxcGFGtAgJmha4M",
//   socket: {
//     host: "redis-17833.c305.ap-south-1-1.ec2.cloud.redislabs.com",
//     port: 17833,
//   },
// });

// const client = createCluster({
//   defaults: { password: "2$7{-WO^d_aAsJW" },
//   rootNodes: [
//     {
//       url: "redis://redis1.eatrofoods.com:6379",
//     },
//     {
//       url: "redis://redis2.eatrofoods.com:6379",
//     },
//     {
//       url: "redis://redis3.eatrofoods.com:6379",
//     },
//     {
//       url: "redis://redis4.eatrofoods.com:6379",
//     },
//     {
//       url: "redis://redis5.eatrofoods.com:6379",
//     },
//     {
//       url: "redis://redis6.eatrofoods.com:6379",
//     },
//   ],
//   useReplicas: true,
// });

client.on("error", (err) => console.log("Redis Client Error", err));

client.connect(); // if causing problem connect it in main async function bootstrap

client.on("connect", () => console.log("Redis is connected"));

export { client as redisClient };
