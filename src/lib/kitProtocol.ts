// Helpers for the LvTS Kit Firmware's serial protocol (src/kit/lvts_kit.ino).
// Plain functions with no React, so tests/site/kit.test.ts can check them.

export interface KitReadings { POT: number; LDR: number; JX: number; JY: number; JSW: number; BTN: number; LINE: number; LED: number }

const KEYS: (keyof KitReadings)[] = ['POT', 'LDR', 'JX', 'JY', 'JSW', 'BTN', 'LINE', 'LED'];

/** Parses a STATUS reply ("POT=512 LDR=300 ...") into numbers. Returns null for any other line. */
export function parseStatus(line: string): KitReadings | null {
  if (!line.startsWith('POT=')) return null;
  const out: Partial<KitReadings> = {};
  for (const part of line.trim().split(/\s+/)) {
    const [k, v] = part.split('=');
    if ((KEYS as string[]).includes(k) && v !== undefined && /^\d+$/.test(v)) out[k as keyof KitReadings] = Number(v);
  }
  return KEYS.every((k) => out[k] !== undefined) ? (out as KitReadings) : null;
}

/**
 * An 8x8 grid (rows top to bottom, each row left to right) as the firmware's MATRIX command.
 * By default the left column is the row byte's highest bit; mirror flips that.
 */
export function matrixCommand(grid: boolean[][], mirror = false): string {
  const rows = grid.map((row) => {
    let v = 0;
    row.forEach((on, col) => { if (on) v |= 1 << (mirror ? col : 7 - col); });
    return v.toString(16).toUpperCase().padStart(2, '0');
  });
  return `MATRIX ${rows.join(' ')}`;
}

/** "#ff0080" to the firmware's "RGB 255 0 128". */
export function rgbCommand(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16) || 0;
  return `RGB ${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}
