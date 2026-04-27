import { W, CLASSES, font, fmt, pctFmt } from "../tokens.js";
import { Eyebrow, Pill, Rule, AllocBar } from "../components/Primitives.jsx";
import { Chart } from "../components/Chart.jsx";
import { FrameworkReveal } from "../components/FrameworkReveal.jsx";
import { calcResults, totalPortfolio, coreTotal, satTotal } from "../engine/simulation.js";

const grainSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

function DecisionSlot({ text, index }) {
  const isHighImpact = text.match(/\$[1-9]\d{4,}/);
  const m = text.match(/\(Y(\d+)\)/);
  const year = m ? m[1] : null;

  return (
    <div style={{
      position: "relative", height: 88,
      background: isHighImpact ? W.chartreuse : W.green,
      border: `1px solid ${W.border}`,
      padding: 12, display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <span style={{
        fontSize: 10, fontWeight: 600,
        color: isHighImpact ? W.midnight : W.white,
        letterSpacing: "0.06em", fontVariantNumeric: "tabular-nums",
      }}>
        D{String(index + 1).padStart(2, "0")}{year ? ` · Y${year}` : ""}
      </span>
      <span style={{
        fontSize: 11, fontWeight: 500,
        color: isHighImpact ? W.midnight : W.white,
        letterSpacing: "-0.005em", lineHeight: 1.2,
      }}>
        {text.replace(/\s*\(Y\d+\)/, "").substring(0, 40)}{text.length > 40 ? "…" : ""}
      </span>
    </div>
  );
}

function EmptySlot({ index }) {
  return (
    <div style={{
      position: "relative", height: 88,
      background: W.green200, border: `1px solid ${W.border}`,
      padding: 12, display: "flex", flexDirection: "column", justifyContent: "space-between",
      opacity: 0.5,
    }}>
      <span style={{
        fontSize: 10, fontWeight: 600, color: W.white,
        letterSpacing: "0.06em", fontVariantNumeric: "tabular-nums",
      }}>
        D{String(index + 1).padStart(2, "0")}
      </span>
      <span style={{ fontSize: 11, color: W.white }}>—</span>
    </div>
  );
}

export function ResultsScreen({ gs, onRestart }) {
  const hist = gs.history;
  const results = calcResults(hist);
  const tp = totalPortfolio(gs);
  const startVal = hist[0]?.totalPortfolio || tp;

  const cv = coreTotal(gs);
  const sv = satTotal(gs);

  // Attribution by asset class
  const attrByClass = CLASSES.map(c => {
    const coreVal = gs.positions[c.id + "_core"] || 0;
    const satVal = gs.positions[c.id + "_sat"] || 0;
    const total = coreVal + satVal;
    const startEntry = hist[0]?.positions || {};
    const startTotal = (startEntry[c.id + "_core"] || 0) + (startEntry[c.id + "_sat"] || 0);
    return { cls: c, current: total, gain: total - startTotal };
  }).filter(x => x.current > 0 || x.gain !== 0);

  const maxGain = Math.max(...attrByClass.map(x => Math.abs(x.gain)), 1);

  // Build up to 8 decision slots
  const decisions = gs.decisions || [];
  const slots = Array.from({ length: Math.max(8, decisions.length) }, (_, i) => decisions[i] || null);

  return (
    <div style={{
      width: "100%", background: W.sand, color: W.fg, fontFamily: font,
    }}>
      {/* HERO — teal gradient */}
      <section style={{
        position: "relative", height: "100vh", minHeight: 700,
        color: W.white, overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url(/assets/gradient-teal.png)",
          backgroundSize: "cover", backgroundPosition: "center",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(0,24,25,0.5) 0%, rgba(0,46,48,0.2) 55%, rgba(0,46,48,0.65) 100%)",
        }} />
        <div style={{
          position: "absolute", inset: 0, opacity: 0.18, mixBlendMode: "overlay",
          pointerEvents: "none", backgroundImage: grainSvg,
        }} />

        <div style={{
          position: "relative", zIndex: 2,
          padding: "64px 56px 0",
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ width: i === 4 ? 20 : 6, height: 2, background: i === 4 ? W.chartreuse : "rgba(255,255,255,0.3)" }} />
              ))}
            </div>
            <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>
              Decade complete · 10 years
            </span>
          </div>

          <div style={{
            fontFamily: font, fontSize: 22, fontWeight: 300,
            color: "rgba(255,255,255,0.7)", letterSpacing: "-0.015em", marginBottom: 20,
          }}>
            Your portfolio grew from {fmt(startVal)} to
          </div>

          <div style={{
            fontFamily: font, fontWeight: 300,
            fontSize: "clamp(80px,12vw,180px)",
            lineHeight: 0.92, letterSpacing: "-0.045em",
            color: W.white, fontVariantNumeric: "tabular-nums", marginBottom: 40,
          }}>
            {fmt(tp).replace(/M$/, "")}<span style={{ color: W.chartreuse }}>M</span>
          </div>

          {results && (
            <div style={{ display: "flex", gap: 56, marginTop: 16 }}>
              {[
                ["Total return", `${results.totalReturn >= 0 ? "+" : ""}${results.totalReturn}%`],
                ["Net IRR", `${results.annualized}%`],
                ["Multiple", `${(tp / startVal).toFixed(2)}×`],
                ["Decisions", `${decisions.length} made`],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 8 }}>
                    {l}
                  </div>
                  <div style={{
                    fontFamily: font, fontSize: 28, fontWeight: 300,
                    color: W.white, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums",
                  }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTAs */}
        <div style={{
          position: "absolute", bottom: 32, left: 0, right: 0, zIndex: 2,
          display: "flex", justifyContent: "center", gap: 12,
        }}>
          <Pill primary dark>Bring this to Willow →</Pill>
          <Pill dark onClick={onRestart}>Run again</Pill>
        </div>
      </section>

      {/* ATTRIBUTION REPORT */}
      <section style={{ padding: "80px 56px 60px" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, marginBottom: 48,
        }}>
          <div>
            <Eyebrow style={{ marginBottom: 16 }}>Attribution</Eyebrow>
            <h2 style={{
              fontFamily: font, fontSize: "clamp(36px,4vw,56px)", fontWeight: 300,
              letterSpacing: "-0.03em", lineHeight: 1.02,
            }}>
              How you<br />got here.
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <p style={{ fontSize: 16, color: W.fgMuted, lineHeight: 1.6, maxWidth: 460 }}>
              {results && parseFloat(results.totalReturn) > 50
                ? "Strong compounding across asset classes. Your direct investments delivered meaningful upside."
                : "A decade of decisions shaped your final portfolio. Here's how each component contributed."}
            </p>
          </div>
        </div>

        {/* Portfolio chart */}
        <div style={{
          background: W.white, border: `1px solid ${W.border}`, padding: "32px 36px", marginBottom: 32,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
            <div>
              <Eyebrow style={{ marginBottom: 4 }}>Portfolio value over time</Eyebrow>
              <div style={{ fontSize: 11, color: W.fgSubtle }}>Year 0 → Year 10 · Diamonds mark decision points</div>
            </div>
            {results && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: W.fgSubtle }}>Worst year</div>
                <div style={{ fontSize: 18, fontWeight: 300, color: parseFloat(results.worstYear) < 0 ? W.danger : W.green, fontVariantNumeric: "tabular-nums" }}>
                  {results.worstYear}%
                </div>
              </div>
            )}
          </div>
          <Chart history={hist} decisions={decisions} />
        </div>

        {/* Asset class attribution */}
        <div style={{
          background: W.white, border: `1px solid ${W.border}`, padding: "32px 36px",
        }}>
          <Eyebrow style={{ marginBottom: 24 }}>Return by asset class</Eyebrow>
          {attrByClass.map(({ cls, current, gain }) => {
            const barWidth = Math.abs(gain) / maxGain * 100;
            const isPos = gain >= 0;
            return (
              <div key={cls.id} style={{
                display: "grid", gridTemplateColumns: "80px 1fr 120px",
                alignItems: "center", gap: 20, padding: "12px 0",
                borderBottom: `1px solid ${W.border}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, background: cls.color, flexShrink: 0, display: "inline-block" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: W.fgMuted }}>{cls.short}</span>
                </div>
                <div style={{ position: "relative", height: 8, background: W.sand400 }}>
                  <div style={{
                    position: "absolute", left: 0, top: 0, height: "100%",
                    width: `${barWidth}%`, background: isPos ? cls.color : W.danger,
                    transition: "width .4s",
                  }} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: isPos ? W.fg : W.danger, fontVariantNumeric: "tabular-nums" }}>
                    {fmt(current)}
                  </div>
                  <div style={{ fontSize: 11, color: isPos ? W.green : W.danger, fontVariantNumeric: "tabular-nums" }}>
                    {gain >= 0 ? "+" : ""}{fmt(gain)}
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 20, display: "flex", gap: 32 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: W.fgSubtle, marginBottom: 6 }}>Core total</div>
              <div style={{ fontSize: 20, fontWeight: 300, color: W.fg, fontVariantNumeric: "tabular-nums" }}>{fmt(cv)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: W.fgSubtle, marginBottom: 6 }}>Direct total</div>
              <div style={{ fontSize: 20, fontWeight: 300, color: W.fg, fontVariantNumeric: "tabular-nums" }}>{fmt(sv)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: W.fgSubtle, marginBottom: 6 }}>Cash</div>
              <div style={{ fontSize: 20, fontWeight: 300, color: W.fg, fontVariantNumeric: "tabular-nums" }}>{fmt(gs.cash)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.16em", color: W.fgSubtle, marginBottom: 6 }}>Income received</div>
              <div style={{ fontSize: 20, fontWeight: 300, color: W.fg, fontVariantNumeric: "tabular-nums" }}>{fmt(gs.totalIncome || 0)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* DECISION REPLAY */}
      <section style={{ padding: "0 56px 64px" }}>
        <div style={{ marginBottom: 28 }}>
          <Eyebrow style={{ marginBottom: 16 }}>Decision replay</Eyebrow>
          <h2 style={{
            fontFamily: font, fontSize: "clamp(28px,3vw,40px)", fontWeight: 300,
            letterSpacing: "-0.025em", lineHeight: 1.05,
          }}>
            {decisions.length} decision{decisions.length !== 1 ? "s" : ""} across the decade.
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(4, slots.length)}, 1fr)`,
          gap: 4, marginBottom: 20,
        }}>
          {slots.map((text, i) =>
            text
              ? <DecisionSlot key={i} text={text} index={i} />
              : <EmptySlot key={i} index={i} />
          )}
        </div>

        <div style={{ display: "flex", gap: 24, fontSize: 12, color: W.fgMuted }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 12, height: 12, background: W.chartreuse, display: "inline-block" }} /> High-value decision
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 12, height: 12, background: W.green, display: "inline-block" }} /> Completed
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 12, height: 12, background: W.green200, display: "inline-block" }} /> Not reached
          </span>
        </div>
      </section>

      {/* PRODUCT BRIDGE */}
      <FrameworkReveal
        positions={gs.positions}
        cash={gs.cash}
        concentrationPenalty={gs.concentrationPenalty}
      />

      <div style={{ padding: "0 56px 32px" }}>
        <span style={{ fontSize: 10, color: W.fgSubtle }}>
          Simulation results reflect a hypothetical 10-year decade. Actual performance will vary. Not an offer to purchase securities. Investors must review fund-level offering documents before any commitment.
        </span>
      </div>
    </div>
  );
}
