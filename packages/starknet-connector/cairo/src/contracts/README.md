
# RedStone oracles integration with Starknet

## 💡 How RedStone oracles work with Starknet

RedStone oracles use an alternative design of providing oracle data to smart contracts. Instead of constantly persisting data on the contract's storage (by data providers), the information is brought on-chain only when needed (by end users). Until that moment data remains in the decentralised cache layer, which is powered by RedStone light cache gateways and streamr data broadcasting protocol. Data is transferred to the contract by end users, who should attach signed data packages to their function invocations. The information integrity is verified on-chain through signature checking.

To learn more about RedStone oracles design go to the [RedStone docs](https://docs.redstone.finance/docs/introduction)

## 📄 Smart Contracts

### Prices.cairo
- Sample oracle contract that consumes RedStone oracles data - [prices.cairo](prices.cairo) written in cairo version 0.10.3.

#### ⨐ constructor
```
@constructor
func constructor{...}(signer_count_threshold: felt, addresses_len: felt, addresses: felt*)
```

As mentioned above, the data packages transferred to the contract are being verified by signature checking. 
To be counted to achieve the ```signer_count_threshold```, the signer signing the passed data 
should be one of the ```addresses``` passed in the constructor. 
There is also needed ```signer_count_threshold``` to be passed.

The value of ```addresses``` is passed in the cairo's way: by passing the length of the array and next the array-data. 
<br />
📚 See: Array arguments in calldata https://www.cairo-lang.org/docs/hello_starknet/more_features.html

📖 The [sample/showroom](https://testnet.starkscan.co/contract/0x03a4732136f974a250bf7d95683af13b05a4d605d3f3390469f6178448a73ae1) 
contract deployed uses single value ```0xf786a909D559F5Dee2dc6706d8e5A81728a39aE9``` 
as a signer address (of the ```redstone-rapid-demo``` data service) and ```1``` as ```signer_count_threshold```.

In the function parameters below, each ```feed_id``` is a cairo-represented string, so that's a felt corresponding to
the string written in cairo:
a number consisting of hex-values of the particular letters in the string. For example:
```ETH``` as a ```feed_id```'s felt is ```0x455448``` in hex or ```4543560``` in decimal,
as ```256*256*ord('E')+256*ord('T')+ord('H')```.
<br />

📟 You can use: `feed_id = hexlify(toUtf8Bytes(feed_string)))` to convert particular values or
the https://cairo-utils-web.vercel.app/ endpoint<br />
📟 You can also use: https://cairo-utils-web.vercel.app/ to convert particular values. <br />

The value of ```feed_ids``` is passed in the cairo's way: by passing the length of the array and next the array-data.
<br />
📚 See: Array arguments in calldata https://www.cairo-lang.org/docs/hello_starknet/more_features.html
<br />

The value ```payload_data``` is passed as an array of bytes representing the packed RedStone payload. Each byte of the payload is a single felt.
<br />
📚 See RedStone data-packing: https://docs.redstone.finance/docs/smart-contract-devs/how-it-works
and the [Sample payload_data](#-sample-payloaddata) section below.

#### ⨗ get_prices
```
@view 
func get_prices{...}(feed_ids_len: felt, feed_ids: felt*, payload_data_len: felt, payload_data: felt*) -> (
    values_len: felt, values: felt*
)
```

The function processes on-chain the ```payload_data``` passed as an argument 
and returns an array of aggregated values of each feed passed as an identifier inside ```feed_ids```.
That's just a @view function - it doesn't consume GAS or modify the contract's storage.

#### ⨗ get_price

```
@view
func get_price{...}(feed_id: felt, payload_data_len: felt, payload_data: felt*) -> (value: felt) 
```

That's an analog of the ```get_prices``` function but for a single ```feed_id```.

#### ⨒ save_prices

```
@external
func save_prices{...}(feed_ids_len: felt, feed_ids: felt*, payload_data_len: felt, payload_data: felt*)
```

Regardless of the on-fly processing, there also exists a function for processing the ```payload_data``` on-chain, but saving/writing 
the aggregated values to the contract's storage instead of returning them as an array directly. The values persist in the contract's storage
and then can be read by using ```get_saved_price(s)``` functions. 
The timestamp of data last saved/written to the contract is able to read by using the ```get_saved_timestamp``` function.
The function modifies the storage and consumes GAS.

📖 See how it works on: https://starknet-showroom.redstone.finance/

#### ⨗ get_saved_prices

```
@view
func get_saved_prices{...}(feed_ids_len: felt, feed_ids: felt*) -> (res_len: felt, res: felt*)
```

The function reads the values persisting in the contract's storage and returns an array corresponding to the passed ```feed_ids```.
The function doesn't modify the storage and can read only aggregated values of the ```feed_ids``` saved by using ```save_prices``` function.


#### ⨗ get_saved_price

```
@view
func get_saved_price{...}(feed_id) -> (value: felt)
```

That's an analog of the ```get_saved_prices``` function but for a single ```feed_id```.

#### ∮ get_saved_timestamp

```
@view
func get_saved_timestamp{...}() -> (res: felt)
```

Returns the timestamp of data last saved/written to the contract's storage by using ```save_prices``` function.

## 📖 Sample payload_data

The sample data passed to the contract deployed for the showroom/sample can be fetched by using:
https://d33trozg86ya9x.cloudfront.net/data-packages/payload?data-packages/payload?unique-signers-count=1&data-service-id=redstone-rapid-demo&format=hex
That's an example endpoint for `redstone-rapid-demo` data-service id, also for the sample value of the signer that can
be used for the constructor (`0xf786a909D559F5Dee2dc6706d8e5A81728a39aE9`)

Then the hex response is needed to be split to single bytes, for example by using hexlify/arrayify functions
of ```ethers``` or ```starknet``` node packages.

📟 You can use: [Makefile](../../../../protocol/scripts/payload-generator/Makefile)  by
invoking ```make DATA_NAME=xxx prepare_data``` or
directly from the  [payload-generator](../../../../protocol/scripts/payload-generator/) environment directory.

📖 See: [README.md](../../README.md) to see the environment possibilities and sample scripts invoking the functions.

[//]: # (You can fetch also the utf-encoded raw-bytes format of the payload by using: https://d33trozg86ya9x.cloudfront.net/data-packages/payload?data-packages/payload?unique-signers-count=1&data-service-id=redstone-rapid-demo&format=raw)

To have defined your custom data-service id and signers, [contact us](#contact).

## ⚠ Possible transaction failures

* ⭕ More than ```3``` signatures to be verified can produce ```OUT_OF_RESOURCES``` Starknet error.
* The number of signers recovered from the signatures matched with ```addresses``` passed in the constructor 
must be greater or equal that the ```signer_count_threshold``` in the constructor, for each feed.
* The timestamp of data-packages must be not older than 15 minutes in relation to the ```block_timestamp```.
* The ```save_prices``` function consumes gas and must be paid by ETHers. The data are available on the contract just after the transaction is accepted on L2.

## 🙋‍Contact

Please feel free to contact us on [Discord](https://redstone.finance/discord) or send email to core@redstone.finance
