"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/app/components/ThemeToggle";

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
  end_date: string | null;
  status: string;
};

type Technician = {
  id: string;
  full_name: string | null;
  role: string;
};

export default function MachineHistoryPage() {
  const supabase = createClient();

  const [machine, setMachine] = useState<Machine | null>(null);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
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

    // =========================
    // Machine
    // =========================

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

    // =========================
    // Alarm History
    // =========================

    const {
      data: alarmData,
      error: alarmError,
    } = await supabase
      .from("alarms")
      .select(
        "id, alarm_code, description, alarm_datetime, cause, status"
      )
      .eq("machine_id", machineId)
      .order("alarm_datetime", {
        ascending: false,
      });

    if (alarmError) {
      setMessage(alarmError.message);
      setLoading(false);
      return;
    }

    setAlarms(alarmData ?? []);

    // =========================
    // Maintenance History
    // =========================

    const {
      data: maintenanceData,
      error: maintenanceError,
    } = await supabase
      .from("maintenance_records")
      .select(
        "id, maintenance_type, problem, action_taken, technician_id, maintenance_date, end_date, status"
      )
      .eq("machine_id", machineId)
      .order("maintenance_date", {
        ascending: false,
      });

    if (maintenanceError) {
      setMessage(maintenanceError.message);
      setLoading(false);
      return;
    }

    setMaintenance(maintenanceData ?? []);

    // =========================
    // Technician
    // =========================

    const technicianIds = Array.from(
      new Set(
        (maintenanceData ?? [])
          .map((item) => item.technician_id)
          .filter(
            (id): id is string => Boolean(id)
          )
      )
    );

    if (technicianIds.length > 0) {
      const {
        data: technicianData,
        error: technicianError,
      } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .in("id", technicianIds);

      if (technicianError) {
        setMessage(technicianError.message);
      } else {
        setTechnicians(technicianData ?? []);
      }
    } else {
      setTechnicians([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function formatDate(date: string | null) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "th-TH",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    );
  }

  function formatDateTime(date: string) {
    if (!date) return "-";

    return new Date(date).toLocaleString(
      "th-TH",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function getTechnicianName(
    technicianId: string | null
  ) {
    if (!technicianId) {
      return "-";
    }

    const technician = technicians.find(
      (item) => item.id === technicianId
    );

    if (!technician) {
      return technicianId.slice(0, 8) + "...";
    }

    return (
      technician.full_name ||
      technicianId.slice(0, 8) + "..."
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white px-6 py-7 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:px-8">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
            🏭
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            กำลังโหลดประวัติเครื่องจักร...
          </p>
        </div>
      </main>
    );
  }

  if (!machine) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center sm:p-8">
          <p className="text-sm text-red-600 dark:text-red-400 sm:text-base">
            {message || "ไม่พบข้อมูลเครื่องจักร"}
          </p>

          <button
            onClick={() =>
              (window.location.href = "/machines")
            }
            className="mt-5 w-full rounded-xl border border-slate-300 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
          >
            ← กลับหน้า Machines
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      {/* ================= BACKGROUND ================= */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl sm:h-96 sm:w-96" />

        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl sm:h-96 sm:w-96" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        {/* ================= HEADER ================= */}

        <header className="mb-7">
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-500 dark:text-blue-400 sm:text-xs sm:tracking-[0.2em]">
                  Machine History
                </p>

                <h1 className="mt-2 break-words text-2xl font-bold tracking-tight sm:text-3xl">
                  {machine.machine_id}
                </h1>

                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
                  ประวัติ Alarm และ Maintenance ของเครื่องจักร
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
                <ThemeToggle />

                <button
                  onClick={() =>
                    (window.location.href = "/machines")
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-lg transition hover:border-blue-500/50 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white sm:w-auto"
                >
                  ← กลับหน้า Machines
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ================= MACHINE INFORMATION ================= */}

        <section className="mb-7 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:mb-8 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-xl sm:h-12 sm:w-12">
              🏭
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-bold sm:text-xl">
                Machine Information
              </h2>

              <p className="text-xs text-slate-500 sm:text-sm">
                ข้อมูลเครื่องจักร
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
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

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Current Status
            </span>

            <div className="mt-2">
              <MachineStatusBadge
                status={machine.status}
              />
            </div>
          </div>
        </section>

        {/* ================= SUMMARY ================= */}

        <section className="mb-7 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-3 sm:gap-4">
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
            value={
              alarms.length +
              maintenance.length
            }
            icon="📋"
          />
        </section>

        {/* ================= MESSAGE ================= */}

        {message && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-600 dark:text-red-300">
            {message}
          </div>
        )}

        {/* =====================================================
            ALARM HISTORY
        ===================================================== */}

        <section className="mb-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:mb-8">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                🚨
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold sm:text-xl">
                  Alarm History
                </h2>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  ประวัติ Alarm ของเครื่องจักร
                </p>
              </div>
            </div>
          </div>

          {alarms.length === 0 ? (
            <EmptyState text="ยังไม่มีประวัติ Alarm" />
          ) : (
            <>
              {/* Desktop / Tablet */}

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-slate-100 dark:bg-slate-800/70">
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
                        className="border-t border-slate-200 transition hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-6 py-5 font-semibold text-slate-900 dark:text-white">
                          {alarm.alarm_code}
                        </td>

                        <td className="max-w-xs px-6 py-5 text-slate-600 dark:text-slate-300">
                          {alarm.description || "-"}
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-slate-600 dark:text-slate-300">
                          {formatDateTime(
                            alarm.alarm_datetime
                          )}
                        </td>

                        <td className="max-w-xs px-6 py-5 text-slate-600 dark:text-slate-300">
                          {alarm.cause || "-"}
                        </td>

                        <td className="px-6 py-5">
                          <AlarmStatusBadge
                            status={alarm.status}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile / Small Tablet */}

              <div className="grid grid-cols-1 gap-3 p-3 lg:hidden">
                {alarms.map((alarm) => (
                  <AlarmHistoryCard
                    key={alarm.id}
                    alarm={alarm}
                    formatDateTime={formatDateTime}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* =====================================================
            MAINTENANCE HISTORY
        ===================================================== */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                🔧
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold sm:text-xl">
                  Maintenance History
                </h2>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  ประวัติการบำรุงรักษาเครื่องจักร
                </p>
              </div>
            </div>
          </div>

          {maintenance.length === 0 ? (
            <EmptyState text="ยังไม่มีประวัติ Maintenance" />
          ) : (
            <>
              {/* Desktop / Tablet */}

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1250px]">
                  <thead className="bg-slate-100 dark:bg-slate-800/70">
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
                        Technician
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Start Date
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
                        className="border-t border-slate-200 transition hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-6 py-5 font-semibold text-slate-900 dark:text-white">
                          {item.maintenance_type}
                        </td>

                        <td className="max-w-xs px-6 py-5 text-slate-600 dark:text-slate-300">
                          {item.problem || "-"}
                        </td>

                        <td className="max-w-xs px-6 py-5 text-slate-600 dark:text-slate-300">
                          {item.action_taken || "-"}
                        </td>

                        <td className="px-6 py-5">
                          <TechnicianInfo
                            technicianId={
                              item.technician_id
                            }
                            technicianName={getTechnicianName(
                              item.technician_id
                            )}
                          />
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-slate-600 dark:text-slate-300">
                          {formatDate(
                            item.maintenance_date
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-5 text-slate-600 dark:text-slate-300">
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

              {/* Mobile / Small Tablet */}

              <div className="grid grid-cols-1 gap-3 p-3 lg:hidden">
                {maintenance.map((item) => (
                  <MaintenanceHistoryCard
                    key={item.id}
                    item={item}
                    technicianName={getTechnicianName(
                      item.technician_id
                    )}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        <p className="mt-7 text-center text-xs text-slate-500 dark:text-slate-700">
          Automation Alarm & Maintenance Management System
        </p>
      </div>
    </main>
  );
}

/* =====================================================
   ALARM HISTORY CARD
===================================================== */

function AlarmHistoryCard({
  alarm,
  formatDateTime,
}: {
  alarm: Alarm;
  formatDateTime: (date: string) => string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Alarm Code
            </p>

            <p className="mt-1 break-words text-base font-bold text-slate-900 dark:text-white">
              {alarm.alarm_code}
            </p>
          </div>

          <AlarmStatusBadge status={alarm.status} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <HistoryField
            label="Date / Time"
            value={formatDateTime(
              alarm.alarm_datetime
            )}
          />

          <HistoryField
            label="Cause"
            value={alarm.cause || "-"}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Description
          </p>

          <p className="mt-1 break-words text-sm leading-6 text-slate-700 dark:text-slate-300">
            {alarm.description || "-"}
          </p>
        </div>
      </div>
    </article>
  );
}

/* =====================================================
   MAINTENANCE HISTORY CARD
===================================================== */

function MaintenanceHistoryCard({
  item,
  technicianName,
  formatDate,
}: {
  item: Maintenance;
  technicianName: string;
  formatDate: (date: string | null) => string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Maintenance Type
            </p>

            <p className="mt-1 break-words text-base font-bold text-slate-900 dark:text-white">
              {item.maintenance_type}
            </p>
          </div>

          <div className="self-start">
            <MaintenanceStatusBadge
              status={item.status}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <HistoryField
            label="Start Date"
            value={formatDate(
              item.maintenance_date
            )}
          />

          <HistoryField
            label="End Date"
            value={formatDate(item.end_date)}
          />

          <HistoryField
            label="Technician"
            value={technicianName}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextHistoryField
            label="Problem"
            value={item.problem || "-"}
          />

          <TextHistoryField
            label="Action Taken"
            value={item.action_taken || "-"}
          />
        </div>

        {item.technician_id && (
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Technician ID
            </p>

            <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">
              {item.technician_id}
            </p>
          </div>
        )}
      </div>
    </article>
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words font-semibold text-slate-900 dark:text-white">
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 sm:text-sm">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:mt-2 sm:text-3xl">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-lg sm:h-11 sm:w-11">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   HISTORY FIELD
===================================================== */

function HistoryField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-700 dark:text-slate-300">
        {value}
      </p>
    </div>
  );
}

/* =====================================================
   TEXT HISTORY FIELD
===================================================== */

function TextHistoryField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm leading-6 text-slate-700 dark:text-slate-300">
        {value}
      </p>
    </div>
  );
}

/* =====================================================
   TECHNICIAN INFO
===================================================== */

function TechnicianInfo({
  technicianId,
  technicianName,
}: {
  technicianId: string | null;
  technicianName: string;
}) {
  return (
    <div>
      <p className="font-semibold text-slate-900 dark:text-white">
        {technicianName}
      </p>

      {technicianId && (
        <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-600">
          {technicianId}
        </p>
      )}
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
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",

    Stop:
      "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",

    Alarm:
      "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",

    Maintenance:
      "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
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
      "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",

    "In Progress":
      "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",

    Closed:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${
        styles[status] ??
        "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
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
      "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",

    "In Progress":
      "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",

    "Waiting Part":
      "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400",

    Completed:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${
        styles[status] ??
        "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {status}
    </span>
  );
}

/* =====================================================
   EMPTY STATE
===================================================== */

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="p-8 text-center sm:p-12">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800">
        📋
      </div>

      <p className="mt-4 font-semibold text-slate-700 dark:text-slate-300">
        {text}
      </p>

      <p className="mt-1 text-sm text-slate-500 dark:text-slate-600">
        ยังไม่มีข้อมูลสำหรับเครื่องจักรนี้
      </p>
    </div>
  );
}