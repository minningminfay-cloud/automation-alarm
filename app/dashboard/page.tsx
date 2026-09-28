import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";
import AlarmChart from "./AlarmChart";
import ThemeToggle from "../components/ThemeToggle";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-slate-900 sm:p-8">
          <p className="text-lg font-semibold text-slate-800 dark:text-white">
            กรุณาเข้าสู่ระบบก่อน
          </p>
        </div>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  // ================= MACHINE / ALARM / MAINTENANCE COUNT =================

  const { count: machineCount } = await supabase
    .from("machines")
    .select("*", { count: "exact", head: true });

  const { count: alarmCount } = await supabase
    .from("alarms")
    .select("*", { count: "exact", head: true });

  const { count: maintenanceCount } = await supabase
    .from("maintenance_records")
    .select("*", { count: "exact", head: true });

  // ================= MACHINE STATUS =================

  const { count: runningCount } = await supabase
    .from("machines")
    .select("*", { count: "exact", head: true })
    .eq("status", "Running");

  const { count: stopCount } = await supabase
    .from("machines")
    .select("*", { count: "exact", head: true })
    .eq("status", "Stop");

  const { count: alarmMachineCount } = await supabase
    .from("machines")
    .select("*", { count: "exact", head: true })
    .eq("status", "Alarm");

  const { count: maintenanceMachineCount } = await supabase
    .from("machines")
    .select("*", { count: "exact", head: true })
    .eq("status", "Maintenance");

  // ================= NOTIFICATION DATA =================

  const { count: openAlarmCount } = await supabase
    .from("alarms")
    .select("*", { count: "exact", head: true })
    .eq("status", "Open");

  const { count: inProgressAlarmCount } = await supabase
    .from("alarms")
    .select("*", { count: "exact", head: true })
    .eq("status", "In Progress");

  const { count: pendingMaintenanceCount } = await supabase
    .from("maintenance_records")
    .select("*", { count: "exact", head: true })
    .eq("status", "Pending");

  const { count: waitingPartCount } = await supabase
    .from("maintenance_records")
    .select("*", { count: "exact", head: true })
    .eq("status", "Waiting Part");

  // ================= ALARM CHART DATA =================

  const { data: alarms } = await supabase
    .from("alarms")
    .select("status");

  const alarmChartData = [
    {
      name: "Open",
      value:
        alarms?.filter(
          (alarm) => alarm.status === "Open"
        ).length ?? 0,
    },
    {
      name: "In Progress",
      value:
        alarms?.filter(
          (alarm) =>
            alarm.status === "In Progress"
        ).length ?? 0,
    },
    {
      name: "Closed",
      value:
        alarms?.filter(
          (alarm) => alarm.status === "Closed"
        ).length ?? 0,
    },
  ];

  return (
    <main className="min-h-screen bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      {/* ================= BACKGROUND ================= */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl sm:h-96 sm:w-96" />

        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl sm:h-96 sm:w-96" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        {/* ================= HEADER ================= */}

        <header className="mb-8 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-xl backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/90 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            {/* LOGO + TITLE */}

            <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20 sm:h-14 sm:w-14">
                <span className="text-xl sm:text-2xl">
                  ⚙️
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    Automation Alarm
                  </h1>

                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-500 dark:text-emerald-400 sm:px-3 sm:text-xs">
                    ● SYSTEM ONLINE
                  </span>
                </div>

                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
                  Industrial Machine Monitoring & Maintenance System
                </p>
              </div>
            </div>

            {/* USER */}

            <div className="flex w-full items-center justify-between gap-2 sm:justify-end sm:gap-3 lg:w-auto">
              <div className="min-w-0 flex-1 sm:flex-none sm:text-right">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white sm:max-w-48">
                  {profile?.full_name || user.email}
                </p>

                <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                  {profile?.role || "user"}
                </p>
              </div>

              <ThemeToggle />

              <LogoutButton />
            </div>
          </div>
        </header>

        {/* ================= WELCOME ================= */}

        <section className="mb-7 sm:mb-8">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-blue-500 dark:text-blue-400 sm:text-sm sm:tracking-[0.2em]">
            Control Center
          </p>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Dashboard Overview
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
            ภาพรวมสถานะเครื่องจักร Alarm และงานบำรุงรักษา
          </p>
        </section>

        {/* ================= MAIN STAT ================= */}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          <StatCard
            title="Total Machines"
            value={machineCount ?? 0}
            icon="🏭"
            description="เครื่องจักรทั้งหมด"
            accent="blue"
          />

          <StatCard
            title="Alarm Records"
            value={alarmCount ?? 0}
            icon="🚨"
            description="รายการ Alarm ทั้งหมด"
            accent="red"
          />

          <StatCard
            title="Maintenance Records"
            value={maintenanceCount ?? 0}
            icon="🔧"
            description="รายการบำรุงรักษา"
            accent="amber"
          />
        </section>

        {/* ================= NOTIFICATIONS ================= */}

        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
              🔔 Notifications
            </h2>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              รายการที่ต้องติดตาม
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <NotificationCard
              href="/alarms"
              title="Open Alarm"
              value={openAlarmCount ?? 0}
              description="Alarm ที่ยังไม่ได้ดำเนินการ"
              icon="🚨"
              color="red"
            />

            <NotificationCard
              href="/alarms"
              title="In Progress"
              value={inProgressAlarmCount ?? 0}
              description="Alarm ที่กำลังดำเนินการ"
              icon="⚠️"
              color="amber"
            />

            <NotificationCard
              href="/maintenance"
              title="Pending Maintenance"
              value={pendingMaintenanceCount ?? 0}
              description="งานบำรุงรักษาที่รอดำเนินการ"
              icon="🔧"
              color="blue"
            />

            <NotificationCard
              href="/maintenance"
              title="Waiting Part"
              value={waitingPartCount ?? 0}
              description="งานที่กำลังรออะไหล่"
              icon="📦"
              color="purple"
            />
          </div>
        </section>

        {/* ================= ALARM CHART ================= */}

        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
              Alarm Overview
            </h2>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              จำนวน Alarm แยกตามสถานะ
            </p>
          </div>

          <div className="w-full min-w-0 overflow-hidden rounded-2xl">
            <AlarmChart data={alarmChartData} />
          </div>
        </section>

        {/* ================= MACHINE STATUS ================= */}

        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
              Machine Status
            </h2>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              สถานะปัจจุบันของเครื่องจักร
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <StatusCard
              title="Running"
              value={runningCount ?? 0}
              icon="✓"
              color="green"
            />

            <StatusCard
              title="Stop"
              value={stopCount ?? 0}
              icon="■"
              color="slate"
            />

            <StatusCard
              title="Alarm"
              value={alarmMachineCount ?? 0}
              icon="!"
              color="red"
            />

            <StatusCard
              title="Maintenance"
              value={maintenanceMachineCount ?? 0}
              icon="🔧"
              color="amber"
            />
          </div>
        </section>

        {/* ================= MANAGEMENT ================= */}

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
              Management
            </h2>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              จัดการข้อมูลของระบบ
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            <ManagementCard
              href="/machines"
              icon="🏭"
              title="Machine Management"
              description="จัดการข้อมูลเครื่องจักร สถานที่ และสถานะ"
            />

            <ManagementCard
              href="/alarms"
              icon="🚨"
              title="Alarm Management"
              description="จัดการ Alarm และติดตามสถานะของปัญหา"
            />

            <ManagementCard
              href="/maintenance"
              icon="🔧"
              title="Maintenance"
              description="บันทึกและติดตามงานบำรุงรักษาเครื่องจักร"
            />

            <ManagementCard
              href="/audit-logs"
              icon="📝"
              title="Audit Log"
              description="ตรวจสอบประวัติการเพิ่ม แก้ไข และลบข้อมูล"
            />
          </div>
        </section>

        {/* ================= FOOTER ================= */}

        <footer className="mt-10 border-t border-slate-200 pt-6 text-center dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-600">
            Automation Alarm & Maintenance Management System
          </p>
        </footer>
      </div>
    </main>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  title,
  value,
  icon,
  description,
  accent,
}: {
  title: string;
  value: number;
  icon: string;
  description: string;
  accent: "blue" | "red" | "amber";
}) {
  const accentClasses = {
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-500 dark:text-blue-400",
    red: "border-red-500/20 bg-red-500/10 text-red-500 dark:text-red-400",
    amber:
      "border-amber-500/20 bg-amber-500/10 text-amber-500 dark:text-amber-400",
  };

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-lg transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:mt-3 sm:text-4xl">
            {value}
          </p>

          <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-500 sm:text-xs">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg sm:h-12 sm:w-12 sm:text-xl ${accentClasses[accent]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   STATUS CARD
===================================================== */

function StatusCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: "green" | "slate" | "red" | "amber";
}) {
  const styles = {
    green: {
      box: "border-emerald-500/20 bg-emerald-500/10",
      icon: "bg-emerald-500/20 text-emerald-500 dark:text-emerald-400",
      text: "text-emerald-500 dark:text-emerald-400",
    },

    slate: {
      box: "border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50",
      icon: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
      text: "text-slate-700 dark:text-slate-200",
    },

    red: {
      box: "border-red-500/20 bg-red-500/10",
      icon: "bg-red-500/20 text-red-500 dark:text-red-400",
      text: "text-red-500 dark:text-red-400",
    },

    amber: {
      box: "border-amber-500/20 bg-amber-500/10",
      icon: "bg-amber-500/20 text-amber-500 dark:text-amber-400",
      text: "text-amber-500 dark:text-amber-400",
    },
  };

  const current = styles[color];

  return (
    <div
      className={`rounded-2xl border p-4 transition duration-300 hover:-translate-y-1 sm:p-5 ${current.box}`}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-400 sm:text-sm">
            {title}
          </p>

          <p
            className={`mt-1 text-2xl font-bold sm:mt-2 sm:text-3xl ${current.text}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base font-bold sm:h-11 sm:w-11 sm:text-lg ${current.icon}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   NOTIFICATION CARD
===================================================== */

function NotificationCard({
  href,
  title,
  value,
  description,
  icon,
  color,
}: {
  href: string;
  title: string;
  value: number;
  description: string;
  icon: string;
  color: "red" | "amber" | "blue" | "purple";
}) {
  const styles = {
    red: {
      box: "border-red-500/20 bg-red-500/10",
      icon: "bg-red-500/20 text-red-500 dark:text-red-400",
      value: "text-red-500 dark:text-red-400",
    },

    amber: {
      box: "border-amber-500/20 bg-amber-500/10",
      icon: "bg-amber-500/20 text-amber-500 dark:text-amber-400",
      value: "text-amber-500 dark:text-amber-400",
    },

    blue: {
      box: "border-blue-500/20 bg-blue-500/10",
      icon: "bg-blue-500/20 text-blue-500 dark:text-blue-400",
      value: "text-blue-500 dark:text-blue-400",
    },

    purple: {
      box: "border-purple-500/20 bg-purple-500/10",
      icon: "bg-purple-500/20 text-purple-500 dark:text-purple-400",
      value: "text-purple-500 dark:text-purple-400",
    },
  };

  const current = styles[color];
  const hasNotification = value > 0;

  return (
    <a
      href={href}
      className={`group rounded-2xl border p-4 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-5 ${current.box}`}
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {title}
          </p>

          <p
            className={`mt-1 text-3xl font-bold sm:mt-2 ${current.value}`}
          >
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg sm:h-11 sm:w-11 ${current.icon}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span
          className={`text-[11px] font-medium leading-4 sm:text-xs ${
            hasNotification
              ? current.value
              : "text-emerald-500 dark:text-emerald-400"
          }`}
        >
          {hasNotification
            ? "มีรายการที่ต้องติดตาม"
            : "ไม่มีรายการที่ต้องติดตาม"}
        </span>

        <span className="shrink-0 text-xs text-slate-500 transition group-hover:translate-x-1 group-hover:text-slate-800 dark:text-slate-600 dark:group-hover:text-slate-300">
          ดูรายการ →
        </span>
      </div>
    </a>
  );
}

/* =====================================================
   MANAGEMENT CARD
===================================================== */

function ManagementCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-lg transition duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 sm:p-6"
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/5 transition duration-300 group-hover:scale-150" />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xl sm:h-12 sm:w-12 sm:text-2xl">
            {icon}
          </div>

          <span className="text-lg text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-500 dark:text-slate-600 dark:group-hover:text-blue-400 sm:text-xl">
            →
          </span>
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
          {title}
        </h3>

        <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400 sm:text-sm sm:leading-6">
          {description}
        </p>
      </div>
    </a>
  );
}