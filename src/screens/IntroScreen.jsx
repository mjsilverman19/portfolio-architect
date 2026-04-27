import { W, font } from "../tokens.js";
import { Eyebrow, Pill } from "../components/Primitives.jsx";

const grainSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

function Figure({ label, value, unit, color = W.white }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{
          fontFamily: font, fontSize: 40, fontWeight: 300,
          letterSpacing: "-0.03em", color, fontVariantNumeric: "tabular-nums",
        }}>{value}</span>
        {unit && <span style={{ fontSize: 16, fontWeight: 300, color: "rgba(255,255,255,0.65)" }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

const STEPS = [
  ["01", "Choose a strategy", "From three institutional presets."],
  ["02", "Allocate", "Across four private asset classes."],
  ["03", "Live the decade", "Respond to up to 8 decision points."],
  ["04", "Review the outcome", "Net of fees, with attribution."],
];

export function IntroScreen({ onStart }) {
  return (
    <div style={{
      width: "100%", minHeight: "100vh", position: "relative", overflow: "hidden",
      background: W.midnight, color: W.white, fontFamily: font,
    }}>
      {/* Full-bleed photo */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url(/assets/photo-architecture-glass.jpg)",
        backgroundSize: "cover", backgroundPosition: "center",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(105deg, rgba(0,24,25,0.92) 0%, rgba(0,46,48,0.78) 38%, rgba(0,46,48,0.35) 70%, rgba(0,46,48,0.55) 100%)",
      }} />
      <div style={{
        position: "absolute", inset: 0, opacity: 0.18, mixBlendMode: "overlay",
        pointerEvents: "none", backgroundImage: grainSvg,
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 2,
        padding: "48px 56px 0",
        display: "grid", gridTemplateColumns: "1fr 380px", gap: 80,
        minHeight: "100vh",
      }}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", paddingBottom: 56 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} style={{ width: i === 0 ? 20 : 6, height: 2, background: i === 0 ? W.chartreuse : W.borderInverse }} />
                ))}
              </div>
              <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
                Portfolio Architect
              </span>
            </div>

            <h1 style={{
              fontFamily: font, fontWeight: 300, fontSize: "clamp(56px,7vw,104px)",
              lineHeight: 0.98, letterSpacing: "-0.035em", color: W.white, maxWidth: 820,
            }}>
              Build a portfolio<br />
              that survives<br />
              <span style={{ color: W.chartreuse }}>the next decade.</span>
            </h1>

            <p style={{
              marginTop: 36, fontSize: 18, lineHeight: 1.55,
              color: "rgba(255,255,255,0.75)", maxWidth: 520,
              fontWeight: 300, letterSpacing: "-0.005em",
            }}>
              Test your allocation against ten years of recessions, recoveries,
              and inflection points. See how your decisions compound — before
              committing real capital.
            </p>

            <div style={{ display: "flex", gap: 12, marginTop: 44 }}>
              <Pill primary dark onClick={onStart}>Begin simulation →</Pill>
            </div>
          </div>

          {/* Stat strip */}
          <div style={{
            display: "flex", gap: 56, paddingTop: 28,
            borderTop: `1px solid ${W.borderInverse}`,
          }}>
            <Figure label="Time horizon" value="10" unit="yrs" />
            <Figure label="Asset classes" value="4" />
            <Figure label="Decision points" value="8" />
            <Figure label="Avg. session" value="6" unit="min" />
          </div>
        </div>

        {/* RIGHT — glass sidebar */}
        <aside style={{
          alignSelf: "end",
          background: "rgba(0, 24, 25, 0.55)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          border: `1px solid ${W.borderInverse}`,
          padding: 32, marginBottom: 56,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
            <Eyebrow color="rgba(255,255,255,0.65)">Session brief</Eyebrow>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", fontVariantNumeric: "tabular-nums" }}>
              REF · WW-PA-0428
            </span>
          </div>

          <h3 style={{
            fontFamily: font, fontWeight: 400, fontSize: 20, color: W.white,
            letterSpacing: "-0.015em", lineHeight: 1.25, marginBottom: 20,
          }}>
            What we'll cover together.
          </h3>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {STEPS.map(([n, t, d], i) => (
              <div key={n} style={{
                display: "grid", gridTemplateColumns: "32px 1fr",
                padding: "14px 0",
                borderBottom: i < STEPS.length - 1 ? `1px solid ${W.borderInverse}` : "none",
                gap: 12,
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: W.chartreuse,
                  letterSpacing: "0.08em", fontVariantNumeric: "tabular-nums", paddingTop: 2,
                }}>{n}</span>
                <div>
                  <div style={{ fontSize: 14, color: W.white, fontWeight: 500, marginBottom: 2 }}>{t}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.45 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${W.borderInverse}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
              <span style={{ letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>Estimated time</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>6–8 minutes</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Disclosure */}
      <div style={{ position: "absolute", bottom: 20, right: 56, zIndex: 2 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: font }}>
          Simulation. Not investment advice. Past scenario constructions are not predictive of future returns.
        </span>
      </div>
    </div>
  );
}
