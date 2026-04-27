import { useState, useEffect } from "react";
import { W, font, fmt, pctFmt } from "../tokens.js";

export function YearTransition({ transitions, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (idx >= transitions.length) { onComplete(); return; }
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setIdx(i => i + 1), 300);
    }, 1600);
    return () => clearTimeout(t);
  }, [idx, transitions.length, onComplete]);

  if (idx >= transitions.length) return null;
  const tr = transitions[idx];
  const neg = ["rate_hike", "credit_crunch"].includes(tr.env?.id);
  const pos = ["boom", "rate_cut"].includes(tr.env?.id);
  const accentColor = neg ? W.danger : pos ? W.chartreuse : W.green300;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,24,25,0.78)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, padding: 20,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
    }}>
      <div style={{
        background: W.midnightDeep,
        border: `1px solid ${W.borderInverse}`,
        borderTop: `3px solid ${accentColor}`,
        padding: "40px 44px",
        maxWidth: 440, width: "100%",
        textAlign: "center",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(-12px) scale(0.97)",
        transition: "opacity 0.3s, transform 0.3s",
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.22em", color: "rgba(255,255,255,0.45)",
          marginBottom: 8, fontFamily: font,
        }}>
          Year {tr.year} of 10
        </div>

        <div style={{
          fontSize: 22, fontWeight: 400, color: W.white,
          letterSpacing: "-0.015em", lineHeight: 1.25, marginBottom: 10,
          fontFamily: font,
        }}>
          {tr.env?.label || "Market Update"}
        </div>

        <div style={{
          fontSize: 14, color: "rgba(255,255,255,0.65)",
          lineHeight: 1.55, marginBottom: tr.wipeouts ? 10 : 24,
          fontFamily: font,
        }}>
          {tr.env?.narrative}
        </div>

        {tr.wipeouts && tr.wipeouts.map((wo, i) => (
          <div key={i} style={{
            fontSize: 13, fontWeight: 500, color: W.danger,
            marginBottom: i === tr.wipeouts.length - 1 ? 20 : 4,
            fontFamily: font,
          }}>
            Your {wo.cls.name} direct position was written off.
          </div>
        ))}

        <div style={{
          display: "flex", justifyContent: "center", gap: 40,
          paddingTop: 20, borderTop: `1px solid ${W.borderInverse}`,
        }}>
          <div>
            <div style={{
              fontSize: 9, color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase", letterSpacing: "0.16em",
              fontWeight: 600, marginBottom: 6, fontFamily: font,
            }}>Portfolio</div>
            <div style={{
              fontSize: 22, fontWeight: 300, color: W.white,
              letterSpacing: "-0.02em", fontFamily: font,
              fontVariantNumeric: "tabular-nums",
            }}>{fmt(tr.newTotal)}</div>
          </div>
          <div>
            <div style={{
              fontSize: 9, color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase", letterSpacing: "0.16em",
              fontWeight: 600, marginBottom: 6, fontFamily: font,
            }}>This Year</div>
            <div style={{
              fontSize: 22, fontWeight: 300,
              color: tr.change >= 0 ? W.chartreuse : W.danger,
              letterSpacing: "-0.02em", fontFamily: font,
              fontVariantNumeric: "tabular-nums",
            }}>{pctFmt(tr.change)}</div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
            {transitions.map((_, i) => (
              <div key={i} style={{
                width: i === idx ? 20 : 6, height: 2,
                background: i < idx ? W.green300 : i === idx ? W.chartreuse : W.borderInverse,
                transition: "all 0.3s",
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
