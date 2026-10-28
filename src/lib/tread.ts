export type TreadColor = "red" | "orange" | "yellow" | "green" | "unknown";
export type TireSeason = "summer" | "winter";

// Separate season thresholds so future superadmin settings can replace defaults.
export const TREAD_THRESHOLDS = {
  summer: { orangeFrom: 1.7, yellowFrom: 2.1, greenFrom: 3.6, greenInclusive: true },
  winter: { orangeFrom: 3, yellowFrom: 4, greenFrom: 5, greenInclusive: false },
} satisfies Record<TireSeason, { orangeFrom: number; yellowFrom: number; greenFrom: number; greenInclusive: boolean }>;

export function tireSeason(tire: string): TireSeason | null {
  if (/vinter/i.test(tire)) return "winter";
  if (/sommar/i.test(tire)) return "summer";
  return null;
}

export function treadColor(depth: number | null | undefined, season: TireSeason | null): TreadColor {
  if (depth == null || !Number.isFinite(depth) || depth < 0 || !season) return "unknown";
  const limits = TREAD_THRESHOLDS[season];
  if (depth < limits.orangeFrom) return "red";
  if (depth < limits.yellowFrom) return "orange";
  if (limits.greenInclusive ? depth >= limits.greenFrom : depth > limits.greenFrom) return "green";
  return "yellow";
}