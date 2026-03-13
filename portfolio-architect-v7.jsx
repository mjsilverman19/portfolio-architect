import { useState, useRef, useEffect, useCallback } from "react";

/* ── Brand (used only in results reveal) ── */
const B = {
  darkTeal: "#002e30", teal: "#014a4c", lime: "#dffa46", mint: "#a3f5c5",
  cream: "#f6f4f1", ltTeal: "#e6eded", gray: "#f8f8f8", body: "#3a3d42",
  white: "#fff", muted: "#7a7d82", red: "#c0392b", warn: "#e67e22", green: "#1a7a4c",
};
const font = '"Linik Sans", system-ui, sans-serif';
const fmt = (n) => { if (Math.abs(n) >= 1e6) return `$${(n/1e6).toFixed(2)}M`; if (Math.abs(n) >= 1e3) return `$${(n/1e3).toFixed(0)}K`; return `$${Math.round(n)}`; };
const pctFmt = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
const rnd = (lo, hi) => Math.random() * (hi - lo) + lo;

/*
  v7 — Combined build. Best of both v6 variants.

  From v6-A (mine):
  - Default allocation zeroed (player builds from scratch)
  - Forced liquidation at Y6 when cash near 0
  - Deep environment explainers with "Why it matters" toggle
  - Two-step Willow reveal (concept → products)
  - Income tracker visible during gameplay
  - Portfolio-dependent branching (VC premium exit in tech surge, RE distressed exit in rate hike)
  - Rich narrative connecting decisions to outcomes
  - Cumulative income tracking and Total Income stat

  From v6-B (theirs):
  - Year transition scenes (animated overlay between decisions)
  - Y3 player chooses which asset class to go direct in
  - Y6 concentration penalty (>55% triggers warning, ongoing drag)
  - Realized vs expected scatter chart in results
  - Annualized return (CAGR) stat
  - Budget-locked slider toggle (zero-sum mode)
  - Concentration drag in sim engine
*/

/* ── Asset class definitions ── */
const CLASSES = [
  { id:"pe", name:"Private Equity", short:"PE", color:"#2d5be3",
    core: { ret:0.09, vol:0.12, income:false, incomeRate:0, jCurve:false },
    sat:  { ret:0.16, vol:0.28, income:false, incomeRate:0, jCurve:true, lockup:5 },
    desc:"Funds that buy, improve, and sell private companies over multi-year holding periods.",
    edu:"Private equity generates returns by acquiring companies, improving operations, and selling them at a profit. Through a diversified fund, your capital is spread across dozens of deals with periodic liquidity. Through a direct investment, you take a concentrated position in a single fund with a multi-year lockup and higher return potential.",
    traits:["Returns driven by operational improvement and exits","Diversified fund: broad exposure, periodic liquidity","Direct investment: concentrated, 5+ year lockup"] },
  { id:"re", name:"Real Estate", short:"RE", color:"#d4820a",
    core: { ret:0.07, vol:0.10, income:true, incomeRate:0.04, jCurve:false },
    sat:  { ret:0.12, vol:0.22, income:true, incomeRate:0.05, jCurve:true, lockup:4 },
    desc:"Investments in commercial and residential properties that generate rental income and grow in value over time.",
    edu:"Real estate earns returns through rental income and property value appreciation. Diversified fund positions provide exposure across property types and geographies. Direct investments offer concentrated bets on specific properties or strategies with higher income potential and more sensitivity to interest rate cycles.",
    traits:["Income from rent plus property value growth","Diversified fund: steady, broad income stream","Direct investment: concentrated, higher yield potential"] },
  { id:"pc", name:"Private Credit", short:"PC", color:"#1a9a6f",
    core: { ret:0.07, vol:0.08, income:true, incomeRate:0.06, jCurve:false },
    sat:  { ret:0.10, vol:0.16, income:true, incomeRate:0.08, jCurve:false, lockup:2 },
    desc:"Lending outside the banking system that generates regular interest income for investors.",
    edu:"Private credit funds lend capital to borrowers and earn interest in return. Diversified fund positions offer floating-rate exposure that tends to perform well when rates rise. Direct investments offer individual lending opportunities with higher yields and more concentrated default risk.",
    traits:["Regular income from interest payments","Rates adjust with the market (floating rate)","Diversified fund: broad. Direct: higher yield, default risk"] },
  { id:"vc", name:"Venture Capital", short:"VC", color:"#8b5cf6",
    core: { ret:0.11, vol:0.18, income:false, incomeRate:0, jCurve:false },
    sat:  { ret:0.22, vol:0.38, income:false, incomeRate:0, jCurve:true, lockup:7 },
    desc:"Investments in early-stage companies where a small number of successes drive the majority of returns.",
    edu:"Venture capital funds invest in startups. Most fail, but the winners can return multiples of invested capital. Through a diversified fund, your exposure is spread across many companies. Through a direct investment, you take a concentrated position with a 7 to 10 year lockup and the widest return dispersion of any asset class.",
    traits:["Extreme return dispersion between managers","Longest lockup period of any asset class","Diversified fund: managed risk. Direct: highest ceiling"] },
];

/* ── Environments with deep explainers ── */
const ENVS = [
  { id:"boom", label:"Economic Expansion",
    narrative:"Strong GDP growth and consumer confidence drive asset values higher across the board.",
    m:{ pe:{c:1.11,s:1.28}, re:{c:1.08,s:1.18}, pc:{c:1.05,s:1.06}, vc:{c:1.14,s:1.45} },
    explainer:"Strong GDP growth lifts corporate earnings and startup valuations. PE and VC benefit most from rising exit multiples. Private credit generates steady income but limited upside in expansions. Real estate appreciates on rising rents and occupancy." },
  { id:"recession", label:"Recession",
    narrative:"Economic contraction hits valuations hard. Concentrated positions suffer the most.",
    m:{ pe:{c:0.93,s:0.72}, re:{c:0.94,s:0.76}, pc:{c:0.97,s:0.90}, vc:{c:0.90,s:0.52} },
    explainer:"Falling demand compresses valuations across risk assets. Direct positions suffer most from concentrated exposure to distressed companies. Private credit holds up best because floating-rate loans still generate income, though default risk rises. VC direct deals face the steepest losses as startups burn cash without new funding rounds." },
  { id:"rate_hike", label:"Rate Hike Cycle",
    narrative:"Central banks raise rates aggressively. Floating-rate credit benefits while real estate cap rates compress.",
    m:{ pe:{c:0.97,s:0.91}, re:{c:0.96,s:0.82}, pc:{c:1.04,s:1.08}, vc:{c:0.95,s:0.86} },
    explainer:"Rising rates increase borrowing costs, pressuring leveraged buyouts and real estate cap rates. Private credit is the clear winner: floating-rate loans reset higher, increasing income. Real estate direct deals suffer most as higher rates compress property valuations." },
  { id:"rate_cut", label:"Rate Cuts Begin",
    narrative:"Easing monetary policy lifts valuations and reopens exit windows for private equity.",
    m:{ pe:{c:1.06,s:1.10}, re:{c:1.06,s:1.14}, pc:{c:0.99,s:0.96}, vc:{c:1.08,s:1.18} },
    explainer:"Falling rates lower discount rates, boosting asset valuations across the board. Real estate benefits from cheaper financing and compressing cap rates. Private credit income declines as floating rates reset lower. PE and VC exit activity picks up." },
  { id:"tech_surge", label:"Tech Sector Surge",
    narrative:"A wave of AI and automation investment sends venture-backed valuations soaring.",
    m:{ pe:{c:1.04,s:1.06}, re:{c:1.01,s:1.00}, pc:{c:1.01,s:1.00}, vc:{c:1.12,s:1.55} },
    explainer:"A technology rally drives outsized gains in venture capital, especially direct positions with concentrated exposure to high-growth startups. Other asset classes see minimal impact. Real estate and credit are largely uncorrelated to tech-sector momentum." },
  { id:"credit_crunch", label:"Credit Crunch",
    narrative:"Lending standards tighten sharply. Borrowers struggle and default rates tick up.",
    m:{ pe:{c:0.94,s:0.82}, re:{c:0.95,s:0.86}, pc:{c:0.94,s:0.84}, vc:{c:0.92,s:0.72} },
    explainer:"Tightening credit conditions hit every asset class. Defaults rise in private credit, refinancing becomes difficult for PE portfolio companies, and VC startups lose access to growth capital. Diversified positions cushion the blow relative to concentrated direct deals." },
  { id:"steady", label:"Stable Growth",
    narrative:"Moderate, broad-based growth. All asset classes perform near long-term averages.",
    m:{ pe:{c:1.06,s:1.07}, re:{c:1.04,s:1.05}, pc:{c:1.04,s:1.05}, vc:{c:1.06,s:1.08} },
    explainer:"A benign environment with moderate growth and stable rates. All asset classes produce returns close to their long-term averages. The spread between core and satellite positions narrows in calm markets." },
  { id:"inflation", label:"Inflation Spike",
    narrative:"Unexpected inflation erodes purchasing power. Real assets and floating-rate instruments hold up.",
    m:{ pe:{c:0.98,s:0.94}, re:{c:1.04,s:1.09}, pc:{c:1.02,s:1.01}, vc:{c:0.94,s:0.82} },
    explainer:"Rising inflation erodes purchasing power but benefits real assets. Real estate performs well as rents and property values adjust upward. Private credit's floating rates offer partial protection. Venture capital suffers as high inflation raises discount rates on future cash flows." },
];
function pickEnv(){ const r=Math.random(); if(r<.12) return ENVS[1]; if(r<.22) return ENVS[2]; if(r<.32) return ENVS[3]; if(r<.39) return ENVS[4]; if(r<.45) return ENVS[5]; if(r<.52) return ENVS[7]; if(r<.68) return ENVS[0]; return ENVS[6]; }

