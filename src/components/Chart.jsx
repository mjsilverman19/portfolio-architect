import { W, CLASSES, font, fmt, pctFmt } from "../tokens.js";

export function Chart({ history, decisions }) {
  if (history.length < 2) return null;

  const qPoints = [];
  for (let i = 0; i < history.length; i++) {
    const val = history[i].totalPortfolio;
    qPoints.push(val);
    if (i < history.length - 1) {
      const next = history[i + 1].totalPortfolio;
      const diff = next - val;
      for (let q = 1; q <= 3; q++) {
        const base = val + (diff * q / 4);
        const trendBias = diff > 0 ? 0.003 : -0.003;
        const noise = base * (trendBias + (Math.random() - 0.5) * 0.03);
        qPoints.push(base + noise);
      }
    }
  }

  const w = 640, h = 180, pad = { t: 14, r: 14, b: 26, l: 54 };
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
  const mn = Math.min(...qPoints) * 0.97, mx = Math.max(...qPoints) * 1.03;
  const range = mx - mn || 1;
  const pts = qPoints.map((v, i) => ({
    x: pad.l + (i / (qPoints.length - 1)) * cw,
    y: pad.t + ch - ((v - mn) / range) * ch,
  }));

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1], curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  const area = d + ` L ${pts[pts.length - 1].x} ${pad.t + ch} L ${pad.l} ${pad.t + ch} Z`;
  const yearIndices = history.map((_, i) => i * 4);

  const decYears = new Set();
  if (decisions) {
    decisions.forEach(dec => {
      const m = dec.match(/\(Y(\d+)\)/);
      if (m) decYears.add(parseInt(m[1]));
    });
  }

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      {[0, 0.5, 1].map((p, i) => {
        const y = pad.t + ch * (1 - p);
        return (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke={W.border} strokeDasharray={i === 1 ? "4,4" : "none"} />
            <text x={pad.l - 5} y={y + 3} textAnchor="end" fontSize={9} fill={W.fgSubtle} fontFamily={font}>
              {fmt(mn + range * p)}
            </text>
          </g>
        );
      })}
      <path d={area} fill={W.green} opacity={0.07} />
      <path d={d} fill="none" stroke={W.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {yearIndices.map((qi, i) => {
        if (qi >= pts.length) return null;
        const p = pts[qi];
        return (
          <circle key={i} cx={p.x} cy={p.y}
            r={i === history.length - 1 ? 4 : 2.5}
            fill={W.green} stroke={W.white} strokeWidth={1.5} />
        );
      })}
      {history.map((x, i) => {
        const qi = i * 4;
        if (qi >= pts.length) return null;
        return (
          <text key={i} x={pts[qi].x} y={pad.t + ch + 16}
            textAnchor="middle" fontSize={9} fill={W.fgSubtle} fontFamily={font}>
            {i === 0 ? "Start" : `Y${x.year}`}
          </text>
        );
      })}
      {decisions && history.map((x, i) => {
        if (!decYears.has(x.year)) return null;
        const qi = i * 4;
        if (qi >= pts.length) return null;
        const p = pts[qi];
        return (
          <polygon key={`dec-${i}`}
            points={`${p.x},${p.y - 7} ${p.x + 5},${p.y} ${p.x},${p.y + 7} ${p.x - 5},${p.y}`}
            fill={W.chartreuse} stroke={W.midnight} strokeWidth={1} />
        );
      })}
    </svg>
  );
}
