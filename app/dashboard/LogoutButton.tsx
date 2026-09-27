"use client";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    window.location.href = "/";
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg bg-red-500 px-5 py-2.5 font-semibold text-white hover:bg-red-600"
    >
      Logout
    </button>
  );
}