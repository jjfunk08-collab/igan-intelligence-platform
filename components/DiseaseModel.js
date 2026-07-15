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

const ART = { kidney: KidneyArt, thyroid: ThyroidArt };

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
