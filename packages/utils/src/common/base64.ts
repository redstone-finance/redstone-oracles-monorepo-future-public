export function fromBase64(base64Str: string): string {
  const buff = Buffer.from(base64Str, "base64");
  return buff.toString("utf-8");
}

export function toBase64(str: string): string {
  const buff = Buffer.from(str, "utf-8");
  return buff.toString("base64");
}
