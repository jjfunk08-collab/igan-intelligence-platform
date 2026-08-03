"use client";

import { usePathname } from "next/navigation";
import { COMPANY, listIndications, getIndication } from "../lib/config";

function subNav(slug) {
  return [
    { href: `/${slug}`, label: "The Brief", exact: true },
    { href: `/${slug}/trials`, label: "Trials" },
    { href: `/${slug}/therapies`, label: "Approvals" },
    { href: `/${slug}/publications`, label: "Literature" },
    { href: `/${slug}/news`, label: "News" },
    { href: `/${slug}/visuals`, label: "Analytics" },
    { href: `/${slug}/sources`, label: "Sources" },
  ];
}

export default function Masthead() {
  const pathname = usePathname() || "/";
  const seg = pathname.split("/")[1] || "";
  const current = getIndication(seg) ? seg : null;
  const indications = listIndications();

  return (
    <header className="masthead">
      <div className="container">
        <div className="masthead__top">
          <div className="masthead__brand">
            <a href="/" aria-label="Portfolio home">
              <img className="masthead__logo" src="/logos/logo-reverse-white.svg" alt="biohaven" width={206} height={30} />
            </a>
            <span className="masthead__divider" aria-hidden="true" />
            <div className="masthead__titles">
              <p className="masthead__eyebrow">{COMPANY.tagline}</p>
              <h1 className="masthead__title">{COMPANY.productLong}</h1>
            </div>
          </div>
          <div className="masthead__updated">
            <span className="live-dot" aria-hidden="true" />
            <strong>Auto-updating</strong><br />
            Refreshed daily from public sources
          </div>
        </div>

        {/* Program switcher */}
        <div className="switcher" aria-label="Indications">
          <span className="switcher__label">Programs:</span>
          {indications.map((ind) => (
            <a
              key={ind.slug}
              href={`/${ind.slug}`}
              className={`switcher__pill${current === ind.slug ? " active" : ""}`}
              style={current === ind.slug ? { borderColor: ind.accent, color: "#fff", background: ind.accent } : null}
            >
              {ind.label}
            </a>
          ))}
        </div>

        {/* Section nav (only inside an indication) */}
        {current ? (
          <nav className="nav" aria-label="Section">
            {subNav(current).map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <a key={item.href} href={item.href} className={active ? "active" : ""}>{item.label}</a>
              );
            })}
          </nav>
        ) : (
          <div style={{ height: 8 }} />
        )}
      </div>
    </header>
  );
}
