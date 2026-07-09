import { COMPANY, DISCLAIMER, SOURCES } from "../lib/config";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__inner">
          <div className="footer__col" style={{ maxWidth: 320 }}>
            <img
              className="footer__logo"
              src="/logos/logo-white.svg"
              alt="biohaven"
              width={150}
              height={22}
            />
            <p>{COMPANY.productLong}</p>
            <p style={{ opacity: 0.7 }}>{DISCLAIMER}</p>
          </div>

          <div className="footer__col">
            <h4>Data Sources</h4>
            <ul>
              {Object.values(SOURCES).map((s) => (
                <li key={s.name}>
                  <a href={s.home} target="_blank" rel="noreferrer">
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__col">
            <h4>Platform</h4>
            <ul>
              <li><a href="/">The Brief</a></li>
              <li><a href="/trials">Trials</a></li>
              <li><a href="/therapies">Approvals</a></li>
              <li><a href="/publications">Literature</a></li>
              <li><a href="/visuals">Analytics</a></li>
              <li><a href="/brief">Email-ready version</a></li>
              <li><a href="/sources">Sources &amp; Method</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="footer__legal">
          © {year} {COMPANY.legalName}. All rights reserved. &nbsp;·&nbsp;
          Developed by {COMPANY.developer}. &nbsp;·&nbsp;
          Every record links to its original public source with an access date.
        </div>
      </div>
    </footer>
  );
}
