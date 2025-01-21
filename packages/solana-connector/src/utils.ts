export function hexToU8Array(hex: string): Uint8Array {
  return Uint8Array.from(Buffer.from(hex, "hex"));
}
