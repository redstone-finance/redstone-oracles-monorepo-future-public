import { Controller, Get, Redirect } from "@nestjs/common";

const DATA_FEEDS__METADATA_GITHUB_URL =
  "https://raw.githubusercontent.com/redstone-finance/redstone-node/main/src/config/tokens.json";

@Controller("data-feeds-metadata")
export class DataFeedsMetadataController {
  @Get()
  @Redirect(DATA_FEEDS__METADATA_GITHUB_URL)
  getSymbolsMetadata() {}
}
