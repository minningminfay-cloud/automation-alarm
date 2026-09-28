"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "../components/ThemeToggle";

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

  // =========================
  // Admin Form
  // =========================

  const [machineId, setMachineId] = useState("");
  const [alarmCode, setAlarmCode] = useState("");
  const [description, setDescription] = useState("");
  const [alarmDatetime, setAlarmDatetime] = useState("");
  const [cause, setCause] = useState("");
  const [status, setStatus] =
    useState<Alarm["status"]>("Open");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  // =========================
  // Filters
  // =========================

  const [machineFilter, setMachineFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [alarmCodeFilter, setAlarmCodeFilter] = useState("");

  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");

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

    const cleanMachineId = machineId.trim();
    const cleanAlarmCode = alarmCode.trim();
    const cleanDescription = description.trim();
    const cleanCause = cause.trim();

    if (!cleanMachineId) {
      setMessage("กรุณาเลือกเครื่องจักร");
      return;
    }

    if (!cleanAlarmCode) {
      setMessage("กรุณากรอก Alarm Code");
      return;
    }

    if (!cleanDescription) {
      setMessage("กรุณากรอก Description");
      return;
    }

    if (!alarmDatetime) {
      setMessage("กรุณาเลือกวันที่และเวลาของ Alarm");
      return;
    }

    if (!cleanCause) {
      setMessage("กรุณากรอก Cause หรือสาเหตุของ Alarm");
      return;
    }

    if (cleanAlarmCode.length < 2) {
      setMessage(
        "Alarm Code ต้องมีอย่างน้อย 2 ตัวอักษร"
      );
      return;
    }

    if (cleanDescription.length < 3) {
      setMessage(
        "Description ต้องมีอย่างน้อย 3 ตัวอักษร"
      );
      return;
    }

    const alarmCodePattern = /^[A-Za-z0-9]+-\d+$/;

    if (!alarmCodePattern.test(cleanAlarmCode)) {
      setMessage(
        "Alarm Code ต้องอยู่ในรูปแบบ เช่น ALM-001 หรือ TEMP-01"
      );
      return;
    }

    // Check Duplicate Alarm Code
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

    const alarmData = {
      machine_id: Number(cleanMachineId),
      alarm_code: cleanAlarmCode,
      description: cleanDescription,
      alarm_datetime: new Date(
        `${alarmDatetime}T00:00:00`
      ).toISOString(),
      cause: cleanCause,
      status,
    };

    // Edit
    if (editingId !== null) {
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
      // Add
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

    const date = new Date(
      alarm.alarm_datetime
    );

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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =========================
  // Admin Delete
  // =========================

  async function handleDelete(id: number) {
    if (
      !confirm(
        "ต้องการลบ Alarm นี้ใช่หรือไม่?"
      )
    ) {
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

    setMessage(
      "เปลี่ยนสถานะ Alarm สำเร็จ"
    );

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
  // Date Range Validation
  // =========================

  const invalidDateRange =
    Boolean(dateFromFilter) &&
    Boolean(dateToFilter) &&
    dateFromFilter > dateToFilter;

  // =========================
  // Filtered Alarm
  // =========================

  const filteredAlarms = alarms.filter(
    (alarm) => {
      if (invalidDateRange) {
        return false;
      }

      const machineMatch =
        !machineFilter ||
        String(alarm.machine_id) ===
          machineFilter;

      const statusMatch =
        !statusFilter ||
        alarm.status === statusFilter;

      const alarmCodeMatch =
        !alarmCodeFilter ||
        alarm.alarm_code
          .toLowerCase()
          .includes(
            alarmCodeFilter.toLowerCase()
          );

      const alarmDate = new Date(
        alarm.alarm_datetime
      );

      const localAlarmDate = new Date(
        alarmDate.getTime() -
          alarmDate.getTimezoneOffset() *
            60000
      )
        .toISOString()
        .slice(0, 10);

      const fromDateMatch =
        !dateFromFilter ||
        localAlarmDate >= dateFromFilter;

      const toDateMatch =
        !dateToFilter ||
        localAlarmDate <= dateToFilter;

      return (
        machineMatch &&
        statusMatch &&
        alarmCodeMatch &&
        fromDateMatch &&
        toDateMatch
      );
    }
  );

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4 text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500 dark:border-slate-700 dark:border-t-blue-500" />

          <p className="text-slate-600 dark:text-slate-400">
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
    (alarm) =>
      alarm.status === "In Progress"
  ).length;

  const closedCount = alarms.filter(
    (alarm) => alarm.status === "Closed"
  ).length;

  // =========================
  // Page
  // =========================

  return (
    <main className="relative min-h-screen overflow-hidden bg-white p-4 text-slate-900 transition-colors dark:bg-slate-950 dark:text-white md:p-6">

      {/* Background Decoration */}

      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">

        {/* =========================
            Header
        ========================= */}

        <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-center md:justify-between">

          <div className="min-w-0">

            <div className="mb-2 flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-xl sm:h-12 sm:w-12 sm:text-2xl">
                🚨
              </div>

              <div className="min-w-0">

                <p className="text-[10px] uppercase tracking-[0.2em] text-red-400 sm:text-xs sm:tracking-[0.25em]">
                  Industrial System
                </p>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  Alarm Management
                </h1>

              </div>

            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 sm:text-base">
              จัดการและติดตาม Alarm ของเครื่องจักร
            </p>

          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">

            <ThemeToggle />

            <button
              onClick={() =>
                (window.location.href =
                  "/dashboard")
              }
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 sm:flex-none sm:px-5"
            >
              ← Dashboard
            </button>

          </div>

        </div>

        {/* =========================
            Summary Cards
        ========================= */}

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">

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
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/50 transition-colors dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/20 sm:p-6">

            <div className="mb-6 flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                {editingId
                  ? "✏️"
                  : "➕"}
              </div>

              <div className="min-w-0">

                <h2 className="text-lg font-semibold text-slate-900 dark:text-white sm:text-xl">
                  {editingId
                    ? "แก้ไข Alarm"
                    : "เพิ่ม Alarm"}
                </h2>

                <p className="text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
                  {editingId
                    ? "แก้ไขข้อมูล Alarm ที่เลือก"
                    : "บันทึกข้อมูล Alarm ใหม่เข้าสู่ระบบ"}
                </p>

              </div>

            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >

              <FormSelect
                label="Machine"
                value={machineId}
                onChange={setMachineId}
              >
                <option value="">
                  -- เลือกเครื่องจักร --
                </option>

                {machines.map(
                  (machine) => (
                    <option
                      key={machine.id}
                      value={machine.id}
                    >
                      {machine.machine_id} -{" "}
                      {machine.name}
                    </option>
                  )
                )}
              </FormSelect>

              <FormInput
                label="Alarm Code"
                value={alarmCode}
                onChange={setAlarmCode}
                placeholder="เช่น ALM-001"
                required
                maxLength={50}
              />

              <FormInput
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="รายละเอียดของ Alarm"
                required
                maxLength={500}
              />

              <FormInput
                label="Alarm Date"
                type="date"
                value={alarmDatetime}
                onChange={setAlarmDatetime}
                required
              />

              <FormInput
                label="Cause"
                value={cause}
                onChange={setCause}
                placeholder="สาเหตุของ Alarm"
                required
                maxLength={500}
              />

              <FormSelect
                label="Status"
                value={status}
                onChange={(value) =>
                  setStatus(
                    value as Alarm["status"]
                  )
                }
              >
                {statuses.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </FormSelect>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row md:col-span-2">

                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500 sm:w-auto"
                >
                  {editingId
                    ? "บันทึกการแก้ไข"
                    : "＋ เพิ่ม Alarm"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full rounded-xl border border-slate-300 bg-slate-100 px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
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
          <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-4 text-blue-600 shadow-lg dark:text-blue-300 sm:px-5">

            <div className="flex items-start gap-3">
              <span className="shrink-0">ℹ️</span>
              <span className="text-sm break-words">
                {message}
              </span>
            </div>

          </div>
        )}

        {/* =========================
            Alarm List
        ========================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 transition-colors dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/20">

          {/* List Header */}

          <div className="border-b border-slate-200 p-4 dark:border-slate-800 sm:p-6">

            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

              <div>

                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Alarm List
                </h2>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  รายการ Alarm ทั้งหมดในระบบ
                </p>

              </div>

              <div className="w-fit rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">

                พบ{" "}

                <span className="font-bold text-slate-900 dark:text-white">
                  {filteredAlarms.length}
                </span>{" "}

                รายการ

              </div>

            </div>

            {/* Filters */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">

              <FilterSelect
                value={machineFilter}
                onChange={setMachineFilter}
              >
                <option value="">
                  ทุกเครื่องจักร
                </option>

                {machines.map(
                  (machine) => (
                    <option
                      key={machine.id}
                      value={machine.id}
                    >
                      {machine.machine_id} -{" "}
                      {machine.name}
                    </option>
                  )
                )}
              </FilterSelect>

              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <option value="">
                  ทุกสถานะ
                </option>

                {statuses.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </FilterSelect>

              <input
                value={alarmCodeFilter}
                onChange={(e) =>
                  setAlarmCodeFilter(
                    e.target.value
                  )
                }
                placeholder="🔎 ค้นหา Alarm Code"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  ตั้งแต่วันที่
                </label>

                <input
                  type="date"
                  value={dateFromFilter}
                  max={
                    dateToFilter ||
                    undefined
                  }
                  onChange={(e) =>
                    setDateFromFilter(
                      e.target.value
                    )
                  }
                  style={{
                    colorScheme: "light",
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  ถึงวันที่
                </label>

                <input
                  type="date"
                  value={dateToFilter}
                  min={
                    dateFromFilter ||
                    undefined
                  }
                  onChange={(e) =>
                    setDateToFilter(
                      e.target.value
                    )
                  }
                  style={{
                    colorScheme: "light",
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

            </div>

            {invalidDateRange && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                ⚠️ วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด
              </div>
            )}

            <div className="mt-4 flex justify-start sm:justify-end">

              <button
                onClick={() => {
                  setMachineFilter("");
                  setStatusFilter("");
                  setAlarmCodeFilter("");
                  setDateFromFilter("");
                  setDateToFilter("");
                }}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white sm:w-auto"
              >
                ↻ ล้างตัวกรอง
              </button>

            </div>

          </div>

          {/* =========================
              Desktop Table
          ========================= */}

          <div className="hidden overflow-x-auto md:block">

            <table className="w-full min-w-[1100px]">

              <thead className="bg-slate-100 dark:bg-slate-950/80">

                <tr className="border-b border-slate-200 dark:border-slate-800">

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-500">
                    Machine
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-500">
                    Alarm Code
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-500">
                    Description
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-500">
                    Date / Time
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-500">
                    Cause
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-500">
                    Status
                  </th>

                  {role === "admin" && (
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-500">
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
                        role === "admin"
                          ? 7
                          : 6
                      }
                      className="px-6 py-16 text-center"
                    >

                      <EmptyState />

                    </td>

                  </tr>
                ) : (
                  filteredAlarms.map(
                    (alarm) => (
                      <tr
                        key={alarm.id}
                        className="border-b border-slate-200 transition hover:bg-slate-50 dark:border-slate-800/70 dark:hover:bg-slate-800/40"
                      >

                        <td className="px-5 py-5">

                          <MachineInfo
                            name={getMachineName(
                              alarm.machine_id
                            )}
                          />

                        </td>

                        <td className="px-5 py-5">

                          <AlarmCodeBadge
                            code={
                              alarm.alarm_code
                            }
                          />

                        </td>

                        <td className="max-w-xs px-5 py-5">

                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {alarm.description}
                          </p>

                        </td>

                        <td className="px-5 py-5">

                          <DateTimeDisplay
                            dateTime={
                              alarm.alarm_datetime
                            }
                          />

                        </td>

                        <td className="max-w-xs px-5 py-5">

                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {alarm.cause ||
                              "-"}
                          </p>

                        </td>

                        <td className="px-5 py-5">

                          {role ===
                          "technician" ? (
                            <StatusSelect
                              status={
                                alarm.status
                              }
                              onChange={(
                                newStatus
                              ) =>
                                handleStatusChange(
                                  alarm.id,
                                  newStatus
                                )
                              }
                            />
                          ) : (
                            <StatusBadge
                              status={
                                alarm.status
                              }
                            />
                          )}

                        </td>

                        {role === "admin" && (
                          <td className="px-5 py-5">

                            <AdminActions
                              onEdit={() =>
                                handleEdit(
                                  alarm
                                )
                              }
                              onDelete={() =>
                                handleDelete(
                                  alarm.id
                                )
                              }
                            />

                          </td>
                        )}

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

          {/* =========================
              Mobile Cards
          ========================= */}

          <div className="block md:hidden">

            {filteredAlarms.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <EmptyState />
              </div>
            ) : (
              <div className="space-y-3 p-3 sm:p-4">

                {filteredAlarms.map(
                  (alarm) => (
                    <div
                      key={alarm.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition dark:border-slate-800 dark:bg-slate-950/60"
                    >

                      {/* Card Header */}

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <MachineInfo
                            name={getMachineName(
                              alarm.machine_id
                            )}
                          />

                        </div>

                        <AlarmCodeBadge
                          code={
                            alarm.alarm_code
                          }
                        />

                      </div>

                      {/* Description */}

                      <div className="mt-4">

                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                          Description
                        </p>

                        <p className="break-words text-sm text-slate-700 dark:text-slate-300">
                          {alarm.description}
                        </p>

                      </div>

                      {/* Date / Time */}

                      <div className="mt-4 grid grid-cols-2 gap-3">

                        <div>

                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Date / Time
                          </p>

                          <DateTimeDisplay
                            dateTime={
                              alarm.alarm_datetime
                            }
                          />

                        </div>

                        <div>

                          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                            Status
                          </p>

                          {role ===
                          "technician" ? (
                            <StatusSelect
                              status={
                                alarm.status
                              }
                              onChange={(
                                newStatus
                              ) =>
                                handleStatusChange(
                                  alarm.id,
                                  newStatus
                                )
                              }
                            />
                          ) : (
                            <StatusBadge
                              status={
                                alarm.status
                              }
                            />
                          )}

                        </div>

                      </div>

                      {/* Cause */}

                      <div className="mt-4">

                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                          Cause
                        </p>

                        <p className="break-words text-sm text-slate-600 dark:text-slate-400">
                          {alarm.cause ||
                            "-"}
                        </p>

                      </div>

                      {/* Admin Actions */}

                      {role === "admin" && (
                        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">

                          <AdminActions
                            onEdit={() =>
                              handleEdit(
                                alarm
                              )
                            }
                            onDelete={() =>
                              handleDelete(
                                alarm.id
                              )
                            }
                          />

                        </div>
                      )}

                    </div>
                  )
                )}

              </div>
            )}

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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 transition-colors dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/10">

      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">

          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>

        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800">
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
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">

        {label}

        {required && (
          <span className="ml-1 text-red-400">
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
        maxLength={maxLength}
        style={
          type === "date"
            ? { colorScheme: "light" }
            : undefined
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600"
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

      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">

        {label}

        {label === "Machine" && (
          <span className="ml-1 text-red-400">
            *
          </span>
        )}

      </span>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        required={label === "Machine"}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
    >
      {children}
    </select>
  );
}

function MachineInfo({
  name,
}: {
  name: string;
}) {
  const parts = name.split(" - ");

  return (
    <div className="flex items-center gap-3">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm dark:bg-slate-800">
        🏭
      </div>

      <div className="min-w-0">

        <p className="font-medium text-slate-900 dark:text-white">
          {parts[0]}
        </p>

        <p className="truncate text-xs text-slate-500">
          {parts[1] ?? ""}
        </p>

      </div>

    </div>
  );
}

function AlarmCodeBadge({
  code,
}: {
  code: string;
}) {
  return (
    <span className="inline-flex max-w-full rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 font-mono text-xs font-semibold text-red-600 dark:text-red-300 sm:text-sm">
      {code}
    </span>
  );
}

function DateTimeDisplay({
  dateTime,
}: {
  dateTime: string;
}) {
  const date = new Date(dateTime);

  return (
    <div>

      <p className="text-sm text-slate-700 dark:text-slate-300">
        {date.toLocaleDateString(
          "th-TH"
        )}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {date.toLocaleTimeString(
          "th-TH",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        )}
      </p>

    </div>
  );
}

function StatusSelect({
  status,
  onChange,
}: {
  status: Alarm["status"];
  onChange: (
    status: Alarm["status"]
  ) => void;
}) {
  return (
    <select
      value={status}
      onChange={(e) =>
        onChange(
          e.target.value as Alarm["status"]
        )
      }
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:w-auto"
    >
      {statuses.map(
        (item) => (
          <option
            key={item}
            value={item}
          >
            {item}
          </option>
        )
      )}
    </select>
  );
}

function AdminActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">

      <button
        onClick={onEdit}
        className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-sm font-medium text-yellow-600 transition hover:bg-yellow-500/20 dark:text-yellow-300"
      >
        ✏️ แก้ไข
      </button>

      <button
        onClick={onDelete}
        className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-500/20 dark:text-red-300"
      >
        🗑 ลบ
      </button>

    </div>
  );
}

function EmptyState() {
  return (
    <div>

      <div className="mb-3 text-4xl">
        📭
      </div>

      <p className="font-medium text-slate-700 dark:text-slate-300">
        ไม่พบข้อมูล Alarm
      </p>

      <p className="mt-1 text-sm text-slate-500">
        ลองเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง
      </p>

    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: Alarm["status"];
}) {
  const styles = {
    Open:
      "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300",

    "In Progress":
      "border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-300",

    Closed:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
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