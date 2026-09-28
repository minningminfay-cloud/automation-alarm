"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuditLog = {
  id: number;
  user_id: string | null;
  action: "INSERT" | "UPDATE" | "DELETE";
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  role: string;
};

export default function AuditLogsPage() {
  const supabase = createClient();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Filters
  const [actionFilter, setActionFilter] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  async function loadData() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/";
      return;
    }

    // Get current user's role
    const { data: currentProfile, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user.id)
        .single();

    if (profileError || !currentProfile) {
      setMessage("ไม่พบข้อมูลผู้ใช้งาน");
      setLoading(false);
      return;
    }

    setRole(currentProfile.role);

    // Audit Log ให้ Admin และ Technician ดู
    if (
      currentProfile.role !== "admin" &&
      currentProfile.role !== "technician"
    ) {
      setMessage("คุณไม่มีสิทธิ์เข้าถึง Audit Log");
      setLoading(false);
      return;
    }

    // Load audit logs
    const { data: auditData, error: auditError } =
      await supabase
        .from("audit_logs")
        .select(
          "id, user_id, action, table_name, record_id, old_data, new_data, created_at"
        )
        .order("created_at", { ascending: false });

    if (auditError) {
      setMessage(auditError.message);
      setLoading(false);
      return;
    }

    // Load profiles
    const { data: profileData, error: profilesError } =
      await supabase
        .from("profiles")
        .select("id, full_name, role");

    if (profilesError) {
      setMessage(profilesError.message);
      setLoading(false);
      return;
    }

    setLogs(auditData ?? []);
    setProfiles(profileData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function getUserName(userId: string | null) {
    if (!userId) {
      return "System";
    }

    const profile = profiles.find(
      (item) => item.id === userId
    );

    return profile?.full_name || "Unknown User";
  }

  function getUserRole(userId: string | null) {
    if (!userId) {
      return "System";
    }

    const profile = profiles.find(
      (item) => item.id === userId
    );

    return profile?.role || "-";
  }

  function formatDateTime(date: string) {
    return new Date(date).toLocaleString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getLocalDate(date: string) {
    const value = new Date(date);

    const year = value.getFullYear();
    const month = String(
      value.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
      value.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const filteredLogs = logs.filter((log) => {
    const actionMatch =
      !actionFilter ||
      log.action === actionFilter;

    const tableMatch =
      !tableFilter ||
      log.table_name === tableFilter;

    const dateMatch =
      !dateFilter ||
      getLocalDate(log.created_at) === dateFilter;

    return (
      actionMatch &&
      tableMatch &&
      dateMatch
    );
  });

  function clearFilters() {
    setActionFilter("");
    setTableFilter("");
    setDateFilter("");
  }

  function getActionStyle(action: AuditLog["action"]) {
    if (action === "INSERT") {
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
    }

    if (action === "UPDATE") {
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";
    }

    return "border-red-500/20 bg-red-500/10 text-red-400";
  }

  function getActionIcon(action: AuditLog["action"]) {
    if (action === "INSERT") {
      return "＋";
    }

    if (action === "UPDATE") {
      return "✏️";
    }

    return "🗑️";
  }

  function getTableLabel(tableName: string) {
    const labels: Record<string, string> = {
      machines: "Machines",
      alarms: "Alarms",
      maintenance_records:
        "Maintenance",
    };

    return labels[tableName] || tableName;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-8 py-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
            📝
          </div>

          <p className="text-slate-300">
            กำลังโหลด Audit Log...
          </p>
        </div>
      </main>
    );
  }

  if (
    role !== "admin" &&
    role !== "technician"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-3xl">
            🔒
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            ไม่มีสิทธิ์เข้าถึง
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            เฉพาะ Admin และ Technician
            เท่านั้นที่สามารถดู Audit Log ได้
          </p>

          <button
            onClick={() =>
              (window.location.href =
                "/dashboard")
            }
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            ← กลับ Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-8">

        {/* ================= HEADER ================= */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl shadow-lg shadow-blue-600/20">
              📝
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                System Monitoring
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Audit Log
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                ตรวจสอบประวัติการเปลี่ยนแปลงข้อมูลในระบบ
              </p>
            </div>

          </div>

          <button
            onClick={() =>
              (window.location.href =
                "/dashboard")
            }
            className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 shadow-lg transition hover:border-blue-500/50 hover:bg-slate-800 hover:text-white"
          >
            ← Dashboard
          </button>

        </div>

        {/* ================= SUMMARY ================= */}

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">

          <MiniStat
            title="Total Logs"
            value={logs.length}
            icon="📝"
          />

          <MiniStat
            title="Insert"
            value={
              logs.filter(
                (log) =>
                  log.action === "INSERT"
              ).length
            }
            icon="＋"
          />

          <MiniStat
            title="Update"
            value={
              logs.filter(
                (log) =>
                  log.action === "UPDATE"
              ).length
            }
            icon="✏️"
          />

          <MiniStat
            title="Delete"
            value={
              logs.filter(
                (log) =>
                  log.action === "DELETE"
              ).length
            }
            icon="🗑️"
          />

        </div>

        {/* ================= MESSAGE ================= */}

        {message && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 shadow-lg">
            {message}
          </div>
        )}

        {/* ================= LOG LIST ================= */}

        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">

          {/* List Header */}

          <div className="border-b border-slate-800 p-6">

            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-xl font-bold">
                  System Activity
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  ประวัติการเพิ่ม แก้ไข และลบข้อมูล
                </p>
              </div>

              <div className="rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300">
                {filteredLogs.length} /{" "}
                {logs.length} รายการ
              </div>

            </div>

            {/* Filters */}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">

              <select
                value={actionFilter}
                onChange={(e) =>
                  setActionFilter(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-200 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">
                  ทุก Action
                </option>

                <option value="INSERT">
                  INSERT
                </option>

                <option value="UPDATE">
                  UPDATE
                </option>

                <option value="DELETE">
                  DELETE
                </option>
              </select>

              <select
                value={tableFilter}
                onChange={(e) =>
                  setTableFilter(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-200 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">
                  ทุก Table
                </option>

                <option value="machines">
                  Machines
                </option>

                <option value="alarms">
                  Alarms
                </option>

                <option value="maintenance_records">
                  Maintenance
                </option>
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(
                    e.target.value
                  )
                }
                style={{
                  colorScheme: "dark",
                }}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-200 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white"
              >
                ↻ ล้างตัวกรอง
              </button>

            </div>

          </div>

          {/* ================= TABLE ================= */}

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px]">

              <thead className="bg-slate-800/70">

                <tr>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date / Time
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    User
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Table
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Record ID
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Details
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredLogs.length === 0 ? (
                  <tr>

                    <td
                      colSpan={6}
                      className="p-12 text-center"
                    >

                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl">
                        📝
                      </div>

                      <p className="mt-4 font-semibold text-slate-300">
                        ไม่พบ Audit Log
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        ลองเปลี่ยนตัวกรอง
                      </p>

                    </td>

                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-t border-slate-800 transition hover:bg-slate-800/40"
                    >

                      {/* Date */}

                      <td className="px-6 py-5">

                        <p className="font-semibold text-slate-200">
                          {formatDateTime(
                            log.created_at
                          )}
                        </p>

                      </td>

                      {/* User */}

                      <td className="px-6 py-5">

                        <div>
                          <p className="font-semibold text-white">
                            {getUserName(
                              log.user_id
                            )}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {getUserRole(
                              log.user_id
                            )}
                          </p>
                        </div>

                      </td>

                      {/* Action */}

                      <td className="px-6 py-5">

                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${getActionStyle(
                            log.action
                          )}`}
                        >
                          <span>
                            {getActionIcon(
                              log.action
                            )}
                          </span>

                          {log.action}
                        </span>

                      </td>

                      {/* Table */}

                      <td className="px-6 py-5">

                        <span className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-300">
                          {getTableLabel(
                            log.table_name
                          )}
                        </span>

                      </td>

                      {/* Record */}

                      <td className="px-6 py-5 font-mono text-sm text-slate-400">
                        #{log.record_id || "-"}
                      </td>

                      {/* Details */}

                      <td className="px-6 py-5">

                        <details className="max-w-md">

                          <summary className="cursor-pointer text-sm font-semibold text-blue-400 transition hover:text-blue-300">
                            ดูรายละเอียด
                          </summary>

                          <div className="mt-3 space-y-3">

                            {log.old_data && (
                              <div>
                                <p className="mb-1 text-xs font-semibold uppercase text-red-400">
                                  Old Data
                                </p>

                                <pre className="max-h-52 overflow-auto rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-400">
                                  {JSON.stringify(
                                    log.old_data,
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                            )}

                            {log.new_data && (
                              <div>
                                <p className="mb-1 text-xs font-semibold uppercase text-emerald-400">
                                  New Data
                                </p>

                                <pre className="max-h-52 overflow-auto rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-400">
                                  {JSON.stringify(
                                    log.new_data,
                                    null,
                                    2
                                  )}
                                </pre>
                              </div>
                            )}

                          </div>

                        </details>

                      </td>

                    </tr>
                  ))
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* Footer */}

        <p className="mt-6 text-center text-xs text-slate-700">
          Automation Alarm & Maintenance Management System
        </p>

      </div>
    </main>
  );
}

/* =====================================================
   MINI STAT
===================================================== */

function MiniStat({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
          {icon}
        </div>

      </div>

    </div>
  );
}