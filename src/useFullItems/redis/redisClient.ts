import { ConfigService } from "@nestjs/config";
import { SchemaFieldTypes, createClient } from "redis";
import { redisConstants } from "./constants";

const config = new ConfigService();

const client = createClient({
  // url: config.get('REDIS_URL'),
  socket: {
    host: config.get("REDIS_HOST"),
    port: config.get("REDIS_PORT"),
  },
  password: config.get("REDIS_PASSWORD"),
});

client.on("error", (err) => console.log("Redis Client Error", err));

client.connect(); // if causing problem connect it in main async function bootstrap

client.on("connect", () => console.log("Redis is connected"));

(async function () {
  try {
    // await client.ft.create(
    //   redisConstants.restaurantOrderIndex,
    //   {
    //     "$:kotId": {
    //       type: SchemaFieldTypes.TAG,
    //       AS: "kotId",
    //     },
    //     "$:restaurantId": { type: SchemaFieldTypes.TAG, AS: "restaurantId" },
    //     // cart: { type: SchemaFieldTypes.NUMERIC },
    //     "$:sessionId": {
    //       type: SchemaFieldTypes.TAG,
    //       AS: "sessionId",
    //       CASESENSITIVE: true,
    //     },
    //     "$:createdAt": {
    //       type: SchemaFieldTypes.NUMERIC,
    //       SORTABLE: true,
    //       AS: "createdAt",
    //     },
    //   },
    //   {
    //     ON: "HASH",
    //     PREFIX: "kot",
    //   },
    // );

    await client.ft.create(
      redisConstants.restaurantOrderIndex,
      {
        kotId: {
          type: SchemaFieldTypes.TAG,
        },
        restaurantId: {
          type: SchemaFieldTypes.TAG,
        },
        sessionId: {
          type: SchemaFieldTypes.TAG,
        },
        createdAt: {
          type: SchemaFieldTypes.NUMERIC,
          SORTABLE: true,
        },
      },
      {
        PREFIX: "order",
        ON: "HASH",
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
      redisConstants.restaurantCartIndex,
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
