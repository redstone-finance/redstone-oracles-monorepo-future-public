import { Controller, Get } from "@nestjs/common";

const GITHUB_REPO_LINK =
  "https://github.com/redstone-finance/redstone-oracles-monorepo/tree/main/packages/cache-service";

@Controller()
export class AppController {
  @Get()
  getRootRouteResponse(): string {
    return (
      `Hello! This is an instance of redstone-cache-service. ` +
      `You can find more information at: ${GITHUB_REPO_LINK}`
    );
  }
}
