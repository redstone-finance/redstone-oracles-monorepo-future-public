import { Controller, Get, Redirect } from "@nestjs/common";

const SYMBOLS_METADATA_GITHUB_URL =
  "https://raw.githubusercontent.com/redstone-finance/redstone-node/main/src/config/tokens.json";

@Controller("symbols-metadata")
export class SymbolsMetadataController {
  @Get()
  @Redirect(SYMBOLS_METADATA_GITHUB_URL)
  getSymbolsMetadata() {}
}
