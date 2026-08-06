import { NextResponse } from "next/server";
import { searchRecords } from "../../../lib/search";
import { getIndication, INDICATIONS } from "../../../lib/config";

const DEFAULT = Object.keys(INDICATIONS)[0];

// OPTIONAL AI answer layer. Disabled unless ANTHROPIC_API_KEY is set. When
// enabled, answers ONLY from records retrieved by our own search (no outside
// knowledge), scoped to the current indication, and always disclaimed.
export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ enabled: false });

  let q = "", slug = DEFAULT;
  try {
    const body = await request.json();
    q = String(body.q || "").trim();
    slug = String(body.area || DEFAULT);
  } catch {
    return NextResponse.json({ enabled: true, answer: "", error: "Bad request" }, { status: 400 });
  }
  const area = getIndication(slug) || getIndication(DEFAULT);
  if (q.length < 2) return NextResponse.json({ enabled: true, answer: "", sources: [] });

  try {
    const { groups } = await searchRecords(area, q, 5);
    const contextLines = [];
    const sources = [];
    for (const g of groups) {
      for (const item of g.items) {
        contextLines.push(`- [${item.badge}] ${item.title} — ${item.subtitle}${item.meta ? " (" + item.meta + ")" : ""} | ${item.url}`);
        sources.push({ title: item.title, url: item.url, badge: item.badge });
      }
    }
    if (contextLines.length === 0) {
      return NextResponse.json({
        enabled: true,
        answer: "I couldn't find anything in the platform's current data matching that question. Try rephrasing, or browse the sections directly.",
        sources: [],
      });
    }

    const context = contextLines.join("\n");
    const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
    const system =
      `You are a retrieval assistant for a Biohaven ${area.label} competitive/regulatory intelligence tracker. ` +
      "Answer the user's question USING ONLY the records provided in the context. " +
      "Do not use outside knowledge and do not infer facts that are not present. " +
      "If the context does not contain the answer, say so plainly. " +
      "Be concise (2-4 sentences). Refer to specific brands, trials, or papers by name. " +
      "Do not give medical advice.";
    const userMsg = `Question: ${q}\n\nContext records (the only information you may use):\n${context}`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 400, system, messages: [{ role: "user", content: userMsg }] }),
    });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      return NextResponse.json({
        enabled: true, answer: "", sources,
        error: `AI service returned ${resp.status}. Check ANTHROPIC_MODEL is a current model string.`,
        detail: detail.slice(0, 300),
      });
    }
    const data = await resp.json();
    const answer = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    return NextResponse.json({ enabled: true, answer, sources });
  } catch (err) {
    return NextResponse.json({ enabled: true, answer: "", error: err.message || "Ask failed" });
  }
}
