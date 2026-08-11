"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function PipelineProgressChart({ data }: { data: { stage: string; completed: number; total: number }[] }) {
  return (
    <div className="bg-surface-white rounded-xl border border-surface-border p-5">
      <p className="text-sm font-medium text-white mb-4">Pipeline progress</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E3E8EF" vertical={false} />
          <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "#5B6B7F" }} interval={0} angle={-20} textAnchor="end" height={70} />
          <YAxis tick={{ fontSize: 11, fill: "#5B6B7F" }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #E3E8EF", fontSize: 12 }}
            formatter={(value: number, name: string) => [value, name === "completed" ? "Completed" : "Total"]}
          />
          <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
