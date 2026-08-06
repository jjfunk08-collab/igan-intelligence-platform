import { COMPANY, DISCLAIMER, REVALIDATE_SECONDS, listIndications } from "../lib/config";
import { getClinicalTrials } from "../lib/sources/clinicaltrials";
import { getApprovedTherapies } from "../lib/sources/openfda";
import CountUp from "../components/CountUp";
import Reveal from "../components/Reveal";
import { Callout } from "../components/ui";

export const revalidate = REVALIDATE_SECONDS;
export const metadata = {
  title: `${COMPANY.productLong} — ${COMPANY.shortName}`,
};

// Portfolio hub: one tile per tracked indication with a live snapshot.
export default async function PortfolioHub() {
  const areas = listIndications();

  const snapshots = await Promise.all(
    areas.map(async (area) => {
      const [trials, therapies] = await Promise.all([
        getClinicalTrials(area, 1),
        getApprovedTherapies(area),
      ]);
      return {
        area,
        trialTotal: trials.total,
        approvals: therapies.items.length,
        newest: [...therapies.items].sort((a, b) =>
          String(b.effectiveDate).localeCompare(String(a.effectiveDate))
        )[0],
      };
    })
  );

  return (
    <>
      <section className="cover">
        <p className="cover__date">{COMPANY.shortName} · Portfolio</p>
        <h1 className="cover__title">{COMPANY.productLong}</h1>
        <p className="cover__summary">
          Live competitive &amp; regulatory intelligence across tracked indications. Pick a program
          to open its brief — trials, Drugs@FDA approvals, literature, news, and analytics, refreshed daily.
        </p>
      </section>

      <Reveal>
      <section className="digest-grid" style={{ marginTop: 26 }}>
        {snapshots.map(({ area, trialTotal, approvals, newest }) => (
            <a className="dcard hub-tile" href={`/${area.slug}`} key={area.slug} style={{ textDecoration: "none" }}>
              <div className="dcard__accent" style={{ background: area.accent }} />
              <div className="dcard__inner">
                <div className="dcard__head">
                  <div>
                    <p className="dcard__eyebrow" style={{ color: area.accent }}>{area.short}</p>
                    <h3 className="dcard__title">{area.label}</h3>
                  </div>
                </div>
                <p className="muted" style={{ fontSize: 13.5, marginTop: 0, marginBottom: 14 }}>{area.blurb}</p>
                <div className="glance" style={{ margin: 0, border: "1px solid var(--line)", gridTemplateColumns: "1fr 1fr" }}>
                  <div className="glance__item">
                    <p className="glance__label">Trials</p>
                    <div className="glance__value" style={{ fontSize: 22 }}><CountUp value={trialTotal} /></div>
                  </div>
                  <div className="glance__item">
                    <p className="glance__label">Approvals</p>
                    <div className="glance__value" style={{ fontSize: 22 }}><CountUp value={approvals} /></div>
                  </div>
                </div>
                {newest ? (
                  <p className="mini-item__meta" style={{ marginTop: 12 }}>
                    Newest: <strong style={{ color: "var(--navy)" }}>{newest.brand}</strong> ({newest.generic})
                  </p>
                ) : null}
              </div>
              <div className="dcard__foot">
                <span style={{ color: area.accent, fontWeight: 600, fontSize: 13 }}>Open {area.short} brief &rarr;</span>
              </div>
            </a>
        ))}
      </section>
      </Reveal>

      <div style={{ marginTop: 20 }}>
        <Callout tone="muted">{DISCLAIMER}</Callout>
      </div>
      <div className="spacer-24" />
    </>
  );
}