/* ── Simulation engine (with concentration drag) ── */
function simYear(st, env) {
  const newPos = {};
  let yearInc = 0;
  CLASSES.forEach(cls => {
    const cv = st.positions[cls.id + "_core"] || 0;
    const sv = st.positions[cls.id + "_sat"] || 0;
    let newC = 0, newS = 0;
    if (cv > 0) {
      const cm = env.m[cls.id].c * rnd(0.94,1.06);
      newC = Math.max(0, cv * cm);
      if (cls.core.income) yearInc += newC * cls.core.incomeRate * rnd(0.8,1.1);
    }
    if (sv > 0) {
      const sm = env.m[cls.id].s * rnd(0.94,1.06);
      let sj = 1;
      if (cls.sat.jCurve && st.year < 2) sj = 0.88;
      else if (cls.sat.jCurve && st.year === 2) sj = 0.95;
      if (cls.id === "pe" && st.penaltyPe) sj *= 0.94;
      if (st.deferralPenalty && st.year >= 9) sj *= 0.85;
      if (st.concentrationPenalty === cls.id) sj *= 0.92;
      newS = Math.max(0, sv * sm * sj);
      if (cls.sat.income) yearInc += newS * cls.sat.incomeRate * rnd(0.8,1.1);
    }
    newPos[cls.id + "_core"] = newC;
    newPos[cls.id + "_sat"] = newS;
  });
  return { positions: newPos, income: yearInc };
}

function totalPortfolio(st) {
  let t = st.cash || 0;
  Object.values(st.positions).forEach(v => { t += v; });
  return t;
}
function coreTotal(st) {
  let t = 0; CLASSES.forEach(c => { t += st.positions[c.id + "_core"] || 0; }); return t;
}
function satTotal(st) {
  let t = 0; CLASSES.forEach(c => { t += st.positions[c.id + "_sat"] || 0; }); return t;
}

