const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function assertHex(hex: string): void {
  if (typeof hex !== "string" || !HEX_PATTERN.test(hex)) {
    throw new RangeError(`Invalid hex color: ${String(hex)}`);
  }
}

function hexToRgb(hex: string): readonly [number, number, number] {
  assertHex(hex);
  const digits =
    hex.length === 4
      ? `#${hex
          .slice(1)
          .split("")
          .map((c) => c + c)
          .join("")}`
      : hex;
  const value = Number.parseInt(digits.slice(1), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function channelLuminance(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return channelLuminance(r) * 0.2126 + channelLuminance(g) * 0.7152 + channelLuminance(b) * 0.0722;
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lighter = Math.max(relativeLuminance(hexA), relativeLuminance(hexB));
  const darker = Math.min(relativeLuminance(hexA), relativeLuminance(hexB));
  return (lighter + 0.05) / (darker + 0.05);
}
