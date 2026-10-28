import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

// Session + roles from the database. Roles are always read from user_roles, never from local storage.
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load(u: User | null) {
      setUser(u);
      if (!u) { setRoles([]); setLoading(false); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
      if (active) { setRoles((data ?? []).map(r => r.role)); setLoading(false); }
    }
    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") load(session?.user ?? null);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  return { user, roles, loading, hasRole: (r: AppRole) => roles.includes(r) };
}
