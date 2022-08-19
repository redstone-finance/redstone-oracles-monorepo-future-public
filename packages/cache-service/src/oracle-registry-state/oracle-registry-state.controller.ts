import { Controller, Get } from "@nestjs/common";
import { getOracleRegistryState } from "redstone-sdk";

@Controller("oracle-registry-state")
export class OracleRegistryStateController {
  @Get()
  async getLoadedOracleRegistryState(): Promise<any> {
    return await getOracleRegistryState();
  }
}
