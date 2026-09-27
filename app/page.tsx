"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-[-180px] left-[-180px] w-[420px] h-[420px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute bottom-[-180px] right-[-180px] w-[420px] h-[420px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / System Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-8 w-8 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6h3m-7.5 4h12m-10 4h8m-10 4h12"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Automation Alarm
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Alarm & Maintenance Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-7 shadow-2xl shadow-black/30 backdrop-blur">
          {/* Card Header */}
          <div className="mb-7">
            <h2 className="text-xl font-semibold text-white">
              เข้าสู่ระบบ
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูลโรงงาน
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="Enter your email"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-white placeholder-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-white placeholder-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Error Message */}
            {message && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                <p className="text-sm text-red-400">{message}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 hover:shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </button>
          </form>

          {/* System Status */}
          <div className="mt-7 flex items-center justify-center gap-2 border-t border-slate-800 pt-5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />

            <span className="text-xs text-slate-500">
              System Online
            </span>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Automation & Maintenance Management System
        </p>
      </div>
    </main>
  );
}