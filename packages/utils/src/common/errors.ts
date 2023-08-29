export const assert = (condition: boolean, errMsg?: string) => {
  if (!condition) {
    const errText = `Assertion failed: ` + (errMsg ? `: ${errMsg}` : "");
    throw new Error(errText);
  }
};

export const assertWithLog = (condition: boolean, errMsg?: string) => {
  if (!condition) {
    const errText = `Assertion failed: ` + (errMsg ? `: ${errMsg}` : "");
    console.error(errText);
  }
};
