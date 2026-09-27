"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Machine = {
  id: number;
  machine_id: string;
  name: string;
};

type Maintenance = {
  id: number;
  machine_id: number;
  maintenance_type: string;
  problem: string;
  action_taken: string;
  technician_id: string;
  maintenance_date: string;
  status: string;
};

const statuses = [
  "Pending",
  "In Progress",
  "Completed",
];

export default function MaintenancePage() {
  const supabase = createClient();

  const [machines, setMachines] = useState<Machine[]>([]);
  const [records, setRecords] = useState<Maintenance[]>([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  const [machineId, setMachineId] = useState("");
  const [maintenanceType, setMaintenanceType] = useState("");
  const [problem, setProblem] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [status, setStatus] = useState("Pending");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  // Filters
  const [machineFilter, setMachineFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [technicianFilter, setTechnicianFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  async function loadData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/";
      return;
    }

    setUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    setRole(profile?.role ?? "");

    const {
      data: machineData,
      error: machineError,
    } = await supabase
      .from("machines")
      .select("id, machine_id, name")
      .order("id");

    if (machineError) {
      setMessage(machineError.message);
    } else {
      setMachines(machineData ?? []);
    }

    const {
      data: maintenanceData,
      error: maintenanceError,
    } = await supabase
      .from("maintenance_records")
      .select("*")
      .order("maintenance_date", {
        ascending: false,
      });

    if (maintenanceError) {
      setMessage(maintenanceError.message);
    } else {
      setRecords(maintenanceData ?? []);
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
    setMaintenanceType("");
    setProblem("");
    setActionTaken("");
    setMaintenanceDate("");
    setStatus("Pending");
    setEditingId(null);
  }

  // =========================
  // Add / Edit
  // =========================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");

    if (
      !machineId ||
      !maintenanceType ||
      !problem ||
      !actionTaken ||
      !maintenanceDate
    ) {
      setMessage(
        "กรุณากรอกข้อมูลที่จำเป็นให้ครบ"
      );
      return;
    }

    if (!userId) {
      setMessage(
        "ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่"
      );
      return;
    }

    const data = {
      machine_id: Number(machineId),
      maintenance_type: maintenanceType,
      problem,
      action_taken: actionTaken,
      technician_id: userId,
      maintenance_date: maintenanceDate,
      status,
    };

    if (editingId) {
      const { error } = await supabase
        .from("maintenance_records")
        .update(data)
        .eq("id", editingId);

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("แก้ไข Maintenance สำเร็จ");
    } else {
      const { error } = await supabase
        .from("maintenance_records")
        .insert(data);

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("เพิ่ม Maintenance สำเร็จ");
    }

    resetForm();
    await loadData();
  }

  // =========================
  // Edit
  // =========================

  function handleEdit(record: Maintenance) {
    setEditingId(record.id);

    setMachineId(String(record.machine_id));
    setMaintenanceType(record.maintenance_type);
    setProblem(record.problem);
    setActionTaken(record.action_taken);

    setMaintenanceDate(
      record.maintenance_date?.slice(0, 10) ?? ""
    );

    setStatus(record.status);
    setMessage("");
  }

  // =========================
  // Delete
  // =========================

  async function handleDelete(id: number) {
    if (role !== "admin") {
      setMessage(
        "เฉพาะ Admin เท่านั้นที่สามารถลบ Maintenance ได้"
      );
      return;
    }

    if (
      !confirm(
        "ต้องการลบรายการ Maintenance นี้ใช่หรือไม่?"
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("maintenance_records")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("ลบ Maintenance สำเร็จ");

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
  // Filter
  // =========================

  const filteredRecords = records.filter(
    (record) => {
      const machineMatch =
        !machineFilter ||
        String(record.machine_id) ===
          machineFilter;

      const statusMatch =
        !statusFilter ||
        record.status === statusFilter;

      const technicianMatch =
        !technicianFilter ||
        record.technician_id
          .toLowerCase()
          .includes(
            technicianFilter.toLowerCase()
          );

      const dateMatch =
        !dateFilter ||
        record.maintenance_date?.slice(0, 10) ===
          dateFilter;

      return (
        machineMatch &&
        statusMatch &&
        technicianMatch &&
        dateMatch
      );
    }
  );

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="text-slate-400">
            กำลังโหลดข้อมูล Maintenance...
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // Summary
  // =========================

  const pendingCount = records.filter(
    (record) => record.status === "Pending"
  ).length;

  const progressCount = records.filter(
    (record) => record.status === "In Progress"
  ).length;

  const completedCount = records.filter(
    (record) => record.status === "Completed"
  ).length;

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

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-2xl">
                🔧
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-blue-400">
                  Industrial System
                </p>

                <h1 className="text-3xl font-bold tracking-tight">
                  Maintenance Management
                </h1>
              </div>

            </div>

            <p className="text-slate-400">
              จัดการและติดตามการบำรุงรักษาเครื่องจักร
            </p>
          </div>

          <button
            onClick={() =>
              (window.location.href =
                "/dashboard")
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
            title="Pending"
            value={pendingCount}
            icon="🟠"
            description="รอดำเนินการ"
          />

          <SummaryCard
            title="In Progress"
            value={progressCount}
            icon="🟡"
            description="กำลังดำเนินการ"
          />

          <SummaryCard
            title="Completed"
            value={completedCount}
            icon="🟢"
            description="ดำเนินการเสร็จแล้ว"
          />

        </div>

        {/* =========================
            Add / Edit Form
        ========================= */}

        {(role === "admin" ||
          role === "technician") && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl shadow-black/20 p-6 mb-6">

            <div className="flex items-center gap-3 mb-6">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                {editingId ? "✏️" : "🔧"}
              </div>

              <div>
                <h2 className="text-xl font-semibold">
                  {editingId
                    ? "แก้ไข Maintenance"
                    : "เพิ่ม Maintenance"}
                </h2>

                <p className="text-sm text-slate-400">
                  {editingId
                    ? "แก้ไขข้อมูลการบำรุงรักษา"
                    : "บันทึกข้อมูลการบำรุงรักษาใหม่"}
                </p>
              </div>

            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >

              {/* Machine */}

              <FormSelect
                label="Machine"
                value={machineId}
                onChange={setMachineId}
                required
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

              {/* Type */}

              <FormInput
                label="Maintenance Type"
                value={maintenanceType}
                onChange={setMaintenanceType}
                placeholder="เช่น Preventive"
                required
              />

              {/* Problem */}

              <FormTextarea
                label="Problem"
                value={problem}
                onChange={setProblem}
                placeholder="ปัญหาที่พบ"
                required
              />

              {/* Action */}

              <FormTextarea
                label="Action Taken"
                value={actionTaken}
                onChange={setActionTaken}
                placeholder="การดำเนินการแก้ไข"
                required
              />

              {/* Technician */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Technician
                </label>

                <input
                  value={
                    role === "technician"
                      ? "ผู้ใช้ที่กำลังเข้าสู่ระบบ"
                      : userId
                  }
                  disabled
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-500"
                />

              </div>

              {/* Date */}

              <FormInput
                label="Maintenance Date"
                type="date"
                value={maintenanceDate}
                onChange={setMaintenanceDate}
                required
              />

              {/* Status */}

              <FormSelect
                label="Status"
                value={status}
                onChange={setStatus}
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

              <div className="flex flex-wrap gap-3 items-end">

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                >
                  {editingId
                    ? "บันทึกการแก้ไข"
                    : "＋ เพิ่ม Maintenance"}
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
            Records
        ========================= */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl shadow-black/20 overflow-hidden">

          {/* Records Header */}

          <div className="p-6 border-b border-slate-800">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">

              <div>
                <h2 className="text-xl font-semibold">
                  Maintenance Records
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                  รายการบำรุงรักษาเครื่องจักรทั้งหมด
                </p>
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300">
                พบ{" "}
                <span className="font-bold text-white">
                  {filteredRecords.length}
                </span>{" "}
                รายการ
              </div>

            </div>

            {/* Filters */}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">

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

              {/* Technician */}

              <input
                value={technicianFilter}
                onChange={(e) =>
                  setTechnicianFilter(
                    e.target.value
                  )
                }
                placeholder="🔎 ค้นหา Technician ID"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />

              {/* Date */}

              <input
                type="date"
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(e.target.value)
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />

            </div>

            {/* Filter Actions */}

            <div className="flex justify-end mt-4">

              <button
                onClick={() => {
                  setMachineFilter("");
                  setStatusFilter("");
                  setTechnicianFilter("");
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

            <table className="w-full min-w-[1200px]">

              <thead className="bg-slate-950/80">

                <tr className="border-b border-slate-800">

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Machine
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Type
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Problem
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action Taken
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Technician ID
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredRecords.length === 0 ? (

                  <tr>

                    <td
                      colSpan={8}
                      className="px-6 py-16 text-center"
                    >

                      <div className="text-4xl mb-3">
                        🛠️
                      </div>

                      <p className="font-medium text-slate-300">
                        ไม่พบข้อมูล Maintenance
                      </p>

                      <p className="text-sm text-slate-500 mt-1">
                        ลองเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง
                      </p>

                    </td>

                  </tr>

                ) : (

                  filteredRecords.map((record) => (

                    <tr
                      key={record.id}
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
                                  record.machine_id
                                ).split(" - ")[0]
                              }
                            </p>

                            <p className="text-xs text-slate-500">
                              {
                                getMachineName(
                                  record.machine_id
                                ).split(" - ")[1]
                              }
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* Type */}

                      <td className="px-5 py-5">

                        <span className="inline-flex rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
                          {record.maintenance_type}
                        </span>

                      </td>

                      {/* Problem */}

                      <td className="px-5 py-5 max-w-xs">

                        <p className="text-sm text-slate-300">
                          {record.problem}
                        </p>

                      </td>

                      {/* Action */}

                      <td className="px-5 py-5 max-w-xs">

                        <p className="text-sm text-slate-300">
                          {record.action_taken}
                        </p>

                      </td>

                      {/* Technician */}

                      <td className="px-5 py-5">

                        <span className="font-mono text-xs text-slate-400 break-all">
                          {record.technician_id}
                        </span>

                      </td>

                      {/* Date */}

                      <td className="px-5 py-5">

                        <p className="text-sm text-slate-300">
                          {record.maintenance_date}
                        </p>

                      </td>

                      {/* Status */}

                      <td className="px-5 py-5">

                        <StatusBadge
                          status={record.status}
                        />

                      </td>

                      {/* Actions */}

                      <td className="px-5 py-5">

                        <div className="flex gap-2">

                          <button
                            onClick={() =>
                              handleEdit(record)
                            }
                            className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-sm font-medium text-yellow-300 transition hover:bg-yellow-500/20"
                          >
                            ✏️ แก้ไข
                          </button>

                          {role === "admin" && (
                            <button
                              onClick={() =>
                                handleDelete(
                                  record.id
                                )
                              }
                              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                            >
                              🗑 ลบ
                            </button>
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
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />

    </label>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}

        {required && (
          <span className="ml-1 text-red-400">
            *
          </span>
        )}
      </span>

      <textarea
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        required={required}
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />

    </label>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  children,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}

        {required && (
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
        required={required}
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
  status: string;
}) {
  const styles: Record<string, string> = {
    Pending:
      "border-orange-500/20 bg-orange-500/10 text-orange-300",

    "In Progress":
      "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",

    Completed:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  };

  const icons: Record<string, string> = {
    Pending: "🟠",
    "In Progress": "🟡",
    Completed: "🟢",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        styles[status] ??
        "border-slate-700 bg-slate-800 text-slate-300"
      }`}
    >
      <span>{icons[status] ?? "⚪"}</span>
      {status}
    </span>
  );
}