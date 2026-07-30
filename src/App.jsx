import { useState, useRef, useEffect, useCallback } from "react";

/* ── Brand (used only in results reveal) ── */
const B = {
  darkTeal: "#002e30", teal: "#014a4c", lime: "#dffa46", mint: "#a3f5c5",
  cream: "#f6f4f1", ltTeal: "#e6eded", gray: "#f8f8f8", body: "#3a3d42",
  white: "#fff", muted: "#7a7d82", red: "#c0392b", warn: "#e67e22", green: "#1a7a4c",
};
const font = '"Linik Sans", system-ui, sans-serif';
const fmt = (n) => { const a=Math.abs(n); if(a<1) return "$0"; const sign=n<0?"\u2212":""; if(a>=1e6) return `${sign}$${(a/1e6).toFixed(2)}M`; if(a>=1e3) return `${sign}$${(a/1e3).toFixed(0)}K`; return `${sign}$${Math.round(a)}`; };
const pctFmt = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
const rnd = (lo, hi) => Math.random() * (hi - lo) + lo;

/* ── Asset class definitions ── */
const CLASSES = [
  { id:"pe", name:"Private Equity", short:"PE", color:"#2d5be3",
    core: { ret:0.14, vol:0.11, income:false, incomeRate:0, jCurve:false },
    sat:  { ret:0.21, vol:0.19, income:false, incomeRate:0, jCurve:true, lockup:5 },
    desc:"Funds that buy, improve, and sell private companies over multi-year holding periods.",
    edu:"Private equity generates returns by acquiring companies, improving operations, and selling them at a profit. Through a diversified fund, your capital is spread across dozens of deals with periodic liquidity. Through a direct investment, you take a concentrated position in a single fund with a multi-year lockup and higher return potential.",
    traits:["Returns driven by operational improvement and exits","Diversified fund: broad exposure, periodic liquidity","Direct investment: concentrated, 5+ year lockup"] },
  { id:"re", name:"Real Estate", short:"RE", color:"#d4820a",
    core: { ret:0.07, vol:0.07, income:true, incomeRate:0.04, jCurve:false },
    sat:  { ret:0.16, vol:0.15, income:true, incomeRate:0.05, jCurve:true, lockup:4 },
    desc:"Investments in commercial and residential properties that generate rental income and grow in value over time.",
    edu:"Real estate earns returns through rental income and property value appreciation. Diversified fund positions provide exposure across property types and geographies. Direct investments offer concentrated bets on specific properties or strategies with higher income potential and more sensitivity to interest rate cycles.",
    traits:["Income from rent plus property value growth","Diversified fund: steady, broad income stream","Direct investment: concentrated, higher yield potential"] },
  { id:"pc", name:"Private Credit", short:"PC", color:"#1a9a6f",
    core: { ret:0.09, vol:0.05, income:true, incomeRate:0.06, jCurve:false },
    sat:  { ret:0.12, vol:0.09, income:true, incomeRate:0.08, jCurve:false, lockup:2 },
    desc:"Lending outside the banking system that generates regular interest income for investors.",
    edu:"Private credit funds lend capital to borrowers and earn interest in return. Diversified fund positions offer floating-rate exposure that tends to perform well when rates rise. Direct investments offer individual lending opportunities with higher yields and more concentrated default risk.",
    traits:["Regular income from interest payments","Rates adjust with the market (floating rate)","Diversified fund: broad. Direct: higher yield, default risk"] },
  { id:"vc", name:"Venture Capital", short:"VC", color:"#8b5cf6",
    core: { ret:0.11, vol:0.15, income:false, incomeRate:0, jCurve:false },
    sat:  { ret:0.23, vol:0.25, income:false, incomeRate:0, jCurve:true, lockup:7 },
    desc:"Investments in early-stage companies where a small number of successes drive the majority of returns.",
    edu:"Venture capital funds invest in startups. Most fail, but the winners can return multiples of invested capital. Through a diversified fund, your exposure is spread across many companies. Through a direct investment, you take a concentrated position with a 7 to 10 year lockup and the widest return dispersion of any asset class.",
    traits:["Extreme return dispersion between managers","Longest lockup period of any asset class","Diversified fund: managed risk. Direct: highest ceiling"] },
];

/* ── Allocation presets ── */
const PRESETS = [
  { id: "growth", label: "Growth", desc: "Maximizes long-term appreciation. Heavier PE and VC allocation with minimal cash reserve.",
    alloc: { pe: 200000, re: 50000, pc: 50000, vc: 150000 }, cash: 50000 },
  { id: "income", label: "Income", desc: "Prioritizes steady distributions. Weighted toward Private Credit and Real Estate.",
    alloc: { pe: 50000, re: 150000, pc: 200000, vc: 0 }, cash: 100000 },
  { id: "balanced", label: "Balanced", desc: "Equal exposure across asset classes with a meaningful cash buffer.",
    alloc: { pe: 100000, re: 100000, pc: 100000, vc: 100000 }, cash: 100000 },
];

