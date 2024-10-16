export type DataPackageTopic = {
  dataServiceId: string;
  dataPackageId: string;
  nodeAddress: string;
};

export function encodeDataPackageTopic({
  dataServiceId,
  dataPackageId,
  nodeAddress,
}: DataPackageTopic) {
  return `data-package/${dataServiceId}/${dataPackageId}/${nodeAddress}`;
}

export function decodeDataPackageTopic(encodedTopic: string): DataPackageTopic {
  const [_, dataServiceId, dataPackageId, nodeAddress] =
    encodedTopic.split("/");

  return {
    dataServiceId,
    dataPackageId,
    nodeAddress,
  };
}
