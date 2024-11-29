import { GetPricesRadixMethod } from "./GetPricesRadixMethod";

export class WritePricesRadixMethod extends GetPricesRadixMethod {
  constructor(
    componentId: string,
    dataFeedIds: string[],
    payloadData: number[],
    fee = dataFeedIds.length * 1.5
  ) {
    super(componentId, dataFeedIds, payloadData, fee, "write_prices");
  }
}
