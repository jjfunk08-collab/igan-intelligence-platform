"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyNote } from "./EmptyNote";

const COLORS = {
  "Phase 1": "#4d4d4f",
  "Phase 2": "#00a3da",
  "Phase 3": "#0047bb",
  "Phase 4": "#6d2077",
  "N/A": "#a8b3c3",
};

export default function PhaseBarChart({ data }) {
  if (!data.length) return <EmptyNote />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#eef2f7" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: "#5b6b84" }}
          axisLine={{ stroke: "#dbe3ee" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "#5b6b84" }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <Tooltip
          cursor={{ fill: "#eef3fa" }}
          contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #dbe3ee" }}
        />
        <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={56}>
          {data.map((d) => (
            <Cell key={d.key} fill={COLORS[d.label] || "#0047bb"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
