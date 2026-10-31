// Classifies a stored service text for the dashboard counts.
export function classifyService(service: string | null): "ny" | "avsluta" | "annat" {
  const s = (service ?? "").toLowerCase();
  if (s.includes("nyförvaring")) return "ny";
  if (s.includes("avsluta")) return "avsluta";
  return "annat";
}
