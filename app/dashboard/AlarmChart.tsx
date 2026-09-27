"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type AlarmChartData = {
  name: string;
  value: number;
};

export default function AlarmChart({
  data,
}: {
  data: AlarmChartData[];
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">

      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">
          Alarm Count by Status
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          จำนวนรายการ Alarm ในแต่ละสถานะ
        </p>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 10,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
            />

            <XAxis
              dataKey="name"
              stroke="#94a3b8"
            />

            <YAxis
              allowDecimals={false}
              stroke="#94a3b8"
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "12px",
                color: "#ffffff",
              }}
              labelStyle={{
                color: "#ffffff",
              }}
            />

            <Bar
              dataKey="value"
              fill="#3b82f6"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}