/* ── Decision tree ── */
function buildDecision(st) {
  /* Y2: Fund subscription window */
  if (st.year === 2) {
    const cv = coreTotal(st);
    if (cv <= 0) return null;
    const cost = Math.round(cv * 0.12);
    return {
      title: "Fund Subscription Window",
      body: `Your diversified funds are accepting additional capital this quarter. Deploying ${fmt(cost)} from your cash reserve increases your exposure and compounds your position through the current market cycle.`,
      options: [
        { id:"fund", label:`Deploy ${fmt(cost)}`, disabled: st.cash < cost, apply: s => {
          const ct = coreTotal(s); const newPos = {...s.positions};
          CLASSES.forEach(c => { const k=c.id+"_core"; if(newPos[k]>0) newPos[k] += cost*(newPos[k]/ct); });
          return {...s, cash:s.cash-cost, positions:newPos, subscriptionFunded:true, decisions:[...s.decisions, `Deployed ${fmt(cost)} into diversified funds (Y2)`]};
        }},
        { id:"decline", label:"Hold Cash", disabled:false, apply: s => ({...s, subscriptionFunded:false, decisions:[...s.decisions,"Held cash, passed on fund subscription (Y2)"]}) },
      ],
      lowCashNote: st.cash < cost ? `This requires ${fmt(cost)}. Your cash reserve holds ${fmt(st.cash)}.` : null,
    };
  }

  /* Y3: Direct investment — player chooses asset class */
  if (st.year === 3) {
    const eligible = CLASSES.map(c => ({cls:c, val:st.positions[c.id+"_core"]||0})).filter(x=>x.val>0);
    if (eligible.length === 0) return null;
    const minInvest = 75000;
    if (eligible.length === 1) {
      const target = eligible[0].cls;
      const lockup = target.sat.lockup;
      return {
        title: `${target.name} Direct Investment`,
        body: `A ${target.name.toLowerCase()} fund is raising capital for a new vintage. This is a direct investment with a ${lockup}-year lockup and higher return potential than your diversified fund position. The minimum commitment is ${fmt(minInvest)}.`,
        options: st.cash >= minInvest ? [
          { id:"invest", label:`Invest ${fmt(minInvest)}`, disabled:false, apply: s => {
            const newPos = {...s.positions};
            newPos[target.id+"_sat"] = (newPos[target.id+"_sat"]||0) + minInvest;
            return {...s, cash:s.cash-minInvest, positions:newPos, firstSatellite:target.id, decisions:[...s.decisions, `Invested ${fmt(minInvest)} in ${target.name} direct deal (Y3)`]};
          }},
          { id:"pass", label:"Stay in Diversified Funds", disabled:false, apply: s => ({...s, firstSatellite:null, decisions:[...s.decisions, "Stayed in diversified funds (Y3)"]}) },
        ] : [
          { id:"cant", label:"Pass (Insufficient Cash)", disabled:false, apply: s => ({...s, firstSatellite:null, decisions:[...s.decisions, "Insufficient cash for direct deal (Y3)"]}) },
        ],
        lowCashNote: st.cash < minInvest ? `This requires ${fmt(minInvest)}. Your cash reserve holds ${fmt(st.cash)}.` : null,
      };
    }
    return {
      title: "Direct Investment Opportunity",
      body: `Several funds are raising capital for new vintages. Each offers a direct investment with a multi-year lockup and higher return potential than your diversified position. The minimum commitment is ${fmt(minInvest)}. Choose which asset class to go direct in, or stay diversified.`,
      options: [
        ...eligible.map(({cls}) => ({
          id:`invest_${cls.id}`, label:`${cls.short} Direct (${cls.sat.lockup}yr)`,
          disabled: st.cash < minInvest,
          apply: s => {
            const newPos = {...s.positions};
            newPos[cls.id+"_sat"] = (newPos[cls.id+"_sat"]||0) + minInvest;
            return {...s, cash:s.cash-minInvest, positions:newPos, firstSatellite:cls.id, decisions:[...s.decisions, `Invested ${fmt(minInvest)} in ${cls.name} direct deal (Y3)`]};
          }
        })),
        { id:"pass", label:"Stay Diversified", disabled:false, apply: s => ({...s, firstSatellite:null, decisions:[...s.decisions, "Stayed in diversified funds (Y3)"]}) },
      ],
      lowCashNote: st.cash < minInvest ? `This requires ${fmt(minInvest)}. Your cash reserve holds ${fmt(st.cash)}.` : null,
    };
  }

  /* Y4: Co-investment (only if player took Y3 direct deal) */
  if (st.year === 4 && st.firstSatellite) {
    const available = CLASSES.filter(c => c.id !== st.firstSatellite && (st.positions[c.id+"_core"]||0) > 0);
    if (available.length === 0) return null;
    const target = available[0];
    const cost = 50000;
    return {
      title: "Co-Investment Opportunity",
      body: `A ${target.name.toLowerCase()} manager is offering a co-investment alongside their flagship fund. Minimum: ${fmt(cost)}. Co-investments carry lower fees but concentrate your exposure in a single deal.`,
      options: st.cash >= cost ? [
        { id:"coinvest", label:`Co-invest ${fmt(cost)}`, disabled:false, apply: s => {
          const newPos = {...s.positions};
          newPos[target.id+"_sat"] = (newPos[target.id+"_sat"]||0) + cost;
          return {...s, cash:s.cash-cost, positions:newPos, decisions:[...s.decisions, `Co-invested ${fmt(cost)} in ${target.name} deal (Y4)`]};
        }},
        { id:"pass", label:"Decline", disabled:false, apply: s => ({...s, decisions:[...s.decisions, `Declined ${target.name} co-investment (Y4)`]}) },
      ] : [
        { id:"cant", label:"Decline (Insufficient Cash)", disabled:false, apply: s => ({...s, decisions:[...s.decisions, `Insufficient cash for co-investment (Y4)`]}) },
      ],
      lowCashNote: st.cash < cost ? `Requires ${fmt(cost)}. Cash reserve: ${fmt(st.cash)}.` : null,
    };
  }

  /* Y5: Portfolio-dependent branches + secondary exit */
  if (st.year === 5) {
    const satPositions = CLASSES.map(c => ({cls:c, val:st.positions[c.id+"_sat"]||0})).filter(x=>x.val>0).sort((a,b)=>b.val-a.val);
    if (satPositions.length === 0) {
      const largest = CLASSES.map(c=>({cls:c,val:st.positions[c.id+"_core"]||0})).filter(x=>x.val>0).sort((a,b)=>b.val-a.val);
      if (largest.length === 0) return null;
      const target = largest[0].cls;
      const cost = 60000;
      return {
        title: `${target.name} Direct Opportunity`,
        body: `A ${target.name.toLowerCase()} fund is raising capital at favorable terms. Minimum: ${fmt(cost)}. This would be your first direct investment, moving beyond your diversified fund allocation.`,
        options: st.cash >= cost ? [
          { id:"invest", label:`Invest ${fmt(cost)}`, disabled:false, apply: s => {
            const newPos = {...s.positions};
            newPos[target.id+"_sat"] = (newPos[target.id+"_sat"]||0) + cost;
            return {...s, cash:s.cash-cost, positions:newPos, decisions:[...s.decisions, `Invested ${fmt(cost)} in ${target.name} direct deal (Y5)`]};
          }},
          { id:"pass", label:"Pass", disabled:false, apply: s => ({...s, decisions:[...s.decisions, `Passed on ${target.name} direct deal (Y5)`]}) },
        ] : [
          { id:"cant", label:"Pass (Insufficient Cash)", disabled:false, apply: s => ({...s, decisions:[...s.decisions, `Insufficient cash for ${target.name} deal (Y5)`]}) },
        ],
        lowCashNote: st.cash < cost ? `Requires ${fmt(cost)}. Cash reserve: ${fmt(st.cash)}.` : null,
      };
    }
    const top = satPositions[0];
    const currentEnv = st.envs[st.year - 1];
    if (top.cls.id === "vc" && currentEnv && currentEnv.id === "tech_surge") {
      const premium = Math.round(top.val * 1.25);
      return {
        title: "Premium Exit Offer",
        body: `The tech rally has inflated your Venture Capital direct position. A buyer is offering ${fmt(premium)}, a 25% premium to estimated value. This is rare in private markets. Selling locks in gains but removes your exposure to further upside.`,
        options: [
          { id:"sell", label:`Sell for ${fmt(premium)}`, disabled:false, apply: s => {
            const newPos = {...s.positions}; newPos["vc_sat"] = 0;
            return {...s, cash:s.cash+premium, positions:newPos, earlyExitSold:true, premiumExit:true, decisions:[...s.decisions, `Sold VC direct position at 25% premium for ${fmt(premium)} (Y5)`]};
          }},
          { id:"hold", label:"Hold for More Upside", disabled:false, apply: s => ({...s, earlyExitSold:false, premiumExit:false, decisions:[...s.decisions, "Held VC direct position through premium offer (Y5)"]}) },
        ],
      };
    }
    if (top.cls.id === "re" && currentEnv && currentEnv.id === "rate_hike") {
      const distressedPrice = Math.round(top.val * 0.70);
      return {
        title: "Distressed Exit Pressure",
        body: `Rising rates have compressed your Real Estate direct position's valuation. A buyer is offering ${fmt(distressedPrice)}, a 30% discount to your entry basis. Holding exposes you to further rate increases, but selling crystallizes the loss.`,
        options: [
          { id:"sell", label:`Sell for ${fmt(distressedPrice)}`, disabled:false, apply: s => {
            const newPos = {...s.positions}; newPos["re_sat"] = 0;
            return {...s, cash:s.cash+distressedPrice, positions:newPos, earlyExitSold:true, decisions:[...s.decisions, `Sold RE direct position at 30% discount for ${fmt(distressedPrice)} (Y5)`]};
          }},
          { id:"hold", label:"Hold Through the Cycle", disabled:false, apply: s => ({...s, earlyExitSold:false, decisions:[...s.decisions, "Held RE direct position through rate pressure (Y5)"]}) },
        ],
      };
    }
    const disc = top.cls.id === "vc" ? 0.75 : 0.80;
    const proceeds = Math.round(top.val * disc);
    return {
      title: "Secondary Market Offer",
      body: `A buyer wants your ${top.cls.name} direct position at ${fmt(proceeds)}, a ${Math.round((1-disc)*100)}% discount to estimated value. Selling returns capital to your cash reserve. Holding maintains exposure as the position approaches its primary value-creation window.`,
      options: [
        { id:"sell", label:`Sell for ${fmt(proceeds)}`, disabled:false, apply: s => {
          const newPos = {...s.positions}; newPos[top.cls.id+"_sat"] = 0;
          return {...s, cash:s.cash+proceeds, positions:newPos, earlyExitSold:true, decisions:[...s.decisions, `Sold ${top.cls.name} direct position for ${fmt(proceeds)} (Y5)`]};
        }},
        { id:"hold", label:"Hold Position", disabled:false, apply: s => ({...s, earlyExitSold:false, decisions:[...s.decisions, `Held ${top.cls.name} direct position through offer (Y5)`]}) },
      ],
    };
  }

  /* Y6: Two possible events — forced liquidation (no cash) OR concentration warning */
  if (st.year === 6) {
    /* Forced liquidation takes priority */
    if (st.cash < 5000) {
      const corePositions = CLASSES.map(c => ({id:c.id+"_core", cls:c, val:st.positions[c.id+"_core"]||0})).filter(x=>x.val>0).sort((a,b)=>a.val-b.val);
      if (corePositions.length > 0) {
        const sellTarget = corePositions[0];
        const callAmt = 40000;
        const discount = 0.15;
        const sellAmt = Math.min(sellTarget.val, Math.round(callAmt / (1 - discount)));
        const proceeds = Math.round(sellAmt * (1 - discount));
        return {
          title: "Capital Call Due",
          body: `A commitment from your fund subscriptions requires a ${fmt(callAmt)} capital call, and your cash reserve is effectively empty. You must sell part of your ${sellTarget.cls.name} diversified position at a 15% discount on the secondary market to meet the obligation. This is the cost of running without a liquidity buffer.`,
          options: [
            { id:"force_sell", label:`Forced Sale: ${fmt(proceeds)} net`, disabled:false, apply: s => {
              const newPos = {...s.positions};
              newPos[sellTarget.id] = Math.max(0, (newPos[sellTarget.id]||0) - sellAmt);
              return {...s, cash: s.cash + proceeds - callAmt, positions:newPos, forcedLiquidation:true,
                decisions:[...s.decisions, `Forced to sell ${sellTarget.cls.name} position at 15% discount to meet ${fmt(callAmt)} capital call (Y6)`]};
            }},
          ],
          lowCashNote: `Your cash reserve is ${fmt(st.cash)}. With no liquidity buffer, you have no choice but to sell at a discount.`,
        };
      }
    }
    /* Concentration check */
    const portVal = totalPortfolio(st) - (st.cash || 0);
    if (portVal > 0) {
      const classTotals = CLASSES.map(c => ({
        cls: c, total: (st.positions[c.id+"_core"]||0) + (st.positions[c.id+"_sat"]||0),
      })).sort((a,b) => b.total - a.total);
      const top = classTotals[0];
      const pct = top.total / portVal;
      if (pct > 0.55) {
        const rebalAmt = Math.round((st.positions[top.cls.id+"_core"]||0) * 0.25);
        const second = classTotals.find(c => c.cls.id !== top.cls.id && c.total > 0);
        if (second && rebalAmt >= 5000) {
          return {
            title: "Concentration Warning",
            body: `${top.cls.name} represents ${Math.round(pct*100)}% of your invested capital. Concentrated portfolios amplify both gains and losses. You can rebalance ${fmt(rebalAmt)} from ${top.cls.name} into ${second.cls.name}, or accept the concentration risk. Accepting will apply an ongoing performance drag from reduced diversification.`,
            options: [
              { id:"rebalance", label:`Rebalance ${fmt(rebalAmt)}`, disabled:false, apply: s => {
                const newPos = {...s.positions};
                newPos[top.cls.id+"_core"] = Math.max(0, (newPos[top.cls.id+"_core"]||0) - rebalAmt);
                newPos[second.cls.id+"_core"] = (newPos[second.cls.id+"_core"]||0) + rebalAmt;
                return {...s, positions:newPos, decisions:[...s.decisions, `Rebalanced ${fmt(rebalAmt)} from ${top.cls.short} to ${second.cls.short} (Y6)`]};
              }},
              { id:"hold", label:"Accept Concentration", disabled:false, apply: s => ({...s, concentrationPenalty: top.cls.id, decisions:[...s.decisions, `Accepted ${top.cls.name} concentration at ${Math.round(pct*100)}% (Y6)`]}) },
            ],
          };
        }
      }
    }
  }

  /* Y7: Distribution redeployment — income has been flowing to cash; player can redeploy into funds */
  if (st.year === 7 && st.totalIncome > 5000) {
    const inc = Math.round(st.totalIncome);
    return {
      title: "Redeploy Distributions",
      body: `Over the past several years, your income-producing positions have distributed ${fmt(inc)} into your cash reserve. You can redeploy that capital into your diversified fund positions to compound growth, or keep it as liquidity for future commitments.`,
      options: [
        { id:"reinvest", label:"Redeploy into Funds", disabled:false, apply: s => {
          const ct = coreTotal(s); const newPos = {...s.positions};
          const deployAmt = Math.min(s.totalIncome, s.cash);
          if (ct > 0) { CLASSES.forEach(c => { const k=c.id+"_core"; if(newPos[k]>0) newPos[k]+=deployAmt*(newPos[k]/ct); }); }
          else { newPos["pc_core"] = (newPos["pc_core"]||0) + deployAmt; }
          return {...s, cash:s.cash-deployAmt, positions:newPos, totalIncome:0, incomeReinvested:true, decisions:[...s.decisions, `Redeployed ${fmt(deployAmt)} of accumulated distributions into diversified funds (Y7)`]};
        }},
        { id:"cash", label:"Keep as Liquidity", disabled:false, apply: s => ({...s, totalIncome:0, incomeReinvested:false, decisions:[...s.decisions, `Kept ${fmt(inc)} in distributions as cash reserve (Y7)`]}) },
      ],
    };
  }

  /* Y8 (reinvested path): Liquidity crunch */
  if (st.year === 8 && st.incomeReinvested === true) {
    const allPos = [...CLASSES.map(c=>({id:c.id+"_core",cls:c,val:st.positions[c.id+"_core"]||0,type:"diversified"})),...CLASSES.map(c=>({id:c.id+"_sat",cls:c,val:st.positions[c.id+"_sat"]||0,type:"direct"}))].filter(x=>x.val>0).sort((a,b)=>a.val-b.val);
    const sellTarget = allPos[0];
    if (!sellTarget) return null;
    const proceeds = Math.round(sellTarget.val * 0.80);
    const label = `${sellTarget.cls.name} ${sellTarget.type} position`;
    return {
      title: "Liquidity Crunch",
      body: `A commitment is due and your cash reserve is thin after reinvesting distributions. You can sell your ${label} on the secondary market at a 20% discount for ${fmt(proceeds)}, or request a deferral that may reduce your priority in future distributions.`,
      options: [
        { id:"sell", label:`Sell for ${fmt(proceeds)}`, disabled:false, apply: s => {
          const newPos = {...s.positions}; newPos[sellTarget.id] = 0;
          return {...s, cash:s.cash+proceeds, positions:newPos, decisions:[...s.decisions, `Sold ${label} at 20% discount for ${fmt(proceeds)} (Y8)`]};
        }},
        { id:"defer", label:"Request Deferral", disabled:false, apply: s => ({...s, deferralPenalty:true, decisions:[...s.decisions,"Requested deferral, reduced distribution priority (Y8)"]}) },
      ],
    };
  }

  /* Y8 (cash path): New fund vintage */
  if (st.year === 8 && st.incomeReinvested === false) {
    const cost = 60000;
    const sorted = CLASSES.map(c => ({cls:c, total:(st.positions[c.id+"_core"]||0)+(st.positions[c.id+"_sat"]||0)})).sort((a,b)=>a.total-b.total);
    const target = sorted[0].cls;
    return {
      title: "New Fund Vintage",
      body: `A top-quartile ${target.name.toLowerCase()} manager is raising a new fund with favorable early-commitment terms. With ${fmt(st.cash)} in cash reserves, you can commit ${fmt(cost)}. This adds a direct position and reduces your liquidity.`,
      options: st.cash >= cost ? [
        { id:"commit", label:`Commit ${fmt(cost)}`, disabled:false, apply: s => {
          const newPos = {...s.positions}; newPos[target.id+"_sat"] = (newPos[target.id+"_sat"]||0) + cost;
          return {...s, cash:s.cash-cost, positions:newPos, decisions:[...s.decisions, `Committed ${fmt(cost)} to ${target.name} fund vintage (Y8)`]};
        }},
        { id:"pass", label:"Pass", disabled:false, apply: s => ({...s, decisions:[...s.decisions,"Passed on new fund vintage (Y8)"]}) },
      ] : [
        { id:"cant", label:"Pass (Insufficient Cash)", disabled:false, apply: s => ({...s, decisions:[...s.decisions,"Insufficient cash for new fund vintage (Y8)"]}) },
      ],
      lowCashNote: st.cash < cost ? `Requires ${fmt(cost)}. Cash reserve: ${fmt(st.cash)}.` : null,
    };
  }

  /* Y9: Rebalance */
  if (st.year === 9) {
    const classTotals = CLASSES.map(c => ({cls:c, total:(st.positions[c.id+"_core"]||0)+(st.positions[c.id+"_sat"]||0)})).filter(x=>x.total>0);
    const portTotal = classTotals.reduce((a,b)=>a+b.total,0);
    if (portTotal <= 0) return null;
    const sorted = classTotals.sort((a,b)=>b.total-a.total);
    const top = sorted[0]; const bottom = sorted[sorted.length-1];
    if (top.cls.id === bottom.cls.id) return null;
    const moveAmt = Math.round((st.positions[top.cls.id+"_core"]||0) * 0.2);
    if (moveAmt < 5000) return null;
    return {
      title: "Rebalance Opportunity",
      body: `${top.cls.name} now represents ${Math.round(top.total/portTotal*100)}% of your portfolio. You can move ${fmt(moveAmt)} from your ${top.cls.name} diversified position into ${bottom.cls.name} to reduce concentration.`,
      options: [
        { id:"rebalance", label:"Rebalance", disabled:false, apply: s => {
          const newPos = {...s.positions};
          newPos[top.cls.id+"_core"] = Math.max(0,(newPos[top.cls.id+"_core"]||0)-moveAmt);
          newPos[bottom.cls.id+"_core"] = (newPos[bottom.cls.id+"_core"]||0)+moveAmt;
          return {...s, positions:newPos, decisions:[...s.decisions, `Rebalanced ${fmt(moveAmt)} from ${top.cls.short} to ${bottom.cls.short} (Y9)`]};
        }},
        { id:"hold", label:"Keep Current Position", disabled:false, apply: s => ({...s, decisions:[...s.decisions,"Maintained current allocation (Y9)"]}) },
      ],
    };
  }
  return null;
}

