import { NestFactory } from "@nestjs/core";
import { json, urlencoded } from "express";
import { Logger, LoggerErrorInterceptor } from "nestjs-pino";
import { AppModule } from "./app.module";
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

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
