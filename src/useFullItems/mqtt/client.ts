import { ConfigService } from "@nestjs/config";

import * as mqtt from "mqtt";

const config = new ConfigService();

// const client = mqtt.connect({
//   username: "anku",
//   password: "ankuWork$100%",
//   host: "mqtt.eatrofoods.com",
//   port: 8883,
//   protocol: "mqtts",
//   clientId: "nodejs_backend",
// });

const returnMqttClient = () => {
  const enviornment = config.get('NODE_ENV')

  if (enviornment === 'DEVELOPMENT') return mqtt.connect({
    host: config.get('mqtthost_dev'),
    port: config.get('mqttport')
  })
}

const client = returnMqttClient()

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