/* Rich narrative */
function buildNarrative(st) {
  const parts = [];
  if (st.subscriptionFunded === true) parts.push("You deployed additional capital into your funds early, giving those positions more time to compound through subsequent market cycles.");
  else if (st.subscriptionFunded === false) parts.push("You held cash through the subscription window, preserving liquidity for later opportunities at the cost of early compounding.");
  if (st.firstSatellite) {
    const satVal = st.positions[st.firstSatellite + "_sat"] || 0;
    const satCls = CLASSES.find(c => c.id === st.firstSatellite);
    if (satVal > 0 && satCls) parts.push(`Your ${satCls.name} direct investment is now worth ${fmt(satVal)}, reflecting the concentrated risk and return profile of satellite positions.`);
    else if (satCls) parts.push(`You took a direct position in ${satCls.name} but exited before term, capturing partial value.`);
  }
  if (st.premiumExit) parts.push("You sold your VC position at a premium during the tech surge, converting momentum into liquidity.");
  if (st.forcedLiquidation) parts.push("Running without a cash reserve forced a liquidation at a discount when a capital call came due. That loss was the direct cost of full deployment.");
  if (st.concentrationPenalty) { const cls = CLASSES.find(c=>c.id===st.concentrationPenalty); if(cls) parts.push(`Accepting concentration in ${cls.name} applied an ongoing performance drag from reduced diversification in the final years.`); }
  if (st.earlyExitSold === true && !st.premiumExit) parts.push("Selling a position on the secondary market returned capital at a discount, trading future upside for immediate liquidity.");
  else if (st.earlyExitSold === false) parts.push("Holding through the secondary offer maintained your exposure through the position's primary value-creation period.");
  if (st.incomeReinvested === true) parts.push("Redeploying accumulated distributions from your cash reserve back into fund positions compounded your core holdings, though it reduced your liquidity buffer.");
  else if (st.incomeReinvested === false) parts.push("Keeping distributions in your cash reserve preserved your liquidity buffer, giving you flexibility for later commitments.");
  if (st.deferralPenalty) parts.push("The deferral you requested reduced your distribution priority in the final years, costing you income in the home stretch.");
  const incomeNames = CLASSES.filter(c => c.core.income || c.sat.income).filter(c => (st.positions[c.id+"_core"]||0) > 0 || (st.positions[c.id+"_sat"]||0) > 0).map(c => c.name);
  if (incomeNames.length > 0 && (st.cumulativeIncome||0) > 1000) parts.push(`Over ten years, your income-generating positions in ${incomeNames.join(" and ")} produced ${fmt(st.cumulativeIncome)} in total distributions.`);
  if (parts.length === 0) return null;
  return parts.join(" ");
}

/* Advance with transition data */
function advanceUntilDecision(initState) {
  let st = { ...initState };
  let summary = null;
  let decision = null;
  let transitions = [];
  while (st.year < 10) {
    const env = st.envs[st.year];
    const { positions: newPos, income } = simYear(st, env);
    const prevTotal = st.history[st.history.length - 1].totalPortfolio;
    /* Distributions flow directly to cash reserve each year */
    st = { ...st, year:st.year+1, positions:newPos, cash:st.cash+income, totalIncome:st.totalIncome+income, cumulativeIncome:(st.cumulativeIncome||0)+income, yearlyIncome:income };
    const tp = totalPortfolio(st);
    st.history = [...st.history, { year:st.year, positions:{...st.positions}, cash:st.cash, totalPortfolio:tp, env, yearlyIncome:income }];
    transitions.push({ year:st.year, env, prevTotal, newTotal:tp, change:((tp-prevTotal)/prevTotal)*100 });
    const d = buildDecision(st);
    if (d) { summary = { year:st.year, env, totalPortfolio:tp, prevTotal }; decision = d; break; }
  }
  return { state:st, summary, decision, transitions, done:st.year>=10&&!decision };
}

function calcResults(hist) {
  if (hist.length < 2) return null;
  const s = hist[0].totalPortfolio, e = hist[hist.length-1].totalPortfolio;
  const ret = (e-s)/s;
  const vals = hist.map(h=>h.totalPortfolio);
  let mdd=0, pk=vals[0];
  for(const v of vals){if(v>pk)pk=v; const d=(pk-v)/pk; if(d>mdd)mdd=d;}
  const years = hist.length - 1;
  const annualized = years > 0 ? (Math.pow(e/s, 1/years) - 1) * 100 : 0;
  return { totalReturn:(ret*100).toFixed(1), finalValue:e, maxDrawdown:(mdd*100).toFixed(1), annualized:annualized.toFixed(1) };
}

