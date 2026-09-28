"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ExportCsvButton from "./ExportCsvButton";
import ThemeToggle from "../components/ThemeToggle";

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

  // ================= EXPORT DATA =================

  const exportLogs = filteredLogs.map((log) => ({
    id: log.id,
    user_name: getUserName(log.user_id),
    user_role: getUserRole(log.user_id),
    action: log.action,
    table_name: getTableLabel(log.table_name),
    record_id: log.record_id || "-",
    created_at: formatDateTime(log.created_at),
  }));

  function clearFilters() {
    setActionFilter("");
    setTableFilter("");
    setDateFilter("");
  }

  function getActionStyle(action: AuditLog["action"]) {
    if (action === "INSERT") {
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400";
    }

    if (action === "UPDATE") {
      return "border-amber-500/20 bg-amber-500/10 text-amber-500 dark:text-amber-400";
    }

    return "border-red-500/20 bg-red-500/10 text-red-500 dark:text-red-400";
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
      maintenance_records: "Maintenance",
    };

    return labels[tableName] || tableName;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white px-8 py-7 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
            📝
          </div>

          <p className="text-slate-600 dark:text-slate-300">
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
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-3xl">
            🔒
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            ไม่มีสิทธิ์เข้าถึง
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            เฉพาะ Admin และ Technician
            เท่านั้นที่สามารถดู Audit Log ได้
          </p>

          <button
            onClick={() =>
              (window.location.href =
                "/dashboard")
            }
            className="mt-6 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            ← กลับ Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* ================= HEADER ================= */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3 sm:items-center sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl shadow-lg shadow-blue-600/20 sm:h-14 sm:w-14 sm:text-2xl">
              📝
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-500 dark:text-blue-400 sm:text-xs sm:tracking-[0.2em]">
                System Monitoring
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Audit Log
              </h1>

              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
                ตรวจสอบประวัติการเปลี่ยนแปลงข้อมูลในระบบ
              </p>
            </div>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
            <ThemeToggle />

            <button
              onClick={() =>
                (window.location.href =
                  "/dashboard")
              }
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg transition hover:border-blue-500/50 hover:bg-slate-50 hover:text-slate-900 sm:flex-none sm:px-5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* ================= SUMMARY ================= */}

        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
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
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-600 shadow-lg dark:text-red-300">
            {message}
          </div>
        )}

        {/* ================= LOG LIST ================= */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          {/* List Header */}

          <div className="border-b border-slate-200 p-4 sm:p-6 dark:border-slate-800">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold sm:text-xl">
                  System Activity
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                  ประวัติการเพิ่ม แก้ไข และลบข้อมูล
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <div className="rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {filteredLogs.length} / {logs.length} รายการ
                </div>

                <ExportCsvButton
                  logs={exportLogs}
                />
              </div>
            </div>

            {/* Filters */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <select
                value={actionFilter}
                onChange={(e) =>
                  setActionFilter(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />

              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                ↻ ล้างตัวกรอง
              </button>
            </div>
          </div>

          {/* ================= DESKTOP TABLE ================= */}

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-slate-100 dark:bg-slate-800/70">
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
                      <EmptyState />
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-t border-slate-200 transition hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800/40"
                    >
                      {/* Date */}

                      <td className="px-6 py-5">
                        <p className="whitespace-nowrap font-semibold text-slate-700 dark:text-slate-200">
                          {formatDateTime(
                            log.created_at
                          )}
                        </p>
                      </td>

                      {/* User */}

                      <td className="px-6 py-5">
                        <UserInfo
                          name={getUserName(
                            log.user_id
                          )}
                          role={getUserRole(
                            log.user_id
                          )}
                        />
                      </td>

                      {/* Action */}

                      <td className="px-6 py-5">
                        <ActionBadge
                          action={log.action}
                          getActionStyle={
                            getActionStyle
                          }
                          getActionIcon={
                            getActionIcon
                          }
                        />
                      </td>

                      {/* Table */}

                      <td className="px-6 py-5">
                        <TableBadge
                          label={getTableLabel(
                            log.table_name
                          )}
                        />
                      </td>

                      {/* Record */}

                      <td className="px-6 py-5 font-mono text-sm text-slate-500 dark:text-slate-400">
                        #{log.record_id || "-"}
                      </td>

                      {/* Details */}

                      <td className="px-6 py-5">
                        <DetailsBlock log={log} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ================= MOBILE / TABLET CARDS ================= */}

          <div className="block lg:hidden">
            {filteredLogs.length === 0 ? (
              <div className="p-8 sm:p-12">
                <EmptyState />
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredLogs.map((log) => (
                  <AuditLogCard
                    key={log.id}
                    log={log}
                    userName={getUserName(
                      log.user_id
                    )}
                    userRole={getUserRole(
                      log.user_id
                    )}
                    tableLabel={getTableLabel(
                      log.table_name
                    )}
                    getActionStyle={
                      getActionStyle
                    }
                    getActionIcon={
                      getActionIcon
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}

        <p className="mt-6 px-4 text-center text-xs leading-5 text-slate-500 dark:text-slate-600">
          Automation Alarm & Maintenance Management System
        </p>
      </div>
    </main>
  );
}

/* =====================================================
   MOBILE AUDIT CARD
===================================================== */

function AuditLogCard({
  log,
  userName,
  userRole,
  tableLabel,
  getActionStyle,
  getActionIcon,
}: {
  log: AuditLog;
  userName: string;
  userRole: string;
  tableLabel: string;
  getActionStyle: (
    action: AuditLog["action"]
  ) => string;
  getActionIcon: (
    action: AuditLog["action"]
  ) => string;
}) {
  return (
    <div className="p-4 sm:p-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
        {/* Top row */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Date / Time
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
              {new Date(
                log.created_at
              ).toLocaleString("th-TH", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <ActionBadge
            action={log.action}
            getActionStyle={
              getActionStyle
            }
            getActionIcon={
              getActionIcon
            }
          />
        </div>

        {/* User / Table */}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              User
            </p>

            <div className="mt-2">
              <UserInfo
                name={userName}
                role={userRole}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Table
            </p>

            <div className="mt-2">
              <TableBadge label={tableLabel} />
            </div>
          </div>
        </div>

        {/* Record ID */}

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Record ID
          </p>

          <p className="mt-1 font-mono text-sm text-slate-600 dark:text-slate-400">
            #{log.record_id || "-"}
          </p>
        </div>

        {/* Details */}

        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
          <DetailsBlock log={log} />
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   USER INFO
===================================================== */

function UserInfo({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  return (
    <div>
      <p className="break-words font-semibold text-slate-900 dark:text-white">
        {name}
      </p>

      <p className="mt-1 text-xs capitalize text-slate-500 dark:text-slate-400">
        {role}
      </p>
    </div>
  );
}

/* =====================================================
   ACTION BADGE
===================================================== */

function ActionBadge({
  action,
  getActionStyle,
  getActionIcon,
}: {
  action: AuditLog["action"];
  getActionStyle: (
    action: AuditLog["action"]
  ) => string;
  getActionIcon: (
    action: AuditLog["action"]
  ) => string;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${getActionStyle(
        action
      )}`}
    >
      <span>{getActionIcon(action)}</span>

      {action}
    </span>
  );
}

/* =====================================================
   TABLE BADGE
===================================================== */

function TableBadge({
  label,
}: {
  label: string;
}) {
  return (
    <span className="inline-flex max-w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
      <span className="truncate">
        {label}
      </span>
    </span>
  );
}

/* =====================================================
   DETAILS
===================================================== */

function DetailsBlock({
  log,
}: {
  log: AuditLog;
}) {
  return (
    <details className="max-w-full">
      <summary className="cursor-pointer text-sm font-semibold text-blue-600 transition hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
        ดูรายละเอียด
      </summary>

      <div className="mt-3 space-y-3">
        {log.old_data && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-red-500 dark:text-red-400">
              Old Data
            </p>

            <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-300 bg-slate-100 p-3 text-xs leading-5 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
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
            <p className="mb-1 text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">
              New Data
            </p>

            <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-300 bg-slate-100 p-3 text-xs leading-5 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              {JSON.stringify(
                log.new_data,
                null,
                2
              )}
            </pre>
          </div>
        )}

        {!log.old_data &&
          !log.new_data && (
            <p className="rounded-xl border border-slate-200 bg-slate-100 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500">
              ไม่มีรายละเอียดข้อมูล
            </p>
          )}
      </div>
    </details>
  );
}

/* =====================================================
   EMPTY STATE
===================================================== */

function EmptyState() {
  return (
    <div className="mx-auto max-w-sm text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800">
        📝
      </div>

      <p className="mt-4 font-semibold text-slate-700 dark:text-slate-300">
        ไม่พบ Audit Log
      </p>

      <p className="mt-1 text-sm text-slate-500">
        ลองเปลี่ยนตัวกรอง
      </p>
    </div>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500 sm:text-sm">
            {title}
          </p>

          <p className="mt-1 text-xl font-bold text-slate-900 sm:mt-2 sm:text-2xl dark:text-white">
            {value}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-base sm:h-10 sm:w-10 sm:text-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}