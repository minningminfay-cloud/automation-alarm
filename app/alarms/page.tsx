"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Machine = {
  id: number;
  machine_id: string;
  name: string;
};

type Alarm = {
  id: number;
  machine_id: number;
  alarm_code: string;
  description: string;
  alarm_datetime: string;
  cause: string | null;
  status: "Open" | "In Progress" | "Closed";
};

const statuses = ["Open", "In Progress", "Closed"] as const;

export default function AlarmsPage() {
  const supabase = createClient();

  const [machines, setMachines] = useState<Machine[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  // Admin form
  const [machineId, setMachineId] = useState("");
  const [alarmCode, setAlarmCode] = useState("");
  const [description, setDescription] = useState("");
  const [alarmDatetime, setAlarmDatetime] = useState("");
  const [cause, setCause] = useState("");
  const [status, setStatus] =
    useState<Alarm["status"]>("Open");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  // Filters
  const [machineFilter, setMachineFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [alarmCodeFilter, setAlarmCodeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // =========================
  // Load Data
  // =========================

  async function loadData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/";
      return;
    }

    // Get role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    setRole(profile?.role ?? "");

    // Get machines
    const {
      data: machineData,
      error: machineError,
    } = await supabase
      .from("machines")
      .select("id, machine_id, name")
      .order("id", { ascending: true });

    if (machineError) {
      setMessage(machineError.message);
    } else {
      setMachines(machineData ?? []);
    }

    // Get alarms
    const {
      data: alarmData,
      error: alarmError,
    } = await supabase
      .from("alarms")
      .select("*")
      .order("alarm_datetime", {
        ascending: false,
      });

    if (alarmError) {
      setMessage(alarmError.message);
    } else {
      setAlarms(alarmData ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // =========================
  // Reset Form
  // =========================

  function resetForm() {
    setMachineId("");
    setAlarmCode("");
    setDescription("");
    setAlarmDatetime("");
    setCause("");
    setStatus("Open");
    setEditingId(null);
  }

  // =========================
  // Admin Add / Edit Alarm
  // =========================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");

    if (
      !machineId ||
      !alarmCode ||
      !description ||
      !alarmDatetime
    ) {
      setMessage("กรุณากรอกข้อมูลที่จำเป็นให้ครบ");
      return;
    }

    const cleanAlarmCode = alarmCode.trim();

    if (!cleanAlarmCode) {
      setMessage("กรุณากรอก Alarm Code");
      return;
    }

    // Check duplicate Alarm Code
    const {
      data: duplicateAlarms,
      error: duplicateError,
    } = await supabase
      .from("alarms")
      .select("id, alarm_code")
      .ilike("alarm_code", cleanAlarmCode);

    if (duplicateError) {
      setMessage(
        `ไม่สามารถตรวจสอบ Alarm Code ได้: ${duplicateError.message}`
      );
      return;
    }

    const isDuplicate = duplicateAlarms?.some(
      (alarm) => alarm.id !== editingId
    );

    if (isDuplicate) {
      setMessage(
        `Alarm Code "${cleanAlarmCode}" มีอยู่แล้ว กรุณาใช้ Alarm Code อื่น`
      );
      return;
    }

    // =========================
    // Alarm Data
    // =========================
    // เลือกวันที่จาก input type="date"
    // แล้วบันทึกเวลาเป็น 00:00:00
    const alarmData = {
      machine_id: Number(machineId),
      alarm_code: cleanAlarmCode,
      description: description.trim(),
      alarm_datetime: new Date(
        `${alarmDatetime}T00:00:00`
      ).toISOString(),
      cause: cause.trim() || null,
      status,
    };

    // =========================
    // Edit
    // =========================

    if (editingId) {
      const { error } = await supabase
        .from("alarms")
        .update(alarmData)
        .eq("id", editingId);

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("แก้ไข Alarm สำเร็จ");
    } else {
      // =========================
      // Add
      // =========================

      const { error } = await supabase
        .from("alarms")
        .insert(alarmData);

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("เพิ่ม Alarm สำเร็จ");
    }

    resetForm();
    await loadData();
  }

  // =========================
  // Admin Edit
  // =========================

  function handleEdit(alarm: Alarm) {
    setEditingId(alarm.id);
    setMachineId(String(alarm.machine_id));
    setAlarmCode(alarm.alarm_code);
    setDescription(alarm.description);

    // Convert database datetime
    // to YYYY-MM-DD for input type="date"
    const date = new Date(alarm.alarm_datetime);

    const localDate = new Date(
      date.getTime() -
        date.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 10);

    setAlarmDatetime(localDate);

    setCause(alarm.cause ?? "");
    setStatus(alarm.status);
    setMessage("");
  }

  // =========================
  // Admin Delete
  // =========================

  async function handleDelete(id: number) {
    if (!confirm("ต้องการลบ Alarm นี้ใช่หรือไม่?")) {
      return;
    }

    const { error } = await supabase
      .from("alarms")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("ลบ Alarm สำเร็จ");
    await loadData();
  }

  // =========================
  // Technician Change Status
  // =========================

  async function handleStatusChange(
    id: number,
    newStatus: Alarm["status"]
  ) {
    setMessage("");

    const { error } = await supabase
      .from("alarms")
      .update({
        status: newStatus,
      })
      .eq("id", id);

    if (error) {
      setMessage(
        `ไม่สามารถเปลี่ยนสถานะได้: ${error.message}`
      );
      return;
    }

    setMessage("เปลี่ยนสถานะ Alarm สำเร็จ");

    await loadData();
  }

  // =========================
  // Get Machine Name
  // =========================

  function getMachineName(machineId: number) {
    const machine = machines.find(
      (item) => item.id === machineId
    );

    if (!machine) {
      return "ไม่พบเครื่องจักร";
    }

    return `${machine.machine_id} - ${machine.name}`;
  }

  // =========================
  // Filtered Alarm
  // =========================

  const filteredAlarms = alarms.filter((alarm) => {
    const machineMatch =
      !machineFilter ||
      String(alarm.machine_id) === machineFilter;

    const statusMatch =
      !statusFilter ||
      alarm.status === statusFilter;

    const alarmCodeMatch =
      !alarmCodeFilter ||
      alarm.alarm_code
        .toLowerCase()
        .includes(alarmCodeFilter.toLowerCase());

    const alarmDate = new Date(
      alarm.alarm_datetime
    )
      .toISOString()
      .slice(0, 10);

    const dateMatch =
      !dateFilter ||
      alarmDate === dateFilter;

    return (
      machineMatch &&
      statusMatch &&
      alarmCodeMatch &&
      dateMatch
    );
  });

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="text-slate-400">
            กำลังโหลดข้อมูล Alarm...
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // Summary
  // =========================

  const openCount = alarms.filter(
    (alarm) => alarm.status === "Open"
  ).length;

  const progressCount = alarms.filter(
    (alarm) => alarm.status === "In Progress"
  ).length;

  const closedCount = alarms.filter(
    (alarm) => alarm.status === "Closed"
  ).length;

  // =========================
  // Page
  // =========================

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-6 relative overflow-hidden">

      {/* Background Decoration */}

      <div className="absolute top-0 left-0 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl">

        {/* =========================
            Header
        ========================= */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <div className="flex items-center gap-3 mb-2">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-2xl">
                🚨
              </div>

              <div>

                <p className="text-xs uppercase tracking-[0.25em] text-red-400">
                  Industrial System
                </p>

                <h1 className="text-3xl font-bold tracking-tight">
                  Alarm Management
                </h1>

              </div>

            </div>

            <p className="text-slate-400">
              จัดการและติดตาม Alarm ของเครื่องจักร
            </p>

          </div>

          <button
            onClick={() =>
              (window.location.href = "/dashboard")
            }
            className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-medium text-slate-200 transition hover:bg-slate-800 hover:border-slate-600"
          >
            ← Dashboard
          </button>

        </div>

        {/* =========================
            Summary Cards
        ========================= */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

          <SummaryCard
            title="Open"
            value={openCount}
            icon="🔴"
            description="Alarm ที่กำลังรอดำเนินการ"
          />

          <SummaryCard
            title="In Progress"
            value={progressCount}
            icon="🟡"
            description="Alarm ที่กำลังแก้ไข"
          />

          <SummaryCard
            title="Closed"
            value={closedCount}
            icon="🟢"
            description="Alarm ที่ดำเนินการแล้ว"
          />

        </div>

        {/* =========================
            Admin Form
        ========================= */}

        {role === "admin" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl shadow-black/20 p-6 mb-6">

            <div className="flex items-center gap-3 mb-6">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                {editingId ? "✏️" : "➕"}
              </div>

              <div>

                <h2 className="text-xl font-semibold">
                  {editingId
                    ? "แก้ไข Alarm"
                    : "เพิ่ม Alarm"}
                </h2>

                <p className="text-sm text-slate-400">
                  {editingId
                    ? "แก้ไขข้อมูล Alarm ที่เลือก"
                    : "บันทึกข้อมูล Alarm ใหม่เข้าสู่ระบบ"}
                </p>

              </div>

            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >

              {/* Machine */}

              <FormSelect
                label="Machine"
                value={machineId}
                onChange={setMachineId}
              >

                <option value="">
                  -- เลือกเครื่องจักร --
                </option>

                {machines.map((machine) => (
                  <option
                    key={machine.id}
                    value={machine.id}
                  >
                    {machine.machine_id} -{" "}
                    {machine.name}
                  </option>
                ))}

              </FormSelect>

              {/* Alarm Code */}

              <FormInput
                label="Alarm Code"
                value={alarmCode}
                onChange={setAlarmCode}
                placeholder="เช่น ALM-001"
                required
              />

              {/* Description */}

              <FormInput
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="รายละเอียดของ Alarm"
                required
              />

              {/* Alarm Date */}

              <FormInput
                label="Alarm Date"
                type="date"
                value={alarmDatetime}
                onChange={setAlarmDatetime}
                required
              />

              {/* Cause */}

              <FormInput
                label="Cause"
                value={cause}
                onChange={setCause}
                placeholder="สาเหตุของ Alarm"
              />

              {/* Status */}

              <FormSelect
                label="Status"
                value={status}
                onChange={(value) =>
                  setStatus(
                    value as Alarm["status"]
                  )
                }
              >

                {statuses.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}

              </FormSelect>

              {/* Buttons */}

              <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                >
                  {editingId
                    ? "บันทึกการแก้ไข"
                    : "＋ เพิ่ม Alarm"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 font-medium text-slate-200 transition hover:bg-slate-700"
                  >
                    ยกเลิก
                  </button>
                )}

              </div>

            </form>

          </div>
        )}

        {/* =========================
            Message
        ========================= */}

        {message && (
          <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/10 px-5 py-4 text-blue-300 shadow-lg">

            <div className="flex items-center gap-3">
              <span>ℹ️</span>
              <span>{message}</span>
            </div>

          </div>
        )}

        {/* =========================
            Alarm List
        ========================= */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl shadow-black/20 overflow-hidden">

          {/* List Header */}

          <div className="p-6 border-b border-slate-800">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">

              <div>

                <h2 className="text-xl font-semibold">
                  Alarm List
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                  รายการ Alarm ทั้งหมดในระบบ
                </p>

              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">

                พบ{" "}

                <span className="font-bold text-white">
                  {filteredAlarms.length}
                </span>{" "}

                รายการ

              </div>

            </div>

            {/* Filters */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">

              {/* Machine */}

              <FilterSelect
                value={machineFilter}
                onChange={setMachineFilter}
              >

                <option value="">
                  ทุกเครื่องจักร
                </option>

                {machines.map((machine) => (
                  <option
                    key={machine.id}
                    value={machine.id}
                  >
                    {machine.machine_id} -{" "}
                    {machine.name}
                  </option>
                ))}

              </FilterSelect>

              {/* Status */}

              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
              >

                <option value="">
                  ทุกสถานะ
                </option>

                {statuses.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}

              </FilterSelect>

              {/* Alarm Code */}

              <input
                value={alarmCodeFilter}
                onChange={(e) =>
                  setAlarmCodeFilter(e.target.value)
                }
                placeholder="🔎 ค้นหา Alarm Code"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />

              {/* Date Filter */}

              <input
                type="date"
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(e.target.value)
                }
                style={{
                  colorScheme: "dark",
                }}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />

            </div>

            {/* Filter Actions */}

            <div className="flex justify-end mt-4">

              <button
                onClick={() => {
                  setMachineFilter("");
                  setStatusFilter("");
                  setAlarmCodeFilter("");
                  setDateFilter("");
                }}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
              >
                ↻ ล้างตัวกรอง
              </button>

            </div>

          </div>

          {/* =========================
              Table
          ========================= */}

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px]">

              <thead className="bg-slate-950/80">

                <tr className="border-b border-slate-800">

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Machine
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Alarm Code
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Description
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date / Time
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Cause
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  {role === "admin" && (
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  )}

                </tr>

              </thead>

              <tbody>

                {filteredAlarms.length === 0 ? (
                  <tr>

                    <td
                      colSpan={
                        role === "admin" ? 7 : 6
                      }
                      className="px-6 py-16 text-center"
                    >

                      <div className="text-4xl mb-3">
                        📭
                      </div>

                      <p className="font-medium text-slate-300">
                        ไม่พบข้อมูล Alarm
                      </p>

                      <p className="text-sm text-slate-500 mt-1">
                        ลองเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง
                      </p>

                    </td>

                  </tr>
                ) : (
                  filteredAlarms.map((alarm) => (
                    <tr
                      key={alarm.id}
                      className="border-b border-slate-800/70 transition hover:bg-slate-800/40"
                    >

                      {/* Machine */}

                      <td className="px-5 py-5">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-sm">
                            🏭
                          </div>

                          <div>

                            <p className="font-medium text-white">
                              {
                                getMachineName(
                                  alarm.machine_id
                                ).split(" - ")[0]
                              }
                            </p>

                            <p className="text-xs text-slate-500">
                              {
                                getMachineName(
                                  alarm.machine_id
                                ).split(" - ")[1]
                              }
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* Alarm Code */}

                      <td className="px-5 py-5">

                        <span className="inline-flex rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 font-mono text-sm font-semibold text-red-300">
                          {alarm.alarm_code}
                        </span>

                      </td>

                      {/* Description */}

                      <td className="px-5 py-5 max-w-xs">

                        <p className="text-sm text-slate-300">
                          {alarm.description}
                        </p>

                      </td>

                      {/* Date */}

                      <td className="px-5 py-5">

                        <p className="text-sm text-slate-300">
                          {new Date(
                            alarm.alarm_datetime
                          ).toLocaleDateString(
                            "th-TH"
                          )}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(
                            alarm.alarm_datetime
                          ).toLocaleTimeString(
                            "th-TH",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>

                      </td>

                      {/* Cause */}

                      <td className="px-5 py-5 max-w-xs">

                        <p className="text-sm text-slate-400">
                          {alarm.cause || "-"}
                        </p>

                      </td>

                      {/* Status */}

                      <td className="px-5 py-5">

                        {role === "technician" ? (

                          <select
                            value={alarm.status}
                            onChange={(e) =>
                              handleStatusChange(
                                alarm.id,
                                e.target
                                  .value as Alarm["status"]
                              )
                            }
                            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                          >

                            {statuses.map((item) => (
                              <option
                                key={item}
                                value={item}
                              >
                                {item}
                              </option>
                            ))}

                          </select>

                        ) : (

                          <StatusBadge
                            status={alarm.status}
                          />

                        )}

                      </td>

                      {/* Admin Actions */}

                      {role === "admin" && (

                        <td className="px-5 py-5">

                          <div className="flex gap-2">

                            <button
                              onClick={() =>
                                handleEdit(alarm)
                              }
                              className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-sm font-medium text-yellow-300 transition hover:bg-yellow-500/20"
                            >
                              ✏️ แก้ไข
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(alarm.id)
                              }
                              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                            >
                              🗑 ลบ
                            </button>

                          </div>

                        </td>

                      )}

                    </tr>
                  ))
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </main>
  );
}

/* =========================================================
   Components
========================================================= */

function SummaryCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: number;
  icon: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-black/10">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>

        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-xl">
          {icon}
        </div>

      </div>

    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-medium text-slate-300">

        {label}

        {required && (
          <span className="text-red-400 ml-1">
            *
          </span>
        )}

      </span>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        required={required}
        style={
          type === "date"
            ? { colorScheme: "dark" }
            : undefined
        }
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />

    </label>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        required={label === "Machine"}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      >
        {children}
      </select>

    </label>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
    >
      {children}
    </select>
  );
}

function StatusBadge({
  status,
}: {
  status: Alarm["status"];
}) {
  const styles = {
    Open: "border-red-500/20 bg-red-500/10 text-red-300",

    "In Progress":
      "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",

    Closed:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  };

  const icons = {
    Open: "🔴",
    "In Progress": "🟡",
    Closed: "🟢",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${styles[status]}`}
    >
      <span>{icons[status]}</span>
      {status}
    </span>
  );
}