/* ── UI Primitives ── */
const Btn = ({children,primary,disabled,onClick,style:s})=>(
  <button onClick={onClick} disabled={disabled} style={{fontFamily:font,border:primary?"none":`1px solid ${B.ltTeal}`,borderRadius:6,padding:"13px 28px",fontSize:14,fontWeight:600,cursor:disabled?"not-allowed":"pointer",background:disabled?B.muted:primary?B.darkTeal:"transparent",color:disabled?"#ccc":primary?B.lime:B.teal,opacity:disabled?.5:1,transition:"all .15s",...s}}>{children}</button>
);
const Stat = ({label,value,sub,color})=>(
  <div style={{background:B.cream,borderRadius:8,padding:"14px 18px",flex:"1 1 130px",minWidth:120}}>
    <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.muted,marginBottom:3}}>{label}</div>
    <div style={{fontSize:22,fontWeight:500,color:color||B.teal}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:B.muted,marginTop:2}}>{sub}</div>}
  </div>
);
const AllocBar = ({positions,cash})=>{
  const items = [];
  CLASSES.forEach(c => { const cv=positions[c.id+"_core"]||0; const sv=positions[c.id+"_sat"]||0; if(cv>0) items.push({color:c.color,val:cv,opacity:0.5}); if(sv>0) items.push({color:c.color,val:sv,opacity:1}); });
  if(cash>0) items.push({color:B.muted,val:cash,opacity:0.3});
  const t = items.reduce((a,b)=>a+b.val,0);
  if(t<=0) return null;
  return(<div style={{display:"flex",borderRadius:5,overflow:"hidden",height:8,background:"#eee"}}>{items.map((it,i)=><div key={i} style={{width:`${(it.val/t)*100}%`,background:it.color,opacity:it.opacity,transition:"width .4s"}}/>)}</div>);
};
const PieChart = ({alloc, reserve})=>{
  const total=500000; const r=72,cx=90,cy=90,sw=36; const circ=2*Math.PI*r; let offset=0;
  const slices=CLASSES.map(a=>{const pct=(alloc[a.id]||0)/total;const dash=pct*circ;const gap=circ-dash;const o=offset;offset+=dash;return{...a,pct,dash,gap,offset:o};}).filter(s=>s.pct>0);
  const unPct=Math.max(0,reserve)/total; const unDash=unPct*circ;
  return(<div style={{display:"flex",alignItems:"center",gap:24,justifyContent:"center",marginBottom:12}}>
    <svg width={180} height={180} viewBox="0 0 180 180"><circle cx={cx} cy={cy} r={r} fill="none" stroke="#eaeaea" strokeWidth={sw}/>{slices.map(s=>(<circle key={s.id} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={sw} strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={-s.offset} transform={`rotate(-90 ${cx} ${cy})`} style={{transition:"all .4s"}}/>))}{unPct>0&&<circle cx={cx} cy={cy} r={r} fill="none" stroke={B.ltTeal} strokeWidth={sw} strokeDasharray={`${unDash} ${circ-unDash}`} strokeDashoffset={-offset} transform={`rotate(-90 ${cx} ${cy})`} style={{transition:"all .4s"}}/>}<text x={cx} y={cy-6} textAnchor="middle" fontSize={16} fontWeight={600} fill={B.darkTeal} fontFamily={font}>{fmt(total-Math.max(0,reserve))}</text><text x={cx} y={cy+12} textAnchor="middle" fontSize={11} fill={B.muted} fontFamily={font}>invested</text></svg>
    <div style={{display:"flex",flexDirection:"column",gap:5}}>{CLASSES.map(a=>{const pct=((alloc[a.id]/total)*100).toFixed(0);return alloc[a.id]>0?(<div key={a.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:B.body}}><span style={{width:10,height:10,borderRadius:2,background:a.color,display:"inline-block",flexShrink:0}}/><span style={{fontWeight:600,minWidth:30}}>{a.short}</span><span style={{color:B.muted}}>{pct}%</span></div>):null;})}{reserve>0&&<div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:B.body}}><span style={{width:10,height:10,borderRadius:2,background:B.ltTeal,display:"inline-block",flexShrink:0}}/><span style={{fontWeight:600,minWidth:30}}>Cash</span><span style={{color:B.muted}}>{((reserve/total)*100).toFixed(0)}%</span></div>}</div>
  </div>);
};
const Chart = ({history})=>{
  if(history.length<2) return null;
  /* Generate quarterly points between yearly data for a more realistic curve */
  const qPoints = [];
  for (let i = 0; i < history.length; i++) {
    const val = history[i].totalPortfolio;
    qPoints.push(val);
    if (i < history.length - 1) {
      const next = history[i+1].totalPortfolio;
      const diff = next - val;
      /* 3 intermediate quarterly points with realistic noise */
      for (let q = 1; q <= 3; q++) {
        const base = val + (diff * q / 4);
        /* Noise: up to 1.5% of portfolio value, with momentum bias toward the trend */
        const trendBias = diff > 0 ? 0.003 : -0.003;
        const noise = base * (trendBias + (Math.random() - 0.5) * 0.03);
        qPoints.push(base + noise);
      }
    }
  }
  const w=640, h=180, pad={t:14,r:14,b:26,l:54};
  const cw=w-pad.l-pad.r, ch=h-pad.t-pad.b;
  const mn=Math.min(...qPoints)*.97, mx=Math.max(...qPoints)*1.03;
  const range=mx-mn||1;
  const pts=qPoints.map((v,i)=>({x:pad.l+(i/(qPoints.length-1))*cw, y:pad.t+ch-((v-mn)/range)*ch}));
  /* Smooth the path with cubic bezier for a more natural look */
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i-1];
    const curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  const area = d + ` L ${pts[pts.length-1].x} ${pad.t+ch} L ${pad.l} ${pad.t+ch} Z`;
  /* Only label the yearly marks, not quarterly */
  const yearIndices = history.map((_, i) => i * 4); /* every 4th point is a year boundary */
  return(<svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{display:"block"}}>
    {[0,.5,1].map((p,i)=>{const y=pad.t+ch*(1-p);return(<g key={i}><line x1={pad.l} x2={w-pad.r} y1={y} y2={y} stroke="#eaeaea" strokeDasharray={i===1?"4,4":"none"}/><text x={pad.l-5} y={y+3} textAnchor="end" fontSize={9} fill={B.muted}>{fmt(mn+range*p)}</text></g>);})}
    <path d={area} fill={B.teal} opacity={.06}/>
    <path d={d} fill="none" stroke={B.teal} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    {yearIndices.map((qi, i) => {
      if (qi >= pts.length) return null;
      const p = pts[qi];
      return <circle key={i} cx={p.x} cy={p.y} r={i===history.length-1?4:2.5} fill={B.teal} stroke={B.white} strokeWidth={1.5}/>;
    })}
    {history.map((x,i)=>{
      const qi = i * 4;
      if (qi >= pts.length) return null;
      return <text key={i} x={pts[qi].x} y={pad.t+ch+16} textAnchor="middle" fontSize={9} fill={B.muted}>{i===0?"Start":`Y${x.year}`}</text>;
    })}
  </svg>);
};
const RiskReturnChart = ({highlighted, realized})=>{
  const w=320,h=180,pad={t:20,r:20,b:36,l:44}; const cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;
  return(<svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{display:"block"}}><rect x={0} y={0} width={w} height={h} rx={6} fill={B.white}/>{[0,.5,1].map((p,i)=>{const y=pad.t+ch*(1-p);return(<g key={i}><line x1={pad.l} x2={w-pad.r} y1={y} y2={y} stroke={B.ltTeal} strokeWidth={.5}/><text x={pad.l-6} y={y+4} textAnchor="end" fontSize={10} fill={B.muted}>{Math.round(p*25)}%</text></g>);})}{[0,.5,1].map((p,i)=>{const x=pad.l+cw*p;return(<g key={i}><line x1={x} x2={x} y1={pad.t} y2={pad.t+ch} stroke={B.ltTeal} strokeWidth={.5}/><text x={x} y={pad.t+ch+14} textAnchor="middle" fontSize={10} fill={B.muted}>{["Low","Med","High"][i]}</text></g>);})}<text x={pad.l+cw/2} y={h-4} textAnchor="middle" fontSize={10} fill={B.muted}>Volatility</text><text x={10} y={pad.t+ch/2} textAnchor="middle" fontSize={10} fill={B.muted} transform={`rotate(-90,10,${pad.t+ch/2})`}>Return</text>{CLASSES.map(c=>{const isHl=c.id===highlighted;const cx1=pad.l+(c.core.vol/0.40)*cw,cy1=pad.t+(1-c.core.ret/0.25)*ch;const cx2=pad.l+(c.sat.vol/0.40)*cw,cy2=pad.t+(1-c.sat.ret/0.25)*ch;const r=realized?.[c.id];const rx=r!=null?pad.l+(c.core.vol/0.40)*cw:null;const ry=r!=null?pad.t+(1-Math.min(Math.max(r,0),0.25)/0.25)*ch:null;return(<g key={c.id}><circle cx={cx1} cy={cy1} r={isHl?6:4} fill={c.color} opacity={isHl?0.5:0.15}/><circle cx={cx2} cy={cy2} r={isHl?6:4} fill={c.color} opacity={isHl?1:0.25} stroke={isHl?B.darkTeal:"none"} strokeWidth={1}/>{isHl&&<line x1={cx1} y1={cy1} x2={cx2} y2={cy2} stroke={c.color} strokeWidth={1} strokeDasharray="2,2" opacity={0.4}/>}{r!=null&&rx!=null&&<circle cx={rx} cy={ry} r={5} fill="none" stroke={c.color} strokeWidth={2} strokeDasharray="3,2"/>}<text x={cx2} y={cy2-10} textAnchor="middle" fontSize={10} fontWeight={isHl?600:400} fill={isHl?B.darkTeal:B.muted}>{c.short}</text></g>);})}</svg>);
};
const AssetDetail = ({cls})=>(<div style={{background:B.cream,borderRadius:8,padding:"16px 18px",marginTop:8,marginBottom:4}}><div style={{maxWidth:320,marginBottom:14}}><RiskReturnChart highlighted={cls.id}/></div><div style={{fontSize:10,color:B.muted,marginBottom:8}}>Faded dot = diversified fund. Solid dot = direct investment.</div><div style={{fontSize:13,color:B.body,lineHeight:1.6,marginBottom:10}}>{cls.edu}</div><div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:8}}>{cls.traits.map((t,i)=>(<div key={i} style={{fontSize:11,color:B.teal,display:"flex",alignItems:"baseline",gap:6}}><span style={{width:4,height:4,borderRadius:1,background:cls.color,flexShrink:0,marginTop:4}}/><span>{t}</span></div>))}</div></div>);
const EventTag = ({env})=>{const neg=["recession","credit_crunch","inflation"].includes(env.id);const pos=["boom","tech_surge","rate_cut"].includes(env.id);return(<span style={{display:"inline-block",padding:"5px 12px",borderRadius:5,fontSize:12,fontWeight:500,background:neg?"#fdf0ed":pos?"#edfaf2":B.gray,color:neg?B.red:pos?B.green:B.body,marginRight:6,marginBottom:6}}>{env.label}</span>);};

