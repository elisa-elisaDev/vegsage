"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export function SignOutButton({ label }: { label: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-red-500 hover:text-red-700 font-medium focus:outline-none focus:underline"
    >
      {label}
    </button>
  );
}
