# Request Execute Benchmark

The request execute model has two main components. Firstly, the client sends a request to the contract, which is saved along with all relevant information. Secondly, the request processor listens for this request and performs the necessary actions to execute it.

The benchmark compares two different implementations of the request execute architecture. In the first approach, called the StorageStructureModel, the request is saved as a structure in a contract's mapping with each argument of the request being saved as separate fields within the structure. During the execution phase, the processor reads the structure from the storage and performs the required computations.

In contrast, the second approach, called the HashCalldataModel, aims to reduce the memory usage of the first model. Instead of storing requests as structures, this approach stores a hash of the arguments in a mapping. When the processor is called with the original request arguments, it computes the hash and searches for a match.

The benefit of the HashCalldataModel is that it reduces memory usage as it only stores a hash of the arguments rather than allocating fields for each argument.

The benchmarks evaluate the performance based on the following variables:

- Number of arguments passed
- Delete the request after execution

```js
{
  "3 arguments, false delete struct, false delete hash": {
    "forSavingRequestAsStruct": 169509,
    "forSavingRequestAsHash": 58742,
    "forExecutingRequestAsStruct": 128966,
    "forExecutingRequestAsHash": 130372
  },
  "5 arguments, false delete struct, false delete hash": {
    "forSavingRequestAsStruct": 223553,
    "forSavingRequestAsHash": 68628,
    "forExecutingRequestAsStruct": 179491,
    "forExecutingRequestAsHash": 181465
  },
  "10 arguments, false delete struct, false delete hash": {
    "forSavingRequestAsStruct": 358775,
    "forSavingRequestAsHash": 93251,
    "forExecutingRequestAsStruct": 305919,
    "forExecutingRequestAsHash": 309139
  },
  "3 arguments, false delete struct, true delete hash": {
    "forSavingRequestAsStruct": 169509,
    "forSavingRequestAsHash": 58742,
    "forExecutingRequestAsStruct": 128966,
    "forExecutingRequestAsHash": 128659
  },
  "5 arguments, false delete struct, true delete hash": {
    "forSavingRequestAsStruct": 223553,
    "forSavingRequestAsHash": 68628,
    "forExecutingRequestAsStruct": 179491,
    "forExecutingRequestAsHash": 179752
  },
  "10 arguments, false delete struct, true delete hash": {
    "forSavingRequestAsStruct": 358775,
    "forSavingRequestAsHash": 93251,
    "forExecutingRequestAsStruct": 305919,
    "forExecutingRequestAsHash": 307426
  },
  "3 arguments, true delete struct, true delete hash": {
    "forSavingRequestAsStruct": 169509,
    "forSavingRequestAsHash": 58742,
    "forExecutingRequestAsStruct": 128010,
    "forExecutingRequestAsHash": 128659
  },
  "5 arguments, true delete struct, true delete hash": {
    "forSavingRequestAsStruct": 223553,
    "forSavingRequestAsHash": 68628,
    "forExecutingRequestAsStruct": 178968,
    "forExecutingRequestAsHash": 179752
  },
  "10 arguments, true delete struct, true delete hash": {
    "forSavingRequestAsStruct": 358775,
    "forSavingRequestAsHash": 93251,
    "forExecutingRequestAsStruct": 306468,
    "forExecutingRequestAsHash": 307426
  }
}
```

The results showcase a considerable gas advantage on saving the data. The costs for executing the requests are comparable.
