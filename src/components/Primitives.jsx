import { useState } from "react";
import { W, CLASSES, font, fmt } from "../tokens.js";

/* Eyebrow — all-caps label */
export function Eyebrow({ children, color = W.green, style }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, letterSpacing: "0.2em",
      textTransform: "uppercase", color, ...style,
    }}>{children}</div>
  );
}

/* Hairline rule */
export function Rule({ color = W.border, style }) {
  return <div style={{ height: 1, background: color, width: "100%", ...style }} />;
}

/* Pill button — Willow rounded style */
export function Pill({ children, primary = false, dark = false, disabled = false, onClick, style }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    height: 48, padding: "0 28px", borderRadius: 999,
    fontSize: 14, fontWeight: 500, letterSpacing: "-0.005em",
    cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid", transition: "all 180ms",
    fontFamily: font, opacity: disabled ? 0.45 : 1,
  };
  let variant;
  if (primary && dark) variant = { background: W.chartreuse, color: W.midnight, borderColor: W.chartreuse };
  else if (primary)    variant = { background: W.midnight, color: W.white, borderColor: W.midnight };
  else if (dark)       variant = { background: "transparent", color: W.white, borderColor: W.borderInverse };
  else                 variant = { background: "transparent", color: W.fg, borderColor: W.borderStrong };
  return (
    <button onClick={!disabled ? onClick : undefined} style={{ ...base, ...variant, ...style }}>
      {children}
    </button>
  );
}

/* Stacked allocation bar */
export function AllocBar({ positions, cash }) {
  const items = [];
  CLASSES.forEach(c => {
    const cv = positions[c.id + "_core"] || 0;
    const sv = positions[c.id + "_sat"] || 0;
    if (cv > 0) items.push({ color: c.color, val: cv, opacity: 0.5 });
    if (sv > 0) items.push({ color: c.color, val: sv, opacity: 1 });
  });
  if (cash > 0) items.push({ color: W.fgSubtle, val: cash, opacity: 0.3 });
  const t = items.reduce((a, b) => a + b.val, 0);
  if (t <= 0) return null;
  return (
    <div style={{ display: "flex", overflow: "hidden", height: 6, background: W.sand400 }}>
      {items.map((it, i) => (
        <div key={i} style={{ width: `${(it.val / t) * 100}%`, background: it.color, opacity: it.opacity, transition: "width .4s" }} />
      ))}
    </div>
  );
}

