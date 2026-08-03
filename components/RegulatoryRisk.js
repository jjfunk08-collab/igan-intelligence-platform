import { getCRLs } from "../lib/sources/crl";
import { SourceTag } from "./ui";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmt(v) {
  if (!v) return "";
  const d = new Date(String(v).length === 4 ? `${v}-01-01` : v);
  if (isNaN(d)) return String(v);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
function resolvabilityColor(r) {
  const s = String(r || "").toLowerCase();
  if (s.includes("trial")) return "#b0304a";      // hardest to clear
  if (s.includes("procedural")) return "#3a7d18";  // usually resolvable
  return "#b5680a";                                // variable
}

function MixBars({ mix, sampleSize }) {
  if (!mix || !mix.length) return null;
  const max = Math.max(...mix.map((m) => m.count), 1);
  return (
    <div className="crl-mix">
      {mix.map((m) => (
        <div className="crl-mix__row" key={m.key}>
          <div className="crl-mix__label" title={m.resolvability}>{m.label}</div>
          <div className="crl-mix__track">
            <div className="crl-mix__fill" style={{ width: `${(m.count / max) * 100}%`, background: resolvabilityColor(m.resolvability) }} />
          </div>
          <div className="crl-mix__val">{m.count}</div>
        </div>
      ))}
      <p className="crl-mix__note">
        Strongest deficiency per letter across a {sampleSize}-letter sample. Bar color reflects how hard that
        class is to clear on resubmission (red = usually a new trial, amber = variable, green = usually procedural).
        Manufacturing/CMC prose is frequently redacted, so its true share is understated.
      </p>
    </div>
  );
}

function AnchorCard({ anchor }) {
  return (
    <div className="crl-anchor">
      <div className="crl-anchor__tag">Read this first · our own letter</div>
      <div className="crl-anchor__title">{anchor.program} — CRL issued {anchor.date}</div>
      <div className="crl-anchor__sub">{anchor.platform} · {anchor.indication} · {anchor.designations}</div>
      <p className="crl-anchor__body">{anchor.why}</p>
      <p className="crl-anchor__note">{anchor.note}</p>
    </div>
  );
}

export default async function RegulatoryRisk({ area, variant = "full" }) {
  let data;
  try {
    data = await getCRLs(area);
  } catch {
    return null; // never break a page over the CRL add-on
  }
  const { items, mix, anchor, playbook, total, live, source, sourceUrl, accessDate, sampleSize } = data;
  const topLabel = mix && mix.length ? mix[0].label.toLowerCase() : "manufacturing and inspection";

  // ---- COMPACT: slim signal strip for feed/overview pages ----
  if (variant === "compact") {
    return (
      <div className="card crl-compact">
        <span className="crl-compact__tag">Regulatory risk</span>
        <span className="crl-compact__text">
          Across the FDA&apos;s published CRL corpus{typeof total === "number" ? ` (${total.toLocaleString()} letters)` : ""},
          the deficiencies hardest to clear are clinical/efficacy findings. Biohaven&apos;s own {anchor.program} CRL
          ({anchor.date}) sits in that bucket.
        </span>
        <a className="crl-compact__link" href={`/${area.slug}/therapies#regulatory-risk`}>Regulatory-risk detail →</a>
      </div>
    );
  }

  // ---- CHART: deficiency mix + anchor note for the analytics page ----
  if (variant === "chart") {
    return (
      <section className="section" id="regulatory-risk">
        <div className="section__head">
          <div>
            <p className="section__eyebrow">Regulatory Risk · Complete Response Letters</p>
            <h2 className="section__title">Why FDA applications get rejected</h2>
          </div>
          <SourceTag source={source} accessDate={accessDate} />
        </div>
        <div className="card">
          <MixBars mix={mix} sampleSize={sampleSize} />
          <p className="crl-takeaway">
            Clinical/statistical findings are comparatively rare but the hardest to clear on resubmission — the
            bucket Biohaven&apos;s {anchor.program} letter sits in. {!live ? "(Showing an embedded seed set — openFDA was unreachable.)" : ""}
          </p>
        </div>
      </section>
    );
  }

  // ---- FULL: complete regulatory-risk section for the approvals page ----
  return (
    <section className="section" id="regulatory-risk">
      <div className="section__head">
        <div>
          <p className="section__eyebrow">Regulatory Risk · Complete Response Letters</p>
          <h2 className="section__title">Why applications get rejected — and what it means here</h2>
        </div>
        <SourceTag source={source} accessDate={accessDate} />
      </div>

      <AnchorCard anchor={anchor} />

      <div className="card" style={{ marginTop: 16 }}>
        <h3 className="crl-h3">Deficiency mix across the published corpus</h3>
        <MixBars mix={mix} sampleSize={sampleSize} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 className="crl-h3">CRLs involving companies active in this space</h3>
        {items && items.length ? (
          <div className="crl-list">
            {items.map((l, i) => (
              <div className="crl-list__row" key={`${l.company}-${i}`}>
                <div className="crl-list__main">
                  <div className="crl-list__co">{l.company}</div>
                  <div className="crl-list__meta">
                    {l.application ? `${l.application} · ` : ""}{l.date ? fmt(l.date) : "date n/a"}
                    {l.matchedOn ? <span className="crl-list__match"> · matched “{l.matchedOn}”</span> : null}
                  </div>
                </div>
                <div className="crl-list__reason">{l.reason}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No letters in the published sample mapped to companies in this indication&apos;s tracked set. The corpus-wide patterns above still apply.</p>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 className="crl-h3">Failure modes → the de-risking move that neutralizes each</h3>
        <div className="crl-play">
          {playbook.map((p, i) => (
            <div className="crl-play__row" key={i}>
              <div className="crl-play__driver"><span className="crl-play__x">✕</span>{p.driver}</div>
              <div className="crl-play__fix"><span className="crl-play__check">✓</span>{p.deRisker}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="crl-prov">
        {live
          ? `Live from openFDA${typeof total === "number" ? ` · ${total.toLocaleString()} published letters` : ""}. `
          : "openFDA was unreachable — showing a small embedded seed set. "}
        Categories are derived from each letter&apos;s own section headings; substantive clinical reasoning is often
        redacted, so the reliable signal is which section failed, not always the sentence explaining how.
        Source: <a href={sourceUrl} target="_blank" rel="noreferrer">openFDA CRL API</a>. Not regulatory advice.
      </p>
    </section>
  );
}
