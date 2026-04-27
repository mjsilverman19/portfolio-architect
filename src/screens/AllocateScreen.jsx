import { useState, useCallback } from "react";
import { W, CLASSES, font, fmt } from "../tokens.js";
import { Eyebrow, Pill, Rule, PieChart, AllocBar, AssetDetail } from "../components/Primitives.jsx";

const TOTAL = 500000;

const NOTES = [
  { tag: "PRIVATE EQUITY", body: "Vintage diversification matters at high weights. Consider spreading across fund vintages for smoother returns.", color: W.green },
  { tag: "VENTURE CAPITAL", body: "High-conviction VC requires a long horizon. Capital calls average 18 months from commitment.", color: W.plum },
  { tag: "PRIVATE CREDIT", body: "Floating-rate exposure performs well in rising-rate environments. Core positions offer steady income.", color: W.gold600 },
  { tag: "REAL ESTATE", body: "Income from core positions offsets J-curve drawdowns in direct deals. Interest rate sensitivity is higher here.", color: W.indigo },
];

function SliderRow({ cls, value, onChange, isLast, onExpand, expanded }) {
  const pct = Math.round((value / TOTAL) * 100);

  return (
    <div style={{
      padding: "20px 0",
      borderBottom: isLast ? "none" : `1px solid ${W.border}`,
    }}>
      <div style={{
        display: "grid", gridTemplateColumns: "auto 1fr auto auto",
        alignItems: "center", gap: 16, marginBottom: 14,
      }}>
        <div style={{ width: 12, height: 12, background: cls.color, flexShrink: 0 }} />
        <div
          style={{ cursor: "pointer" }}
          onClick={() => onExpand(expanded ? null : cls.id)}
        >
          <div style={{ fontSize: 14, fontWeight: 500, color: W.fg, letterSpacing: "-0.005em" }}>{cls.name}</div>
          <div style={{ fontSize: 11, color: W.fgSubtle, marginTop: 2 }}>{cls.desc.split(".")[0]}.</div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => onChange(cls.id, Math.max(0, value - 25000))}
            style={{
              width: 28, height: 28, border: `1px solid ${W.border}`, background: W.white,
              color: W.fgMuted, fontSize: 14, fontFamily: font, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>−</button>
          <button
            onClick={() => onChange(cls.id, Math.min(TOTAL, value + 25000))}
            style={{
              width: 28, height: 28, border: `1px solid ${W.border}`, background: W.white,
              color: W.fgMuted, fontSize: 14, fontFamily: font, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>+</button>
        </div>
        <div style={{
          fontFamily: font, fontSize: 26, fontWeight: 300,
          color: W.fg, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums",
          minWidth: 56, textAlign: "right",
        }}>
          {pct}<span style={{ fontSize: 13, color: W.fgMuted, marginLeft: 2 }}>%</span>
        </div>
      </div>

      {/* Track */}
      <div style={{ position: "relative", height: 4, background: W.sand400, marginLeft: 28 }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          width: `${pct}%`, background: cls.color, transition: "width .2s",
        }} />
        <input
          type="range" min={0} max={TOTAL} step={25000} value={value}
          onChange={e => onChange(cls.id, Number(e.target.value))}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            opacity: 0, cursor: "pointer", margin: 0,
          }}
        />
        <div style={{
          position: "absolute", left: `${pct}%`, top: -6, transform: "translateX(-50%)",
          width: 16, height: 16, background: W.white, border: `1.5px solid ${cls.color}`,
          borderRadius: 999, pointerEvents: "none", transition: "left .2s",
        }} />
      </div>

      {expanded && <AssetDetail cls={cls} />}
    </div>
  );
}

