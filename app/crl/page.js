import { COMPANY, REVALIDATE_SECONDS, listIndications } from "../../lib/config";
import { getCRLCorpus } from "../../lib/sources/crl";
import { PageHeader, SourceTag } from "../../components/ui";
import CRLTracker from "../../components/CRLTracker";

export const revalidate = REVALIDATE_SECONDS;
export const metadata = { title: `CRL Tracker — ${COMPANY.product}` };

// Biohaven's own pivotal-stage programs, mapped to the CRL lesson that most
// applies to each. (Asset names per public pipeline disclosures.)
const BHV_ASSETS = {
  igan: "BHV-1400 (Gd-IgA1 TRAP)",
  graves: "BHV-1300 (IgG degrader)",
  "focal-epilepsy": "Opakalim (BHV-7000)",
  parkinsons: "BHV-8000 (TYK2/JAK1)",
  obesity: "Taldefgrobep alfa (BHV-2000)",
};
const LESSON =
  "Lock an adequate & well-controlled pivotal design with endpoints pre-specified before unblinding, and get the evidentiary bar agreed with FDA in writing — the exact gap behind the troriluzole CRL.";

function resolvabilityColor(r) {
  const s = String(r || "").toLowerCase();
  if (s.includes("trial")) return "#b0304a";
  if (s.includes("procedural")) return "#3a7d18";
  return "#b5680a";
}

export default async function CRLPage() {
  const data = await getCRLCorpus();
  const { letters, mix, categories, total, live, anchor, playbook, source, sourceUrl, accessDate, sampleSize } = data;
  const max = Math.max(...mix.map((m) => m.count), 1);
  const indications = listIndications();

  return (
    <>
      <div className="spacer-24" />
      <a href="/" className="link-more">&larr; Back to portfolio</a>
      <PageHeader
        eyebrow="Regulatory Intelligence · Complete Response Letters"
        title="CRL Tracker"
        meta={<SourceTag source={source} accessDate={accessDate} />}
      />

      <p className="notice" style={{ marginTop: 4 }}>
        The FDA&apos;s published Complete Response Letter corpus, read for pattern rather than anecdote: what actually
        blocks approvals, how often, and — for any letter — the specific sections and deficiencies cited. One of these
        letters was written to Biohaven.
      </p>

      {/* Anchor: Biohaven's own CRL */}
      <div className="crl-anchor" style={{ marginTop: 16 }}>
        <div className="crl-anchor__tag">Read this first · our own letter</div>
        <div className="crl-anchor__title">{anchor.program} — CRL issued {anchor.date}</div>
        <div className="crl-anchor__sub">{anchor.platform} · {anchor.indication} · {anchor.designations}</div>
        <p className="crl-anchor__body">{anchor.why}</p>
        <p className="crl-anchor__note">{anchor.note}</p>
      </div>

      {/* Deficiency mix */}
      <section className="section">
        <div className="section__head">
          <div>
            <p className="section__eyebrow">The corpus, by cause</p>
            <h2 className="section__title">Rejections cluster into a small number of causes</h2>
          </div>
        </div>
        <div className="card">
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
          </div>
          <p className="crl-mix__note">
            Strongest deficiency per letter across a {sampleSize}-letter sample. Color reflects how hard that class is
            to clear on resubmission (red = usually a new trial, amber = variable, green = usually procedural).
            Clinical/statistical findings are comparatively rare but the hardest to clear — the bucket the troriluzole
            letter sits in. Manufacturing/CMC prose is often redacted, so its true share is understated.
          </p>
        </div>
      </section>

      {/* Interactive tracker */}
      <section className="section">
        <div className="section__head">
          <div>
            <p className="section__eyebrow">Every letter · zoom in</p>
            <h2 className="section__title">Browse the corpus</h2>
          </div>
        </div>
        <CRLTracker letters={letters} categories={categories} total={total} />
      </section>

      {/* Pipeline mapping */}
      <section className="section">
        <div className="section__head">
          <div>
            <p className="section__eyebrow">Applied to us</p>
            <h2 className="section__title">Which lesson protects which Biohaven program</h2>
          </div>
        </div>
        <div className="card">
          <div className="crl-map">
            {indications.map((ind) => (
              <div className="crl-map__row" key={ind.slug}>
                <div className="crl-map__prog">
                  <span className="crl-map__dot" style={{ background: ind.accent }} />
                  <div>
                    <div className="crl-map__asset">{BHV_ASSETS[ind.slug] || ind.label}</div>
                    <div className="crl-map__ind">{ind.label}</div>
                  </div>
                </div>
                <div className="crl-map__lesson">{LESSON}</div>
              </div>
            ))}
          </div>
          <p className="crl-mix__note">
            Mapping is an analytical overlay of the CRL learnings onto public program descriptions — not regulatory guidance.
          </p>
        </div>
      </section>

      {/* Playbook */}
      <section className="section">
        <div className="section__head">
          <div>
            <p className="section__eyebrow">The playbook</p>
            <h2 className="section__title">Failure modes → the de-risking move that neutralizes each</h2>
          </div>
        </div>
        <div className="card">
          <div className="crl-play">
            {playbook.map((p, i) => (
              <div className="crl-play__row" key={i}>
                <div className="crl-play__driver"><span className="crl-play__x">✕</span>{p.driver}</div>
                <div className="crl-play__fix"><span className="crl-play__check">✓</span>{p.deRisker}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <p className="crl-prov">
        {live
          ? `Live from openFDA${typeof total === "number" ? ` · ${total.toLocaleString()} published letters` : ""}. `
          : "openFDA was unreachable — showing a small embedded seed set. "}
        Categories are derived from each letter&apos;s own section headings; substantive clinical reasoning is often
        redacted, so the reliable signal is which section failed, not always the sentence explaining how.
        Source: <a href={sourceUrl} target="_blank" rel="noreferrer">openFDA CRL API</a>. Not regulatory, legal, or medical advice.
      </p>
      <div className="spacer-24" />
    </>
  );
}