/* Environment explainer */
const EnvExplainer = ({env})=>{
  const [open, setOpen] = useState(false);
  if (!env || !env.explainer) return null;
  return(<div style={{marginBottom:16}}><div style={{background:B.cream,borderRadius:8,padding:"12px 16px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><EventTag env={env}/><span style={{fontSize:11,color:B.teal,cursor:"pointer",fontWeight:500}} onClick={()=>setOpen(!open)}>{open?"Hide":"Why it matters"}</span></div>{open&&<div style={{fontSize:13,color:B.body,lineHeight:1.6,marginTop:10,paddingTop:10,borderTop:`1px solid ${B.ltTeal}`}}>{env.explainer}</div>}</div></div>);
};

/* Income tracker */
const IncomeTracker = ({gs})=>{
  const cumInc = gs.cumulativeIncome || 0;
  if (cumInc < 100) return null;
  const incomeByClass = CLASSES.filter(c => c.core.income || c.sat.income).map(c => {
    const coreVal = gs.positions[c.id+"_core"] || 0; const satVal = gs.positions[c.id+"_sat"] || 0;
    return { cls: c, estimated: (c.core.income ? coreVal * c.core.incomeRate : 0) + (c.sat.income ? satVal * c.sat.incomeRate : 0) };
  }).filter(x => x.estimated > 100);
  return(<div style={{background:B.cream,borderRadius:8,padding:"12px 16px",marginBottom:12}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.muted}}>Distributions to Cash</div><div style={{fontSize:10,color:B.muted}}>Total received: {fmt(cumInc)}</div></div>
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>{incomeByClass.map(x=>(<div key={x.cls.id} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:B.body}}><span style={{width:8,height:8,borderRadius:2,background:x.cls.color,display:"inline-block",flexShrink:0}}/><span style={{fontWeight:500}}>{x.cls.short}</span><span style={{color:B.muted}}>~{fmt(x.estimated)}/yr</span></div>))}</div>
    {incomeByClass.length===0&&<div style={{fontSize:12,color:B.muted}}>No income-producing positions. PE and VC generate returns through capital appreciation, not regular distributions.</div>}
  </div>);
};

/* Year transition scene */
const YearTransition = ({transitions, onComplete}) => {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (idx >= transitions.length) { onComplete(); return; }
    setVisible(true);
    const t = setTimeout(() => { setVisible(false); setTimeout(() => setIdx(i => i + 1), 300); }, 1400);
    return () => clearTimeout(t);
  }, [idx, transitions.length, onComplete]);
  if (idx >= transitions.length) return null;
  const tr = transitions[idx];
  const neg = ["recession","credit_crunch","inflation"].includes(tr.env?.id);
  const pos = ["boom","tech_surge","rate_cut"].includes(tr.env?.id);
  const borderColor = neg ? B.red : pos ? B.green : B.teal;
  return (<div style={{position:"fixed",inset:0,background:"rgba(0,46,48,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20,backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)"}}>
    <div style={{background:B.white,borderRadius:14,padding:"32px 36px",maxWidth:400,width:"100%",textAlign:"center",borderTop:`4px solid ${borderColor}`,boxShadow:"0 12px 48px rgba(0,0,0,0.2)",opacity:visible?1:0,transform:visible?"translateY(0) scale(1)":"translateY(-10px) scale(0.97)",transition:"opacity 0.3s, transform 0.3s"}}>
      <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".18em",color:B.muted,marginBottom:6}}>YEAR {tr.year}</div>
      <div style={{fontSize:20,fontWeight:500,color:B.darkTeal,marginBottom:8}}>{tr.env?.label||"Market Update"}</div>
      <div style={{fontSize:13,color:B.body,lineHeight:1.55,marginBottom:16}}>{tr.env?.narrative}</div>
      <div style={{display:"flex",justifyContent:"center",gap:24}}>
        <div><div style={{fontSize:10,color:B.muted,textTransform:"uppercase",letterSpacing:".1em"}}>Portfolio</div><div style={{fontSize:20,fontWeight:500,color:B.teal}}>{fmt(tr.newTotal)}</div></div>
        <div><div style={{fontSize:10,color:B.muted,textTransform:"uppercase",letterSpacing:".1em"}}>This Year</div><div style={{fontSize:20,fontWeight:500,color:tr.change>=0?B.green:B.red}}>{pctFmt(tr.change)}</div></div>
      </div>
    </div>
  </div>);
};

