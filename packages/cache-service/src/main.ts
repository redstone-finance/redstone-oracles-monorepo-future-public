import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { urlencoded, json } from "express";
import { Logger } from "nestjs-pino";
import { LoggerErrorInterceptor } from "nestjs-pino";
import config from "./config";

const REQUEST_SIZE_LIMIT = "50mb";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: REQUEST_SIZE_LIMIT }));
  app.use(urlencoded({ extended: true, limit: REQUEST_SIZE_LIMIT }));
  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.enableCors();
  await app.listen(config.appPort);
}

bootstrap();
