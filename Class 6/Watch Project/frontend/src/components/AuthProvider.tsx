"use client";

import { useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setIsAdmin, setLoading } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        setIsAdmin(profile?.is_admin ?? false);
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", session.user.id)
          .single();
        setIsAdmin(profile?.is_admin ?? false);
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setIsAdmin, setLoading]);

  return <>{children}</>;
}
