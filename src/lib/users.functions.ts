import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  role: z.enum(["superadmin", "useradmin", "mekaniker", "kund"]),
});

// Superadmin creates a ready-to-use (pre-confirmed) account with a chosen role.
export const createUserWithRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "superadmin" });
    const { data: isUserAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "useradmin" });
    // Användaradmin får bara skapa mekaniker- och kundkonton.
    if (!isSuper && !(isUserAdmin && (data.role === "mekaniker" || data.role === "kund"))) throw new Error("Du har inte behörighet att skapa den här typen av konto");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true,
      user_metadata: { display_name: data.name, full_name: data.name },
    });
    if (error || !created.user) {
      const msg = error?.message ?? "";
      throw new Error(/already|registered|exists/i.test(msg) ? "E-postadressen finns redan" : "Kunde inte skapa användaren");
    }
    const id = created.user.id;
    await supabaseAdmin.from("profiles").update({ display_name: data.name, email: data.email }).eq("id", id);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", id);
    const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({ user_id: id, role: data.role });
    if (roleErr) throw new Error("Användaren skapades men rollen kunde inte sparas");
    return { id, email: data.email };
  });

// Superadmin sets a new password for another account (e.g. a mechanic who forgot it).
export const setUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), password: z.string().min(8).max(72) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "superadmin" });
    if (!isAdmin) throw new Error("Endast superadmin kan byta lösenord");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.password });
    if (error) throw new Error(/weak|pwned|leaked/i.test(error.message) ? "Lösenordet är för svagt eller känt från dataläckor – välj ett annat" : "Kunde inte byta lösenord");
    return { ok: true };
  });