/* ── Environments with deep explainers ── */
const ENVS = [
  { id:"boom", label:"Economic Expansion",
    narrative:"Strong GDP growth and consumer confidence drive asset values higher across the board.",
    m:{ pe:{c:1.189,s:1.251}, re:{c:1.137,s:1.222}, pc:{c:1.127,s:1.170}, vc:{c:1.108,s:1.159} },
    explainer:"Strong GDP growth lifts corporate earnings and startup valuations. PE and VC benefit most from rising exit multiples. Private credit generates steady income but limited upside in expansions. Real estate appreciates on rising rents and occupancy." },
  { id:"rate_hike", label:"Rate Hike Cycle",
    narrative:"Central banks raise rates aggressively. Floating-rate credit benefits while equity valuations compress.",
    m:{ pe:{c:0.976,s:0.968}, re:{c:1.060,s:1.097}, pc:{c:1.045,s:1.060}, vc:{c:0.846,s:0.774} },
    explainer:"Rising rates increase borrowing costs, pressuring leveraged buyouts and venture valuations. Private credit is the clear winner: floating-rate loans reset higher, increasing income. Real estate holds up as rents adjust upward. VC suffers the steepest decline as higher discount rates compress growth-stage valuations." },
  { id:"rate_cut", label:"Rate Cuts Begin",
    narrative:"Easing monetary policy lifts valuations and reopens exit windows for private equity.",
    m:{ pe:{c:1.156,s:1.207}, re:{c:1.100,s:1.162}, pc:{c:1.077,s:1.103}, vc:{c:1.169,s:1.248} },
    explainer:"Falling rates lower discount rates, boosting asset valuations across the board. PE and VC benefit most as exit activity picks up and growth-stage companies see multiple expansion. Real estate benefits from cheaper financing. Private credit income declines as floating rates reset lower." },
  { id:"credit_crunch", label:"Credit Crunch",
    narrative:"Lending standards tighten sharply. Borrowers struggle and default rates tick up.",
    m:{ pe:{c:1.060,s:1.080}, re:{c:0.964,s:0.942}, pc:{c:1.094,s:1.126}, vc:{c:0.937,s:0.907} },
    explainer:"Tightening credit conditions pressure real estate and venture capital. Real estate declines as financing dries up and transaction volume falls. VC startups lose access to growth capital. Private equity and credit prove more resilient, with credit funds benefiting from higher spreads on performing loans." },
  { id:"steady", label:"Stable Growth",
    narrative:"Moderate, broad-based growth. All asset classes perform near long-term averages.",
    m:{ pe:{c:1.066,s:1.088}, re:{c:1.001,s:1.002}, pc:{c:1.089,s:1.119}, vc:{c:1.014,s:1.021} },
    explainer:"A benign environment with moderate growth and stable rates. PE and private credit lead with steady returns. Real estate and venture capital deliver muted performance. The spread between core and satellite positions is narrow in calm markets." },
];
function pickEnv(){ const r=Math.random(); if(r<.20) return ENVS[0]; if(r<.35) return ENVS[1]; if(r<.50) return ENVS[2]; if(r<.65) return ENVS[3]; return ENVS[4]; }

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
            return {...s, cash:s.cash-minInvest, positions:newPos, firstSatellite:target.id, satelliteDeployed:(s.satelliteDeployed||0)+minInvest, decisions:[...s.decisions, `Invested ${fmt(minInvest)} in ${target.name} direct deal (Y3)`]};
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
            return {...s, cash:s.cash-minInvest, positions:newPos, firstSatellite:cls.id, satelliteDeployed:(s.satelliteDeployed||0)+minInvest, decisions:[...s.decisions, `Invested ${fmt(minInvest)} in ${cls.name} direct deal (Y3)`]};
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
          return {...s, cash:s.cash-cost, positions:newPos, satelliteDeployed:(s.satelliteDeployed||0)+cost, decisions:[...s.decisions, `Co-invested ${fmt(cost)} in ${target.name} deal (Y4)`]};
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
            return {...s, cash:s.cash-cost, positions:newPos, satelliteDeployed:(s.satelliteDeployed||0)+cost, decisions:[...s.decisions, `Invested ${fmt(cost)} in ${target.name} direct deal (Y5)`]};
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
        const positionCost = sellAmt;
        return {
          title: "Capital Call Due",
          body: `A commitment from your fund subscriptions requires a ${fmt(callAmt)} capital call, and your cash reserve is effectively empty. You must sell ${fmt(positionCost)} of your ${sellTarget.cls.name} diversified position on the secondary market. After a 15% liquidity discount, this nets ${fmt(proceeds)} to cover the ${fmt(callAmt)} obligation.`,
          options: [
            { id:"force_sell", label:`Forced Sale: −${fmt(positionCost)} position`, disabled:false, apply: s => {
              const newPos = {...s.positions};
              newPos[sellTarget.id] = Math.max(0, (newPos[sellTarget.id]||0) - sellAmt);
              return {...s, cash: s.cash + proceeds - callAmt, positions:newPos, forcedLiquidation:true,
                decisions:[...s.decisions, `Forced to sell ${sellTarget.cls.name} position at 15% discount to meet ${fmt(callAmt)} capital call (Y6)` + (s.history[0].cash === 0 ? ". This outcome was driven by entering the simulation with no cash reserve." : "")]};
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
          return {...s, cash:s.cash-cost, positions:newPos, satelliteDeployed:(s.satelliteDeployed||0)+cost, decisions:[...s.decisions, `Committed ${fmt(cost)} to ${target.name} fund vintage (Y8)`]};
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

/* Advance with transition data */
function advanceUntilDecision(initState) {
  let st = { ...initState };
  let summary = null;
  let decision = null;
  let transitions = [];
  while (st.year < 10) {
    const env = st.envs[st.year];
    const prevPositions = { ...st.positions };
    const { positions: newPos, income } = simYear(st, env);
    const prevTotal = st.history[st.history.length - 1].totalPortfolio;
    /* Distributions flow directly to cash reserve each year */
    st = { ...st, year:st.year+1, positions:newPos, cash:st.cash+income, totalIncome:st.totalIncome+income, cumulativeIncome:(st.cumulativeIncome||0)+income, yearlyIncome:income };
    /* Detect satellite positions wiped out this year */
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
    st.history = [...st.history, { year:st.year, positions:{...st.positions}, cash:st.cash, totalPortfolio:tp, env, yearlyIncome:income }];
    transitions.push({ year:st.year, env, prevTotal, newTotal:tp, change:((tp-prevTotal)/prevTotal)*100, wipeouts: wipeouts.length > 0 ? wipeouts : undefined });
    const d = buildDecision(st);
    if (d) { summary = { year:st.year, env, totalPortfolio:tp, prevTotal }; decision = d; break; }
  }
  return { state:st, summary, decision, transitions, done:st.year>=10&&!decision };
}

function calcResults(hist) {
  if (hist.length < 2) return null;
  const s = hist[0].totalPortfolio, e = hist[hist.length-1].totalPortfolio;
  const ret = (e-s)/s;
  const yearlyReturns = [];
  for (let i = 1; i < hist.length; i++) {
    yearlyReturns.push((hist[i].totalPortfolio - hist[i-1].totalPortfolio) / hist[i-1].totalPortfolio);
  }
  const worstYear = Math.min(...yearlyReturns);
  const years = hist.length - 1;
  const annualized = years > 0 ? (Math.pow(e/s, 1/years) - 1) * 100 : 0;
  return { totalReturn:(ret*100).toFixed(1), finalValue:e, worstYear:(worstYear*100).toFixed(1), annualized:annualized.toFixed(1) };
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
const Chart = ({history, decisions})=>{
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
    {decisions && (() => {
      const decYears = new Set();
      decisions.forEach(d => { const m = d.match(/\(Y(\d+)\)/); if (m) decYears.add(parseInt(m[1])); });
      return history.map((x, i) => {
        if (!decYears.has(x.year)) return null;
        const qi = i * 4;
        if (qi >= pts.length) return null;
        const p = pts[qi];
        return <polygon key={`dec-${i}`} points={`${p.x},${p.y-7} ${p.x+5},${p.y} ${p.x},${p.y+7} ${p.x-5},${p.y}`} fill={B.lime} stroke={B.darkTeal} strokeWidth={1}/>;
      });
    })()}
  </svg>);
};
const RiskReturnChart = ({highlighted, realized})=>{
  const w=320,h=180,pad={t:20,r:20,b:36,l:44}; const cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;
  return(<svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{display:"block"}}><rect x={0} y={0} width={w} height={h} rx={6} fill={B.white}/>{[0,.5,1].map((p,i)=>{const y=pad.t+ch*(1-p);return(<g key={i}><line x1={pad.l} x2={w-pad.r} y1={y} y2={y} stroke={B.ltTeal} strokeWidth={.5}/><text x={pad.l-6} y={y+4} textAnchor="end" fontSize={10} fill={B.muted}>{Math.round(p*25)}%</text></g>);})}{[0,.5,1].map((p,i)=>{const x=pad.l+cw*p;return(<g key={i}><line x1={x} x2={x} y1={pad.t} y2={pad.t+ch} stroke={B.ltTeal} strokeWidth={.5}/><text x={x} y={pad.t+ch+14} textAnchor="middle" fontSize={10} fill={B.muted}>{["Low","Med","High"][i]}</text></g>);})}<text x={pad.l+cw/2} y={h-4} textAnchor="middle" fontSize={10} fill={B.muted}>Volatility</text><text x={10} y={pad.t+ch/2} textAnchor="middle" fontSize={10} fill={B.muted} transform={`rotate(-90,10,${pad.t+ch/2})`}>Return</text>{CLASSES.map(c=>{const isHl=c.id===highlighted;const cx1=pad.l+(c.core.vol/0.40)*cw,cy1=pad.t+(1-c.core.ret/0.25)*ch;const cx2=pad.l+(c.sat.vol/0.40)*cw,cy2=pad.t+(1-c.sat.ret/0.25)*ch;const r=realized?.[c.id];const rx=r!=null?pad.l+(c.core.vol/0.40)*cw:null;const ry=r!=null?pad.t+(1-Math.min(Math.max(r,0),0.25)/0.25)*ch:null;return(<g key={c.id}><circle cx={cx1} cy={cy1} r={isHl?6:4} fill={c.color} opacity={isHl?0.5:0.15}/><circle cx={cx2} cy={cy2} r={isHl?6:4} fill={c.color} opacity={isHl?1:0.25} stroke={isHl?B.darkTeal:"none"} strokeWidth={1}/>{isHl&&<line x1={cx1} y1={cy1} x2={cx2} y2={cy2} stroke={c.color} strokeWidth={1} strokeDasharray="2,2" opacity={0.4}/>}{r!=null&&rx!=null&&<circle cx={rx} cy={ry} r={5} fill="none" stroke={c.color} strokeWidth={2} strokeDasharray="3,2"/>}<text x={cx2} y={cy2-10} textAnchor="middle" fontSize={10} fontWeight={isHl?600:400} fill={isHl?B.darkTeal:B.muted}>{c.short}</text></g>);})}</svg>);
};
const AssetDetail = ({cls})=>(<div style={{background:B.cream,borderRadius:8,padding:"16px 18px",marginTop:8,marginBottom:4}}><div style={{maxWidth:320,marginBottom:14}}><RiskReturnChart highlighted={cls.id}/></div><div style={{fontSize:10,color:B.muted,marginBottom:8}}>Faded dot = diversified fund. Solid dot = direct investment.</div><div style={{fontSize:13,color:B.body,lineHeight:1.6,marginBottom:10}}>{cls.edu}</div><div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:8}}>{cls.traits.map((t,i)=>(<div key={i} style={{fontSize:11,color:B.teal,display:"flex",alignItems:"baseline",gap:6}}><span style={{width:4,height:4,borderRadius:1,background:cls.color,flexShrink:0,marginTop:4}}/><span>{t}</span></div>))}</div></div>);
const EventTag = ({env})=>{const neg=["rate_hike","credit_crunch"].includes(env.id);const pos=["boom","rate_cut"].includes(env.id);return(<span style={{display:"inline-block",padding:"5px 12px",borderRadius:5,fontSize:12,fontWeight:500,background:neg?"#fdf0ed":pos?"#edfaf2":B.gray,color:neg?B.red:pos?B.green:B.body,marginRight:6,marginBottom:6}}>{env.label}</span>);};

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
  const neg = ["rate_hike","credit_crunch"].includes(tr.env?.id);
  const pos = ["boom","rate_cut"].includes(tr.env?.id);
  const borderColor = neg ? B.red : pos ? B.green : B.teal;
  return (<div style={{position:"fixed",inset:0,background:"rgba(0,46,48,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20,backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)"}}>
    <div style={{background:B.white,borderRadius:14,padding:"32px 36px",maxWidth:400,width:"100%",textAlign:"center",borderTop:`4px solid ${borderColor}`,boxShadow:"0 12px 48px rgba(0,0,0,0.2)",opacity:visible?1:0,transform:visible?"translateY(0) scale(1)":"translateY(-10px) scale(0.97)",transition:"opacity 0.3s, transform 0.3s"}}>
      <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".18em",color:B.muted,marginBottom:6}}>YEAR {tr.year}</div>
      <div style={{fontSize:20,fontWeight:500,color:B.darkTeal,marginBottom:8}}>{tr.env?.label||"Market Update"}</div>
      <div style={{fontSize:13,color:B.body,lineHeight:1.55,marginBottom:tr.wipeouts?8:16}}>{tr.env?.narrative}</div>
      {tr.wipeouts&&tr.wipeouts.map((wo,i)=>(<div key={i} style={{fontSize:13,fontWeight:500,color:B.red,marginBottom:i===tr.wipeouts.length-1?16:4}}>Your {wo.cls.name} direct position was written off.</div>))}
      <div style={{display:"flex",justifyContent:"center",gap:24}}>
        <div><div style={{fontSize:10,color:B.muted,textTransform:"uppercase",letterSpacing:".1em"}}>Portfolio</div><div style={{fontSize:20,fontWeight:500,color:B.teal}}>{fmt(tr.newTotal)}</div></div>
        <div><div style={{fontSize:10,color:B.muted,textTransform:"uppercase",letterSpacing:".1em"}}>This Year</div><div style={{fontSize:20,fontWeight:500,color:tr.change>=0?B.green:B.red}}>{pctFmt(tr.change)}</div></div>
      </div>
    </div>
  </div>);
};

