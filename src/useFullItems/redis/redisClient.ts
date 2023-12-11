import { ConfigService } from "@nestjs/config";
import { SchemaFieldTypes, createClient, createCluster } from "redis";

const config = new ConfigService();

const client = createClient({
  // url: config.get('REDIS_URL'),
  socket: {
    host: config.get('REDIS_HOST'),
    port: config.get('REDIS_PORT')
  },
  password: config.get('REDIS_PASSWORD'),
});

// const client = createClient({
//   password: "1ifKVAoxmOZwkX5cqfxcGFGtAgJmha4M",
//   socket: {
//     host: "redis-17833.c305.ap-south-1-1.ec2.cloud.redislabs.com",
//     port: 17833,
//   },
// });

/* const client = createCluster({
  defaults: { password: "2$7{-WO^d_aAsJW" },
  rootNodes: [
    {
      url: "redis://redis1.eatrofoods.com:6379",
    },
    {
      url: "redis://redis2.eatrofoods.com:6379",
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
    },
  ],
  useReplicas: true,
}); */

client.on("error", (err) => console.log("Redis Client Error", err));

client.connect(); // if causing problem connect it in main async function bootstrap

client.on("connect", () => console.log("Redis is connected"));

(async function () {
  try {
    await client.ft.create(
      "restaurantOrder",
      {
        "$:kotId": {
          type: SchemaFieldTypes.TAG,
          AS: "kotId",
        },
        "$:restaurantId": { type: SchemaFieldTypes.TAG, AS: "restaurantId" },
        // cart: { type: SchemaFieldTypes.NUMERIC },
        "$:sessionId": {
          type: SchemaFieldTypes.TAG,
          AS: "sessionId",
          CASESENSITIVE: true,
        },
        "$:createdAt": {
          type: SchemaFieldTypes.NUMERIC,
          SORTABLE: true,
          AS: "createdAt",
        },
      },
      {
        ON: "JSON",
        PREFIX: "kot",
      },
    );
  } catch (e) {
    if (e.message === "Index already exists") {
      console.log("restaurantOrder Index exists already, skipped creation.");
    } else {
      // Something went wrong, perhaps RediSearch isn't installed...
      console.error(e);
      // process.exit(1);
    }
  }
})();

(async function () {
  try {
    await client.ft.create(
      "restaurantCart",
      {
        // cart: { type: SchemaFieldTypes.NUMERIC },
        sessionId: { type: SchemaFieldTypes.TAG },
        createdAt: { type: SchemaFieldTypes.NUMERIC, SORTABLE: true },
      },
      {
        ON: "HASH",
        PREFIX: "cart",
      },
    );
  } catch (e) {
    if (e.message === "Index already exists") {
      console.log("restaurantOrder Index exists already, skipped creation.");
    } else {
      // Something went wrong, perhaps RediSearch isn't installed...
      console.error(e);
      // process.exit(1);
    }
  }
})();

export { client as redisClient };
