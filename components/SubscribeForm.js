"use client";

import { useState } from "react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SubscribeForm({ indication, label, accent = "#0047bb" }) {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [message, setMessage] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, indication, frequency, dayOfWeek }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setState("done");
      setMessage(`You're subscribed — the ${label} brief will land in your inbox ${cadenceLabel(frequency, dayOfWeek)}.`);
    } catch (err) {
      setState("error");
      setMessage(err.message || "Something went wrong.");
    }
  }

  if (state === "done") {
    return (
      <div className="subscribe subscribe--done">
        <span className="subscribe__check" style={{ background: accent }}>✓</span>
        <p className="subscribe__msg">{message}</p>
      </div>
    );
  }

  return (
    <form className="subscribe" onSubmit={onSubmit}>
      <div className="subscribe__row">
        <p className="subscribe__title">Subscribe to this brief</p>
        <p className="subscribe__sub">Get the {label} brief emailed to you automatically — no need to check back.</p>
      </div>
      <div className="subscribe__controls">
        <input
          type="email"
          required
          placeholder="you@biohaven.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="subscribe__input"
        />
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="subscribe__select">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        {frequency === "weekly" ? (
          <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className="subscribe__select">
            {DAYS.map((d, i) => (
              <option key={d} value={i}>{d}s</option>
            ))}
          </select>
        ) : null}
        <button type="submit" className="btn" disabled={state === "loading"} style={{ background: accent, borderColor: accent }}>
          {state === "loading" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {state === "error" ? <p className="subscribe__error">{message}</p> : null}
      <p className="subscribe__fine">Internal use only. Unsubscribe anytime via the link in any email.</p>
    </form>
  );
}

function cadenceLabel(frequency, dayOfWeek) {
  if (frequency === "daily") return "every day";
  if (frequency === "monthly") return "on the 1st of each month";
  return `every ${DAYS[dayOfWeek]}`;
}
