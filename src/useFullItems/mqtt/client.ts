import { ConfigService } from "@nestjs/config";

import * as mqtt from "mqtt";
import { constants } from "../constants";

const config = new ConfigService();

const getConfigFunction = (str) => {
  const variable: string | undefined = config.get(str);

  if (variable) return variable;
  else throw new Error(`No config found ${str}`);
};

// const client = mqtt.connect({
//   username: "anku",
//   password: "ankuWork$100%",
//   host: "mqtt.eatrofoods.com",
//   port: 8883,
//   protocol: "mqtts",
//   clientId: "nodejs_backend",
// });

const client = mqtt.connect({
  hostname: getConfigFunction("mqtthostname"),
  port: parseInt(getConfigFunction("mqttport")),
  username: getConfigFunction("mqttUsername"),
  password: getConfigFunction("mqttPassword"),
  clientId: constants.workerTokenGenerator(5),
  protocol: "tcp",
});

client.on("connect", function () {
  console.log("mqtt connected");
});

client.on("error", (error) => {
  console.log("mqtt error: ", error);
});

client.on("reconnect", () => {
  console.log("mqtt reconnecting");
});

export { client as mqttClient };
