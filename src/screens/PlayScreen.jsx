import { useState } from "react";
import { W, CLASSES, font, fmt, pctFmt } from "../tokens.js";
import { Eyebrow, EnvExplainer, AllocBar, IncomeTracker } from "../components/Primitives.jsx";
import { Chart } from "../components/Chart.jsx";
import { totalPortfolio } from "../engine/simulation.js";

const grainSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

function ChoiceCard({ option, letter, onChoose, disabled }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => !disabled && !option.disabled && onChoose(option)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered && !option.disabled
          ? "rgba(223,250,71,0.06)"
          : "rgba(0, 24, 25, 0.55)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${hovered && !option.disabled ? "rgba(223,250,71,0.35)" : W.borderInverse}`,
        padding: 22,
        cursor: option.disabled ? "not-allowed" : "pointer",
        transition: "all 220ms",
        opacity: option.disabled ? 0.5 : 1,
      }}
    >
      <div style={{ display: "flex", gap: 18 }}>
        {/* Letter glyph */}
        <div style={{
          width: 34, height: 34, flexShrink: 0,
          border: `1px solid ${hovered && !option.disabled ? W.chartreuse : W.borderInverseStrong}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 600, fontFamily: font,
          color: hovered && !option.disabled ? W.chartreuse : W.white,
          transition: "all 220ms",
        }}>{letter}</div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: W.white, letterSpacing: "-0.01em", marginBottom: 6 }}>
            {option.label}
          </div>
          {option.disabled && (
            <div style={{ fontSize: 12, color: W.danger, marginBottom: 6 }}>
              Insufficient funds
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PlayScreen({ gs, decision, summary, onChoose, onSkip }) {
  const tp = totalPortfolio(gs);
  const startVal = gs.history[0]?.totalPortfolio || tp;
  const totalChange = ((tp - startVal) / startVal) * 100;
  const prevTotal = summary?.prevTotal || tp;
  const yearChange = ((tp - prevTotal) / prevTotal) * 100;

  const letters = ["A", "B", "C", "D"];

  return (
    <div style={{
      width: "100%", minHeight: "100vh", position: "relative", overflow: "hidden",
      background: W.midnight, color: W.white, fontFamily: font,
    }}>
      {/* Full-bleed dam photo */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${import.meta.env.BASE_URL}assets/photo-infrastructure-dam.jpg)`,
        backgroundSize: "cover", backgroundPosition: "center 30%",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(95deg, rgba(0,24,25,0.88) 0%, rgba(0,46,48,0.6) 45%, rgba(0,46,48,0.2) 100%)",
      }} />
      <div style={{
        position: "absolute", inset: 0, opacity: 0.16, mixBlendMode: "overlay",
        pointerEvents: "none", backgroundImage: grainSvg,
      }} />

      {/* Progress rail */}
      <div style={{
        position: "relative", zIndex: 2,
        padding: "24px 56px 0",
        display: "flex", alignItems: "center", gap: 28,
      }}>
        <Eyebrow color="rgba(255,255,255,0.6)">Year {gs.year} of 10</Eyebrow>
        <div style={{ flex: 1, display: "flex", gap: 4 }}>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} style={{
              flex: 1, height: 2,
              background: i < gs.year ? W.chartreuse : W.borderInverse,
              opacity: i < gs.year ? 1 : 0.5,
            }} />
          ))}
        </div>
        <span style={{
          fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: "0.08em",
          fontVariantNumeric: "tabular-nums",
        }}>
          {fmt(tp)} · {totalChange >= 0 ? "+" : ""}{totalChange.toFixed(1)}% total
        </span>
      </div>

      {/* Main grid */}
      <div style={{
        position: "relative", zIndex: 2,
        padding: "48px 56px 0",
        display: "grid", gridTemplateColumns: "1fr 540px", gap: 60,
        minHeight: "calc(100vh - 80px)",
      }}>
        {/* LEFT — editorial context */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", paddingBottom: 56 }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "7px 14px", border: `1px solid ${W.borderInverse}`,
              borderRadius: 999, marginBottom: 28,
              fontSize: 11, color: W.chartreuse, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase",
            }}>
              <span style={{ width: 6, height: 6, background: W.chartreuse, borderRadius: 999 }} />
              Decision required
            </div>

            {summary?.env && (
              <div style={{
                fontSize: 13, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase",
                fontWeight: 600, marginBottom: 14,
              }}>
                {summary.env.label}
              </div>
            )}

            <h1 style={{
              fontFamily: font, fontSize: "clamp(40px,4.5vw,68px)", fontWeight: 300,
              letterSpacing: "-0.03em", lineHeight: 1.02, color: W.white, maxWidth: 680, marginBottom: 20,
            }}>
              {decision.title}
            </h1>

            <p style={{
              fontSize: 16, lineHeight: 1.6, color: "rgba(255,255,255,0.72)",
              maxWidth: 520, fontWeight: 300, marginBottom: 24,
            }}>
              {decision.body}
            </p>

            {decision.lowCashNote && (
              <div style={{
                padding: "10px 14px", background: "rgba(179,41,28,0.15)",
                border: `1px solid rgba(179,41,28,0.4)`,
                fontSize: 13, color: "#f4887e", marginBottom: 20,
              }}>
                {decision.lowCashNote}
              </div>
            )}

            {summary?.env && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  background: "rgba(0,24,25,0.5)", backdropFilter: "blur(12px)",
                  border: `1px solid ${W.borderInverse}`, padding: "12px 16px",
                }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.55 }}>
                    {summary.env.narrative}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Portfolio stats strip */}
          <div>
            {/* Chart */}
            {gs.history.length >= 2 && (
              <div style={{
                background: "rgba(0,24,25,0.4)", backdropFilter: "blur(8px)",
                border: `1px solid ${W.borderInverse}`, padding: "16px 20px", marginBottom: 20,
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>
                  Portfolio trajectory
                </div>
                <Chart history={gs.history} decisions={gs.decisions} />
              </div>
            )}

            <div style={{
              display: "flex", gap: 48, paddingTop: 20,
              borderTop: `1px solid ${W.borderInverse}`,
            }}>
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 600, marginBottom: 6 }}>
                  Portfolio · Y{gs.year}
                </div>
                <div style={{ fontSize: 24, fontWeight: 300, color: W.white, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                  {fmt(tp)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 600, marginBottom: 6 }}>
                  This year
                </div>
                <div style={{ fontSize: 24, fontWeight: 300, color: yearChange >= 0 ? W.chartreuse : W.danger, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                  {pctFmt(yearChange)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 600, marginBottom: 6 }}>
                  Cash
                </div>
                <div style={{ fontSize: 24, fontWeight: 300, color: W.white, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                  {fmt(gs.cash)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — choice cards */}
        <aside style={{
          display: "flex", flexDirection: "column", gap: 10,
          paddingTop: 8, paddingBottom: 56,
        }}>
          <div style={{ marginBottom: 8 }}>
            <Eyebrow color="rgba(255,255,255,0.65)" style={{ marginBottom: 4 }}>Choose your path</Eyebrow>
          </div>

          {decision.options.map((opt, i) => (
            <ChoiceCard
              key={opt.id}
              option={opt}
              letter={letters[i] || String(i + 1)}
              onChoose={onChoose}
              disabled={false}
            />
          ))}

          {/* Decision log */}
          {gs.decisions.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>
                Decision history
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {gs.decisions.slice(-4).map((d, i) => (
                  <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
                    {d}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
