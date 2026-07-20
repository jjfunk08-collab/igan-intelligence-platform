"use client";

import { useState } from "react";

/* ---------- Hand-built, stylized organ illustrations (brand palette) ---------- */

function KidneyArt() {
  return (
    <g>
      {/* Kidney bean */}
      <path
        d="M120,68 C82,68 58,104 58,150 C58,196 84,232 120,232 C146,232 152,208 152,188 C152,176 160,172 168,170 L168,130 C160,128 152,122 152,112 C152,92 150,68 120,68 Z"
        fill="url(#kidneyGrad)" stroke="#002a61" strokeWidth="2"
      />
      {/* hilum notch highlight */}
      <path d="M152,112 C152,122 160,128 168,130 L168,170 C160,172 152,176 152,188" fill="none" stroke="#00a3da" strokeWidth="2" opacity="0.5" />
      {/* connector to glomerulus */}
      <path d="M168,150 C200,150 214,150 226,150" stroke="#8aa0bf" strokeWidth="2" strokeDasharray="4 4" fill="none" />
      {/* Glomerulus capsule */}
      <circle cx="300" cy="150" r="80" fill="#ffffff" stroke="#cbd6e6" strokeWidth="2" />
      <circle cx="300" cy="150" r="80" fill="url(#glomGrad)" opacity="0.35" />
      {/* Capillary tuft (loops) */}
      <g fill="none" stroke="#0047bb" strokeWidth="3" opacity="0.85" strokeLinecap="round">
        <path d="M300,150 C270,120 250,150 275,170 C300,188 262,205 300,205" />
        <path d="M300,150 C330,120 352,148 328,170 C304,188 342,205 300,205" />
        <path d="M300,150 C285,115 300,102 315,120" />
      </g>
      {/* Mesangium deposits */}
      <g fill="#6d2077">
        <circle cx="300" cy="150" r="6" />
        <circle cx="288" cy="162" r="4" />
        <circle cx="312" cy="160" r="4" />
      </g>
      {/* afferent vessel */}
      <path d="M232,205 C250,195 262,188 276,178" stroke="#b0304a" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.8" />
    </g>
  );
}

function ThyroidArt() {
  return (
    <g>
      {/* trachea */}
      <rect x="126" y="118" width="28" height="120" rx="14" fill="#e6ecf5" stroke="#cbd6e6" strokeWidth="2" />
      <line x1="126" y1="140" x2="154" y2="140" stroke="#cbd6e6" strokeWidth="2" />
      <line x1="126" y1="162" x2="154" y2="162" stroke="#cbd6e6" strokeWidth="2" />
      <line x1="126" y1="184" x2="154" y2="184" stroke="#cbd6e6" strokeWidth="2" />
      {/* thyroid lobes (butterfly) */}
      <path d="M126,140 C96,138 80,160 84,188 C88,214 116,220 128,196 C136,180 138,158 126,140 Z" fill="url(#thyroidGrad)" stroke="#002a61" strokeWidth="2" />
      <path d="M154,140 C184,138 200,160 196,188 C192,214 164,220 152,196 C144,180 142,158 154,140 Z" fill="url(#thyroidGrad)" stroke="#002a61" strokeWidth="2" />
      <rect x="126" y="168" width="28" height="20" rx="6" fill="url(#thyroidGrad)" stroke="#002a61" strokeWidth="2" />

      {/* eye (thyroid eye disease) */}
      <g>
        <path d="M272,112 C300,86 344,86 372,112 C344,138 300,138 272,112 Z" fill="#ffffff" stroke="#002a61" strokeWidth="2" />
        <circle cx="322" cy="112" r="18" fill="url(#irisGrad)" />
        <circle cx="322" cy="112" r="8" fill="#0a2340" />
        <circle cx="316" cy="106" r="3" fill="#ffffff" opacity="0.85" />
        {/* proptosis arrow */}
        <path d="M348,150 L366,150 M361,145 L366,150 L361,155" stroke="#58bd2b" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="357" y="170" textAnchor="middle" fontSize="10" fill="#3a7d18" fontFamily="var(--font-mono)">forward</text>
      </g>
    </g>
  );
}

