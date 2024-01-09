import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import "../common/set-test-envs";

describe("Data feeds metadata (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("/data-feeds-metadata (GET)", async () => {
    await request(app.getHttpServer())
      .get("/data-feeds-metadata")
      .expect(302)
      .expect(
        "Location",
        "https://raw.githubusercontent.com/redstone-finance/redstone-node/main/src/config/tokens.json"
      );
  });
});
