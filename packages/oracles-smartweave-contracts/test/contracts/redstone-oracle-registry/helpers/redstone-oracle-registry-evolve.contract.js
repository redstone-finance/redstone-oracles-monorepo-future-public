(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) =>
    key in obj
      ? __defProp(obj, key, {
          enumerable: true,
          configurable: true,
          writable: true,
          value,
        })
      : (obj[key] = value);
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop)) __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop)) __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __objRest = (source, exclude) => {
    var target = {};
    for (var prop in source)
      if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
        target[prop] = source[prop];
    if (source != null && __getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(source)) {
        if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
          target[prop] = source[prop];
      }
    return target;
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) =>
        x.done
          ? resolve(x.value)
          : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/contracts/redstone-oracle-registry/data-services/write/createDataService.ts
  var createDataService = (state, action) => {
    const data = action.input.data;
    const isValidData =
      data.id &&
      data.name &&
      data.logo &&
      data.description &&
      data.manifestTxId;
    if (!isValidData) {
      throw new ContractError("Invalid data feed data");
    }
    const _a = data,
      { id } = _a,
      restData = __objRest(_a, ["id"]);
    if (state.dataServices[id]) {
      throw new ContractError(`Data feed with id ${id} already exists`);
    }
    restData.name = "evolveName";
    restData.manifestTxId = "evolveManifestTxId";
    restData.logo = "evolveLogo";
    restData.description = "evolveDescription";
    state.dataServices[id] = __spreadProps(__spreadValues({}, restData), {
      admin: action.caller,
    });
    return { state };
  };

  // src/contracts/redstone-oracle-registry/handleEvolve.ts
  var handleEvolve = (state, action) => {
    if (!state.canEvolve) {
      throw new ContractError("Contract cannot evolve");
    }
    if (!state.contractAdmins.some((admin) => admin === action.caller)) {
      throw new ContractError("Only the admin can evolve a contract");
    }
    const data = action.input.data;
    state.evolve = data.evolveTransactionId;
    return { state };
  };

  // src/contracts/redstone-oracle-registry/redstone-oracle-registry.contract.ts
  var handle = (state, action) =>
    __async(void 0, null, function* () {
      const { input } = action;
      switch (input.function) {
        case "createDataService":
          return createDataService(state, action);
        case "evolve":
          return handleEvolve(state, action);
        default:
          throw new ContractError(
            `No function supplied or function not recognized: "${input.function}"`
          );
      }
    });
})();
