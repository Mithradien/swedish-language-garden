// Booking confirmation e-mail. Text building is pure (tested); sending uses the
// workshop's own SMTP server configured through SMTP_* environment variables,
// so it works the same on the self-hosted server. Never throws: a failed mail
// must not undo a booking.

export type Company = { company?: string; phone?: string; email?: string; address?: string; postalCode?: string; city?: string };
export type BookingMail = { name: string; regnr: string; date: string; time: string; service: string; price?: string | null; siteUrl?: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function formatSwedishDate(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return d.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function buildConfirmation(b: BookingMail, c: Company) {
  const shop = c.company?.trim() || "Verkstaden";
  const place = [c.address, [c.postalCode, c.city].filter(Boolean).join(" ")].filter((s) => s && s.trim()).join(", ");
  const rows: [string, string][] = [
    ["Registreringsnummer", b.regnr],
    ["Datum", formatSwedishDate(b.date)],
    ["Tid", b.time],
    ["Tjänst", b.service],
    ...(b.price ? [["Pris", b.price] as [string, string]] : []),
    ...(place ? [["Adress", place] as [string, string]] : []),
  ];
  const subject = `Bokningsbekräftelse ${b.regnr} – ${b.date} kl. ${b.time}`;
  const contact = [c.phone && `Telefon: ${c.phone}`, c.email && `E-post: ${c.email}`].filter(Boolean) as string[];
  const link = b.siteUrl ? `${b.siteUrl.replace(/\/$/, "")}/kund` : "";
  const text = [
    `Hej ${b.name}!`, "", `Tack för din bokning hos ${shop}.`, "",
    ...rows.map(([k, v]) => `${k}: ${v}`), "",
    ...(link ? [`Se, ändra eller avboka din tid på Mina sidor: ${link}`, ""] : []),
    ...contact, "", `Välkommen!`, shop,
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,sans-serif;color:#1a1a1a">
<div style="max-width:560px;margin:0 auto;padding:24px">
<h1 style="font-size:20px;margin:0 0 16px">Bokningsbekräftelse</h1>
<p>Hej ${esc(b.name)}!</p><p>Tack för din bokning hos ${esc(shop)}.</p>
<table style="border-collapse:collapse;width:100%;margin:16px 0">${rows.map(([k, v]) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;color:#666">${esc(k)}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;font-weight:bold">${esc(v)}</td></tr>`).join("")}</table>
${link ? `<p><a href="${esc(link)}" style="display:inline-block;background:#f9cc21;color:#1a1a1a;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold">Mina sidor – ändra eller avboka</a></p>` : ""}
${contact.length ? `<p style="color:#666;font-size:13px">${contact.map(esc).join("<br>")}</p>` : ""}
<p>Välkommen!<br>${esc(shop)}</p></div></body></html>`;
  return { subject, text, html };
}

export type MailConfig = { host: string; port: number; username: string; password: string; from_address: string; site_url: string; enabled: boolean };

/** Saved settings (Inställningar → E-post) win; SMTP_* env vars are the fallback. */
export function resolveMailConfig(saved: Partial<MailConfig> | null, env: Record<string, string | undefined>): MailConfig | null {
  if (saved && saved.enabled === false) return null;
  const host = saved?.host || env["SMTP_HOST"] || "";
  const from = saved?.from_address || env["SMTP_FROM"] || "";
  if (!host || !from) return null;
  return {
    host, from_address: from, enabled: true,
    port: saved?.host ? saved.port || 587 : Number(env["SMTP_PORT"] || 587),
    username: saved?.host ? saved.username ?? "" : env["SMTP_USER"] ?? "",
    password: saved?.host ? saved.password ?? "" : env["SMTP_PASS"] ?? "",
    site_url: saved?.site_url || env["SITE_URL"] || "",
  };
}

export async function sendMail(cfg: MailConfig, to: string, m: { subject: string; text: string; html: string }, fromName?: string, replyTo?: string) {
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: cfg.host, port: cfg.port, secure: cfg.port === 465,
    auth: cfg.username ? { user: cfg.username, pass: cfg.password } : undefined,
  });
  await transport.sendMail({ from: fromName ? `"${fromName.replace(/"/g, "")}" <${cfg.from_address}>` : cfg.from_address, to, replyTo: replyTo || undefined, ...m });
}

export async function sendBookingConfirmation(to: string, b: BookingMail, c: Company, cfg: MailConfig | null): Promise<boolean> {
  if (!cfg) { console.warn("[mail] e-postinställningar saknas – inget bekräftelsemail skickat"); return false; }
  try {
    await sendMail(cfg, to, buildConfirmation({ ...b, siteUrl: cfg.site_url || b.siteUrl }, c), c.company, c.email);
    return true;
  } catch (e) {
    console.error("[mail] kunde inte skicka bekräftelse", e);
    return false;
  }
}