function BrainArt() {
  return (
    <g>
      {/* Brain silhouette */}
      <path
        d="M60,150 C55,112 84,80 120,84 C138,70 168,80 166,104 C186,112 180,140 166,150 C182,164 174,196 150,194 C148,214 118,220 106,204 C80,214 55,190 60,150 Z"
        fill="url(#kidneyGrad)" stroke="#002a61" strokeWidth="2"
      />
      {/* sulci */}
      <g fill="none" stroke="#00a3da" strokeWidth="2" opacity="0.45" strokeLinecap="round">
        <path d="M88,110 C104,120 96,134 112,140" />
        <path d="M96,168 C114,164 108,182 128,180" />
        <path d="M132,110 C140,126 128,136 140,150" />
      </g>
      {/* Seizure focus patch + spark (under marker 1) */}
      <circle cx="108" cy="104" r="20" fill="#c2410c" opacity="0.22" />
      <path d="M110,94 L102,106 L109,106 L105,116 L118,102 L110,102 Z" fill="#c2410c" opacity="0.9" />

      {/* connector: focus -> neuron membrane (under marker 5) */}
      <path d="M168,150 C210,150 250,150 282,150" stroke="#8aa0bf" strokeWidth="2" strokeDasharray="4 4" fill="none" />

      {/* Neuronal membrane (lipid bilayer) */}
      <rect x="286" y="72" width="7" height="162" rx="3.5" fill="#dbe7f4" stroke="#9db6d6" strokeWidth="1.5" />
      <rect x="307" y="72" width="7" height="162" rx="3.5" fill="#dbe7f4" stroke="#9db6d6" strokeWidth="1.5" />

      {/* Hyperexcitability burst (under marker 2) */}
      <g stroke="#c2410c" strokeWidth="2" strokeLinecap="round" opacity="0.75">
        <path d="M300,80 L300,68" /><path d="M289,84 L281,76" /><path d="M311,84 L319,76" />
        <path d="M283,92 L272,90" /><path d="M317,92 L328,90" />
      </g>

      {/* Kv7.2/7.3 channel — the target (under marker 3) */}
      <path d="M288,138 L300,146 L312,138 L312,162 L300,154 L288,162 Z" fill="#58bd2b" opacity="0.92" stroke="#3a7d18" strokeWidth="1" />
      {/* K+ efflux */}
      <path d="M316,150 L334,150 M329,145 L334,150 L329,155" stroke="#3a7d18" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="342" y="154" fontSize="10" fill="#3a7d18" fontFamily="var(--font-mono)">K+</text>

      {/* Voltage-gated sodium channel (under marker 4) */}
      <path d="M288,194 L300,202 L312,194 L312,218 L300,210 L288,218 Z" fill="#b0304a" opacity="0.55" stroke="#8f2036" strokeWidth="1" />
      <text x="342" y="210" fontSize="10" fill="#8f2036" fontFamily="var(--font-mono)">Na+</text>
      <path d="M334,206 L316,206 M321,201 L316,206 L321,211" stroke="#8f2036" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

const ART = { kidney: KidneyArt, thyroid: ThyroidArt, brain: BrainArt };

export default function DiseaseModel({ model, accent = "#0047bb" }) {
  const hotspots = model.hotspots || [];
  const [activeId, setActiveId] = useState(hotspots[0]?.id);
  const current = hotspots.find((h) => h.id === activeId) || hotspots[0];
  const Art = ART[model.type] || KidneyArt;

  return (
    <div className="model">
      <div className="model__stage">
        <svg viewBox="0 0 420 300" role="img" aria-label={model.title}>
          <defs>
            <linearGradient id="kidneyGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0a3a78" />
              <stop offset="100%" stopColor="#002a61" />
            </linearGradient>
            <radialGradient id="glomGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00a3da" />
              <stop offset="100%" stopColor="#ffffff" />
            </radialGradient>
            <linearGradient id="thyroidGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0a3a78" />
              <stop offset="100%" stopColor="#002a61" />
            </linearGradient>
            <radialGradient id="irisGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00a3da" />
              <stop offset="100%" stopColor="#0047bb" />
            </radialGradient>
          </defs>

          <Art />

          {/* Hotspot markers */}
          {hotspots.map((h, i) => {
            const on = h.id === activeId;
            return (
              <g
                key={h.id}
                className="hotspot"
                onClick={() => setActiveId(h.id)}
                onMouseEnter={() => setActiveId(h.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveId(h.id); } }}
                tabIndex={0}
                role="button"
                aria-label={h.label}
                aria-pressed={on}
                style={{ cursor: "pointer" }}
              >
                {on ? <circle cx={h.x} cy={h.y} r="18" fill={accent} opacity="0.18" className="hotspot__pulse" /> : null}
                <circle cx={h.x} cy={h.y} r="12" fill={on ? accent : "#ffffff"} stroke={accent} strokeWidth="2.5" />
                <text x={h.x} y={h.y} textAnchor="middle" dominantBaseline="central" fontSize="12"
                  fontFamily="var(--font-mono)" fontWeight="600" fill={on ? "#ffffff" : accent}>
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="model__panel">
        <p className="model__eyebrow" style={{ color: accent }}>Mechanism</p>
        {current ? (
          <div key={current.id} className="model__content">
            <h4 className="model__title">
              <span className="model__num" style={{ background: accent }}>
                {hotspots.findIndex((h) => h.id === current.id) + 1}
              </span>
              {current.label}
            </h4>
            <p className="model__body">{current.body}</p>
            {current.tags && current.tags.length ? (
              <div className="model__tags">
                <span className="model__tags-label">Targeted by</span>
                {current.tags.map((t) => (
                  <span className="model__chip" key={t} style={{ borderColor: accent, color: accent }}>{t}</span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        <p className="model__caption">{model.caption}</p>
      </div>
    </div>
  );
}
