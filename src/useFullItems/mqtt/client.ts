import * as mqtt from "mqtt";
const client = mqtt.connect("mqtt://mqtt.eatrofoods.com", {
  username: "anku",
  password: "ankuWork$100%",
});

client.on("connect", function () {
  console.log("mqtt connected");
});

export { client as mqttClient };
