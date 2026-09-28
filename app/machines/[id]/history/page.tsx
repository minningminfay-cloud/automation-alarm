"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Machine = {
  id: number;
  machine_id: string;
  name: string;
  type: string;
  location: string;
  status: "Running" | "Stop" | "Alarm" | "Maintenance";
};

type Alarm = {
  id: number;
  alarm_code: string;
  description: string;
  alarm_datetime: string;
  cause: string | null;
  status: string;
};

type Maintenance = {
  id: number;
  maintenance_type: string;
  problem: string;
  action_taken: string;
  technician_id: string | null;
  maintenance_date: string;
  end_date: string;
  status: string;
};

export default function MachineHistoryPage() {
  const supabase = createClient();

  const [machine, setMachine] = useState<Machine | null>(null);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadHistory() {
    setLoading(true);
    setMessage("");

    const pathParts = window.location.pathname.split("/");
    const machineId = Number(pathParts[2]);

    if (!machineId) {
      setMessage("ไม่พบ Machine ID");
      setLoading(false);
      return;
    }

    // Load machine
    const {
      data: machineData,
      error: machineError,
    } = await supabase
      .from("machines")
      .select("*")
      .eq("id", machineId)
      .single();

    if (machineError || !machineData) {
      setMessage(
        machineError?.message ?? "ไม่พบข้อมูลเครื่องจักร"
      );
      setLoading(false);
      return;
    }

    setMachine(machineData);

    // Load alarm history
    const { data: alarmData, error: alarmError } = await supabase
      .from("alarms")
      .select(
        "id, alarm_code, description, alarm_datetime, cause, status"
      )
      .eq("machine_id", machineId)
      .order("alarm_datetime", { ascending: false });

    if (alarmError) {
      setMessage(alarmError.message);
      setLoading(false);
      return;
    }

    setAlarms(alarmData ?? []);

    // Load maintenance history
    const {
      data: maintenanceData,
      error: maintenanceError,
    } = await supabase
      .from("maintenance_records")
      .select(
        "id, maintenance_type, problem, action_taken, technician_id, maintenance_date, end_date, status"
      )
      .eq("machine_id", machineId)
      .order("maintenance_date", { ascending: false });

    if (maintenanceError) {
      setMessage(maintenanceError.message);
      setLoading(false);
      return;
    }

    setMaintenance(maintenanceData ?? []);

    setLoading(false);
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function formatDate(date: string) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  function formatDateTime(date: string) {
    if (!date) return "-";

    return new Date(date).toLocaleString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-8 py-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
            🏭
          </div>

          <p className="text-slate-300">
            กำลังโหลดประวัติเครื่องจักร...
          </p>
        </div>
      </main>
    );
  }

  if (!machine) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <p className="text-red-400">
            {message || "ไม่พบข้อมูลเครื่องจักร"}
          </p>

          <button
            onClick={() => (window.location.href = "/machines")}
            className="mt-5 rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            ← กลับหน้า Machines
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
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
              Machine History
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {machine.machine_id}
            </h1>

            <p className="mt-1 text-slate-400">
              ประวัติ Alarm และ Maintenance ของเครื่องจักร
            </p>
          </div>

          <button
            onClick={() => (window.location.href = "/machines")}
            className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 shadow-lg transition hover:border-blue-500/50 hover:bg-slate-800 hover:text-white"
          >
            ← กลับหน้า Machines
          </button>
        </div>

        {/* Machine Information */}
        <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-xl">
              🏭
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Machine Information
              </h2>

              <p className="text-sm text-slate-500">
                ข้อมูลเครื่องจักร
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              label="Machine ID"
              value={machine.machine_id}
            />

            <InfoCard
              label="Name"
              value={machine.name}
            />

            <InfoCard
              label="Type"
              value={machine.type}
            />

            <InfoCard
              label="Location"
              value={machine.location}
            />
          </div>

          <div className="mt-4">
            <span className="text-sm text-slate-500">
              Current Status
            </span>

            <div className="mt-2">
              <MachineStatusBadge status={machine.status} />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard
            title="Total Alarms"
            value={alarms.length}
            icon="🚨"
          />

          <SummaryCard
            title="Maintenance Records"
            value={maintenance.length}
            icon="🔧"
          />

          <SummaryCard
            title="Total History"
            value={alarms.length + maintenance.length}
            icon="📋"
          />
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {message}
          </div>
        )}

        {/* Alarm History */}
        <section className="mb-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
          <div className="border-b border-slate-800 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                🚨
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Alarm History
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  ประวัติ Alarm ของเครื่องจักร
                </p>
              </div>
            </div>
          </div>

          {alarms.length === 0 ? (
            <EmptyState text="ยังไม่มีประวัติ Alarm" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-slate-800/70">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Alarm Code
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Description
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Date / Time
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Cause
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {alarms.map((alarm) => (
                    <tr
                      key={alarm.id}
                      className="border-t border-slate-800 transition hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-5 font-semibold text-white">
                        {alarm.alarm_code}
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {alarm.description || "-"}
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {formatDateTime(alarm.alarm_datetime)}
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {alarm.cause || "-"}
                      </td>

                      <td className="px-6 py-5">
                        <AlarmStatusBadge status={alarm.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Maintenance History */}
        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
          <div className="border-b border-slate-800 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                🔧
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Maintenance History
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  ประวัติการบำรุงรักษาเครื่องจักร
                </p>
              </div>
            </div>
          </div>

          {maintenance.length === 0 ? (
            <EmptyState text="ยังไม่มีประวัติ Maintenance" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-slate-800/70">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Type
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Problem
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Action Taken
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Date
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      End Date
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {maintenance.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-800 transition hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-5 font-semibold text-white">
                        {item.maintenance_type}
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {item.problem || "-"}
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {item.action_taken || "-"}
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {formatDate(item.maintenance_date)}
                      </td>

                      <td className="px-6 py-5 text-slate-300">
                        {formatDate(item.end_date)}
                      </td>

                      <td className="px-6 py-5">
                        <MaintenanceStatusBadge
                          status={item.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-slate-700">
          Automation Alarm & Maintenance Management System
        </p>
      </div>
    </main>
  );
}

/* =====================================================
   INFO CARD
===================================================== */

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 font-semibold text-white">
        {value || "-"}
      </p>
    </div>
  );
}

/* =====================================================
   SUMMARY CARD
===================================================== */

function SummaryCard({
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

/* =====================================================
   MACHINE STATUS
===================================================== */

function MachineStatusBadge({
  status,
}: {
  status: Machine["status"];
}) {
  const styles = {
    Running:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",

    Stop:
      "border-slate-600 bg-slate-800 text-slate-300",

    Alarm:
      "border-red-500/20 bg-red-500/10 text-red-400",

    Maintenance:
      "border-amber-500/20 bg-amber-500/10 text-amber-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

/* =====================================================
   ALARM STATUS
===================================================== */

function AlarmStatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    Open:
      "border-red-500/20 bg-red-500/10 text-red-400",

    "In Progress":
      "border-amber-500/20 bg-amber-500/10 text-amber-400",

    Closed:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${
        styles[status] ??
        "border-slate-600 bg-slate-800 text-slate-300"
      }`}
    >
      {status}
    </span>
  );
}

/* =====================================================
   MAINTENANCE STATUS
===================================================== */

function MaintenanceStatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    Pending:
      "border-slate-600 bg-slate-800 text-slate-300",

    "In Progress":
      "border-blue-500/20 bg-blue-500/10 text-blue-400",

    "Waiting Part":
      "border-orange-500/20 bg-orange-500/10 text-orange-400",

    Completed:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${
        styles[status] ??
        "border-slate-600 bg-slate-800 text-slate-300"
      }`}
    >
      {status}
    </span>
  );
}

/* =====================================================
   EMPTY STATE
===================================================== */

function EmptyState({ text }: { text: string }) {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl">
        📋
      </div>

      <p className="mt-4 font-semibold text-slate-300">
        {text}
      </p>

      <p className="mt-1 text-sm text-slate-600">
        ยังไม่มีข้อมูลสำหรับเครื่องจักรนี้
      </p>
    </div>
  );
}