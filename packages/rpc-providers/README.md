# Magic providers, compatible with ethers.Provider interface

:::info
Tested only with JsonRpcProviders
:::

## ProviderWithFallback

1. If the provider fails on some operation new provider is elected.
2. If all providers fail on the same operation error is thrown.
3. When we switch to the next provider, all operations are executed by it till it fails.
4. Providers are elected by the sequence given in array. If array ends we start from the beginning.

## ProviderWithAgreement

1. Works like `ProviderWithFallback, with an exception for two methods.
2. `getBlockNumber` asks all providers for blockNumber and then picks (default is median)
3. `call` asks all providers for result
   - if at least `N` answers are the same, it returns call result
   - ignores all errors
   - as soon as it will receive `N` matching responses returns. (doesn't wait for the rest of the providers to finish)
