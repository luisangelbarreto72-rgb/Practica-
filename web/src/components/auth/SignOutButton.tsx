"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/** Solo se muestra cuando Supabase está configurado (hay sesión que cerrar). */
export function SignOutButton() {
  const router = useRouter();
  if (!supabaseConfigured) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace("/login");
        router.refresh();
      }}
    >
      <LogOut className="size-4" />
    </Button>
  );
}
