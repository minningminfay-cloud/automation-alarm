import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";
import AlarmChart from "./AlarmChart";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
          <p className="text-lg font-semibold text-slate-800">
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

  const { count: machineCount } = await supabase
    .from("machines")
    .select("*", { count: "exact", head: true });

  const { count: alarmCount } = await supabase
    .from("alarms")
    .select("*", { count: "exact", head: true });

  const { count: maintenanceCount } = await supabase
    .from("maintenance_records")
    .select("*", { count: "exact", head: true });

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

  // ================= ALARM CHART DATA =================

  const { data: alarms } = await supabase
    .from("alarms")
    .select("status");

  const alarmChartData = [
    {
      name: "Open",
      value: alarms?.filter((alarm) => alarm.status === "Open").length ?? 0,
    },
    {
      name: "In Progress",
      value:
        alarms?.filter((alarm) => alarm.status === "In Progress").length ?? 0,
    },
    {
      name: "Closed",
      value:
        alarms?.filter((alarm) => alarm.status === "Closed").length ?? 0,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-8">

        {/* ================= HEADER ================= */}

        <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
                <span className="text-2xl">⚙️</span>
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Automation Alarm
                  </h1>

                  <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 sm:inline-block">
                    ● SYSTEM ONLINE
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-400">
                  Industrial Machine Monitoring & Maintenance System
                </p>
              </div>

            </div>

            {/* User */}
            <div className="flex items-center gap-4">

              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-white">
                  {profile?.full_name || user.email}
                </p>

                <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                  {profile?.role || "user"}
                </p>
              </div>

              <LogoutButton />

            </div>

          </div>
        </header>

        {/* ================= WELCOME ================= */}

        <section className="mb-8">

          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
            Control Center
          </p>

          <h2 className="text-3xl font-bold text-white">
            Dashboard Overview
          </h2>

          <p className="mt-2 text-slate-400">
            ภาพรวมสถานะเครื่องจักร Alarm และงานบำรุงรักษา
          </p>

        </section>

        {/* ================= MAIN STAT ================= */}

        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

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

        {/* ================= ALARM CHART ================= */}

        <section className="mb-8">

          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">
              Alarm Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              จำนวน Alarm แยกตามสถานะ
            </p>
          </div>

          <AlarmChart data={alarmChartData} />

        </section>

        {/* ================= MACHINE STATUS ================= */}

        <section className="mb-8">

          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">
              Machine Status
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              สถานะปัจจุบันของเครื่องจักร
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

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
            <h2 className="text-xl font-bold text-white">
              Management
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              จัดการข้อมูลของระบบ
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

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

          </div>

        </section>

        {/* ================= FOOTER ================= */}

        <footer className="mt-10 border-t border-slate-800 pt-6 text-center">

          <p className="text-xs text-slate-600">
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
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-400",
    red: "border-red-500/20 bg-red-500/10 text-red-400",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  };

  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-slate-700 hover:shadow-2xl">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-4xl font-bold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xl ${accentClasses[accent]}`}
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
      icon: "bg-emerald-500/20 text-emerald-400",
      text: "text-emerald-400",
    },

    slate: {
      box: "border-slate-700 bg-slate-800/50",
      icon: "bg-slate-700 text-slate-300",
      text: "text-slate-200",
    },

    red: {
      box: "border-red-500/20 bg-red-500/10",
      icon: "bg-red-500/20 text-red-400",
      text: "text-red-400",
    },

    amber: {
      box: "border-amber-500/20 bg-amber-500/10",
      icon: "bg-amber-500/20 text-amber-400",
      text: "text-amber-400",
    },
  };

  const current = styles[color];

  return (
    <div
      className={`rounded-2xl border p-5 transition duration-300 hover:-translate-y-1 ${current.box}`}
    >

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <p
            className={`mt-2 text-3xl font-bold ${current.text}`}
          >
            {value}
          </p>

        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold ${current.icon}`}
        >
          {icon}
        </div>

      </div>

    </div>
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
      className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl transition duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-slate-800"
    >

      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/5 transition duration-300 group-hover:scale-150" />

      <div className="relative">

        <div className="mb-5 flex items-center justify-between">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
            {icon}
          </div>

          <span className="text-xl text-slate-600 transition group-hover:translate-x-1 group-hover:text-blue-400">
            →
          </span>

        </div>

        <h3 className="text-lg font-bold text-white">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {description}
        </p>

      </div>

    </a>
  );
}