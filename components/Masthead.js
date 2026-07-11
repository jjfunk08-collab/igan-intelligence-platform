"use client";

import { usePathname } from "next/navigation";
import { COMPANY } from "../lib/config";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/visuals", label: "Visuals" },
  { href: "/brief", label: "Weekly Brief" },
  { href: "/sources", label: "Sources" },
];

export default function Masthead() {
  const pathname = usePathname();

  return (
    <header className="masthead">
      <div className="container">
        <div className="masthead__top">
          <div className="masthead__brand">
            {/* Reverse-white wordmark: green "bio" + white "haven" on navy, per brand guide */}
            <img
              className="masthead__logo"
              src="/logos/logo-reverse-white.svg"
              alt="biohaven"
              width={206}
              height={30}
            />
            <span className="masthead__divider" aria-hidden="true" />
            <div className="masthead__titles">
              <p className="masthead__eyebrow">{COMPANY.tagline}</p>
              <h1 className="masthead__title">{COMPANY.productLong}</h1>
            </div>
          </div>
          <div className="masthead__updated">
            <span className="live-dot" aria-hidden="true" />
            <strong>Auto-updating</strong>
            <br />
            Refreshed daily from public sources
          </div>
        </div>
        <nav className="nav" aria-label="Primary">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <a key={item.href} href={item.href} className={active ? "active" : ""}>
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
