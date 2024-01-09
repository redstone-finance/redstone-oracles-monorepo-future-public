import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { mockOracleRegistryState } from "../common/mock-values";
import "../common/set-test-envs";

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock("@redstone-finance/sdk", () => ({
  __esModule: true,
  ...jest.requireActual("@redstone-finance/sdk"),
  getOracleRegistryState: jest.fn(() => mockOracleRegistryState),
}));

describe("Oracle registry state (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("/oracle-registry-state (GET)", async () => {
    const testResponse = await request(app.getHttpServer())
      .get("/oracle-registry-state")
      .expect(200);

    expect(testResponse.body).toEqual(mockOracleRegistryState);
  });
});
