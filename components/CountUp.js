"use client";

import { useEffect, useState } from "react";

// Animated counter. SSR + first client paint render 0 (they match, no
// hydration mismatch), then it counts up to the target. Respects reduced motion.
export default function CountUp({ value, duration = 900 }) {
  const target = Number(value);
  const finite = Number.isFinite(target);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!finite) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setDisplay(target); return; }

    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, finite, duration]);

  if (!finite) return <>{value == null ? "\u2014" : value}</>;
  return <span suppressHydrationWarning>{Number(display).toLocaleString()}</span>;
}
