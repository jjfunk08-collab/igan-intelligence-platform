import { COMPANY, REVALIDATE_SECONDS, listIndications } from "../../lib/config";
import { getCRLCorpus } from "../../lib/sources/crl";
import { PageHeader, SourceTag } from "../../components/ui";
import CRLTracker from "../../components/CRLTracker";
import CRLCharts from "../../components/CRLCharts";
import CRLPlaybook from "../../components/CRLPlaybook";

export const revalidate = REVALIDATE_SECONDS;
export const metadata = { title: `CRL Tracker — ${COMPANY.product}` };

// Biohaven's pivotal-stage programs, each paired with the SPECIFIC learning
// from the CRL corpus that most applies to it (asset names per public pipeline
// disclosures). Deliberately different per program.
const LEARNINGS = {
  igan: {
    asset: "BHV-1400 (Gd-IgA1 TRAP)",
    text: "IgAN approvals have cleared on a pre-specified proteinuria (UPCR) surrogate under accelerated approval, with confirmatory eGFR to follow. Idea: lock that surrogate plus the confirmatory-eGFR plan with FDA up front rather than leaning on a novel endpoint.",
  },
  graves: {
    asset: "BHV-1300 (IgG degrader)",
    text: "A first-in-class degrader competes with anti-FcRn in the same ATD-uncontrolled population. Idea: prospectively define the ATD-free biochemical-euthyroidism response endpoint, and size the chronic-use safety database (infection/immunosuppression) before the pivotal.",
  },
  "focal-epilepsy": {
    asset: "Opakalim (BHV-7000)",
    text: "Adjunctive epilepsy has a well-trodden placebo-controlled seizure-frequency endpoint, so efficacy design is low-risk. Idea: the likelier CRL exposure is CMC/formulation readiness — establish a clean bioequivalence bridge and inspection-ready manufacturing ahead of PDUFA.",
  },
  parkinsons: {
    asset: "BHV-8000 (TYK2/JAK1)",
    text: "No disease-modifying PD therapy is approved, and the troriluzole CRL shows the danger of external-control/RWE evidence. Idea: use an adequate, prospectively-powered progression endpoint (MDS-UPDRS) with written FDA agreement on the disease-modification bar — not RWE as the pivotal basis.",
  },
  obesity: {
    asset: "Taldefgrobep alfa (BHV-2000)",
    text: "After a Phase 3 SMA miss, obesity is GLP-1-dominated. Idea: pre-specify body-composition / lean-mass endpoints and the comparator context, and confirm with FDA that muscle preservation is a registrable benefit before committing the pivotal.",
  },
};

function resolvabilityColor(r) {
  const s = String(r || "").toLowerCase();
  if (s.includes("trial")) return "#b0304a";
  if (s.includes("procedural")) return "#3a7d18";
  return "#b5680a";
}

export default async function CRLPage() {
  const data = await getCRLCorpus();
  const { letters, mix, byYear, resolvability, diseaseCounts, categories, total, live, anchor, playbook, source, sourceUrl, accessDate, sampleSize } = data;
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
        letters was written to Biohaven. Browse the full corpus at the bottom of this page.
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

      {/* More graphics: how hard to clear, by-year trend, disease coverage */}
      <section className="section">
        <div className="section__head">
          <div>
            <p className="section__eyebrow">The corpus, visualized</p>
            <h2 className="section__title">A fuller read of the data</h2>
          </div>
        </div>
        <CRLCharts byYear={byYear} resolvability={resolvability} diseaseCounts={diseaseCounts} />
      </section>

      {/* Pipeline mapping — specific learnings per program */}
      <section className="section">
        <div className="section__head">
          <div>
            <p className="section__eyebrow">Applied to us</p>
            <h2 className="section__title">Which learning applies to which Biohaven program</h2>
          </div>
        </div>
        <div className="card">
          <div className="crl-map">
            {indications.map((ind) => {
              const learn = LEARNINGS[ind.slug];
              return (
                <div className="crl-map__row" key={ind.slug}>
                  <div className="crl-map__prog">
                    <span className="crl-map__dot" style={{ background: ind.accent }} />
                    <div>
                      <div className="crl-map__asset">{learn ? learn.asset : ind.label}</div>
                      <div className="crl-map__ind">{ind.label}</div>
                    </div>
                  </div>
                  <div className="crl-map__lesson">{learn ? learn.text : ""}</div>
                </div>
              );
            })}
          </div>
          <p className="crl-mix__note">
            Each row pairs the program with the corpus learning most relevant to its modality and endpoint path. This is
            an analytical overlay on public program descriptions — an idea to pressure-test, not regulatory guidance.
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
          <CRLPlaybook items={playbook} />
        </div>
      </section>

      {/* Browse the full corpus — placed last so it doesn't bury everything above */}
      <section className="section">
        <div className="section__head">
          <div>
            <p className="section__eyebrow">Every letter · zoom in</p>
            <h2 className="section__title">Browse the full corpus</h2>
          </div>
        </div>
        <CRLTracker letters={letters} categories={categories} diseases={diseaseCounts} total={total} />
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
