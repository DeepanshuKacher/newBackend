import { ConfigService } from "@nestjs/config";

const config = new ConfigService();

enum NodeEnvironment {
  DEVELOPMENT = "DEVELOPMENT",
  PRODUCTION = "PRODUCTION",
}

const getConfig = (value: string) => {
  const data = config.get(value);
  if (typeof data === "string") return data;
};

const workEnvironment = getConfig("NODE_ENV"),
  development_url = getConfig("development_url");

const modifyRestroURL =
  workEnvironment === NodeEnvironment.PRODUCTION
    ? "https://modify-restaurants.eatrofoods.com"
    : `http://${development_url}:3002`;

export const constants = {
  OTP: "OTP",
  ZADD_SCORE: 1,
  States: "States",
  parcel: "parcel",
  IS_DEVELOPMENT: workEnvironment === NodeEnvironment.DEVELOPMENT,
  IS_PRODUCTION: workEnvironment === NodeEnvironment.PRODUCTION,
  timeConstants: {
    daysFromMilliSeconds: (days = 1) => days * 24 * 60 * 60 * 1000,
  },
  cookieParser: getConfig("cookieParser"),
  modifyRestroURL,
  PORT: getConfig("PORT"),
  sessionId: "d8s*s7sns9",
  restaurantId: "urNbaHna1D",
  globalDomain:
    workEnvironment === NodeEnvironment.PRODUCTION
      ? ".eatrofoods.com"
      : development_url,

  globalDomainForFoodie:
    workEnvironment === NodeEnvironment.PRODUCTION
      ? ".eatrofoods.com"
      : development_url,

  userType: "d7d-+r5",
  // useTypeManager: "kxEaaz7dtU",
  // userTypeOwner: "DCrZ9g4h9L",
  // userTypeWaiter: "9nAirUoFy8",
  // userTypeChef: "hmtnqkuLi8",
  s3Bucket: getConfig("s3Bucket"),
  OK: "OK",
  InternalError: "Internal Server Error",

  objectURL: (restaurantId: string, name: string) =>
    `${privateContstants.s3Endpoint}/${
      constants.s3Bucket
    }/${privateContstants.objectKey(restaurantId, name)}`,

  workerTokenGenerator: (length?: number) => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      passwordLength = length || 9;
    let password = "";
    for (let i = 0; i <= passwordLength; i++) {
      const randomNumber = Math.floor(Math.random() * chars.length);
      password += chars.substring(randomNumber, randomNumber + 1);
    }
    return password;
  },
  workerPassportPhoto: (mongodbId: string) => `${mongodbId}-passportPhoto`,
  workerIdentityPhoto: (mongodbId: string) => `${mongodbId}-identityPhoto`,
  IndiaTimeZone: "Asia/Kolkata",
};

export const privateContstants = {
  objectKey: (restaurantId: string, name: string) =>
    `${restaurantId}-${name}`.replace(/\s/g, "-").toLocaleLowerCase(),
  s3Endpoint: getConfig("s3Endpoint"),
  s3Region: getConfig("s3Region"),
  s3AccessKeyId: getConfig("s3AccessKeyId"),
  s3SecretAccessKey: getConfig("s3SecretAccessKey"),
  JWT_SECRET: getConfig("JWT_SECRET"),
  REDIS_URL: getConfig("REDIS_URL"),
  REDIS_PASSWORD: getConfig("REDIS_PASSWORD"),
  workEnvironment,
  updateToken: "updateToken",
  clearData: "clearData",
  development_url,
};

export const functionsObject = {
  arrayToObject: <T>(itemArray: any[]): { [key: string]: T } => {
    const tempObj = {};
    for (const x of itemArray) {
      if (x) {
        tempObj[x] = x;
      }
    }
    return tempObj;
  },
};
