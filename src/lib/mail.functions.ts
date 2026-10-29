import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Sends a test e-mail with the saved mail settings. Superadmin only (RLS on mail_settings).
export const sendTestMail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ to: z.string().trim().email().max(255) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "superadmin" });
    if (!isSuper) return { ok: false as const, error: "Endast superadmin kan skicka testmejl." };
    const { data: row } = await context.supabase.from("mail_settings").select("*").eq("id", 1).maybeSingle();
    const { resolveMailConfig, sendMail } = await import("./booking-email");
    const cfg = resolveMailConfig(row, process.env);
    if (!cfg) return { ok: false as const, error: "Fyll i server och avsändaradress först (och se till att utskick är på)." };
    try {
      await sendMail(cfg, data.to, { subject: "Testmejl från bokningssystemet", text: "Det här är ett testmejl. E-postinställningarna fungerar.", html: "<p>Det här är ett testmejl. E-postinställningarna fungerar.</p>" });
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: `Kunde inte skicka: ${e instanceof Error ? e.message : String(e)}` };
    }
  });
