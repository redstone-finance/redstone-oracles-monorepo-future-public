import { Controller, Get } from "@nestjs/common";

// TODO: implement

@Controller("oracle-registry-state")
export class OracleRegistryStateController {
  @Get()
  async getLoadedOracleRegistryState(): Promise<any> {
    return {
      nodes: { heh: "haha" },
      dataFeeds: {},
    };
  }
}
