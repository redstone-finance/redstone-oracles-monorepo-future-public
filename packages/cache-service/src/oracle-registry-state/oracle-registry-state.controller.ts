import { Controller, Get } from "@nestjs/common";
import { getOracleState } from "../utils/get-oracle-state";

@Controller("oracle-registry-state")
export class OracleRegistryStateController {
  @Get()
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async getLoadedOracleRegistryState(): Promise<unknown> {
    return await getOracleState();
  }
}
