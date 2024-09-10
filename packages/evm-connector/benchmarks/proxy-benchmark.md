# Proxy Benchmark

A proxy contract is a type of smart contract that allows other contracts to be executed without direct interaction. In the context of obtaining oracle values on a blockchain, a proxy contract receives a RedStone payload and makes calls to other contracts, passing them the oracle values.

Currently, we are testing two different implementations of a proxy: the ProxyConnector-based approach and the StorageProxy-based approach. The first approach, when making a call to other contracts, attaches the RedStone payload to the calldata and relies on the other contract to extract the values from it. The second approach extracts the values from the RedStone payload and stores them in storage. Then, the other contracts can access the values by reading them from the proxy contract's storage.

The benchmarks evaluate the performance based on the following variables:

- The number of assets
- The number of signers required
- The length of the proxy chain

In other words, the benchmark results will depend on how many assets are being handled, how many individuals need to sign off on the transaction, and how many proxy contracts are involved in the process.

### Running the benchmark

```sh
yarn test ./benchmarks/proxy-benchmark.ts
```

## Results and conclusion

Some of the benchmark results are presented below.

```js
  "3 signers, 2 symbols, 1 points, 2 proxy chain length": {
    "proxyConnectorOneAsset": 119126,
    "storageProxyOneAsset": 132894,
    "storageProxyOneAssetSecondWrite": 95894,
    "proxyConnectorManyAssets": 126296,
    "storageProxyManyAssets": 165063,
    "storageProxyManyAssetsSecondWrite": 108163
  },
  "3 signers, 20 symbols, 1 points, 2 proxy chain length": {
    "proxyConnectorOneAsset": 646099,
    "storageProxyOneAsset": 588300,
    "storageProxyOneAssetSecondWrite": 551300,
    "proxyConnectorManyAssets": 850853,
    "storageProxyManyAssets": 1233247,
    "storageProxyManyAssetsSecondWrite": 818147
  },
  "10 signers, 2 symbols, 1 points, 2 proxy chain length": {
    "proxyConnectorOneAsset": 266666,
    "storageProxyOneAsset": 262059,
    "storageProxyOneAssetSecondWrite": 225059,
    "proxyConnectorManyAssets": 284228,
    "storageProxyManyAssets": 304691,
    "storageProxyManyAssetsSecondWrite": 247791
  },
  "3 signers, 2 symbols, 1 points, 5 proxy chain length": {
    "proxyConnectorOneAsset": 163715,
    "storageProxyOneAsset": 148887,
    "storageProxyOneAssetSecondWrite": 111887,
    "proxyConnectorManyAssets": 174659,
    "storageProxyManyAssets": 183693,
    "storageProxyManyAssetsSecondWrite": 126793
  },
```

The data enables us to make the following observations. First, the storageProxy approach scales better w.r.t. number of singers and proxy chain length than proxyConnector approach. This is due to the fact, that in proxyConnector approach RedStone payload is parsed multiple times, whereas in the storageProxy approach, it is processed only once. Nonetheless, when the values of the aforementioned variables are low, the proxyConnector approach excels.

Second, the storageProxy approach can utilize the fact that subsequent writes to the same storage slot are cheaper than the initial write. When second writes are considered the storageProxy-based approach outperforms proxyConnector across all benchmark scenarios.
