"use client";

import { useState } from "react";

export default function CopyBrief({ text }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button className="btn btn--ghost" onClick={handleCopy} type="button">
      {copied ? "Copied ✓" : "Copy brief as text"}
    </button>
  );
}
