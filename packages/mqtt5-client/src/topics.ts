export type DataFeedTopic = {
  dataServiceId: string;
  dataPackageId: string;
  nodeAddress: string;
};

export function encodeDataFeedTopic({
  dataServiceId,
  dataPackageId,
  nodeAddress,
}: DataFeedTopic) {
  return `data-feed/${dataServiceId}/${dataPackageId}/${nodeAddress}`;
}

export function decodeDataFeedTopic(encodedTopic: string): DataFeedTopic {
  const [_, dataServiceId, dataPackageId, nodeAddress] =
    encodedTopic.split("/");

  return {
    dataServiceId,
    dataPackageId,
    nodeAddress,
  };
}
