"use client";

type AuditLog = {
  id: number;
  user_name: string;
  user_role: string;
  action: string;
  table_name: string;
  record_id: string;
  created_at: string;
};

export default function ExportCsvButton({
  logs,
}: {
  logs: AuditLog[];
}) {
  function escapeCsv(value: string | number) {
    return `"${String(value ?? "")
      .replace(/"/g, '""')
      .replace(/\n/g, " ")
      .replace(/\r/g, " ")}"`;
  }

  function exportCsv() {
    if (logs.length === 0) {
      alert("ไม่มีข้อมูลสำหรับ Export");
      return;
    }

    const header = [
      "ID",
      "Date / Time",
      "User",
      "Role",
      "Action",
      "Table",
      "Record ID",
    ];

    const rows = logs.map((log) => [
      log.id,
      log.created_at,
      log.user_name,
      log.user_role,
      log.action,
      log.table_name,
      log.record_id,
    ]);

    const csvContent = [
      header.map(escapeCsv).join(","),
      ...rows.map((row) =>
        row.map(escapeCsv).join(",")
      ),
    ].join("\r\n");

    // ช่วยให้ภาษาไทยเปิดใน Excel ได้ถูกต้อง
    const bom = "\uFEFF";

    const blob = new Blob(
      [bom + csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={exportCsv}
      disabled={logs.length === 0}
      className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
    >
      📥 Export CSV
    </button>
  );
}