/* Framework Reveal — v5-style single step (Willow brand + products immediately) */
const FrameworkReveal = ({positions, cash, concentrationPenalty})=>{
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
      {label:"Satellite",pct:sPct,color:"#d4820a",desc:"Direct investments via the Willow marketplace. Higher return potential with lockups and concentrated risk." + (concentrationPenalty ? ` Concentration drag from ${(CLASSES.find(c=>c.id===concentrationPenalty)||{}).name||"a position"} reduced satellite returns in this simulation.` : ""),val:sv},
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
  const stateHistoryRef = useRef([]);
  const [gs, setGs] = useState(null);
  const [decision, setDecision] = useState(null);
  const [summary, setSummary] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [expandedAsset, setExpandedAsset] = useState(null);
  const [transitions, setTransitions] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);

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
      subscriptionFunded:null, firstSatellite:null, earlyExitSold:null, incomeReinvested:null, premiumExit:false, satelliteDeployed:0 };
    runAdvance(init);
  }
  function handleChoice(opt) {
    if(opt.disabled) return;
    stateHistoryRef.current = [...stateHistoryRef.current, JSON.parse(JSON.stringify(gsRef.current))];
    runAdvance(opt.apply(gsRef.current));
  }
  function undoChoice() {
    const stack = stateHistoryRef.current;
    if (stack.length === 0) return;
    const prev = stack[stack.length - 1];
    stateHistoryRef.current = stack.slice(0, -1);
    gsRef.current = prev;
    setGs(prev);
    const d = buildDecision(prev);
    setDecision(d);
    setSummary(d ? { year: prev.year, env: prev.envs[prev.year - 1], totalPortfolio: totalPortfolio(prev), prevTotal: prev.history[prev.history.length - 2]?.totalPortfolio || 500000 } : null);
    setTransitions(null);
    setPhase("play");
  }
  function resetAll() { setPhase("intro"); setAlloc({pe:0,re:0,pc:0,vc:0}); gsRef.current=null; setGs(null); setDecision(null); setSummary(null); setShowConfirm(false); setExpandedAsset(null); setTransitions(null); setSelectedPreset(null); stateHistoryRef.current=[]; }
  function rerunSim() { gsRef.current=null; setGs(null); setDecision(null); setSummary(null); setTransitions(null); stateHistoryRef.current=[]; startGame(); }

  const results = phase==="results"&&gs ? calcResults(gs.history) : null;

  /* ── INTRO ── */
  if(phase==="intro") return(
    <div style={{fontFamily:font,background:B.white,minHeight:"100vh"}}>
      <div style={{background:B.darkTeal,padding:"56px 28px",textAlign:"center"}}>
        <h1 style={{color:B.white,fontSize:34,fontWeight:500,margin:"0 0 10px",lineHeight:1.2}}>Portfolio Architect</h1>
        <p style={{color:B.ltTeal,fontSize:15,maxWidth:460,margin:"0 auto 28px",lineHeight:1.6}}>Build a $500K private markets portfolio. Allocate across asset classes, navigate a decade of market conditions, and see how your decisions shape the outcome.</p>
        <Btn primary onClick={()=>setPhase("preset")} style={{padding:"16px 52px",fontSize:16,borderRadius:8,boxShadow:"0 2px 12px rgba(0,0,0,.25)",letterSpacing:".04em"}}>Begin</Btn>
      </div>
      <div style={{maxWidth:540,margin:"0 auto",padding:"36px 24px"}}>
        {[{n:"01",t:"Allocate",d:"Spread your capital across four private markets asset classes. Any amount you leave unallocated is held as a cash reserve."},{n:"02",t:"Decide",d:"During the simulation, opportunities and obligations appear: fund subscriptions, direct investments, concentration warnings, secondary market offers, and liquidity crunches. Each choice reshapes your portfolio."},{n:"03",t:"Review",d:"After ten simulated years, see how your portfolio performed, what your decisions cost or gained you, and how results map to a real investment framework."}].map(s=>(
          <div key={s.n} style={{display:"flex",gap:14,marginBottom:20}}><div style={{fontWeight:600,fontSize:13,color:B.teal,minWidth:28,paddingTop:1}}>{s.n}</div><div><div style={{fontWeight:600,color:B.darkTeal,fontSize:14,marginBottom:3}}>{s.t}</div><div style={{color:B.body,fontSize:13,lineHeight:1.55}}>{s.d}</div></div></div>
        ))}
        <div style={{marginTop:24,fontSize:11,color:B.muted,lineHeight:1.5}}>
          <div>Simulated performance for educational purposes only. Past performance, real or simulated, does not guarantee future results. All investments involve risk, including possible loss of principal.</div>
          <div style={{borderTop:`1px solid ${B.ltTeal}`,marginTop:10,paddingTop:10,fontSize:10,color:B.muted,opacity:0.7}}>Simulation parameters derived from the Preqin Private Capital Quarterly Index and Preqin Benchmarks fund-level performance data. Does not represent any specific investment product, fund, or strategy. Does not account for fees, expenses, or taxes.</div>
        </div>
      </div>
    </div>
  );

  /* ── PRESET SELECTION ── */
  if(phase==="preset") return(
    <div style={{fontFamily:font,background:B.white,minHeight:"100vh"}}>
      <div style={{background:B.darkTeal,padding:"36px 28px",textAlign:"center"}}>
        <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".18em",color:B.lime,marginBottom:6}}>STEP 1</div>
        <div style={{color:B.white,fontSize:22,fontWeight:500,marginBottom:4}}>Choose a Starting Strategy</div>
        <div style={{color:B.ltTeal,fontSize:14,maxWidth:420,margin:"0 auto",lineHeight:1.5}}>Pick a preset to start from, or build a custom allocation from scratch.</div>
      </div>
      <div style={{maxWidth:560,margin:"0 auto",padding:"28px 24px"}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {PRESETS.map(p=>{
            const total=Object.values(p.alloc).reduce((a,b)=>a+b,0);
            return(<div key={p.id} onClick={()=>{setAlloc({...p.alloc});setSelectedPreset(p.id);setPhase("allocate");}} style={{background:B.cream,borderRadius:10,padding:"20px 22px",cursor:"pointer",border:`2px solid transparent`,transition:"all .15s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:16,fontWeight:600,color:B.darkTeal}}>{p.label}</div>
                <div style={{fontSize:12,color:B.muted}}>{fmt(p.cash)} cash reserve</div>
              </div>
              <div style={{fontSize:13,color:B.body,lineHeight:1.5,marginBottom:12}}>{p.desc}</div>
              <div style={{display:"flex",borderRadius:4,overflow:"hidden",height:6,marginBottom:8}}>
                {CLASSES.map(c=>{const pct=(p.alloc[c.id]||0)/500000*100;return pct>0?<div key={c.id} style={{width:`${pct}%`,background:c.color,transition:"width .3s"}}/>:null;})}
                {p.cash>0&&<div style={{width:`${p.cash/500000*100}%`,background:B.muted,opacity:0.3}}/>}
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{CLASSES.map(c=>{const amt=p.alloc[c.id];return amt>0?<div key={c.id} style={{fontSize:11,color:B.body}}><span style={{fontWeight:600,color:c.color}}>{c.short}</span> {fmt(amt)}</div>:null;})}</div>
            </div>);
          })}
        </div>
        <div style={{textAlign:"center",marginTop:20}}>
          <span style={{fontSize:13,color:B.teal,cursor:"pointer",fontWeight:500}} onClick={()=>{setAlloc({pe:0,re:0,pc:0,vc:0});setSelectedPreset(null);setPhase("allocate");}}>Build Custom Allocation</span>
        </div>
        <div style={{textAlign:"center",marginTop:16}}>
          <span style={{fontSize:12,color:B.muted,cursor:"pointer"}} onClick={()=>setPhase("intro")}>{"\u2190"} Back</span>
        </div>
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
        {selectedPreset && (() => { const sp = PRESETS.find(p => p.id === selectedPreset); return sp ? (
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:B.ltTeal,borderRadius:8,padding:"10px 14px",fontSize:12,color:B.teal,marginBottom:10,lineHeight:1.5}}>
            <span>Starting from: <strong>{sp.label}</strong> preset</span>
            <span style={{cursor:"pointer",fontWeight:500,fontSize:11}} onClick={()=>setAlloc({...sp.alloc})}>Reset to preset</span>
          </div>
        ) : null; })()}
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
        {reserve===0&&totalAlloc>0&&(<div style={{background:"#fdf0ed",borderRadius:8,padding:"12px 16px",fontSize:13,color:B.red,marginBottom:12,lineHeight:1.5}}>You have no cash reserve. During the simulation, capital calls and new investments require available cash. With nothing held back, you may be forced to sell positions at a discount when obligations come due.</div>)}
        {reserve>0&&reserve<50000&&(<div style={{background:"#fef6ed",borderRadius:8,padding:"12px 16px",fontSize:13,color:B.warn,marginBottom:12,lineHeight:1.5}}>In private markets, fund managers issue capital calls on a set schedule — and missing one can mean forfeiting your position. Most institutional allocators hold 10–20% in reserve. Your current reserve of {fmt(reserve)} may be tight if multiple calls arrive in the same period.</div>)}
        {reserve>=50000&&reserve<100000&&(<div style={{background:B.cream,borderRadius:8,padding:"12px 16px",fontSize:13,color:B.body,marginBottom:12,lineHeight:1.5}}>{fmt(reserve)} held as cash reserve. Cash earns no return, but it is the only capital available when commitments come due or opportunities appear.</div>)}
        {reserve>=100000&&reserve<500000&&(<div style={{background:B.cream,borderRadius:8,padding:"12px 16px",fontSize:13,color:B.body,marginBottom:12,lineHeight:1.5}}>A larger cash reserve means fewer forced sales when capital calls arrive, but cash earns no return in this simulation. Experienced allocators balance liquidity against opportunity cost. {fmt(reserve)} held in reserve.</div>)}
        {over&&<div style={{background:"#fdf0ed",borderRadius:8,padding:"12px 16px",fontSize:13,color:B.red,marginBottom:12}}>Over budget by {fmt(totalAlloc-500000)}. Reduce allocations.</div>}
        <div style={{display:"flex",gap:10,marginTop:20}}><Btn onClick={()=>{setShowConfirm(false);setPhase("preset");}}>Back</Btn><Btn primary disabled={over||totalAlloc===0} onClick={()=>setShowConfirm(true)} style={{flex:1}}>Run Simulation</Btn></div>
        {showConfirm&&(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,46,48,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}}>
          <div style={{background:B.cream,borderRadius:12,padding:"32px 28px",maxWidth:440,width:"100%",boxShadow:"0 8px 32px rgba(0,0,0,.2)"}}>
            <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".18em",color:B.teal,marginBottom:6}}>PORTFOLIO REVIEW</div>
            <div style={{fontSize:17,fontWeight:500,color:B.darkTeal,marginBottom:18,lineHeight:1.3}}>Confirm your allocation before the simulation begins.</div>
            <div style={{marginBottom:16}}>{CLASSES.map(c=>{const amt=alloc[c.id];if(amt<=0)return null;return(<div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${B.ltTeal}`}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:8,height:8,borderRadius:2,background:c.color,display:"inline-block"}}/><span style={{fontSize:13,fontWeight:500,color:B.darkTeal}}>{c.name}</span></div><div><span style={{fontSize:13,fontWeight:600,color:B.teal}}>{fmt(amt)}</span><span style={{fontSize:11,color:B.muted,marginLeft:6}}>{((amt/500000)*100).toFixed(0)}%</span></div></div>);})}</div>
            <div style={{background:B.white,borderRadius:8,padding:"12px 14px",marginBottom:20}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".1em",color:B.muted}}>Cash Reserve</div><div style={{fontSize:18,fontWeight:500,color:reserve>0?B.teal:B.red,marginTop:2}}>{fmt(Math.max(0,reserve))}</div></div><div style={{fontSize:11,color:reserve===0?B.red:reserve<50000?B.warn:B.muted,maxWidth:200,textAlign:"right",lineHeight:1.4}}>{reserve===0?"Expect forced liquidations.":reserve<50000?"Tight — capital calls may force secondary sales.":"Adequate buffer for most scenarios."}</div></div></div>
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
      <style>{`.play-hdr-left:hover .play-back{opacity:1;margin-right:8px;max-width:60px}.play-back{opacity:0;max-width:0;overflow:hidden;transition:opacity .2s,max-width .25s,margin .25s;margin-right:0;cursor:pointer;white-space:nowrap}`}</style>
      <div style={{background:B.darkTeal,padding:"22px 28px 18px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16}}>
          <div className="play-hdr-left" style={{cursor:stateHistoryRef.current.length>0?"default":undefined}}>
            <div style={{display:"flex",alignItems:"center",marginBottom:4}}>
              {stateHistoryRef.current.length>0&&<span className="play-back" onClick={undoChoice} style={{color:B.ltTeal,fontSize:11,fontWeight:500}}>{"\u2190"} Back</span>}
              <span style={{fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:".2em",color:B.lime}}>YEAR {gs.year} OF 10</span>
            </div>
            <div style={{color:B.white,fontSize:20,fontWeight:500}}>Decision Required</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:24,fontWeight:500,color:B.lime,lineHeight:1}}>{fmt(tp)}</div>
            <div style={{fontSize:12,color:changeTot>=0?B.mint:"#ff9f9f",marginTop:3}}>{pctFmt(changeTot)} total</div>
          </div>
        </div>
        <div style={{marginTop:14,height:4,background:"rgba(255,255,255,.12)",borderRadius:2}}><div style={{height:"100%",width:`${(gs.year/10)*100}%`,background:B.lime,borderRadius:2,transition:"width .3s"}}/></div>
      </div>
      <div style={{maxWidth:600,margin:"0 auto",padding:"24px 24px"}}>
        {gs.history.length>1&&<Chart history={gs.history} decisions={gs.decisions}/>}
        {summary&&(<div style={{display:"flex",gap:10,flexWrap:"wrap",margin:"16px 0"}}><Stat label="Portfolio" value={fmt(summary.totalPortfolio)}/><Stat label="This Period" value={pctFmt(yearChg)} color={yearChg>=0?B.green:B.red}/><Stat label="Cash Reserve" value={fmt(gs.cash)} sub={gs.cash<30000?"Low":"Available"} color={gs.cash<30000?B.warn:B.teal}/></div>)}
        <IncomeTracker gs={gs}/>
        {gs.concentrationPenalty && (() => { const penCls = CLASSES.find(c => c.id === gs.concentrationPenalty); return penCls ? (
          <div style={{background:"#fdf0ed",borderRadius:8,padding:"10px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
            <span style={{width:8,height:8,borderRadius:2,background:penCls.color,display:"inline-block",flexShrink:0}}/>
            <span style={{fontSize:12,color:B.red,fontWeight:500}}>Concentration drag active on {penCls.name} satellite position ({"\u2212"}8%/yr)</span>
          </div>
        ) : null; })()}
        {summary&&summary.env&&<EnvExplainer env={summary.env}/>}
        {gs.history.filter(h=>h.env).length>1&&(<div style={{marginBottom:16}}><div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.muted,marginBottom:6}}>Market History</div><div style={{display:"flex",flexWrap:"wrap"}}>{gs.history.filter(h=>h.env).map((h,i)=><EventTag key={i} env={h.env}/>)}</div></div>)}
        {decision&&(<div style={{background:B.cream,borderRadius:10,padding:"24px 24px",marginBottom:20}}>
          <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".15em",color:B.teal,marginBottom:6}}>DECISION</div>
          <h3 style={{fontSize:19,fontWeight:500,color:B.darkTeal,margin:"0 0 10px"}}>{decision.title}</h3>
          <p style={{fontSize:14,color:B.body,lineHeight:1.6,margin:"0 0 18px"}}>{decision.body}</p>
          {decision.lowCashNote&&(<div style={{background:"#fdf0ed",borderRadius:6,padding:"10px 14px",fontSize:13,color:B.red,marginBottom:14,lineHeight:1.5}}>{decision.lowCashNote}</div>)}
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{decision.options.map(opt=>(<Btn key={opt.id} primary={decision.options.length===1} disabled={opt.disabled} onClick={()=>handleChoice(opt)} style={{flex:"1 1 auto",minWidth:120}}>{opt.label}</Btn>))}</div>
        </div>)}
        <div style={{marginTop:8}}><div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.muted,marginBottom:8}}>Current Allocation</div><AllocBar positions={gs.positions} cash={gs.cash}/><div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:8}}>{CLASSES.map(c=>{const cv=gs.positions[c.id+"_core"]||0;const sv=gs.positions[c.id+"_sat"]||0;if(cv+sv<=0)return null;return(<div key={c.id} style={{fontSize:12,color:B.body}}><span style={{fontWeight:600,color:c.color}}>{c.short}</span> {fmt(cv+sv)}{sv>0&&<span style={{fontSize:10,color:B.muted,marginLeft:3}}>({fmt(sv)} direct)</span>}</div>);})}{gs.cash>0&&<div style={{fontSize:12,color:B.body}}><span style={{fontWeight:600,color:B.muted}}>CASH</span> {fmt(gs.cash)}</div>}</div></div>
        {gs.decisions.length>0&&(<div style={{marginTop:20}}><div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.muted,marginBottom:6}}>Your Decisions</div>{gs.decisions.map((d,i)=><div key={i} style={{fontSize:12,color:B.body,padding:"4px 0",borderBottom:`1px solid ${B.ltTeal}`}}>{d}</div>)}</div>)}
      </div>
    </div>);
  }

  /* ── RESULTS ── */
  if(phase==="results"&&gs&&results) {
    const startPos = gs.history[0].positions;
    const endPos = gs.positions;
    const totalGain = results.finalValue - 500000;
    const classContrib = CLASSES.map(c => {
      const startVal = (startPos[c.id+"_core"]||0) + (startPos[c.id+"_sat"]||0);
      const endVal = (endPos[c.id+"_core"]||0) + (endPos[c.id+"_sat"]||0);
      return { cls:c, start:startVal, end:endVal, contrib:endVal - startVal };
    }).filter(x => x.start > 0 || x.end > 0);
    const startCash = gs.history[0].cash;
    const cashContrib = gs.cash - startCash - (gs.cumulativeIncome||0);
    const maxContrib = Math.max(...classContrib.map(x=>Math.abs(x.contrib)), Math.abs(cashContrib), 1);
    const coreStart = CLASSES.reduce((a,c)=>(a+(startPos[c.id+"_core"]||0)),0);
    const coreEnd = CLASSES.reduce((a,c)=>(a+(endPos[c.id+"_core"]||0)),0);
    const satDeployed = gs.satelliteDeployed||0;
    const satEnd = CLASSES.reduce((a,c)=>(a+(endPos[c.id+"_sat"]||0)),0);
    const cumIncome = gs.cumulativeIncome||0;
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
          <Stat label="Worst Year" value={`${results.worstYear}%`} sub={parseFloat(results.worstYear)>=0?"Smallest gain":"Largest single-year decline"} color={parseFloat(results.worstYear)<-10?B.red:parseFloat(results.worstYear)<0?B.warn:B.teal}/>
          <Stat label="Total Income" value={fmt(cumIncome)} sub="From credit and real estate" color={B.teal}/>
        </div>
        <Chart history={gs.history} decisions={gs.decisions}/>
        <div style={{margin:"20px 0",background:B.cream,borderRadius:8,padding:"18px 20px"}}>
          <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.muted,marginBottom:12}}>Returns Attribution</div>
          {classContrib.map(({cls,start,end,contrib})=>{const pct=totalGain!==0?Math.round((contrib/totalGain)*100):0;const barW=Math.round((Math.abs(contrib)/maxContrib)*100);return(
            <div key={cls.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${B.ltTeal}`}}>
              <div style={{display:"flex",alignItems:"center",gap:6,minWidth:110}}><span style={{width:8,height:8,borderRadius:2,background:cls.color,display:"inline-block",flexShrink:0}}/><span style={{fontSize:13,fontWeight:500,color:B.darkTeal}}>{cls.name}</span></div>
              <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:6,background:B.ltTeal,borderRadius:3,position:"relative"}}><div style={{position:"absolute",top:0,left:contrib>=0?0:undefined,right:contrib<0?0:undefined,height:"100%",width:`${barW}%`,background:contrib>=0?cls.color:B.red,borderRadius:3,opacity:.7}}/></div></div>
              <div style={{textAlign:"right",minWidth:70}}><span style={{fontSize:13,fontWeight:600,color:contrib>=0?B.teal:B.red}}>{contrib>=0?"+":""}{fmt(contrib)}</span></div>
              <div style={{textAlign:"right",minWidth:36}}><span style={{fontSize:11,color:B.muted}}>{totalGain!==0?`${pct}%`:"\u2014"}</span></div>
            </div>);})}
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,minWidth:110}}><span style={{width:8,height:8,borderRadius:2,background:B.muted,display:"inline-block",flexShrink:0}}/><span style={{fontSize:13,fontWeight:500,color:B.darkTeal}}>Cash</span></div>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:6,background:B.ltTeal,borderRadius:3,position:"relative"}}>{cashContrib!==0&&<div style={{position:"absolute",top:0,right:0,height:"100%",width:`${Math.round((Math.abs(cashContrib)/maxContrib)*100)}%`,background:B.red,borderRadius:3,opacity:.7}}/>}</div></div>
            <div style={{textAlign:"right",minWidth:70}}><span style={{fontSize:13,fontWeight:600,color:cashContrib<=0?B.muted:B.teal}}>{fmt(cashContrib)}</span></div>
            <div style={{textAlign:"right",minWidth:36}}><span style={{fontSize:11,color:B.muted}}>{"\u2014"}</span></div>
          </div>
        </div>
        <div style={{margin:"20px 0",background:B.cream,borderRadius:8,padding:"18px 20px"}}>
          <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.muted,marginBottom:12}}>Core vs. Satellite vs. Income</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:"0",fontSize:13}}>
            <div style={{padding:"6px 0",borderBottom:`1px solid ${B.ltTeal}`,fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".1em",color:B.muted}}></div>
            <div style={{padding:"6px 8px",borderBottom:`1px solid ${B.ltTeal}`,fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".1em",color:B.muted,textAlign:"right"}}>Start</div>
            <div style={{padding:"6px 8px",borderBottom:`1px solid ${B.ltTeal}`,fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".1em",color:B.muted,textAlign:"right"}}>End</div>
            <div style={{padding:"6px 0 6px 8px",borderBottom:`1px solid ${B.ltTeal}`,fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".1em",color:B.muted,textAlign:"right"}}>Return</div>
            <div style={{padding:"8px 0",borderBottom:`1px solid ${B.ltTeal}`,color:B.darkTeal,fontWeight:500}}>Core <span style={{fontSize:11,color:B.muted,fontWeight:400}}>(diversified funds)</span></div>
            <div style={{padding:"8px 8px",borderBottom:`1px solid ${B.ltTeal}`,textAlign:"right",color:B.body}}>{fmt(coreStart)}</div>
            <div style={{padding:"8px 8px",borderBottom:`1px solid ${B.ltTeal}`,textAlign:"right",color:B.body}}>{fmt(coreEnd)}</div>
            <div style={{padding:"8px 0 8px 8px",borderBottom:`1px solid ${B.ltTeal}`,textAlign:"right",fontWeight:600,color:coreEnd>=coreStart?B.teal:B.red}}>{coreStart>0?pctFmt(((coreEnd-coreStart)/coreStart)*100):"\u2014"}</div>
            <div style={{padding:"8px 0",borderBottom:`1px solid ${B.ltTeal}`,color:B.darkTeal,fontWeight:500}}>Satellite <span style={{fontSize:11,color:B.muted,fontWeight:400}}>(direct deals)</span></div>
            <div style={{padding:"8px 8px",borderBottom:`1px solid ${B.ltTeal}`,textAlign:"right",color:B.body}}>{satDeployed>0?fmt(satDeployed):"\u2014"}</div>
            <div style={{padding:"8px 8px",borderBottom:`1px solid ${B.ltTeal}`,textAlign:"right",color:B.body}}>{satEnd>0?fmt(satEnd):"\u2014"}</div>
            <div style={{padding:"8px 0 8px 8px",borderBottom:`1px solid ${B.ltTeal}`,textAlign:"right",fontWeight:600,color:satDeployed>0&&satEnd>=satDeployed?B.teal:satDeployed>0?B.red:B.muted}}>{satDeployed>0?pctFmt(((satEnd-satDeployed)/satDeployed)*100):"\u2014"}</div>
            <div style={{padding:"8px 0",color:B.darkTeal,fontWeight:500}}>Income <span style={{fontSize:11,color:B.muted,fontWeight:400}}>(cumulative distributions)</span></div>
            <div style={{padding:"8px 8px",textAlign:"right",color:B.muted}}>{"\u2014"}</div>
            <div style={{padding:"8px 8px",textAlign:"right",color:B.body}}>{fmt(cumIncome)}</div>
            <div style={{padding:"8px 0 8px 8px",textAlign:"right",color:B.muted}}>{"\u2014"}</div>
          </div>
        </div>
        {gs.concentrationPenalty && (() => {
          const penCls = CLASSES.find(c => c.id === gs.concentrationPenalty);
          if (!penCls) return null;
          const satKey = penCls.id + "_sat";
          const actualValue = gs.positions[satKey] || 0;
          /* Find the year concentration was accepted (Y6) and compute years of drag */
          const concYear = 6;
          const yearsOfDrag = Math.max(0, (gs.history.length - 1) - concYear);
          const theoretical = yearsOfDrag > 0 ? actualValue / Math.pow(0.92, yearsOfDrag) : actualValue;
          const dragCost = Math.round(theoretical - actualValue);
          return dragCost > 0 ? (
            <div style={{margin:"20px 0",background:"#fdf0ed",borderRadius:8,padding:"18px 20px"}}>
              <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.red,marginBottom:8}}>Concentration Impact</div>
              <div style={{fontSize:13,color:B.body,lineHeight:1.6}}>
                You accepted concentration in {penCls.name} at Year 6. The 8% annual performance drag compounded over {yearsOfDrag} year{yearsOfDrag!==1?"s":""}, reducing your {penCls.name} satellite position by an estimated <span style={{fontWeight:600,color:B.red}}>{"\u2212"}{fmt(dragCost)}</span>.
              </div>
            </div>
          ) : null;
        })()}
        <FrameworkReveal positions={gs.positions} cash={gs.cash} concentrationPenalty={gs.concentrationPenalty}/>
        <div style={{display:"flex",gap:10}}><Btn primary onClick={rerunSim} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center"}}><span>Rerun Simulation</span><span style={{fontSize:11,fontWeight:400,opacity:.7,marginTop:2}}>Same allocation, different markets</span></Btn><Btn onClick={resetAll} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center"}}><span>Start Over</span><span style={{fontSize:11,fontWeight:400,opacity:.7,marginTop:2}}>Choose a new allocation</span></Btn></div>
        {gs.decisions.length>0&&(<div style={{marginTop:20}}><div style={{fontSize:11,color:B.teal,cursor:"pointer",fontWeight:500}} onClick={()=>setShowLog(!showLog)}>{showLog?"Hide decision log":"View decision log"}</div>{showLog&&(<div style={{marginTop:8,background:B.cream,borderRadius:8,padding:"12px 16px"}}>{gs.decisions.map((d,i)=>(<div key={i} style={{fontSize:12,color:B.body,padding:"4px 0",borderBottom:i<gs.decisions.length-1?`1px solid ${B.ltTeal}`:"none"}}>{d}</div>))}</div>)}</div>)}
        <div style={{marginTop:28,fontSize:11,color:B.muted,lineHeight:1.5}}>
          <div>Simulated performance for educational purposes only. Past performance, real or simulated, does not guarantee future results. All investments involve risk, including possible loss of principal.</div>
          <div style={{borderTop:`1px solid ${B.ltTeal}`,marginTop:10,paddingTop:10,fontSize:10,color:B.muted,opacity:0.7}}>Simulation parameters derived from the Preqin Private Capital Quarterly Index and Preqin Benchmarks fund-level performance data. Does not represent any specific investment product, fund, or strategy. Does not account for fees, expenses, or taxes.</div>
        </div>
      </div>
    </div>);
  }

  return <div style={{fontFamily:font,padding:40,textAlign:"center",color:B.muted}}>Loading...</div>;
}
