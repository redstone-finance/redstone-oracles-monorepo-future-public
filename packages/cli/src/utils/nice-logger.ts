import util from "util";

const log = (val: any) => {
  console.log(util.inspect(val, { depth: null, colors: true }));
};

export default {
  log,
};
