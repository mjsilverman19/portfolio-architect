import { CLASSES } from "../tokens.js";
import { ENVS } from "./presets.js";
import { buildDecision } from "./decisions.js";

export const rnd = (lo, hi) => Math.random() * (hi - lo) + lo;

export function totalPortfolio(st) {
  let t = st.cash || 0;
  Object.values(st.positions).forEach(v => { t += v; });
  return t;
}

export function coreTotal(st) {
  let t = 0;
  CLASSES.forEach(c => { t += st.positions[c.id + "_core"] || 0; });
  return t;
}

export function satTotal(st) {
  let t = 0;
  CLASSES.forEach(c => { t += st.positions[c.id + "_sat"] || 0; });
  return t;
}

export function simYear(st, env) {
  const newPos = {};
  let yearInc = 0;
  CLASSES.forEach(cls => {
    const cv = st.positions[cls.id + "_core"] || 0;
    const sv = st.positions[cls.id + "_sat"] || 0;
    let newC = 0, newS = 0;
    if (cv > 0) {
      const cm = env.m[cls.id].c * rnd(0.94, 1.06);
      newC = Math.max(0, cv * cm);
      if (cls.core.income) yearInc += newC * cls.core.incomeRate * rnd(0.8, 1.1);
    }
    if (sv > 0) {
      const sm = env.m[cls.id].s * rnd(0.94, 1.06);
      let sj = 1;
      if (cls.sat.jCurve && st.year < 2) sj = 0.88;
      else if (cls.sat.jCurve && st.year === 2) sj = 0.95;
      if (cls.id === "pe" && st.penaltyPe) sj *= 0.94;
      if (st.deferralPenalty && st.year >= 9) sj *= 0.85;
      if (st.concentrationPenalty === cls.id) sj *= 0.92;
      newS = Math.max(0, sv * sm * sj);
      if (cls.sat.income) yearInc += newS * cls.sat.incomeRate * rnd(0.8, 1.1);
    }
    newPos[cls.id + "_core"] = newC;
    newPos[cls.id + "_sat"] = newS;
  });
  return { positions: newPos, income: yearInc };
}

export function pickEnv() {
  const r = Math.random();
  if (r < 0.20) return ENVS[0];
  if (r < 0.35) return ENVS[1];
  if (r < 0.50) return ENVS[2];
  if (r < 0.65) return ENVS[3];
  return ENVS[4];
}

export function advanceUntilDecision(initState) {
  let st = { ...initState };
  let summary = null;
  let decision = null;
  let transitions = [];
  while (st.year < 10) {
    const env = st.envs[st.year];
    const prevPositions = { ...st.positions };
    const { positions: newPos, income } = simYear(st, env);
    const prevTotal = st.history[st.history.length - 1].totalPortfolio;
    st = {
      ...st,
      year: st.year + 1,
      positions: newPos,
      cash: st.cash + income,
      totalIncome: st.totalIncome + income,
      cumulativeIncome: (st.cumulativeIncome || 0) + income,
      yearlyIncome: income,
    };
    const wipeouts = [];
    CLASSES.forEach(cls => {
      const prevSat = prevPositions[cls.id + "_sat"] || 0;
      const newSat = newPos[cls.id + "_sat"] || 0;
      if (prevSat > 0 && newSat === 0) {
        wipeouts.push({ cls, prevVal: prevSat });
        st = { ...st, decisions: [...st.decisions, `${cls.name} direct investment written off — portfolio companies failed to secure follow-on funding (Y${st.year})`] };
      }
    });
    const tp = totalPortfolio(st);
    st.history = [...st.history, { year: st.year, positions: { ...st.positions }, cash: st.cash, totalPortfolio: tp, env, yearlyIncome: income }];
    transitions.push({ year: st.year, env, prevTotal, newTotal: tp, change: ((tp - prevTotal) / prevTotal) * 100, wipeouts: wipeouts.length > 0 ? wipeouts : undefined });
    const d = buildDecision(st);
    if (d) { summary = { year: st.year, env, totalPortfolio: tp, prevTotal }; decision = d; break; }
  }
  return { state: st, summary, decision, transitions, done: st.year >= 10 && !decision };
}

export function calcResults(hist) {
  if (hist.length < 2) return null;
  const s = hist[0].totalPortfolio, e = hist[hist.length - 1].totalPortfolio;
  const ret = (e - s) / s;
  const yearlyReturns = [];
  for (let i = 1; i < hist.length; i++) {
    yearlyReturns.push((hist[i].totalPortfolio - hist[i - 1].totalPortfolio) / hist[i - 1].totalPortfolio);
  }
  const worstYear = Math.min(...yearlyReturns);
  const years = hist.length - 1;
  const annualized = years > 0 ? (Math.pow(e / s, 1 / years) - 1) * 100 : 0;
  return {
    totalReturn: (ret * 100).toFixed(1),
    finalValue: e,
    worstYear: (worstYear * 100).toFixed(1),
    annualized: annualized.toFixed(1),
  };
}