export function AllocateScreen({ alloc, onChange, onLock, onReset, selectedPreset }) {
  const [expandedAsset, setExpandedAsset] = useState(null);

  const totalAlloc = Object.values(alloc).reduce((a, b) => a + b, 0);
  const over = totalAlloc > TOTAL;
  const reserve = Math.max(0, TOTAL - totalAlloc);

  return (
    <div style={{
      width: "100%", minHeight: "100vh", background: W.sand,
      color: W.fg, fontFamily: font, display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        padding: "36px 56px 28px",
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        borderBottom: `1px solid ${W.border}`,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ width: i === 2 ? 20 : 6, height: 2, background: i === 2 ? W.green : W.border }} />
              ))}
            </div>
            <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: W.fgMuted, fontWeight: 600 }}>
              Allocate{selectedPreset ? ` · ${selectedPreset.label}` : ""}
            </span>
          </div>
          <h1 style={{
            fontFamily: font, fontSize: "clamp(36px,4vw,56px)", fontWeight: 300,
            letterSpacing: "-0.03em", lineHeight: 1, color: W.fg,
          }}>
            Tune the engine.
          </h1>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {selectedPreset && <Pill onClick={onReset}>← Reset to preset</Pill>}
          <Pill
            primary
            disabled={over || totalAlloc === 0}
            onClick={onLock}
          >
            Lock allocation →
          </Pill>
        </div>
      </div>

      {/* Three columns */}
      <div style={{
        display: "grid", gridTemplateColumns: "300px minmax(0,1fr) 320px",
        flex: 1, borderBottom: `1px solid ${W.border}`,
      }}>
        {/* LEFT — donut + stats */}
        <aside style={{
          padding: 36, borderRight: `1px solid ${W.border}`,
          display: "flex", flexDirection: "column", gap: 28,
        }}>
          <PieChart alloc={alloc} reserve={reserve} />

          <div>
            <Eyebrow style={{ marginBottom: 14 }}>Portfolio snapshot</Eyebrow>
            {[
              { label: "Committed", value: fmt(totalAlloc) },
              { label: "Cash reserve", value: fmt(reserve) },
              { label: "PE + VC weight", value: `${Math.round(((alloc.pe + alloc.vc) / TOTAL) * 100)}%` },
              { label: "Income weight", value: `${Math.round(((alloc.re + alloc.pc) / TOTAL) * 100)}%` },
            ].map((r, i, arr) => (
              <div key={r.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0",
                borderBottom: i < arr.length - 1 ? `1px solid ${W.border}` : "none",
                fontSize: 13,
              }}>
                <span style={{ color: W.fgMuted }}>{r.label}</span>
                <span style={{ color: W.fg, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{r.value}</span>
              </div>
            ))}
          </div>

          {over && (
            <div style={{ padding: "12px 14px", background: "#fdf0ed", border: `1px solid ${W.danger}` }}>
              <div style={{ fontSize: 12, color: W.danger, fontWeight: 500 }}>Over budget by {fmt(totalAlloc - TOTAL)}</div>
              <div style={{ fontSize: 11, color: W.danger, opacity: 0.8, marginTop: 4 }}>Total cannot exceed $500K.</div>
            </div>
          )}

          {!over && totalAlloc > 0 && (
            <div style={{ padding: "12px 14px", background: W.sand200, border: `1px solid ${W.border}` }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ width: 6, height: 6, background: W.chartreuse, borderRadius: 999, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: W.fg, marginBottom: 3 }}>Ready to simulate</div>
                  <div style={{ fontSize: 11, color: W.fgMuted, lineHeight: 1.5 }}>
                    {reserve > 0 ? `${fmt(reserve)} held in cash reserve.` : "All capital committed."}
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* MIDDLE — sliders */}
        <main style={{ padding: "36px 40px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
            <Eyebrow>Asset class allocation</Eyebrow>
            <span style={{ fontSize: 11, color: W.fgSubtle, fontVariantNumeric: "tabular-nums" }}>
              {fmt(totalAlloc)} of {fmt(TOTAL)}{totalAlloc <= TOTAL ? ` · ${fmt(reserve)} unallocated` : ""}
            </span>
          </div>

          {CLASSES.map((cls, i) => (
            <SliderRow
              key={cls.id}
              cls={cls}
              value={alloc[cls.id] || 0}
              onChange={onChange}
              isLast={i === CLASSES.length - 1}
              expanded={expandedAsset === cls.id}
              onExpand={setExpandedAsset}
            />
          ))}

          <div style={{ marginTop: 8 }}>
            <AllocBar positions={
              Object.fromEntries(CLASSES.map(c => [[c.id + "_core", alloc[c.id] || 0], [c.id + "_sat", 0]]).flat())
            } cash={reserve} />
          </div>
        </main>

        {/* RIGHT — committee notes */}
        <aside style={{
          padding: 36, borderLeft: `1px solid ${W.border}`, background: W.sand200,
          display: "flex", flexDirection: "column", gap: 24,
        }}>
          <div>
            <Eyebrow style={{ marginBottom: 6 }}>Investment notes</Eyebrow>
            <div style={{ fontSize: 11, color: W.fgSubtle, fontVariantNumeric: "tabular-nums" }}>
              Per asset class · Q2 2025
            </div>
          </div>

          {NOTES.map(n => (
            <div key={n.tag} style={{ paddingLeft: 14, borderLeft: `2px solid ${n.color}` }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", color: n.color, marginBottom: 6 }}>
                {n.tag}
              </div>
              <p style={{ fontSize: 13, color: W.fg, lineHeight: 1.55 }}>{n.body}</p>
            </div>
          ))}

          <div style={{ marginTop: "auto" }}>
            <Rule />
            <div style={{ paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: W.fgSubtle, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
                  Next step
                </div>
                <div style={{ fontSize: 13, color: W.fg, marginTop: 4 }}>Live the decade</div>
              </div>
              <button
                onClick={!over && totalAlloc > 0 ? onLock : undefined}
                style={{
                  width: 36, height: 36, background: (!over && totalAlloc > 0) ? W.midnight : W.sand400,
                  color: W.white, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, cursor: (!over && totalAlloc > 0) ? "pointer" : "default",
                  border: "none", flexShrink: 0,
                }}>→</button>
            </div>
          </div>
        </aside>
      </div>

      <div style={{ padding: "12px 56px 18px" }}>
        <span style={{ fontSize: 10, color: W.fgSubtle }}>
          Allocations are split 50/50 between diversified fund (core) and direct investment (satellite) positions in the simulation.
        </span>
      </div>
    </div>
  );
}
