import { W, CLASSES, font, fmt } from "../tokens.js";
import { Eyebrow, Pill, Rule } from "../components/Primitives.jsx";
import { PRESETS } from "../engine/presets.js";

const PRESET_META = [
  {
    id: "income",
    code: "P-01",
    target: "6–8%",
    drawdown: "−9%",
    photo: "/assets/photo-architecture-curves.jpg",
    featured: false,
    notes: "Built for investors prioritizing distributions. Private Credit and Real Estate generate regular yield.",
  },
  {
    id: "balanced",
    code: "P-02",
    target: "8–11%",
    drawdown: "−18%",
    photo: "/assets/photo-infrastructure-dam.jpg",
    featured: true,
    notes: "Our most-selected preset. Balanced exposure across all four asset classes for steady compounding.",
  },
  {
    id: "growth",
    code: "P-03",
    target: "11–15%",
    drawdown: "−28%",
    photo: "/assets/photo-architecture-glass.jpg",
    featured: false,
    notes: "Designed for long-horizon compounders. Heavy PE and VC allocation with tolerance for J-curve drawdowns.",
  },
];

function StrategyCard({ preset, meta, onSelect }) {
  const totalInvested = Object.values(preset.alloc).reduce((a, b) => a + b, 0);

  return (
    <div style={{
      background: W.white, border: `1px solid ${W.border}`,
      display: "flex", flexDirection: "column", position: "relative",
    }}>
      {/* Photo strip */}
      <div style={{
        height: 180, position: "relative",
        backgroundImage: `url(${meta.photo})`,
        backgroundSize: "cover", backgroundPosition: "center",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: meta.featured
            ? "linear-gradient(180deg, rgba(0,46,48,0.15) 0%, rgba(0,46,48,0.55) 100%)"
            : "linear-gradient(180deg, rgba(0,46,48,0.25) 0%, rgba(0,46,48,0.42) 100%)",
        }} />
        <div style={{
          position: "absolute", top: 16, left: 20, right: 20,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{
            fontSize: 11, color: "rgba(255,255,255,0.85)",
            letterSpacing: "0.18em", fontWeight: 600, textTransform: "uppercase",
            fontVariantNumeric: "tabular-nums",
          }}>{meta.code}</span>
          {meta.featured && (
            <span style={{
              fontSize: 10, color: W.midnight, background: W.chartreuse,
              padding: "4px 10px", letterSpacing: "0.18em", fontWeight: 600,
              textTransform: "uppercase",
            }}>Most chosen</span>
          )}
        </div>
        <div style={{ position: "absolute", bottom: 20, left: 20 }}>
          <h3 style={{
            fontFamily: font, fontSize: 40, fontWeight: 300,
            color: W.white, letterSpacing: "-0.025em", lineHeight: 0.95,
          }}>{preset.label}</h3>
        </div>
      </div>

      {/* Tagline */}
      <div style={{ padding: "22px 26px 14px" }}>
        <p style={{ fontSize: 15, color: W.fg, lineHeight: 1.4, fontWeight: 400, letterSpacing: "-0.01em" }}>
          {preset.desc}
        </p>
      </div>

      {/* Target + drawdown */}
      <div style={{
        padding: "18px 26px",
        borderTop: `1px solid ${W.border}`, borderBottom: `1px solid ${W.border}`,
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20,
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: W.fgSubtle, marginBottom: 6 }}>
            Target IRR
          </div>
          <div style={{ fontFamily: font, fontSize: 28, fontWeight: 300, color: W.fg, letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            {meta.target}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: W.fgSubtle, marginBottom: 6 }}>
            Stress drawdown
          </div>
          <div style={{ fontFamily: font, fontSize: 28, fontWeight: 300, color: W.fg, letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" }}>
            {meta.drawdown}
          </div>
        </div>
      </div>

      {/* Allocation tearsheet */}
      <div style={{ padding: "22px 26px" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: W.fgSubtle, marginBottom: 12 }}>
          Indicative allocation
        </div>
        {/* Stacked bar */}
        <div style={{ height: 6, display: "flex", marginBottom: 14, overflow: "hidden" }}>
          {CLASSES.map((c, i) => {
            const v = preset.alloc[c.id] || 0;
            const pct = (v / totalInvested) * 100;
            if (pct === 0) return null;
            return (
              <div key={c.id} style={{ width: `${pct}%`, background: c.color, marginRight: i < CLASSES.length - 1 ? 1 : 0 }} />
            );
          })}
        </div>
        {/* Legend */}
        <div>
          {CLASSES.map((c, i) => {
            const v = preset.alloc[c.id] || 0;
            if (v === 0) return null;
            const pct = Math.round((v / totalInvested) * 100);
            return (
              <div key={c.id} style={{
                display: "grid", gridTemplateColumns: "10px 44px 1fr auto",
                alignItems: "center", gap: 10, padding: "7px 0",
                borderBottom: i < CLASSES.length - 1 ? `1px solid ${W.border}` : "none",
                fontSize: 12,
              }}>
                <div style={{ width: 8, height: 8, background: c.color }} />
                <span style={{ color: W.fgMuted, fontWeight: 600, letterSpacing: "0.06em" }}>{c.short}</span>
                <span style={{ color: W.fgMuted }}>{c.name}</span>
                <span style={{ color: W.fg, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{pct}%</span>
              </div>
            );
          })}
          {/* Cash row */}
          {preset.cash > 0 && (() => {
            const cashPct = Math.round((preset.cash / (totalInvested + preset.cash)) * 100);
            return (
              <div style={{
                display: "grid", gridTemplateColumns: "10px 44px 1fr auto",
                alignItems: "center", gap: 10, padding: "7px 0",
                fontSize: 12,
              }}>
                <div style={{ width: 8, height: 8, background: W.fgSubtle }} />
                <span style={{ color: W.fgMuted, fontWeight: 600, letterSpacing: "0.06em" }}>CASH</span>
                <span style={{ color: W.fgMuted }}>Reserve</span>
                <span style={{ color: W.fg, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                  {Math.round((preset.cash / 500000) * 100)}%
                </span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Notes + CTA */}
      <div style={{ padding: "0 26px 26px", marginTop: "auto" }}>
        <p style={{
          fontSize: 12, color: W.fgMuted, lineHeight: 1.5,
          padding: "14px 0", borderTop: `1px solid ${W.border}`,
        }}>
          {meta.notes}
        </p>
        <button
          onClick={() => onSelect(preset)}
          style={{
            width: "100%", marginTop: 8,
            height: 48, fontFamily: font, fontSize: 14, fontWeight: 500,
            background: meta.featured ? W.midnight : W.white,
            color: meta.featured ? W.white : W.fg,
            border: `1px solid ${meta.featured ? W.midnight : W.borderStrong}`,
            cursor: "pointer", letterSpacing: "-0.005em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}
        >
          Select {preset.label} <span style={{ fontSize: 16 }}>→</span>
        </button>
      </div>
    </div>
  );
}

export function PresetScreen({ onSelect, onBlank }) {
  const orderedPresets = ["income", "balanced", "growth"].map(id => PRESETS.find(p => p.id === id));
  const orderedMeta = ["income", "balanced", "growth"].map(id => PRESET_META.find(m => m.id === id));

  return (
    <div style={{
      width: "100%", minHeight: "100vh", background: W.sand,
      color: W.fg, fontFamily: font,
      display: "flex", flexDirection: "column",
    }}>
      {/* Header band */}
      <div style={{
        padding: "52px 56px 40px",
        display: "grid", gridTemplateColumns: "1fr 460px", gap: 80,
        alignItems: "end",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ width: i === 1 ? 20 : 6, height: 2, background: i === 1 ? W.green : W.border }} />
              ))}
            </div>
            <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: W.fgMuted, fontWeight: 600 }}>
              Strategy
            </span>
          </div>
          <h1 style={{
            fontFamily: font, fontSize: "clamp(48px,5vw,72px)", fontWeight: 300,
            letterSpacing: "-0.03em", lineHeight: 1, color: W.fg,
          }}>
            Choose a starting<br />posture.
          </h1>
        </div>
        <div>
          <p style={{ fontSize: 16, color: W.fgMuted, lineHeight: 1.6, fontWeight: 400 }}>
            Three preset allocations, each calibrated for a distinct return profile.
            You'll be able to adjust every weight in the next step — these are starting
            positions, not destinations.
          </p>
          <div style={{ display: "flex", gap: 20, marginTop: 20, fontSize: 12, color: W.fgSubtle }}>
            <span>Updated quarterly</span>
            <span style={{ width: 1, background: W.border }} />
            <span>Effective: Q2 2025</span>
          </div>
        </div>
      </div>

      {/* Three cards */}
      <div style={{
        padding: "0 56px",
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20,
        flex: 1,
      }}>
        {orderedPresets.map((preset, i) => (
          <StrategyCard key={preset.id} preset={preset} meta={orderedMeta[i]} onSelect={onSelect} />
        ))}
      </div>

      {/* Bottom strip */}
      <div style={{
        marginTop: 36, padding: "24px 56px",
        borderTop: `1px solid ${W.border}`,
        background: W.sand200,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
          <Eyebrow>Or build your own</Eyebrow>
          <span style={{ fontSize: 14, color: W.fgMuted, maxWidth: 460 }}>
            Skip the presets and start from a blank canvas.
          </span>
        </div>
        <Pill onClick={onBlank}>Start from blank →</Pill>
      </div>

      <div style={{ padding: "14px 56px 20px", borderTop: `1px solid ${W.border}` }}>
        <span style={{ fontSize: 10, color: W.fgSubtle, fontFamily: font }}>
          Indicative allocations and target ranges are simulation parameters, not offers to invest. Returns shown are gross of advisory fees and net of estimated fund-level fees.
        </span>
      </div>
    </div>
  );
}