/* Donut pie chart for allocation screen */
export function PieChart({ alloc, reserve }) {
  const total = 500000;
  const r = 72, cx = 90, cy = 90, sw = 36;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = CLASSES.map(a => {
    const pct = (alloc[a.id] || 0) / total;
    const dash = pct * circ;
    const gap = circ - dash;
    const o = offset;
    offset += dash;
    return { ...a, pct, dash, gap, offset: o };
  }).filter(s => s.pct > 0);
  const unPct = Math.max(0, reserve) / total;
  const unDash = unPct * circ;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28, justifyContent: "center", marginBottom: 16 }}>
      <svg width={180} height={180} viewBox="0 0 180 180">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={W.sand400} strokeWidth={sw} />
        {slices.map(s => (
          <circle key={s.id} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={sw}
            strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={-s.offset}
            transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "all .4s" }} />
        ))}
        {unPct > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={W.sand400} strokeWidth={sw}
            strokeDasharray={`${unDash} ${circ - unDash}`} strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "all .4s" }} />
        )}
        <text x={cx} y={cy - 7} textAnchor="middle" dominantBaseline="auto"
          fontSize={15} fontWeight={500} fill={W.midnight} fontFamily={font}
          style={{ fontVariantNumeric: "tabular-nums" }}>
          {fmt(total - Math.max(0, reserve))}
        </text>
        <text x={cx} y={cy + 11} textAnchor="middle" dominantBaseline="auto"
          fontSize={10} fontWeight={600} letterSpacing="0.12em" fill={W.fgSubtle} fontFamily={font}>
          INVESTED
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {CLASSES.map(a => {
          const pct = ((alloc[a.id] / total) * 100).toFixed(0);
          return alloc[a.id] > 0 ? (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: W.fg }}>
              <span style={{ width: 10, height: 10, background: a.color, flexShrink: 0, display: "inline-block" }} />
              <span style={{ fontWeight: 600, minWidth: 32, color: W.fgMuted, fontSize: 11 }}>{a.short}</span>
              <span style={{ color: W.fgSubtle, fontSize: 12 }}>{pct}%</span>
            </div>
          ) : null;
        })}
        {reserve > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, background: W.sand400, flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontWeight: 600, minWidth: 32, color: W.fgMuted, fontSize: 11 }}>CASH</span>
            <span style={{ color: W.fgSubtle, fontSize: 12 }}>{((reserve / total) * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* Stat card */
export function Stat({ label, value, sub, color }) {
  return (
    <div style={{
      background: W.white, border: `1px solid ${W.border}`,
      padding: "16px 20px", flex: "1 1 130px", minWidth: 120,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, textTransform: "uppercase",
        letterSpacing: "0.16em", color: W.fgSubtle, marginBottom: 6,
      }}>{label}</div>
      <div style={{
        fontSize: 22, fontWeight: 300, letterSpacing: "-0.02em",
        color: color || W.midnight, fontVariantNumeric: "tabular-nums",
      }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: W.fgSubtle, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/* RiskReturn scatter plot */
export function RiskReturnChart({ highlighted, realized }) {
  const w = 320, h = 180, pad = { t: 20, r: 20, b: 36, l: 44 };
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <rect x={0} y={0} width={w} height={h} rx={4} fill={W.sand} />
      {[0, 0.5, 1].map((p, i) => {
        const y = pad.t + ch * (1 - p);
        return (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke={W.border} strokeWidth={0.5} />
            <text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize={10} fill={W.fgSubtle}>{Math.round(p * 25)}%</text>
          </g>
        );
      })}
      {[0, 0.5, 1].map((p, i) => {
        const x = pad.l + cw * p;
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={pad.t} y2={pad.t + ch} stroke={W.border} strokeWidth={0.5} />
            <text x={x} y={pad.t + ch + 14} textAnchor="middle" fontSize={10} fill={W.fgSubtle}>{["Low", "Med", "High"][i]}</text>
          </g>
        );
      })}
      <text x={pad.l + cw / 2} y={h - 4} textAnchor="middle" fontSize={10} fill={W.fgSubtle}>Volatility</text>
      <text x={10} y={pad.t + ch / 2} textAnchor="middle" fontSize={10} fill={W.fgSubtle} transform={`rotate(-90,10,${pad.t + ch / 2})`}>Return</text>
      {CLASSES.map(c => {
        const isHl = c.id === highlighted;
        const cx1 = pad.l + (c.core.vol / 0.40) * cw, cy1 = pad.t + (1 - c.core.ret / 0.25) * ch;
        const cx2 = pad.l + (c.sat.vol / 0.40) * cw, cy2 = pad.t + (1 - c.sat.ret / 0.25) * ch;
        return (
          <g key={c.id}>
            <circle cx={cx1} cy={cy1} r={isHl ? 6 : 4} fill={c.color} opacity={isHl ? 0.4 : 0.12} />
            <circle cx={cx2} cy={cy2} r={isHl ? 6 : 4} fill={c.color} opacity={isHl ? 1 : 0.22} stroke={isHl ? W.midnight : "none"} strokeWidth={1} />
            {isHl && <line x1={cx1} y1={cy1} x2={cx2} y2={cy2} stroke={c.color} strokeWidth={1} strokeDasharray="2,2" opacity={0.4} />}
            <text x={cx2} y={cy2 - 10} textAnchor="middle" fontSize={10} fontWeight={isHl ? 600 : 400} fill={isHl ? W.midnight : W.fgSubtle}>{c.short}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* Asset detail card */
export function AssetDetail({ cls }) {
  return (
    <div style={{ background: W.sand200, border: `1px solid ${W.border}`, padding: "16px 18px", marginTop: 8, marginBottom: 4 }}>
      <div style={{ maxWidth: 320, marginBottom: 14 }}>
        <RiskReturnChart highlighted={cls.id} />
      </div>
      <div style={{ fontSize: 10, color: W.fgSubtle, marginBottom: 8 }}>Faded dot = diversified fund. Solid dot = direct investment.</div>
      <div style={{ fontSize: 13, color: W.fg, lineHeight: 1.6, marginBottom: 10 }}>{cls.edu}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {cls.traits.map((t, i) => (
          <div key={i} style={{ fontSize: 11, color: W.fgMuted, display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ width: 4, height: 4, background: cls.color, flexShrink: 0, marginTop: 4, display: "inline-block" }} />
            <span>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Event tag for economic conditions */
export function EventTag({ env }) {
  const neg = ["rate_hike", "credit_crunch"].includes(env.id);
  const pos = ["boom", "rate_cut"].includes(env.id);
  return (
    <span style={{
      display: "inline-block", padding: "4px 12px", fontSize: 12, fontWeight: 500,
      background: neg ? "#fdf0ed" : pos ? W.green50 : W.sand200,
      color: neg ? W.danger : pos ? W.green : W.fg,
      marginRight: 6, marginBottom: 6,
    }}>{env.label}</span>
  );
}

/* Environment explainer */
export function EnvExplainer({ env }) {
  const [open, setOpen] = useState(false);
  if (!env || !env.explainer) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ background: W.sand200, border: `1px solid ${W.border}`, padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <EventTag env={env} />
          <span style={{ fontSize: 11, color: W.green, cursor: "pointer", fontWeight: 500 }} onClick={() => setOpen(!open)}>
            {open ? "Hide" : "Why it matters"}
          </span>
        </div>
        {open && (
          <div style={{ fontSize: 13, color: W.fg, lineHeight: 1.6, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${W.border}` }}>
            {env.explainer}
          </div>
        )}
      </div>
    </div>
  );
}

/* Income tracker */
export function IncomeTracker({ gs }) {
  const cumInc = gs.cumulativeIncome || 0;
  if (cumInc < 100) return null;
  const incomeByClass = CLASSES.filter(c => c.core.income || c.sat.income).map(c => {
    const coreVal = gs.positions[c.id + "_core"] || 0;
    const satVal = gs.positions[c.id + "_sat"] || 0;
    return { cls: c, estimated: (c.core.income ? coreVal * c.core.incomeRate : 0) + (c.sat.income ? satVal * c.sat.incomeRate : 0) };
  }).filter(x => x.estimated > 100);
  return (
    <div style={{ background: W.sand200, border: `1px solid ${W.border}`, padding: "12px 16px", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <Eyebrow color={W.fgSubtle}>Distributions to Cash</Eyebrow>
        <div style={{ fontSize: 10, color: W.fgSubtle }}>Total received: {fmt(cumInc)}</div>
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {incomeByClass.map(x => (
          <div key={x.cls.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: W.fg }}>
            <span style={{ width: 8, height: 8, background: x.cls.color, flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontWeight: 500 }}>{x.cls.short}</span>
            <span style={{ color: W.fgSubtle }}>~{fmt(x.estimated)}/yr</span>
          </div>
        ))}
        {incomeByClass.length === 0 && (
          <div style={{ fontSize: 12, color: W.fgSubtle }}>No income-producing positions active.</div>
        )}
      </div>
    </div>
  );
}
