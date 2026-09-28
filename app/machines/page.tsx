"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "../components/ThemeToggle";

type Machine = {
  id: number;
  machine_id: string;
  name: string;
  type: string;
  location: string;
  status: "Running" | "Stop" | "Alarm" | "Maintenance";
};

const statuses = ["Running", "Stop", "Alarm", "Maintenance"] as const;

export default function MachinesPage() {
  const supabase = createClient();

  const [machines, setMachines] = useState<Machine[]>([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  const [machineId, setMachineId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] =
    useState<Machine["status"]>("Running");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function loadData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/";
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    setRole(profile?.role ?? "");

    const { data, error } = await supabase
      .from("machines")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      setMessage(error.message);
    } else {
      setMachines(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setMachineId("");
    setName("");
    setType("");
    setLocation("");
    setStatus("Running");
    setEditingId(null);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");

    const cleanMachineId = machineId.trim();
    const cleanName = name.trim();
    const cleanType = type.trim();
    const cleanLocation = location.trim();

    // Validation: required fields
    if (
      !cleanMachineId ||
      !cleanName ||
      !cleanType ||
      !cleanLocation
    ) {
      setMessage("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    // Validation: Machine ID length
    if (cleanMachineId.length < 2) {
      setMessage("Machine ID ต้องมีอย่างน้อย 2 ตัวอักษร");
      return;
    }

    // Validation: Machine ID format
    const machineIdPattern = /^[A-Za-z0-9]+-\d+$/;

    if (!machineIdPattern.test(cleanMachineId)) {
      setMessage(
        "Machine ID ต้องอยู่ในรูปแบบ เช่น MC-001 หรือ PUMP-01"
      );
      return;
    }

    // Validation: duplicate Machine ID
    const duplicateMachine = machines.find(
      (machine) =>
        machine.machine_id.trim().toLowerCase() ===
          cleanMachineId.toLowerCase() &&
        machine.id !== editingId
    );

    if (duplicateMachine) {
      setMessage(
        "Machine ID นี้มีอยู่แล้ว กรุณาใช้ Machine ID อื่น"
      );
      return;
    }

    const machineData = {
      machine_id: cleanMachineId,
      name: cleanName,
      type: cleanType,
      location: cleanLocation,
      status,
    };

    if (editingId !== null) {
      const { error } = await supabase
        .from("machines")
        .update(machineData)
        .eq("id", editingId);

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("แก้ไขข้อมูลเครื่องจักรสำเร็จ");
    } else {
      const { error } = await supabase
        .from("machines")
        .insert(machineData);

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("เพิ่มเครื่องจักรสำเร็จ");
    }

    resetForm();
    await loadData();
  }

  function handleEdit(machine: Machine) {
    setEditingId(machine.id);
    setMachineId(machine.machine_id);
    setName(machine.name);
    setType(machine.type);
    setLocation(machine.location);
    setStatus(machine.status);
    setMessage("");
  }

  async function handleDelete(id: number) {
    if (!confirm("ต้องการลบเครื่องจักรนี้ใช่หรือไม่?")) {
      return;
    }

    const { error } = await supabase
      .from("machines")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("ลบเครื่องจักรสำเร็จ");
    await loadData();
  }

  const filteredMachines = machines.filter((machine) => {
    const searchText = search.toLowerCase().trim();

    const searchMatch =
      !searchText ||
      machine.machine_id.toLowerCase().includes(searchText) ||
      machine.name.toLowerCase().includes(searchText) ||
      machine.type.toLowerCase().includes(searchText) ||
      machine.location.toLowerCase().includes(searchText);

    const statusMatch =
      !statusFilter ||
      machine.status === statusFilter;

    return searchMatch && statusMatch;
  });

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white px-6 py-6 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:px-8">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
            ⚙️
          </div>

          <p className="text-slate-700 dark:text-slate-300">
            กำลังโหลดข้อมูล...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      {/* ================= BACKGROUND ================= */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* ================= HEADER ================= */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl shadow-lg shadow-blue-600/20">
              🏭
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500 dark:text-blue-400">
                Industrial System
              </p>

              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Machine Management
              </h1>

              <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                จัดการข้อมูลและสถานะเครื่องจักร
              </p>
            </div>
          </div>

          <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-3">
            <ThemeToggle />

            <button
              onClick={() =>
                (window.location.href = "/dashboard")
              }
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg transition hover:border-blue-500/50 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white sm:flex-none sm:px-5"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* ================= SUMMARY ================= */}

        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
          <MiniStat
            title="Total"
            value={machines.length}
            icon="🏭"
          />

          <MiniStat
            title="Running"
            value={
              machines.filter(
                (machine) => machine.status === "Running"
              ).length
            }
            icon="✓"
          />

          <MiniStat
            title="Stop"
            value={
              machines.filter(
                (machine) => machine.status === "Stop"
              ).length
            }
            icon="■"
          />

          <MiniStat
            title="Alarm"
            value={
              machines.filter(
                (machine) => machine.status === "Alarm"
              ).length
            }
            icon="!"
          />

          <MiniStat
            title="Maintenance"
            value={
              machines.filter(
                (machine) =>
                  machine.status === "Maintenance"
              ).length
            }
            icon="🔧"
          />
        </div>

        {/* ================= ADD / EDIT ================= */}

        {role === "admin" && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-2xl sm:p-6">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
                {editingId ? "✏️" : "＋"}
              </div>

              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingId
                    ? "แก้ไขเครื่องจักร"
                    : "เพิ่มเครื่องจักร"}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {editingId
                    ? "แก้ไขข้อมูลเครื่องจักร"
                    : "เพิ่มข้อมูลเครื่องจักรใหม่เข้าสู่ระบบ"}
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <FormInput
                value={machineId}
                onChange={setMachineId}
                placeholder="Machine ID เช่น MC-001"
              />

              <FormInput
                value={name}
                onChange={setName}
                placeholder="Machine Name"
              />

              <FormInput
                value={type}
                onChange={setType}
                placeholder="Machine Type"
              />

              <FormInput
                value={location}
                onChange={setLocation}
                placeholder="Location"
              />

              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as Machine["status"]
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 sm:w-auto"
                >
                  {editingId
                    ? "บันทึกการแก้ไข"
                    : "＋ เพิ่มเครื่องจักร"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full rounded-xl border border-slate-300 bg-slate-100 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 sm:w-auto"
                  >
                    ยกเลิก
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ================= MESSAGE ================= */}

        {message && (
          <div className="mb-6 break-words rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-600 shadow-lg dark:text-blue-300">
            {message}
          </div>
        )}

        {/* ================= MACHINE LIST ================= */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-2xl">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Machine List
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  รายการเครื่องจักรทั้งหมดในระบบ
                </p>
              </div>

              <div className="w-fit rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {filteredMachines.length} / {machines.length} เครื่อง
              </div>
            </div>

            {/* ================= FILTERS ================= */}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="relative min-w-0">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  🔍
                </span>

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="ค้นหา ID / Name / Type / Location"
                  className="w-full min-w-0 rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">
                  ทุก Status
                </option>

                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                ↻ ล้างตัวกรอง
              </button>
            </div>
          </div>

          {/* ================= TABLE ================= */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-100 dark:bg-slate-800/70">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Machine
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Type
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Location
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredMachines.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center sm:p-12"
                    >
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800">
                        🔍
                      </div>

                      <p className="mt-4 font-semibold text-slate-700 dark:text-slate-300">
                        ไม่พบข้อมูลเครื่องจักร
                      </p>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-600">
                        ลองเปลี่ยนคำค้นหาหรือตัวกรอง
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredMachines.map((machine) => (
                    <tr
                      key={machine.id}
                      className="border-t border-slate-200 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                            🏭
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {machine.machine_id}
                            </p>

                            <p className="mt-1 max-w-xs truncate text-sm text-slate-500 dark:text-slate-400">
                              {machine.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-slate-700 dark:text-slate-300">
                        {machine.type}
                      </td>

                      <td className="px-6 py-5 text-slate-700 dark:text-slate-300">
                        📍 {machine.location}
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge status={machine.status} />
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          {/* History */}

                          <button
                            onClick={() =>
                              (window.location.href =
                                `/machines/${machine.id}/history`)
                            }
                            className="whitespace-nowrap rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-500/20 dark:text-blue-400"
                          >
                            📋 History
                          </button>

                          {/* Admin */}

                          {role === "admin" && (
                            <>
                              <button
                                onClick={() =>
                                  handleEdit(machine)
                                }
                                className="whitespace-nowrap rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-600 transition hover:bg-amber-500/20 dark:text-amber-400"
                              >
                                ✏️ แก้ไข
                              </button>

                              <button
                                onClick={() =>
                                  handleDelete(machine.id)
                                }
                                className="whitespace-nowrap rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-500/20 dark:text-red-400"
                              >
                                🗑️ ลบ
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= FOOTER ================= */}

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-700">
          Automation Alarm & Maintenance Management System
        </p>
      </div>
    </main>
  );
}

/* =====================================================
   FORM INPUT
===================================================== */

function FormInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
      required
    />
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:shadow-xl sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            {title}
          </p>

          <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
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

/* =====================================================
   STATUS BADGE
===================================================== */

function StatusBadge({
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

  const icons = {
    Running: "●",
    Stop: "■",
    Alarm: "!",
    Maintenance: "🔧",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${styles[status]}`}
    >
      <span>{icons[status]}</span>
      {status}
    </span>
  );
}