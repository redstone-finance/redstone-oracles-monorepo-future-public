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
        "Hello! I am working correctly"
      );
    });
  });
});
