import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "../../src/app.controller";

describe("AppController", () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe("root", () => {
    it('should return "Hello World!"', () => {
      expect(appController.getRootRouteResponse()).toBe(
        "Hello! This is an instance of redstone-cache-service. " +
          "You can find more information at: " +
          "https://github.com/redstone-finance/redstone-oracles-monorepo/tree/main/packages/cache-service"
      );
    });
  });
});
