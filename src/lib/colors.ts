export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function luminance(hex: string): number {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Cor de texto legível sobre a cor informada. */
export function readableOn(hex: string): string {
  if (!HEX_RE.test(hex)) return "#ffffff";
  return luminance(hex) > 0.45 ? "#1c1917" : "#ffffff";
}

export function isDark(hex: string): boolean {
  return HEX_RE.test(hex) && luminance(hex) < 0.2;
}

export function storeThemeVars(s: { primary_color: string; accent_color: string; background_color: string }) {
  const dark = isDark(s.background_color);
  return {
    "--brand": s.primary_color,
    "--brand-fg": readableOn(s.primary_color),
    "--accent": s.accent_color,
    "--accent-fg": readableOn(s.accent_color),
    "--page": s.background_color,
    "--ink": dark ? "#f5f5f4" : "#1c1917",
    "--ink-soft": dark ? "#d6d3d1" : "#57534e",
    "--card": dark ? "rgba(255,255,255,0.06)" : "#ffffff",
    "--line": dark ? "rgba(255,255,255,0.12)" : "rgba(28,25,23,0.10)",
  } as React.CSSProperties;
}
