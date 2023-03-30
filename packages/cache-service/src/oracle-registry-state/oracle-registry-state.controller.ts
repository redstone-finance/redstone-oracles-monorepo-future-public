import { Controller, Get } from "@nestjs/common";
import { getOracleState } from "../utils/get-oracle-state";

@Controller("oracle-registry-state")
export class OracleRegistryStateController {
  @Get()
  async getLoadedOracleRegistryState(): Promise<any> {
    return await getOracleState();
  }
}
