export function roundToSignificantDigits(num: number, number = 2): number {
  if (num === 0) return 0;

  const d = Math.ceil(Math.log10(num < 0 ? -num : num));
  const power = number - d;
  const magnitude = Math.pow(10, power);
  const shifted = Math.round(num * magnitude);

  return shifted / magnitude;
}

export function getFilenameWithoutExtension(url: string) {
  const fileNameWithExtension = url.substring(url.lastIndexOf("/") + 1);

  return fileNameWithExtension.split(".").slice(0, -1).join(".");
}
