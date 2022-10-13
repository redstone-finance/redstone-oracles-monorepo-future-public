import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { urlencoded, json } from "express";
import { Logger } from "nestjs-pino";

const REQEUST_SIZE_LIMIT = "50mb";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: REQEUST_SIZE_LIMIT }));
  app.use(urlencoded({ extended: true, limit: REQEUST_SIZE_LIMIT }));
  app.useLogger(app.get(Logger));
  await app.listen(3000);
}

bootstrap();
