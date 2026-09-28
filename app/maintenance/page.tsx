"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "../components/ThemeToggle";

type Machine = {
  id: number;
  machine_id: string;
  name: string;
};

type Technician = {
  id: string;
  full_name: string | null;
  role: string;
};

type Maintenance = {
  id: number;
  machine_id: number;
  maintenance_type: string;
  problem: string;
  action_taken: string;
  technician_id: string;
  maintenance_date: string;
  end_date: string | null;
  status: string;
};

const statuses = [
  "Pending",
  "In Progress",
  "Waiting Part",
  "Completed",
];

export default function MaintenancePage() {
  const supabase = createClient();

  // =========================
  // Data
  // =========================

  const [machines, setMachines] = useState<Machine[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [records, setRecords] = useState<Maintenance[]>([]);

  // =========================
  // User
  // =========================

  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");

  // =========================
  // Loading
  // =========================

  const [loading, setLoading] = useState(true);

  // =========================
  // Form
  // =========================

  const [machineId, setMachineId] = useState("");
  const [maintenanceType, setMaintenanceType] = useState("");
  const [problem, setProblem] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("Pending");

  const [editingId, setEditingId] = useState<number | null>(null);

  // =========================
  // Message
  // =========================

  const [message, setMessage] = useState("");

  // =========================
  // Filters
  // =========================

  const [machineFilter, setMachineFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [technicianFilter, setTechnicianFilter] = useState("");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

    setUserId(user.id);

    // Profile / Role

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const currentRole = profile?.role ?? "";

    setRole(currentRole);

    // Machines

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

    // Technicians / Staff

    const {
      data: technicianData,
      error: technicianError,
    } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["admin", "technician"])
      .order("full_name", { ascending: true });

    if (technicianError) {
      setMessage(technicianError.message);
    } else {
      setTechnicians(technicianData ?? []);
    }

    // Maintenance

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

    // Default Technician

    if (currentRole === "technician") {
      setTechnicianId(user.id);
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
    setEndDate("");
    setStatus("Pending");
    setEditingId(null);

    if (role === "technician") {
      setTechnicianId(userId);
    } else {
      setTechnicianId("");
    }
  }

  // =========================
  // Get Technician Name
  // =========================

  function getTechnicianName(id: string) {
    const technician = technicians.find(
      (item) => item.id === id
    );

    if (!technician) {
      return "ไม่พบข้อมูล Technician";
    }

    return technician.full_name?.trim()
      ? technician.full_name
      : "ไม่ระบุชื่อ";
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
  // Submit
  // =========================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");

    const cleanMaintenanceType =
      maintenanceType.trim();

    const cleanProblem =
      problem.trim();

    const cleanActionTaken =
      actionTaken.trim();

    // Required Validation

    if (
      !machineId ||
      !cleanMaintenanceType ||
      !cleanProblem ||
      !cleanActionTaken ||
      !maintenanceDate ||
      !endDate ||
      !technicianId
    ) {
      setMessage(
        "กรุณากรอกข้อมูลที่จำเป็นให้ครบ"
      );
      return;
    }

    // Machine Validation

    const selectedMachine = machines.find(
      (machine) =>
        String(machine.id) === machineId
    );

    if (!selectedMachine) {
      setMessage(
        "ไม่พบข้อมูลเครื่องจักรที่เลือก"
      );
      return;
    }

    // Maintenance Type Validation

    if (cleanMaintenanceType.length < 2) {
      setMessage(
        "Maintenance Type ต้องมีอย่างน้อย 2 ตัวอักษร"
      );
      return;
    }

    if (cleanMaintenanceType.length > 100) {
      setMessage(
        "Maintenance Type ต้องไม่เกิน 100 ตัวอักษร"
      );
      return;
    }

    // Problem Validation

    if (cleanProblem.length < 3) {
      setMessage(
        "Problem ต้องมีอย่างน้อย 3 ตัวอักษร"
      );
      return;
    }

    if (cleanProblem.length > 500) {
      setMessage(
        "Problem ต้องไม่เกิน 500 ตัวอักษร"
      );
      return;
    }

    // Action Validation

    if (cleanActionTaken.length < 3) {
      setMessage(
        "Action Taken ต้องมีอย่างน้อย 3 ตัวอักษร"
      );
      return;
    }

    if (cleanActionTaken.length > 500) {
      setMessage(
        "Action Taken ต้องไม่เกิน 500 ตัวอักษร"
      );
      return;
    }

    // Date Validation

    if (endDate < maintenanceDate) {
      setMessage(
        "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น"
      );
      return;
    }

    // Technician Validation

    const selectedTechnician =
      technicians.find(
        (technician) =>
          technician.id === technicianId
      );

    if (!selectedTechnician) {
      setMessage(
        "ไม่พบข้อมูล Technician ที่เลือก"
      );
      return;
    }

    // Status Validation

    if (!statuses.includes(status)) {
      setMessage(
        "กรุณาเลือก Status ที่ถูกต้อง"
      );
      return;
    }

    // Technician Permission

    if (
      role !== "admin" &&
      role !== "technician"
    ) {
      setMessage(
        "คุณไม่มีสิทธิ์เพิ่มหรือแก้ไข Maintenance"
      );
      return;
    }

    // Technician Self Check

    if (
      role === "technician" &&
      technicianId !== userId
    ) {
      setMessage(
        "Technician สามารถบันทึกงานในชื่อของตนเองเท่านั้น"
      );
      return;
    }

    // Maintenance Data

    const data = {
      machine_id: Number(machineId),
      maintenance_type: cleanMaintenanceType,
      problem: cleanProblem,
      action_taken: cleanActionTaken,
      technician_id: technicianId,
      maintenance_date: maintenanceDate,
      end_date: endDate,
      status,
    };

    // Edit

    if (editingId) {
      const { error } = await supabase
        .from("maintenance_records")
        .update(data)
        .eq("id", editingId);

      if (error) {
        setMessage(
          `ไม่สามารถแก้ไข Maintenance ได้: ${error.message}`
        );
        return;
      }

      setMessage(
        "แก้ไข Maintenance สำเร็จ"
      );
    }

    // Add

    else {
      const { error } = await supabase
        .from("maintenance_records")
        .insert(data);

      if (error) {
        setMessage(
          `ไม่สามารถเพิ่ม Maintenance ได้: ${error.message}`
        );
        return;
      }

      setMessage(
        "เพิ่ม Maintenance สำเร็จ"
      );
    }

    resetForm();
    await loadData();
  }

  // =========================
  // Edit
  // =========================

  function handleEdit(record: Maintenance) {
    setEditingId(record.id);

    setMachineId(
      String(record.machine_id)
    );

    setMaintenanceType(
      record.maintenance_type
    );

    setProblem(record.problem);

    setActionTaken(
      record.action_taken
    );

    setTechnicianId(
      record.technician_id
    );

    setMaintenanceDate(
      record.maintenance_date?.slice(
        0,
        10
      ) ?? ""
    );

    setEndDate(
      record.end_date?.slice(
        0,
        10
      ) ?? ""
    );

    setStatus(record.status);

    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
      setMessage(
        `ไม่สามารถลบ Maintenance ได้: ${error.message}`
      );
      return;
    }

    setMessage(
      "ลบ Maintenance สำเร็จ"
    );

    await loadData();
  }

  // =========================
  // Filter
  // =========================

  const invalidDateRange =
    Boolean(dateFrom) &&
    Boolean(dateTo) &&
    dateFrom > dateTo;

  const filteredRecords =
    records.filter((record) => {
      if (invalidDateRange) {
        return false;
      }

      const machineMatch =
        !machineFilter ||
        String(record.machine_id) ===
          machineFilter;

      const statusMatch =
        !statusFilter ||
        record.status === statusFilter;

      const technicianName =
        getTechnicianName(
          record.technician_id
        );

      const technicianMatch =
        !technicianFilter ||
        technicianName
          .toLowerCase()
          .includes(
            technicianFilter.toLowerCase()
          ) ||
        record.technician_id
          .toLowerCase()
          .includes(
            technicianFilter.toLowerCase()
          );

      const recordDate =
        record.maintenance_date?.slice(
          0,
          10
        ) ?? "";

      const dateFromMatch =
        !dateFrom ||
        recordDate >= dateFrom;

      const dateToMatch =
        !dateTo ||
        recordDate <= dateTo;

      return (
        machineMatch &&
        statusMatch &&
        technicianMatch &&
        dateFromMatch &&
        dateToMatch
      );
    });

  // =========================
  // Summary
  // =========================

  const pendingCount =
    records.filter(
      (record) =>
        record.status === "Pending"
    ).length;

  const progressCount =
    records.filter(
      (record) =>
        record.status === "In Progress"
    ).length;

  const waitingPartCount =
    records.filter(
      (record) =>
        record.status === "Waiting Part"
    ).length;

  const completedCount =
    records.filter(
      (record) =>
        record.status === "Completed"
    ).length;

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <main className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center text-slate-900 dark:text-white">
        <div className="text-center px-6">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-300 dark:border-slate-700 border-t-blue-500" />

          <p className="text-slate-500 dark:text-slate-400">
            กำลังโหลดข้อมูล Maintenance...
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // Page
  // =========================

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white p-3 sm:p-4 md:p-6 relative overflow-hidden transition-colors">

      {/* Background */}

      <div className="absolute top-0 left-0 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl">

        {/* Header */}

        <div className="flex flex-col gap-4 mb-6 md:mb-8 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="flex items-center gap-3 mb-2">

              <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-xl sm:text-2xl">
                🔧
              </div>

              <div>

                <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-blue-500 dark:text-blue-400">
                  Industrial System
                </p>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Maintenance Management
                </h1>

              </div>

            </div>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              จัดการและติดตามการบำรุงรักษาเครื่องจักร
            </p>

          </div>

          <div className="flex items-center gap-2 sm:gap-3">

            <ThemeToggle />

            <button
              onClick={() =>
                (window.location.href =
                  "/dashboard")
              }
              className="flex-1 sm:flex-none rounded-xl border border-slate-300 bg-white px-4 sm:px-5 py-3 text-sm sm:text-base font-medium text-slate-700 transition hover:bg-slate-100 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-600"
            >
              ← Dashboard
            </button>

          </div>

        </div>

        {/* Summary */}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mb-6">

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
            title="Waiting Part"
            value={waitingPartCount}
            icon="🔵"
            description="กำลังรออะไหล่"
          />

          <SummaryCard
            title="Completed"
            value={completedCount}
            icon="🟢"
            description="ดำเนินการเสร็จแล้ว"
          />

        </div>

        {/* Add / Edit Form */}

        {(role === "admin" ||
          role === "technician") && (

          <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/20 p-4 sm:p-6 mb-6">

            <div className="flex items-center gap-3 mb-6">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                {editingId
                  ? "✏️"
                  : "🔧"}
              </div>

              <div>

                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                  {editingId
                    ? "แก้ไข Maintenance"
                    : "เพิ่ม Maintenance"}
                </h2>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
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

              <FormSelect
                label="Machine"
                value={machineId}
                onChange={setMachineId}
                required
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
                label="Maintenance Type"
                value={maintenanceType}
                onChange={
                  setMaintenanceType
                }
                placeholder="เช่น Preventive"
                required
                maxLength={100}
              />

              <FormTextarea
                label="Problem"
                value={problem}
                onChange={setProblem}
                placeholder="ปัญหาที่พบ"
                required
                maxLength={500}
              />

              <FormTextarea
                label="Action Taken"
                value={actionTaken}
                onChange={
                  setActionTaken
                }
                placeholder="การดำเนินการแก้ไข"
                required
                maxLength={500}
              />

              {/* Technician */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Technician
                  <span className="ml-1 text-red-400">
                    *
                  </span>
                </label>

                {role === "admin" ? (

                  <select
                    value={technicianId}
                    onChange={(e) =>
                      setTechnicianId(
                        e.target.value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >

                    <option value="">
                      -- เลือก Technician --
                    </option>

                    {technicians.map(
                      (technician) => (
                        <option
                          key={technician.id}
                          value={technician.id}
                        >
                          {technician.full_name ||
                            "ไม่ระบุชื่อ"}
                        </option>
                      )
                    )}

                  </select>

                ) : (

                  <div className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">

                    <p className="font-medium text-slate-900 dark:text-white">
                      {getTechnicianName(
                        userId
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500 break-all">
                      {userId}
                    </p>

                  </div>

                )}

              </div>

              <FormInput
                label="Maintenance Date"
                type="date"
                value={maintenanceDate}
                onChange={
                  setMaintenanceDate
                }
                required
              />

              <FormInput
                label="End Date"
                type="date"
                value={endDate}
                onChange={setEndDate}
                required
              />

              <FormSelect
                label="Status"
                value={status}
                onChange={setStatus}
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

              {/* Buttons */}

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">

                <button
                  type="submit"
                  className="flex-1 sm:flex-none rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                >
                  {editingId
                    ? "บันทึกการแก้ไข"
                    : "＋ เพิ่ม Maintenance"}
                </button>

                {editingId && (

                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 sm:flex-none rounded-xl border border-slate-300 bg-slate-100 px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    ยกเลิก
                  </button>

                )}

              </div>

            </form>

          </div>
        )}

        {/* Message */}

        {message && (

          <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 sm:px-5 py-4 text-blue-600 dark:text-blue-300 shadow-lg">

            <div className="flex items-start gap-3">
              <span className="shrink-0">ℹ️</span>
              <span className="text-sm sm:text-base break-words">
                {message}
              </span>
            </div>

          </div>

        )}

        {/* Records */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/20 overflow-hidden">

          {/* Records Header */}

          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">

            <div className="flex flex-col gap-3 mb-5 md:flex-row md:items-center md:justify-between">

              <div>

                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                  Maintenance Records
                </h2>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  รายการบำรุงรักษาเครื่องจักรทั้งหมด
                </p>

              </div>

              <div className="w-fit rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">

                พบ{" "}

                <span className="font-bold text-slate-900 dark:text-white">
                  {filteredRecords.length}
                </span>{" "}

                รายการ

              </div>

            </div>

            {/* Filters */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

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
                value={technicianFilter}
                onChange={(e) =>
                  setTechnicianFilter(
                    e.target.value
                  )
                }
                placeholder="🔎 ค้นหา Technician"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />

              <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-1">

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    วันที่เริ่มต้น
                  </label>

                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) =>
                      setDateFrom(
                        e.target.value
                      )
                    }
                    max={
                      dateTo || undefined
                    }
                    style={{
                      colorScheme:
                        "light dark",
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    วันที่สิ้นสุด
                  </label>

                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) =>
                      setDateTo(
                        e.target.value
                      )
                    }
                    min={
                      dateFrom || undefined
                    }
                    style={{
                      colorScheme:
                        "light dark",
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />

                </div>

              </div>

            </div>

            {invalidDateRange && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                ⚠️ วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด
              </div>
            )}

            <div className="flex justify-end mt-4">

              <button
                onClick={() => {
                  setMachineFilter("");
                  setStatusFilter("");
                  setTechnicianFilter("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="w-full sm:w-auto rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                ↻ ล้างตัวกรอง
              </button>

            </div>

          </div>

          {/* =========================
              Desktop Table
          ========================= */}

          <div className="hidden lg:block overflow-x-auto">

            <table className="w-full min-w-[1450px]">

              <thead className="bg-slate-100 dark:bg-slate-950/80">

                <tr className="border-b border-slate-200 dark:border-slate-800">

                  <TableHeader>
                    Machine
                  </TableHeader>

                  <TableHeader>
                    Type
                  </TableHeader>

                  <TableHeader>
                    Problem
                  </TableHeader>

                  <TableHeader>
                    Action Taken
                  </TableHeader>

                  <TableHeader>
                    Technician
                  </TableHeader>

                  <TableHeader>
                    Start Date
                  </TableHeader>

                  <TableHeader>
                    End Date
                  </TableHeader>

                  <TableHeader>
                    Status
                  </TableHeader>

                  <TableHeader>
                    Actions
                  </TableHeader>

                </tr>

              </thead>

              <tbody>

                {filteredRecords.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan={9}
                      className="px-6 py-16 text-center"
                    >

                      <EmptyState />

                    </td>

                  </tr>

                ) : (

                  filteredRecords.map(
                    (record) => {

                      const machineName =
                        getMachineName(
                          record.machine_id
                        );

                      const machineParts =
                        machineName.split(
                          " - "
                        );

                      return (

                        <tr
                          key={record.id}
                          className="border-b border-slate-200 dark:border-slate-800/70 transition hover:bg-slate-100 dark:hover:bg-slate-800/40"
                        >

                          <td className="px-5 py-5">

                            <MachineInfo
                              machineCode={
                                machineParts[0]
                              }
                              machineName={
                                machineParts[1]
                              }
                            />

                          </td>

                          <td className="px-5 py-5">

                            <TypeBadge
                              type={
                                record.maintenance_type
                              }
                            />

                          </td>

                          <td className="px-5 py-5 max-w-xs">

                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {record.problem}
                            </p>

                          </td>

                          <td className="px-5 py-5 max-w-xs">

                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {
                                record.action_taken
                              }
                            </p>

                          </td>

                          <td className="px-5 py-5">

                            <TechnicianInfo
                              name={getTechnicianName(
                                record.technician_id
                              )}
                              id={
                                record.technician_id
                              }
                            />

                          </td>

                          <td className="px-5 py-5">

                            <DateDisplay
                              date={
                                record.maintenance_date
                              }
                            />

                          </td>

                          <td className="px-5 py-5">

                            <DateDisplay
                              date={
                                record.end_date
                              }
                            />

                          </td>

                          <td className="px-5 py-5">

                            <StatusBadge
                              status={
                                record.status
                              }
                            />

                          </td>

                          <td className="px-5 py-5">

                            <ActionButtons
                              role={role}
                              onEdit={() =>
                                handleEdit(
                                  record
                                )
                              }
                              onDelete={() =>
                                handleDelete(
                                  record.id
                                )
                              }
                            />

                          </td>

                        </tr>

                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

          {/* =========================
              Mobile / Tablet Cards
          ========================= */}

          <div className="lg:hidden p-3 sm:p-4">

            {filteredRecords.length ===
            0 ? (

              <EmptyState />

            ) : (

              <div className="space-y-4">

                {filteredRecords.map(
                  (record) => {

                    const machineName =
                      getMachineName(
                        record.machine_id
                      );

                    const machineParts =
                      machineName.split(
                        " - "
                      );

                    return (

                      <div
                        key={record.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                      >

                        {/* Card Header */}

                        <div className="flex items-start justify-between gap-3">

                          <MachineInfo
                            machineCode={
                              machineParts[0]
                            }
                            machineName={
                              machineParts[1]
                            }
                          />

                          <StatusBadge
                            status={
                              record.status
                            }
                          />

                        </div>

                        {/* Type */}

                        <div className="mt-4">

                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Maintenance Type
                          </p>

                          <TypeBadge
                            type={
                              record.maintenance_type
                            }
                          />

                        </div>

                        {/* Problem */}

                        <InfoBlock
                          title="Problem"
                          value={
                            record.problem
                          }
                        />

                        {/* Action */}

                        <InfoBlock
                          title="Action Taken"
                          value={
                            record.action_taken
                          }
                        />

                        {/* Technician */}

                        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">

                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Technician
                          </p>

                          <TechnicianInfo
                            name={getTechnicianName(
                              record.technician_id
                            )}
                            id={
                              record.technician_id
                            }
                          />

                        </div>

                        {/* Dates */}

                        <div className="mt-4 grid grid-cols-2 gap-3">

                          <DateCard
                            title="Start Date"
                            date={
                              record.maintenance_date
                            }
                          />

                          <DateCard
                            title="End Date"
                            date={
                              record.end_date
                            }
                          />

                        </div>

                        {/* Actions */}

                        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">

                          <ActionButtons
                            role={role}
                            fullWidth
                            onEdit={() =>
                              handleEdit(
                                record
                              )
                            }
                            onDelete={() =>
                              handleDelete(
                                record.id
                              )
                            }
                          />

                        </div>

                      </div>

                    );
                  }
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
   Table Header
========================================================= */

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">
      {children}
    </th>
  );
}

/* =========================================================
   Summary Card
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
    <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/10 transition-colors">

      <div className="flex items-start justify-between gap-2">

        <div className="min-w-0">

          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
            {title}
          </p>

          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-[10px] sm:text-xs text-slate-500 truncate">
            {description}
          </p>

        </div>

        <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg sm:text-xl dark:bg-slate-800">
          {icon}
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   Form Input
========================================================= */

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
            ? {
                colorScheme:
                  "light dark",
              }
            : undefined
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600"
      />

    </label>
  );
}

/* =========================================================
   Form Textarea
========================================================= */

function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
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

      <textarea
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600"
      />

    </label>
  );
}

/* =========================================================
   Form Select
========================================================= */

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

      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">

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
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
      >
        {children}
      </select>

    </label>
  );
}

/* =========================================================
   Filter Select
========================================================= */

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
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
    >
      {children}
    </select>
  );
}

/* =========================================================
   Machine Info
========================================================= */

function MachineInfo({
  machineCode,
  machineName,
}: {
  machineCode: string;
  machineName?: string;
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm dark:bg-slate-800">
        🏭
      </div>

      <div className="min-w-0">

        <p className="font-medium text-slate-900 dark:text-white break-words">
          {machineCode}
        </p>

        <p className="text-xs text-slate-500 break-words">
          {machineName || "-"}
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   Technician Info
========================================================= */

function TechnicianInfo({
  name,
  id,
}: {
  name: string;
  id: string;
}) {
  return (
    <div className="min-w-0">

      <p className="font-medium text-slate-900 dark:text-white break-words">
        {name}
      </p>

      <p className="mt-1 font-mono text-xs text-slate-500 break-all">
        {id}
      </p>

    </div>
  );
}

/* =========================================================
   Type Badge
========================================================= */

function TypeBadge({
  type,
}: {
  type: string;
}) {
  return (
    <span className="inline-flex max-w-full rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-300 break-words">
      {type}
    </span>
  );
}

/* =========================================================
   Date Display
========================================================= */

function DateDisplay({
  date,
}: {
  date: string | null;
}) {
  return (
    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
      {date ? date.slice(0, 10) : "-"}
    </p>
  );
}

/* =========================================================
   Date Card
========================================================= */

function DateCard({
  title,
  date,
}: {
  title: string;
  date: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">

      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
        {date ? date.slice(0, 10) : "-"}
      </p>

    </div>
  );
}

/* =========================================================
   Info Block
========================================================= */

function InfoBlock({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="mt-4">

      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </p>

      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">

        <p className="text-sm leading-6 text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
          {value}
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   Action Buttons
========================================================= */

function ActionButtons({
  role,
  onEdit,
  onDelete,
  fullWidth = false,
}: {
  role: string;
  onEdit: () => void;
  onDelete: () => void;
  fullWidth?: boolean;
}) {
  const canEdit =
    role === "admin" ||
    role === "technician";

  const canDelete =
    role === "admin";

  if (!canEdit && !canDelete) {
    return (
      <span className="text-sm text-slate-500">
        ไม่มีสิทธิ์ดำเนินการ
      </span>
    );
  }

  return (
    <div
      className={`flex gap-2 ${
        fullWidth
          ? "flex-col sm:flex-row"
          : "flex-wrap"
      }`}
    >

      {canEdit && (

        <button
          onClick={onEdit}
          className={`rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-sm font-medium text-yellow-600 dark:text-yellow-300 transition hover:bg-yellow-500/20 ${
            fullWidth
              ? "w-full sm:flex-1"
              : ""
          }`}
        >
          ✏️ แก้ไข
        </button>

      )}

      {canDelete && (

        <button
          onClick={onDelete}
          className={`rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-300 transition hover:bg-red-500/20 ${
            fullWidth
              ? "w-full sm:flex-1"
              : ""
          }`}
        >
          🗑 ลบ
        </button>

      )}

    </div>
  );
}

/* =========================================================
   Empty State
========================================================= */

function EmptyState() {
  return (
    <div className="py-10 sm:py-16 text-center">

      <div className="text-4xl mb-3">
        🛠️
      </div>

      <p className="font-medium text-slate-700 dark:text-slate-300">
        ไม่พบข้อมูล Maintenance
      </p>

      <p className="text-sm text-slate-500 mt-1">
        ลองเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง
      </p>

    </div>
  );
}

/* =========================================================
   Status Badge
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<
    string,
    string
  > = {
    Pending:
      "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-300",

    "In Progress":
      "border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-300",

    "Waiting Part":
      "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300",

    Completed:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  };

  const icons: Record<
    string,
    string
  > = {
    Pending: "🟠",
    "In Progress": "🟡",
    "Waiting Part": "🔵",
    Completed: "🟢",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
        styles[status] ??
        "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      <span>
        {icons[status] ?? "⚪"}
      </span>

      {status}
    </span>
  );
}