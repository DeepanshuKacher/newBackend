import { HttpStatus, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as cookieParser from "cookie-parser";
import { redisClient } from "./useFullItems";
import { constants } from "./useFullItems";
import { randomUUID } from "crypto";

async function bootstrap() {
  // const dotenvKeys = await redisClient.HGETALL("dotenv");

  // secretKeys("set", dotenvKeys);

  // const jwtkeys = secretKeys("get")?.["DATABASE_URL"];

  // console.log(jwtkeys);

  const app = await NestFactory.create(AppModule);

  if (constants.IS_PRODUCTION) {
    app.enableCors({
      origin: [
        "https://eatrofoods.com",
        /^https:[/]{2}[a-zA-Z-_0-9]+[.]eatrofoods.com$/,
      ],
      credentials: true,
    });
  } else if (constants.IS_DEVELOPMENT) {
    app.enableCors({
      // origin: /^http:[/]{2}localhost:[0-9]{4}/,
      origin: /http:[.]*/,
      credentials: true,
    });
  }
  app.use(cookieParser(constants.cookieParser));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true /* this is required */,
      forbidNonWhitelisted: true /* not working without whitelist:true */,
    }),
  );

  await app.listen(constants.PORT, () =>
    console.log("server is running on port " + constants.PORT),
  );
}
bootstrap();
