const stringify = global.JSON.stringify;

global.JSON.stringify = (value, _, space) => {
  return stringify(
    value,
    (_, value) => (typeof value === "bigint" ? value.toString() : value),
    space
  );
};
