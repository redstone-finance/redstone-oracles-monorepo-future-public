import { Controller, Get, Logger } from "@nestjs/common";

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  @Get()
  getRootRouteResponse(): string {
    this.logger.log("Received a request to the root route");
    return `Hello! I am working correctly`;
  }
}
