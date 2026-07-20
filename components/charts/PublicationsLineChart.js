"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyNote } from "./EmptyNote";

export default function PublicationsLineChart({ data }) {
  const hasSignal = data.some((d) => d.count > 0);
  if (!hasSignal) return <EmptyNote />;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="pubFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#58bd2b" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#58bd2b" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#eef2f7" />
        <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#5b6b84" }} axisLine={{ stroke: "#dbe3ee" }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#5b6b84" }} axisLine={false} tickLine={false} width={30} />
        <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #dbe3ee" }} />
        <Area type="monotone" dataKey="count" stroke="#3a7d18" strokeWidth={2} fill="url(#pubFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
