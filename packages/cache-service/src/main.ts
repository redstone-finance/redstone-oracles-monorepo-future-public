import { NestFactory } from "@nestjs/core";
import { json, urlencoded } from "express";
import * as http from "http";
import { Logger, LoggerErrorInterceptor } from "nestjs-pino";
import { AppModule } from "./app.module";
import config from "./config";

const REQUEST_SIZE_LIMIT = "50mb";
const KEEP_ALIVE_TIMEOUT_IN_MILLISECONDS =
  config.keepAliveTimeoutInSeconds * 1000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: REQUEST_SIZE_LIMIT }));
  app.use(urlencoded({ extended: true, limit: REQUEST_SIZE_LIMIT }));
  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.enableCors();
  const server = app.getHttpServer() as http.Server;
  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_IN_MILLISECONDS;
  server.headersTimeout = KEEP_ALIVE_TIMEOUT_IN_MILLISECONDS + 1000; // it should be greater than keepAliveTimeout
  await app.listen(config.appPort);
}

void bootstrap();
