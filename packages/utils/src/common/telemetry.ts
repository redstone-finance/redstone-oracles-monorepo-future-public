const seralizeToInfluxObj = (
  obj: Record<string, string | number | boolean | undefined>
) =>
  Object.entries(obj)
    .map(
      ([k, v]) =>
        `${fluxEscape(k)}=${fluxEscape(
          v !== undefined ? v.toString() : "undefined"
        )}`
    )
    .join(",");

function fluxEscape(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/,/g, "\\,")
    .replace(/=/g, "\\=")
    .replace(/ /g, "\\ ");
}

export const makeInfluxMetric = (
  name: string,
  tags: Record<string, string | number | boolean | undefined>,
  fields: Record<string, string | number | boolean>
) => {
  const parsedTags = seralizeToInfluxObj(tags);
  const parseFields = seralizeToInfluxObj(fields);

  return `${name},${parsedTags} ${parseFields} ${Date.now()}`;
};
