import { W, CLASSES, font, fmt } from "../tokens.js";
import { Eyebrow, Pill } from "./Primitives.jsx";

function coreTotal(positions) {
  let t = 0;
  CLASSES.forEach(c => { t += positions[c.id + "_core"] || 0; });
  return t;
}
function satTotal(positions) {
  let t = 0;
  CLASSES.forEach(c => { t += positions[c.id + "_sat"] || 0; });
  return t;
}

export function FrameworkReveal({ positions, cash, concentrationPenalty }) {
  const cv = coreTotal(positions);
  const sv = satTotal(positions);
  const total = cv + sv + cash;
  if (total <= 0) return null;

  const cPct = Math.round(cv / total * 100);
  const sPct = Math.round(sv / total * 100);
  const lPct = Math.round(cash / total * 100);

  const penalizedName = concentrationPenalty
    ? (CLASSES.find(c => c.id === concentrationPenalty) || {}).name || "a position"
    : null;

  return (
    <div style={{
      background: W.midnight,
      color: W.white,
      padding: "48px 56px",
      position: "relative", overflow: "hidden",
      marginTop: 48,
    }}>
      {/* Right-side imagery */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 400,
        backgroundImage: `url(${import.meta.env.BASE_URL}assets/photo-investor-phone.jpg)`,
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.7,
      }} />
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 520,
        background: `linear-gradient(90deg, ${W.midnight} 0%, rgba(0,46,48,0.4) 60%, rgba(0,46,48,0) 100%)`,
      }} />

      <div style={{ position: "relative", maxWidth: 700 }}>
        <Eyebrow color={W.chartreuse} style={{ marginBottom: 12 }}>What's next</Eyebrow>
        <h2 style={{
          fontFamily: font, fontSize: 44, fontWeight: 300,
          letterSpacing: "-0.03em", lineHeight: 1.05, color: W.white, marginBottom: 20,
        }}>
          Bring this allocation<br />to the real thing.
        </h2>
        <p style={{
          fontSize: 16, color: "rgba(255,255,255,0.72)", lineHeight: 1.55,
          fontWeight: 300, maxWidth: 500, marginBottom: 40,
        }}>
          Your simulation maps directly to Willow products. Three buckets —
          Core funds, Direct investments, and Liquidity — represent how
          Willow structures every client portfolio.
        </p>

        {/* Bar breakdown */}
        <div style={{ display: "flex", borderRadius: 0, overflow: "hidden", height: 32, marginBottom: 28 }}>
          {cPct > 0 && (
            <div style={{ width: `${cPct}%`, background: W.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: W.white }}>{cPct}%</span>
            </div>
          )}
          {sPct > 0 && (
            <div style={{ width: `${sPct}%`, background: W.gold600, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: W.white }}>{sPct}%</span>
            </div>
          )}
          {lPct > 0 && (
            <div style={{ width: `${lPct}%`, background: W.fgSubtle, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: W.white }}>{lPct}%</span>
            </div>
          )}
        </div>

        {/* Three rows */}
        {[
          {
            label: "Core",
            pct: cPct,
            color: W.green,
            desc: "Evergreen funds from top-tier managers. Diversified exposure with periodic liquidity.",
            val: cv,
          },
          {
            label: "Satellite",
            pct: sPct,
            color: W.gold600,
            desc: "Direct investments via the Willow marketplace. Higher return potential with lockups." +
              (penalizedName ? ` Concentration drag from ${penalizedName} reduced satellite returns.` : ""),
            val: sv,
          },
          {
            label: "Liquidity",
            pct: lPct,
            color: W.fgSubtle,
            desc: "On Willow, idle cash earns yield via Short Term Notes while preserving full access.",
            val: cash,
          },
        ].map((b, i) => (
          <div key={b.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "16px 0",
            borderBottom: i < 2 ? `1px solid ${W.borderInverse}` : "none",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, background: b.color, flexShrink: 0, display: "inline-block" }} />
                <span style={{ fontWeight: 600, fontSize: 14, color: W.white }}>{b.label}</span>
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginLeft: 18, maxWidth: 380, lineHeight: 1.5 }}>
                {b.desc}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 300, color: W.white, fontVariantNumeric: "tabular-nums" }}>{fmt(b.val)}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{b.pct}%</div>
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
          <Pill primary dark>Schedule a call →</Pill>
          <Pill dark>Download draft IPS</Pill>
        </div>
      </div>
    </div>
  );
}
