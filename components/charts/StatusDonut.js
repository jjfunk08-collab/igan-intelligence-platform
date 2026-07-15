"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { EmptyNote } from "./EmptyNote";

const COLORS = {
  Recruiting: "#58bd2b",
  "Active / Enrolling": "#00a3da",
  Completed: "#a8b3c3",
  "Terminated / Withdrawn": "#b0304a",
  Other: "#6d2077",
};

export default function StatusDonut({ data }) {
  if (!data.length) return <EmptyNote />;
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <div style={{ width: 180, height: 180, flexShrink: 0, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius={54}
              outerRadius={82}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.key} fill={COLORS[d.label] || "#4d4d4f"} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #dbe3ee" }} />
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", pointerEvents: "none",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "var(--navy)" }}>
            {total}
          </div>
          <div style={{ fontSize: 10.5, color: "var(--ink-muted)" }}>trials</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
        {data.map((d) => (
          <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 9, height: 9, borderRadius: "50%",
                background: COLORS[d.label] || "#4d4d4f", flexShrink: 0,
              }}
            />
            <span style={{ color: "var(--ink)" }}>{d.label}</span>
            <span className="mono muted">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