/* Framework Reveal — v5-style single step (Willow brand + products immediately) */
const FrameworkReveal = ({positions, cash})=>{
  const cv=coreTotal({positions}); const sv=satTotal({positions}); const total=cv+sv+cash;
  if (total<=0) return null;
  const cPct=Math.round(cv/total*100), sPct=Math.round(sv/total*100), lPct=Math.round(cash/total*100);
  return(<div style={{background:B.cream,borderRadius:10,padding:"24px 20px",marginBottom:20,borderTop:`3px solid ${B.teal}`}}>
    <div style={{fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:".2em",color:B.teal,marginBottom:4}}>WILLOW WEALTH</div>
    <div style={{fontSize:18,fontWeight:500,color:B.darkTeal,lineHeight:1.3,marginBottom:6}}>Your portfolio, mapped to a real investment framework.</div>
    <div style={{fontSize:14,color:B.body,lineHeight:1.5,marginBottom:16}}>The decisions you made built a portfolio across three categories. Here is how each one maps to products on the Willow Wealth platform.</div>
    <div style={{display:"flex",borderRadius:6,overflow:"hidden",height:28,marginBottom:16}}>
      {cPct>0&&<div style={{width:`${cPct}%`,background:B.green,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:11,fontWeight:600,color:B.white}}>{cPct}%</span></div>}
      {sPct>0&&<div style={{width:`${sPct}%`,background:"#d4820a",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:11,fontWeight:600,color:B.white}}>{sPct}%</span></div>}
      {lPct>0&&<div style={{width:`${lPct}%`,background:B.muted,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:11,fontWeight:600,color:B.white}}>{lPct}%</span></div>}
    </div>
    {[
      {label:"Core",pct:cPct,color:B.green,desc:"Evergreen funds from Goldman Sachs, Carlyle, and StepStone. Diversified exposure with daily NAV and quarterly liquidity.",val:cv},
      {label:"Satellite",pct:sPct,color:"#d4820a",desc:"Direct investments via the Willow marketplace. Higher return potential with lockups and concentrated risk.",val:sv},
      {label:"Liquidity",pct:lPct,color:B.muted,desc:"Your cash earned nothing during the simulation. On Willow, Short Term Notes earn yield on idle capital while preserving access.",val:cash},
    ].map(b=>(<div key={b.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${B.ltTeal}`}}><div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}><span style={{width:8,height:8,borderRadius:2,background:b.color,display:"inline-block"}}/><span style={{fontWeight:600,fontSize:13,color:B.darkTeal}}>{b.label}</span></div><div style={{fontSize:11,color:B.muted,marginLeft:16,maxWidth:340}}>{b.desc}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:600,color:B.teal}}>{fmt(b.val)}</div><div style={{fontSize:11,color:B.muted}}>{b.pct}%</div></div></div>))}
    <div style={{marginTop:16,textAlign:"center"}}><div style={{display:"inline-block",padding:"14px 36px",borderRadius:6,background:B.darkTeal,color:B.lime,fontWeight:600,fontSize:14,cursor:"pointer",letterSpacing:".02em"}}>Build this portfolio on Willow Wealth</div></div>
  </div>);
};

/* ── App ── */
export default function App() {
  const [phase, setPhase] = useState("intro");
  const [alloc, setAlloc] = useState({pe:0, re:0, pc:0, vc:0});
  const gsRef = useRef(null);
  const [gs, setGs] = useState(null);
  const [decision, setDecision] = useState(null);
  const [summary, setSummary] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [expandedAsset, setExpandedAsset] = useState(null);
  const [transitions, setTransitions] = useState(null);

  const totalAlloc = Object.values(alloc).reduce((a,b)=>a+b,0);
  const over = totalAlloc > 500000;
  const reserve = 500000 - totalAlloc;

  const handleFreeSlider = useCallback((id, val) => { setAlloc(prev => ({...prev, [id]: val})); }, []);

  const onTransitionComplete = useCallback(() => { setTransitions(null); }, []);

  function runAdvance(state) {
    const result = advanceUntilDecision(state);
    gsRef.current = result.state; setGs(result.state); setDecision(result.decision); setSummary(result.summary);
    if (result.transitions.length > 0) setTransitions(result.transitions);
    setPhase(result.done ? "results" : "play");
  }
  function startGame() {
    const envs = Array.from({length:10},()=>pickEnv());
    const initPos = {}; CLASSES.forEach(c => { initPos[c.id+"_core"]=alloc[c.id]||0; initPos[c.id+"_sat"]=0; });
    const cashStart = Math.max(0, reserve);
    const init = { year:0, positions:initPos, cash:cashStart, totalIncome:0, cumulativeIncome:0, yearlyIncome:0, envs,
      history:[{year:0, positions:{...initPos}, cash:cashStart, totalPortfolio:500000, env:null, yearlyIncome:0}],
      decisions:[], penaltyPe:false, deferralPenalty:false, forcedLiquidation:false, concentrationPenalty:null,
      subscriptionFunded:null, firstSatellite:null, earlyExitSold:null, incomeReinvested:null, premiumExit:false };
    runAdvance(init);
  }
  function handleChoice(opt) { if(opt.disabled) return; runAdvance(opt.apply(gsRef.current)); }
  function resetAll() { setPhase("intro"); setAlloc({pe:0,re:0,pc:0,vc:0}); gsRef.current=null; setGs(null); setDecision(null); setSummary(null); setShowConfirm(false); setExpandedAsset(null); setTransitions(null); }

  const results = phase==="results"&&gs ? calcResults(gs.history) : null;
  const realizedReturns = gs && gs.history.length > 1 ? (()=>{const r={};CLASSES.forEach(c=>{const sv=(gs.history[0].positions[c.id+"_core"]||0)+(gs.history[0].positions[c.id+"_sat"]||0);const ev=(gs.positions[c.id+"_core"]||0)+(gs.positions[c.id+"_sat"]||0);if(sv>10000){const yrs=gs.history.length-1;r[c.id]=Math.pow(ev/sv,1/yrs)-1;}});return r;})() : null;

  /* ── INTRO ── */
  if(phase==="intro") return(
    <div style={{fontFamily:font,background:B.white,minHeight:"100vh"}}>
      <div style={{background:B.darkTeal,padding:"56px 28px",textAlign:"center"}}>
        <h1 style={{color:B.white,fontSize:34,fontWeight:500,margin:"0 0 10px",lineHeight:1.2}}>Portfolio Architect</h1>
        <p style={{color:B.ltTeal,fontSize:15,maxWidth:460,margin:"0 auto 28px",lineHeight:1.6}}>Build a $500K private markets portfolio. Allocate across asset classes, navigate a decade of market conditions, and see how your decisions shape the outcome.</p>
        <Btn primary onClick={()=>setPhase("allocate")} style={{padding:"16px 52px",fontSize:16,borderRadius:8,boxShadow:"0 2px 12px rgba(0,0,0,.25)",letterSpacing:".04em"}}>Begin</Btn>
      </div>
      <div style={{maxWidth:540,margin:"0 auto",padding:"36px 24px"}}>
        {[{n:"01",t:"Allocate",d:"Spread your capital across four private markets asset classes. Any amount you leave unallocated is held as a cash reserve."},{n:"02",t:"Decide",d:"During the simulation, opportunities and obligations appear: fund subscriptions, direct investments, concentration warnings, secondary market offers, and liquidity crunches. Each choice reshapes your portfolio."},{n:"03",t:"Review",d:"After ten simulated years, see how your portfolio performed, what your decisions cost or gained you, and how results map to a real investment framework."}].map(s=>(
          <div key={s.n} style={{display:"flex",gap:14,marginBottom:20}}><div style={{fontWeight:600,fontSize:13,color:B.teal,minWidth:28,paddingTop:1}}>{s.n}</div><div><div style={{fontWeight:600,color:B.darkTeal,fontSize:14,marginBottom:3}}>{s.t}</div><div style={{color:B.body,fontSize:13,lineHeight:1.55}}>{s.d}</div></div></div>
        ))}
        <div style={{marginTop:24,padding:14,background:B.cream,borderRadius:8,fontSize:11,color:B.muted,lineHeight:1.5}}>Simulated performance for educational purposes only. Not indicative of actual results or future returns. All investments involve risk, including loss of principal.</div>
      </div>
    </div>
  );

  /* ── ALLOCATE ── */
  const rangeStyle = `input[type="range"]{-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;outline:none;background:#ddd}input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:18px;height:18px;border-radius:50%;cursor:pointer;background:var(--thumb-color,#014a4c);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)}input[type="range"]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;cursor:pointer;background:var(--thumb-color,#014a4c);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)}`;
  if(phase==="allocate") return(
    <div style={{fontFamily:font,background:B.white,minHeight:"100vh"}}>
      <style>{rangeStyle}</style>
      <div style={{background:B.darkTeal,padding:"20px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div><div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".18em",color:B.lime}}>STEP 1</div><div style={{color:B.white,fontSize:18,fontWeight:500,marginTop:3}}>Allocate $500K</div></div>
        <div style={{textAlign:"right"}}><div style={{fontSize:10,textTransform:"uppercase",letterSpacing:".1em",color:B.ltTeal}}>Cash Reserve</div><div style={{fontSize:20,fontWeight:500,color:reserve<0?"#ff6b6b":reserve>50000?B.mint:B.lime}}>{fmt(Math.max(0,reserve))}</div></div>
      </div>
      <div style={{maxWidth:560,margin:"0 auto",padding:"28px 24px"}}>
        <PieChart alloc={alloc} reserve={reserve}/>
        <div style={{background:B.ltTeal,borderRadius:8,padding:"10px 14px",fontSize:12,color:B.teal,marginBottom:16,lineHeight:1.5}}>Your capital enters through diversified funds managed by institutional managers. During the simulation, you will have opportunities to move capital into direct investments.</div>
        {CLASSES.map(a=>{
          const p=((alloc[a.id]/500000)*100).toFixed(0); const isOpen=expandedAsset===a.id;
          return(<div key={a.id} style={{marginBottom:14,borderBottom:`1px solid ${B.ltTeal}`,paddingBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
              <div style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}} onClick={()=>setExpandedAsset(isOpen?null:a.id)}><span style={{width:10,height:10,borderRadius:2,background:a.color,display:"inline-block",flexShrink:0}}/><span style={{fontWeight:600,color:B.darkTeal,fontSize:13}}>{a.name}</span><span style={{fontSize:10,color:B.teal,fontWeight:500,marginLeft:2}}>{isOpen?"\u25B2":"\u25BC"}</span></div>
              <div><span style={{fontWeight:600,color:B.teal,fontSize:14}}>{fmt(alloc[a.id])}</span><span style={{color:B.muted,fontSize:11,marginLeft:5}}>{p}%</span></div>
            </div>
            <input type="range" min={0} max={500000} step={10000} value={alloc[a.id]} onChange={e=>handleFreeSlider(a.id,parseInt(e.target.value))} style={{width:"100%","--thumb-color":a.color,background:`linear-gradient(to right, ${a.color} ${(alloc[a.id]/500000)*100}%, #ddd ${(alloc[a.id]/500000)*100}%)`}}/>
            {!isOpen&&<div style={{fontSize:11,color:B.muted,marginTop:1,lineHeight:1.4}}>{a.desc} <span style={{color:B.teal,cursor:"pointer",fontWeight:500}} onClick={()=>setExpandedAsset(a.id)}>Learn more</span></div>}
            {isOpen&&<AssetDetail cls={a}/>}
          </div>);
        })}
        {reserve===0&&(<div style={{background:"#fdf0ed",borderRadius:8,padding:"12px 16px",fontSize:13,color:B.red,marginBottom:12,lineHeight:1.5}}>You have no cash reserve. During the simulation, capital calls and new investments require available cash. With nothing held back, you may be forced to sell positions at a discount when obligations come due.</div>)}
        {reserve>0&&reserve<500000&&(<div style={{background:B.cream,borderRadius:8,padding:"12px 16px",fontSize:13,color:B.body,marginBottom:12,lineHeight:1.5}}>{fmt(reserve)} held as cash reserve. Cash earns no return, but it is the only capital available when commitments come due or opportunities appear.</div>)}
        {over&&<div style={{background:"#fdf0ed",borderRadius:8,padding:"12px 16px",fontSize:13,color:B.red,marginBottom:12}}>Over budget by {fmt(totalAlloc-500000)}. Reduce allocations.</div>}
        <div style={{display:"flex",gap:10,marginTop:20}}><Btn onClick={()=>{setShowConfirm(false);setPhase("intro");}}>Back</Btn><Btn primary disabled={over||totalAlloc===0} onClick={()=>setShowConfirm(true)} style={{flex:1}}>Run Simulation</Btn></div>
        {showConfirm&&(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,46,48,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}}>
          <div style={{background:B.cream,borderRadius:12,padding:"32px 28px",maxWidth:440,width:"100%",boxShadow:"0 8px 32px rgba(0,0,0,.2)"}}>
            <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".18em",color:B.teal,marginBottom:6}}>PORTFOLIO REVIEW</div>
            <div style={{fontSize:17,fontWeight:500,color:B.darkTeal,marginBottom:18,lineHeight:1.3}}>Confirm your allocation before the simulation begins.</div>
            <div style={{marginBottom:16}}>{CLASSES.map(c=>{const amt=alloc[c.id];if(amt<=0)return null;return(<div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${B.ltTeal}`}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:8,height:8,borderRadius:2,background:c.color,display:"inline-block"}}/><span style={{fontSize:13,fontWeight:500,color:B.darkTeal}}>{c.name}</span></div><div><span style={{fontSize:13,fontWeight:600,color:B.teal}}>{fmt(amt)}</span><span style={{fontSize:11,color:B.muted,marginLeft:6}}>{((amt/500000)*100).toFixed(0)}%</span></div></div>);})}</div>
            <div style={{background:B.white,borderRadius:8,padding:"12px 14px",marginBottom:20}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".1em",color:B.muted}}>Cash Reserve</div><div style={{fontSize:18,fontWeight:500,color:reserve>0?B.teal:B.red,marginTop:2}}>{fmt(Math.max(0,reserve))}</div></div><div style={{fontSize:11,color:B.muted,maxWidth:200,textAlign:"right",lineHeight:1.4}}>{reserve>0?"Available for new investments and obligations during the simulation. Earns no return.":"No cash reserve. You may be forced to liquidate positions at a discount when obligations come due."}</div></div></div>
            <div style={{display:"flex",gap:10}}><Btn onClick={()=>setShowConfirm(false)} style={{flex:1}}>Go Back</Btn><Btn primary onClick={()=>{setShowConfirm(false);startGame();}} style={{flex:1}}>Confirm and Start</Btn></div>
          </div>
        </div>)}
      </div>
    </div>
  );

  /* ── PLAY ── */
  if(phase==="play"&&gs) {
    const tp=totalPortfolio(gs); const changeTot=((tp-500000)/500000)*100;
    const yearChg=summary?((summary.totalPortfolio-summary.prevTotal)/summary.prevTotal*100):0;
    return(<div style={{fontFamily:font,background:B.white,minHeight:"100vh"}}>
      {transitions&&transitions.length>0&&<YearTransition transitions={transitions} onComplete={onTransitionComplete}/>}
      <div style={{background:B.darkTeal,padding:"20px 28px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}><div><div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".18em",color:B.lime}}>YEAR {gs.year} OF 10</div><div style={{color:B.white,fontSize:18,fontWeight:500,marginTop:2}}>Decision Required</div></div><div style={{textAlign:"right"}}><div style={{fontSize:22,fontWeight:500,color:B.lime}}>{fmt(tp)}</div><div style={{fontSize:12,color:changeTot>=0?B.mint:"#ff9f9f"}}>{pctFmt(changeTot)} total</div></div></div><div style={{marginTop:14,height:4,background:"rgba(255,255,255,.12)",borderRadius:2}}><div style={{height:"100%",width:`${(gs.year/10)*100}%`,background:B.lime,borderRadius:2,transition:"width .3s"}}/></div></div>
      <div style={{maxWidth:600,margin:"0 auto",padding:"24px 24px"}}>
        {gs.history.length>1&&<Chart history={gs.history}/>}
        {summary&&(<div style={{display:"flex",gap:10,flexWrap:"wrap",margin:"16px 0"}}><Stat label="Portfolio" value={fmt(summary.totalPortfolio)}/><Stat label="This Period" value={pctFmt(yearChg)} color={yearChg>=0?B.green:B.red}/><Stat label="Cash Reserve" value={fmt(gs.cash)} sub={gs.cash<30000?"Low":"Available"} color={gs.cash<30000?B.warn:B.teal}/></div>)}
        <IncomeTracker gs={gs}/>
        {summary&&summary.env&&<EnvExplainer env={summary.env}/>}
        {gs.history.filter(h=>h.env).length>1&&(<div style={{marginBottom:16}}><div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.muted,marginBottom:6}}>Market History</div><div style={{display:"flex",flexWrap:"wrap"}}>{gs.history.filter(h=>h.env).map((h,i)=><EventTag key={i} env={h.env}/>)}</div></div>)}
        {decision&&(<div style={{background:B.cream,borderRadius:10,padding:"24px 24px",marginBottom:20}}>
          <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".15em",color:B.teal,marginBottom:6}}>DECISION</div>
          <h3 style={{fontSize:19,fontWeight:500,color:B.darkTeal,margin:"0 0 10px"}}>{decision.title}</h3>
          <p style={{fontSize:14,color:B.body,lineHeight:1.6,margin:"0 0 18px"}}>{decision.body}</p>
          {decision.lowCashNote&&(<div style={{background:"#fdf0ed",borderRadius:6,padding:"10px 14px",fontSize:13,color:B.red,marginBottom:14,lineHeight:1.5}}>{decision.lowCashNote}</div>)}
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{decision.options.map(opt=>(<Btn key={opt.id} primary={!["decline","pass","hold","cash","cant","force_sell"].includes(opt.id)} disabled={opt.disabled} onClick={()=>handleChoice(opt)} style={{flex:"1 1 auto",minWidth:120}}>{opt.label}</Btn>))}</div>
        </div>)}
        <div style={{marginTop:8}}><div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.muted,marginBottom:8}}>Current Allocation</div><AllocBar positions={gs.positions} cash={gs.cash}/><div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:8}}>{CLASSES.map(c=>{const cv=gs.positions[c.id+"_core"]||0;const sv=gs.positions[c.id+"_sat"]||0;if(cv+sv<=0)return null;return(<div key={c.id} style={{fontSize:12,color:B.body}}><span style={{fontWeight:600,color:c.color}}>{c.short}</span> {fmt(cv+sv)}{sv>0&&<span style={{fontSize:10,color:B.muted,marginLeft:3}}>({fmt(sv)} direct)</span>}</div>);})}{gs.cash>0&&<div style={{fontSize:12,color:B.body}}><span style={{fontWeight:600,color:B.muted}}>CASH</span> {fmt(gs.cash)}</div>}</div></div>
        {gs.decisions.length>0&&(<div style={{marginTop:20}}><div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.muted,marginBottom:6}}>Your Decisions</div>{gs.decisions.map((d,i)=><div key={i} style={{fontSize:12,color:B.body,padding:"4px 0",borderBottom:`1px solid ${B.ltTeal}`}}>{d}</div>)}</div>)}
      </div>
    </div>);
  }

  /* ── RESULTS ── */
  if(phase==="results"&&gs&&results) {
    const narrative = buildNarrative(gs);
    return(<div style={{fontFamily:font,background:B.white,minHeight:"100vh"}}>
      <div style={{background:B.darkTeal,padding:"36px 28px",textAlign:"center"}}>
        <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".2em",color:B.lime,marginBottom:8}}>SIMULATION COMPLETE</div>
        <div style={{fontSize:28,fontWeight:500,color:B.white,marginBottom:4}}>{fmt(results.finalValue)}</div>
        <div style={{fontSize:15,color:parseFloat(results.totalReturn)>=0?B.mint:"#ff9f9f"}}>{pctFmt(parseFloat(results.totalReturn))} total return</div>
      </div>
      <div style={{maxWidth:640,margin:"0 auto",padding:"28px 24px"}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
          <Stat label="Final Value" value={fmt(results.finalValue)} sub={`${pctFmt(parseFloat(results.totalReturn))} total`} color={parseFloat(results.totalReturn)>=0?B.teal:B.red}/>
          <Stat label="Annualized" value={`${results.annualized}%`} sub="Per year (CAGR)" color={parseFloat(results.annualized)>0?B.teal:B.red}/>
          <Stat label="Max Drawdown" value={`${results.maxDrawdown}%`} sub="Largest decline" color={parseFloat(results.maxDrawdown)>20?B.warn:B.teal}/>
          <Stat label="Total Income" value={fmt(gs.cumulativeIncome||0)} sub="From credit and real estate" color={B.teal}/>
        </div>
        <Chart history={gs.history}/>
        {narrative&&(<div style={{margin:"20px 0",background:B.cream,borderRadius:8,padding:"18px 20px"}}><div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.teal,marginBottom:8}}>YOUR STORY</div><div style={{fontSize:14,color:B.body,lineHeight:1.7}}>{narrative}</div></div>)}
        {realizedReturns&&Object.keys(realizedReturns).length>0&&(<div style={{margin:"20px 0"}}><div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.muted,marginBottom:6}}>Expected vs Realized Returns</div><div style={{background:B.cream,borderRadius:8,padding:"16px 14px"}}><RiskReturnChart realized={realizedReturns}/><div style={{fontSize:10,color:B.muted,marginTop:8,lineHeight:1.4}}>Solid dots = expected return (diversified and direct). Dashed circles = your realized annualized return per asset class.</div></div></div>)}
        <div style={{margin:"20px 0"}}><div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.muted,marginBottom:6}}>Market Scenario</div><div style={{display:"flex",flexWrap:"wrap"}}>{gs.history.filter(h=>h.env).map((h,i)=><EventTag key={i} env={h.env}/>)}</div></div>
        <div style={{margin:"20px 0"}}><div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.muted,marginBottom:8}}>Decision History</div><div style={{background:B.cream,borderRadius:8,padding:"16px 18px"}}>{gs.decisions.length>0?gs.decisions.map((d,i)=>(<div key={i} style={{fontSize:13,color:B.body,padding:"6px 0",borderBottom:i<gs.decisions.length-1?`1px solid ${B.ltTeal}`:"none"}}>{d}</div>)):<div style={{fontSize:13,color:B.muted}}>No decisions reached.</div>}</div></div>
        <FrameworkReveal positions={gs.positions} cash={gs.cash}/>
        <div style={{display:"flex",gap:10}}><Btn primary onClick={resetAll} style={{flex:1}}>Play Again</Btn><Btn onClick={()=>{setPhase("allocate");gsRef.current=null;setGs(null);setDecision(null);setSummary(null);setTransitions(null);}} style={{flex:1}}>New Allocation</Btn></div>
        <div style={{marginTop:28,padding:14,background:B.cream,borderRadius:8,fontSize:11,color:B.muted,lineHeight:1.5}}>Simulated performance for educational purposes only. Not indicative of actual results or future returns. Past performance, real or simulated, does not guarantee future results. All investments involve risk, including possible loss of principal.</div>
      </div>
    </div>);
  }

  return <div style={{fontFamily:font,padding:40,textAlign:"center",color:B.muted}}>Loading...</div>;
}
