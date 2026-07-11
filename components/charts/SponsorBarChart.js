"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyNote } from "./EmptyNote";

export default function SponsorBarChart({ data }) {
  if (!data.length) return <EmptyNote />;
  // Longest bar on top reads better for a leaderboard.
  const rows = [...data].reverse();
  const height = Math.max(180, rows.length * 34);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} stroke="#eef2f7" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#5b6b84" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="sponsor"
          width={170}
          tick={{ fontSize: 12, fill: "#17233a" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip cursor={{ fill: "#eef3fa" }} contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #dbe3ee" }} />
        <Bar dataKey="count" fill="#0047bb" radius={[0, 5, 5, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
