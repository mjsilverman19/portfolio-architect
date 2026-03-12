import { useState, useRef } from "react";

/* ── Brand ── */
const B = {
  darkTeal: "#002e30", teal: "#014a4c", lime: "#dffa46", mint: "#a3f5c5",
  cream: "#f6f4f1", ltTeal: "#e6eded", gray: "#f8f8f8", body: "#3a3d42",
  white: "#fff", muted: "#7a7d82", red: "#c0392b", warn: "#e67e22", green: "#1a7a4c",
};
const font = '"Linik Sans", system-ui, sans-serif';
const fmt = (n) => { if (Math.abs(n) >= 1e6) return `$${(n/1e6).toFixed(2)}M`; if (Math.abs(n) >= 1e3) return `$${(n/1e3).toFixed(0)}K`; return `$${Math.round(n)}`; };
const pctFmt = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
const rnd = (lo, hi) => Math.random() * (hi - lo) + lo;

/* ── Assets ── */
const ASSETS = [
  { id:"pe", name:"Private Equity", short:"PE", color:"#2d5be3", jCurve:true, lockup:5, income:false, incomeRate:0, ret:.72, vol:.82,
    desc:"Funds that seek to buy, improve, and sell private companies over long holding periods.",
    edu:"Private equity funds use investor capital to acquire companies, improve their operations, and eventually sell them. In the early years, returns are typically negative as capital is deployed and fees accrue\u2014this is sometimes called the J-curve. The payoff tends to come in years 4 through 8. Your capital is committed for the full life of the fund; early exits typically require selling at a meaningful discount.",
    traits:["Returns are typically negative in years 1\u20133","No income during the holding period","Performance varies widely between fund managers"] },
  { id:"pc", name:"Private Credit", short:"PC", color:"#1a9a6f", jCurve:false, lockup:2, income:true, incomeRate:0.07, ret:.35, vol:.22,
    desc:"Lending that takes place outside of banks, seeking to generate regular interest income for investors.",
    edu:"Private credit is lending that happens outside the traditional banking system. Funds provide capital and earn interest in return, usually paid quarterly. Many loans carry rates that adjust with the broader market, so income tends to rise when rates increase. The main risk is borrower default\u2014uncommon in strong economies but more frequent during downturns.",
    traits:["Regular income (~7% annually)","Interest rates adjust with the market","Lower volatility, but real risk of borrower default"] },
  { id:"re", name:"Real Estate", short:"RE", color:"#d4820a", jCurve:true, lockup:4, income:true, incomeRate:0.04, ret:.52, vol:.58,
    desc:"Investments in commercial and residential properties that seek to generate rental income and grow in value over time.",
    edu:"Real estate funds invest in properties and earn returns through rental income and increases in property value. Rental income provides a steady baseline, but property values are sensitive to interest rates\u2014when rates rise, values tend to fall. Inflation can be positive because rents can be raised over time, though rapid rate increases may more than offset that benefit.",
    traits:["Rental income plus potential property value growth","Rents can rise with inflation","Property values are sensitive to interest rate changes"] },
  { id:"vc", name:"Venture Capital", short:"VC", color:"#8b5cf6", jCurve:true, lockup:7, income:false, incomeRate:0, ret:.90, vol:.95,
    desc:"Investments in early-stage companies where funds seek outsized returns from a small number of successes.",
    edu:"Venture capital funds invest in startups and early-stage companies. Most companies in a fund will fail or return very little, while a small number of successes drive the majority of performance. Early returns are typically negative for 3 to 4 years. Capital is committed for the longest period of any private market asset class, often 7 to 10 years, and performance is closely tied to the technology sector.",
    traits:["A small number of winners drive most returns","Returns are typically negative for 3\u20134 years","Performance is closely tied to the technology sector"] },
  { id:"infra", name:"Infrastructure", short:"INFRA", color:"#0891b2", jCurve:false, lockup:5, income:true, incomeRate:0.05, ret:.28, vol:.12,
    desc:"Investments in essential physical assets like energy systems and transportation that seek to produce steady, contracted income.",
    edu:"Infrastructure funds invest in physical assets that people and businesses rely on every day: power grids, toll roads, data centers, and pipelines. Revenue is generated through long-term contracts, many of which include built-in price increases tied to inflation. This makes income among the most predictable in private markets, but the trade-off is a lower return ceiling\u2014infrastructure tends to underperform riskier asset classes in strong markets.",
    traits:["Predictable income from long-term contracts","Built-in inflation protection","Lower return potential in strong markets"] },
];

/* ── Environments ── */
const ENVS = [
  { id:"boom", label:"Economic Expansion", m:{ pe:1.28, pc:1.04, re:1.18, vc:1.45, infra:1.04 }},
  { id:"recession", label:"Recession", m:{ pe:0.72, pc:0.93, re:0.76, vc:0.52, infra:0.97 }},
  { id:"rate_hike", label:"Rate Hike Cycle", m:{ pe:0.91, pc:1.09, re:0.82, vc:0.86, infra:1.02 }},
  { id:"rate_cut", label:"Rate Cuts Begin", m:{ pe:1.10, pc:0.96, re:1.14, vc:1.18, infra:1.01 }},
  { id:"tech_surge", label:"Tech Sector Surge", m:{ pe:1.06, pc:1.0, re:1.0, vc:1.55, infra:0.99 }},
  { id:"credit_crunch", label:"Credit Crunch", m:{ pe:0.82, pc:0.86, re:0.86, vc:0.72, infra:0.96 }},
  { id:"steady", label:"Stable Growth", m:{ pe:1.07, pc:1.04, re:1.05, vc:1.08, infra:1.03 }},
  { id:"inflation", label:"Inflation Spike", m:{ pe:0.94, pc:1.01, re:1.09, vc:0.82, infra:1.07 }},
];
function pickEnv(){ const r=Math.random(); if(r<.12) return ENVS[1]; if(r<.22) return ENVS[2]; if(r<.32) return ENVS[3]; if(r<.39) return ENVS[4]; if(r<.45) return ENVS[5]; if(r<.52) return ENVS[7]; if(r<.68) return ENVS[0]; return ENVS[6]; }

/* ── Simulation engine (pure functions) ── */
function simYear(st, env) {
  const newAlloc = {};
  let yearInc = 0;
  ASSETS.forEach(a => {
    let v = st.alloc[a.id];
    if (v <= 0) { newAlloc[a.id] = 0; return; }
    const mult = env.m[a.id] * rnd(0.94, 1.06);
    let j = 1;
    if (a.jCurve && st.year < 2) j = 0.90;
    else if (a.jCurve && st.year === 2) j = 0.96;
    if (a.id === "pe" && st.penaltyPe) j *= 0.95;
    if (a.id === "pc" && st.distressedBonus && st.year >= 3 && st.year <= 6) j *= 1.08;
    if (a.income && st.deferralPenalty && st.year >= 9) j *= 0.85;
    v = Math.max(0, v * mult * j);
    if (a.income) yearInc += v * a.incomeRate * rnd(0.8, 1.1);
    newAlloc[a.id] = v;
  });
  return { alloc: newAlloc, income: yearInc };
}

function buildDecision(st) {
  /* Y2: Capital Call */
  if (st.year === 2 && st.alloc.pe > 0) {
    const cost = Math.round(st.alloc.pe * 0.15);
    return {
      title: "Capital Call",
      body: `Your private equity fund manager is requesting ${fmt(cost)} in additional capital for a new round of investments. Funding this maintains your commitment to the fund and increases your PE exposure. Declining means forfeiting this allocation.`,
      options: [
        { id:"fund", label:"Fund the Call", disabled: st.cash < cost, apply: (s) => ({...s, cash:s.cash-cost, alloc:{...s.alloc, pe:s.alloc.pe+cost}, capitalCallFunded:true, decisions:[...s.decisions, `Funded PE capital call (${fmt(cost)}) Y2`]}) },
        { id:"decline", label:"Decline", disabled:false, apply: (s) => ({...s, penaltyPe:true, capitalCallFunded:false, decisions:[...s.decisions,"Declined PE capital call Y2"]}) },
      ],
      lowCashNote: st.cash < cost ? `This call requires ${fmt(cost)}. Your current cash reserves are ${fmt(st.cash)}.` : null,
    };
  }
  /* Y3: Branched — funded path gets distressed opportunity, declined path gets co-invest */
  if (st.year === 3 && st.capitalCallFunded === true) {
    return {
      title: "Distressed Investment Opportunity",
      body: `A credit fund is offering access to loans purchased at a steep discount during the current market downturn. The minimum investment is $75K. Discounted purchases can produce strong returns as markets recover, but deploying cash now reduces your reserves at a volatile point in the cycle.`,
      options: st.cash >= 75000 ? [
        { id:"deploy", label:"Invest $75K", disabled:false, apply: (s) => ({...s, cash:s.cash-75000, alloc:{...s.alloc, pc:s.alloc.pc+75000}, distressedBonus:true, decisions:[...s.decisions,"Invested $75K into distressed credit Y3"]}) },
        { id:"hold", label:"Pass", disabled:false, apply: (s) => ({...s, decisions:[...s.decisions,"Passed on distressed opportunity Y3"]}) },
      ] : [
        { id:"cant", label:"Pass \u2014 Insufficient Cash", disabled:false, apply: (s) => ({...s, decisions:[...s.decisions,"Had no reserves for distressed opportunity Y3"]}) },
      ],
      lowCashNote: st.cash < 75000 ? `This opportunity requires $75K. Your current reserves are ${fmt(st.cash)}.` : null,
    };
  }
  if (st.year === 3 && st.capitalCallFunded === false) {
    return {
      title: "Co-Investment Opportunity",
      body: `Your PE fund manager, despite the declined capital call, is offering a smaller co-investment in a direct deal. The minimum is $50K. This bypasses the fund structure and its fees, giving you direct exposure to a single company at a lower cost basis.`,
      options: st.cash >= 50000 ? [
        { id:"coinvest", label:"Invest $50K", disabled:false, apply: (s) => ({...s, cash:s.cash-50000, alloc:{...s.alloc, pe:s.alloc.pe+50000}, decisions:[...s.decisions,"Co-invested $50K directly into PE deal Y3"]}) },
        { id:"decline", label:"Decline", disabled:false, apply: (s) => ({...s, decisions:[...s.decisions,"Declined co-investment opportunity Y3"]}) },
      ] : [
        { id:"cant", label:"Decline \u2014 Insufficient Cash", disabled:false, apply: (s) => ({...s, decisions:[...s.decisions,"Had no reserves for co-investment Y3"]}) },
      ],
      lowCashNote: st.cash < 50000 ? `This opportunity requires $50K. Your current reserves are ${fmt(st.cash)}.` : null,
    };
  }
  if (st.year === 3 && st.capitalCallFunded === null) {
    /* Fallback: no PE allocated, capital call was skipped — show distressed opportunity */
    return {
      title: "Distressed Investment Opportunity",
      body: `A credit fund is offering access to loans purchased at a steep discount during the current market downturn. The minimum investment is $75K. Discounted purchases can produce strong returns as markets recover, but deploying cash now reduces your reserves at a volatile point in the cycle.`,
      options: st.cash >= 75000 ? [
        { id:"deploy", label:"Invest $75K", disabled:false, apply: (s) => ({...s, cash:s.cash-75000, alloc:{...s.alloc, pc:s.alloc.pc+75000}, distressedBonus:true, decisions:[...s.decisions,"Invested $75K into distressed credit Y3"]}) },
        { id:"hold", label:"Pass", disabled:false, apply: (s) => ({...s, decisions:[...s.decisions,"Passed on distressed opportunity Y3"]}) },
      ] : [
        { id:"cant", label:"Pass \u2014 Insufficient Cash", disabled:false, apply: (s) => ({...s, decisions:[...s.decisions,"Had no reserves for distressed opportunity Y3"]}) },
      ],
      lowCashNote: st.cash < 75000 ? `This opportunity requires $75K. Your current reserves are ${fmt(st.cash)}.` : null,
    };
  }
  /* Y5: Early Exit Offer */
  if (st.year === 5 && (st.alloc.vc > 0 || st.alloc.pe > 0)) {
    const target = st.alloc.vc > 0 ? "vc" : "pe";
    const tName = target === "vc" ? "Venture Capital" : "Private Equity";
    const disc = target === "vc" ? 0.75 : 0.80;
    const proceeds = Math.round(st.alloc[target] * disc);
    return {
      title: "Early Exit Offer",
      body: `A buyer has offered to purchase your ${tName} position at ${fmt(proceeds)}, representing a ${Math.round((1-disc)*100)}% discount to its current estimated value. Selling provides immediate liquidity. Holding maintains exposure to an asset class approaching its primary value-creation period.`,
      options: [
        { id:"sell", label:`Sell for ${fmt(proceeds)}`, disabled:false, apply: (s) => ({...s, cash:s.cash+proceeds, alloc:{...s.alloc,[target]:0}, earlyExitSold:true, decisions:[...s.decisions, `Sold ${target.toUpperCase()} on secondary for ${fmt(proceeds)} Y5`]}) },
        { id:"hold", label:"Hold", disabled:false, apply: (s) => ({...s, earlyExitSold:false, decisions:[...s.decisions, `Held ${target.toUpperCase()} through Y5`]}) },
      ],
    };
  }
  /* Y6: Redeploy Proceeds — only if sold at Y5 */
  if (st.year === 6 && st.earlyExitSold === true) {
    const redeployAmt = Math.round(st.cash * 0.6);
    const total = Object.values(st.alloc).reduce((a,b)=>a+b,0);
    const sorted = total > 0 ? ASSETS.map(a=>({...a, val:st.alloc[a.id], p:st.alloc[a.id]/total})).sort((a,b)=>a.p-b.p) : ASSETS.map(a=>({...a, val:0, p:0}));
    const target = sorted[0];
    return {
      title: "Redeploy Sale Proceeds",
      body: `You have ${fmt(st.cash)} in cash from the secondary sale. You can redeploy ${fmt(redeployAmt)} into ${target.name}, your smallest position, or hold it as reserves heading into the second half of the simulation.`,
      options: redeployAmt > 0 ? [
        { id:"redeploy", label:`Redeploy ${fmt(redeployAmt)} into ${target.short}`, disabled:false, apply: (s) => ({...s, cash:s.cash-redeployAmt, alloc:{...s.alloc,[target.id]:s.alloc[target.id]+redeployAmt}, decisions:[...s.decisions, `Redeployed ${fmt(redeployAmt)} into ${target.short} Y6`]}) },
        { id:"hold", label:"Hold as Cash", disabled:false, apply: (s) => ({...s, decisions:[...s.decisions,"Held sale proceeds as cash Y6"]}) },
      ] : [
        { id:"hold", label:"Hold as Cash", disabled:false, apply: (s) => ({...s, decisions:[...s.decisions,"Held sale proceeds as cash Y6"]}) },
      ],
    };
  }
  /* Y7: Income Reinvestment */
  if (st.year === 7 && st.totalIncome > 5000) {
    const inc = Math.round(st.totalIncome);
    return {
      title: "Income Reinvestment",
      body: `You have received ${fmt(inc)} in income payments from your credit and real asset holdings. You can reinvest this amount to grow your portfolio, or take it as cash to strengthen your reserves.`,
      options: [
        { id:"reinvest", label:"Reinvest", disabled:false, apply: (s) => { const half=Math.round(s.totalIncome/2); return {...s, alloc:{...s.alloc, pc:s.alloc.pc+half, infra:s.alloc.infra+(s.totalIncome-half)}, totalIncome:0, incomeReinvested:true, decisions:[...s.decisions, `Reinvested ${fmt(inc)} in distributions Y7`]}; }},
        { id:"cash", label:"Take Cash", disabled:false, apply: (s) => ({...s, cash:s.cash+s.totalIncome, totalIncome:0, incomeReinvested:false, decisions:[...s.decisions, `Took ${fmt(inc)} distributions as cash Y7`]}) },
      ],
    };
  }
  /* Y8: Branched — reinvested path gets liquidity crunch, cash path gets new fund opportunity */
  if (st.year === 8 && st.incomeReinvested === true) {
    const sorted = ASSETS.map(a=>({...a, val:st.alloc[a.id]})).filter(a=>a.val>0).sort((a,b)=>a.val-b.val);
    const sellTarget = sorted[0] || ASSETS[0];
    const sellProceeds = Math.round(sellTarget.val * 0.80);
    return {
      title: "Liquidity Crunch",
      body: `A capital commitment is coming due and your portfolio is heavily invested with limited reserves. You reinvested your income, leaving little liquidity. You can sell your ${sellTarget.name} position on the secondary market at a 20% discount to raise ${fmt(sellProceeds)}, or request a deferral from the fund manager, which may reduce your priority in future distributions.`,
      options: [
        { id:"sell", label:`Sell ${sellTarget.short} for ${fmt(sellProceeds)}`, disabled:false, apply: (s) => ({...s, cash:s.cash+sellProceeds, alloc:{...s.alloc,[sellTarget.id]:0}, decisions:[...s.decisions, `Sold ${sellTarget.short} at 20% discount for ${fmt(sellProceeds)} Y8`]}) },
        { id:"defer", label:"Request Deferral", disabled:false, apply: (s) => ({...s, deferralPenalty:true, decisions:[...s.decisions,"Requested deferral \u2014 reduced distribution priority Y8"]}) },
      ],
    };
  }
  if (st.year === 8 && st.incomeReinvested === false) {
    return {
      title: "New Fund Opportunity",
      body: `A top-quartile fund is raising its next vintage with favorable terms for early commitments. With ${fmt(st.cash)} in reserves, you have the option to commit $60K. This deploys cash into a new position but reduces your remaining liquidity.`,
      options: st.cash >= 60000 ? [
        { id:"commit", label:"Commit $60K", disabled:false, apply: (s) => { const target = s.alloc.pe <= s.alloc.vc ? "pe" : "vc"; return {...s, cash:s.cash-60000, alloc:{...s.alloc,[target]:s.alloc[target]+60000}, decisions:[...s.decisions, `Committed $60K to new ${target.toUpperCase()} fund Y8`]}; }},
        { id:"pass", label:"Pass", disabled:false, apply: (s) => ({...s, decisions:[...s.decisions,"Passed on new fund opportunity Y8"]}) },
      ] : [
        { id:"cant", label:"Pass \u2014 Insufficient Cash", disabled:false, apply: (s) => ({...s, decisions:[...s.decisions,"Had insufficient cash for new fund Y8"]}) },
      ],
      lowCashNote: st.cash < 60000 ? `This commitment requires $60K. Your current reserves are ${fmt(st.cash)}.` : null,
    };
  }
  /* Y9: Portfolio Concentration (unchanged, all paths reconverge) */
  if (st.year === 9) {
    const total = Object.values(st.alloc).reduce((a,b)=>a+b,0);
    if (total <= 0) return null;
    const sorted = ASSETS.map(a=>({...a, val:st.alloc[a.id], p:st.alloc[a.id]/total})).sort((a,b)=>b.p-a.p);
    const top = sorted[0];
    const bottom = sorted.filter(s=>s.val>0).pop() || sorted[sorted.length-1];
    if (top.id === bottom.id) return null;
    const moveAmt = Math.round(top.val * 0.2);
    return {
      title: "Portfolio Concentration",
      body: `Market movement over the past several years has shifted your portfolio. ${top.name} now makes up ${Math.round(top.p*100)}% of your total allocation. You can move ${fmt(moveAmt)} into ${bottom.name} to spread your risk, or keep your current positioning.`,
      options: [
        { id:"rebalance", label:"Rebalance", disabled:false, apply: (s) => ({...s, alloc:{...s.alloc,[top.id]:s.alloc[top.id]-moveAmt,[bottom.id]:s.alloc[bottom.id]+moveAmt}, decisions:[...s.decisions, `Rebalanced ${fmt(moveAmt)} from ${top.short} to ${bottom.short} Y9`]}) },
        { id:"hold", label:"Keep Current Position", disabled:false, apply: (s) => ({...s, decisions:[...s.decisions, "Kept current position Y9"]}) },
      ],
    };
  }
  return null;
}

function buildNarrative(st) {
  const parts = [];
  if (st.capitalCallFunded === true) parts.push("funded the capital call");
  else if (st.capitalCallFunded === false) parts.push("declined the capital call");
  if (st.earlyExitSold === true) parts.push("sold early for liquidity");
  else if (st.earlyExitSold === false) parts.push("held through the exit offer");
  if (st.incomeReinvested === true) parts.push("reinvested income for growth");
  else if (st.incomeReinvested === false) parts.push("took cash for flexibility");
  if (parts.length === 0) return null;
  return `You ${parts.join(", ")}.`;
}

function advanceUntilDecision(initState) {
  let st = { ...initState };
  let summary = null;
  let decision = null;
  while (st.year < 10) {
    const env = st.envs[st.year];
    const { alloc: newAlloc, income } = simYear(st, env);
    const prevTotal = st.history[st.history.length - 1].totalPortfolio;
    st = { ...st, year: st.year + 1, alloc: newAlloc, totalIncome: st.totalIncome + income };
    const totalPort = Object.values(st.alloc).reduce((a,b)=>a+b,0) + st.cash;
    st.history = [...st.history, { year:st.year, alloc:{...st.alloc}, cash:st.cash, totalPortfolio:totalPort, env }];
    const d = buildDecision(st);
    if (d) { summary = { year:st.year, env, totalPortfolio:totalPort, prevTotal }; decision = d; break; }
  }
  return { state: st, summary, decision, done: st.year >= 10 && !decision };
}

function calcScore(hist, decisions) {
  if (hist.length < 2) return null;
  const s = hist[0].totalPortfolio, e = hist[hist.length-1].totalPortfolio;
  const ret = (e-s)/s;
  const vals = hist.map(h=>h.totalPortfolio);
  let mdd=0, pk=vals[0];
  for(const v of vals){if(v>pk)pk=v; const d=(pk-v)/pk; if(d>mdd)mdd=d;}
  const la = hist[hist.length-1].alloc;
  const at = Object.values(la).reduce((a,b)=>a+b,0);
  const act = Object.values(la).filter(v=>v>0).length;
  const mc = at>0?Math.max(...Object.values(la))/at:1;
  let ds = Math.min(100,act*22); if(mc>.5)ds*=.55; else if(mc>.35)ds*=.75;
  const rs = Math.min(100,Math.max(0,ret*180));
  const rk = Math.max(0,100-mdd*280);
  const db = Math.min(15,decisions.length*3);
  const ov = Math.min(100,Math.round(ds*.25+rs*.35+rk*.25+db));
  return { totalReturn:(ret*100).toFixed(1), finalValue:e, maxDrawdown:(mdd*100).toFixed(1), divScore:Math.round(ds), retScore:Math.round(rs), riskScore:Math.round(rk), overall:ov, grade:ov>=85?"A":ov>=70?"B":ov>=55?"C":ov>=40?"D":"F" };
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
const AllocBar = ({alloc})=>{ const t=Object.values(alloc).reduce((a,b)=>a+b,0); if(t<=0) return null; return(<div style={{display:"flex",borderRadius:5,overflow:"hidden",height:8,background:"#eee"}}>{ASSETS.map(a=>{const p=(alloc[a.id]/t)*100;return p>0?<div key={a.id} style={{width:`${p}%`,background:a.color,transition:"width .4s"}}/>:null;})}</div>);};

const PieChart = ({alloc, reserve})=>{
  const total = 500000;
  const r = 72, cx = 90, cy = 90, sw = 36;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = ASSETS.map(a=>{
    const pct = alloc[a.id] / total;
    const dash = pct * circ;
    const gap = circ - dash;
    const o = offset;
    offset += dash;
    return { ...a, pct, dash, gap, offset: o };
  }).filter(s => s.pct > 0);
  const cashPct = Math.max(0, reserve) / total;
  const cashDash = cashPct * circ;
  return(
    <div style={{display:"flex",alignItems:"center",gap:24,justifyContent:"center",marginBottom:12}}>
      <svg width={180} height={180} viewBox="0 0 180 180">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eaeaea" strokeWidth={sw}/>
        {slices.map(s=>(
          <circle key={s.id} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={sw}
            strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={-s.offset}
            transform={`rotate(-90 ${cx} ${cy})`} style={{transition:"all .4s"}}/>
        ))}
        {cashPct>0&&<circle cx={cx} cy={cy} r={r} fill="none" stroke={B.ltTeal} strokeWidth={sw}
          strokeDasharray={`${cashDash} ${circ-cashDash}`} strokeDashoffset={-offset}
          transform={`rotate(-90 ${cx} ${cy})`} style={{transition:"all .4s"}}/>}
        <text x={cx} y={cy-6} textAnchor="middle" fontSize={16} fontWeight={600} fill={B.darkTeal} fontFamily={font}>{fmt(total-Math.max(0,reserve))}</text>
        <text x={cx} y={cy+12} textAnchor="middle" fontSize={11} fill={B.muted} fontFamily={font}>invested</text>
      </svg>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {ASSETS.map(a=>{
          const pct = ((alloc[a.id]/total)*100).toFixed(0);
          return alloc[a.id]>0?(
            <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:B.body}}>
              <span style={{width:10,height:10,borderRadius:2,background:a.color,display:"inline-block",flexShrink:0}}/>
              <span style={{fontWeight:600,minWidth:42}}>{a.short}</span>
              <span style={{color:B.muted}}>{pct}%</span>
            </div>
          ):null;
        })}
        {reserve>0&&(
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:B.body}}>
            <span style={{width:10,height:10,borderRadius:2,background:B.ltTeal,display:"inline-block",flexShrink:0}}/>
            <span style={{fontWeight:600,minWidth:42}}>Cash</span>
            <span style={{color:B.muted}}>{((reserve/total)*100).toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Chart = ({history})=>{
  if(history.length<2) return null;
  const w=640,h=170,pad={t:14,r:14,b:26,l:54};
  const cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;
  const vals=history.map(x=>x.totalPortfolio);
  const mn=Math.min(...vals)*.92,mx=Math.max(...vals)*1.06;
  const range=mx-mn||1;
  const pts=vals.map((v,i)=>({x:pad.l+(i/(vals.length-1))*cw,y:pad.t+ch-((v-mn)/range)*ch}));
  const d=pts.map((p,i)=>`${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ");
  const area=d+` L ${pts[pts.length-1].x} ${pad.t+ch} L ${pad.l} ${pad.t+ch} Z`;
  const baseY=pad.t+ch-((history[0].totalPortfolio-mn)/range)*ch;
  return(
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{display:"block"}}>
      {[0,.5,1].map((p,i)=>{const y=pad.t+ch*(1-p);return(<g key={i}><line x1={pad.l} x2={w-pad.r} y1={y} y2={y} stroke="#eaeaea"/><text x={pad.l-5} y={y+3} textAnchor="end" fontSize={9} fill={B.muted}>{fmt(mn+range*p)}</text></g>);})}
      <line x1={pad.l} x2={w-pad.r} y1={baseY} y2={baseY} stroke={B.teal} strokeWidth={1} strokeDasharray="3,3" opacity={.25}/>
      <path d={area} fill={B.teal} opacity={.06}/>
      <path d={d} fill="none" stroke={B.teal} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={i===pts.length-1?4.5:2.5} fill={B.teal} stroke={B.white} strokeWidth={1.5}/>)}
      {history.map((x,i)=><text key={i} x={pad.l+(i/(vals.length-1))*cw} y={pad.t+ch+16} textAnchor="middle" fontSize={9} fill={B.muted}>{i===0?"Start":`Y${x.year}`}</text>)}
    </svg>
  );
};

const RiskReturnChart = ({highlighted})=>{
  const w=320,h=180,pad={t:20,r:20,b:36,l:44};
  const cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;
  return(
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{display:"block"}}>
      <rect x={0} y={0} width={w} height={h} rx={6} fill={B.white}/>
      {[0,.5,1].map((p,i)=>{const y=pad.t+ch*(1-p);return(<g key={i}><line x1={pad.l} x2={w-pad.r} y1={y} y2={y} stroke={B.ltTeal} strokeWidth={.5}/><text x={pad.l-6} y={y+4} textAnchor="end" fontSize={10} fill={B.muted}>{Math.round(p*100)}%</text></g>);})}
      {[0,.5,1].map((p,i)=>{const x=pad.l+cw*p;return(<g key={i}><line x1={x} x2={x} y1={pad.t} y2={pad.t+ch} stroke={B.ltTeal} strokeWidth={.5}/><text x={x} y={pad.t+ch+14} textAnchor="middle" fontSize={10} fill={B.muted}>{["Low","Med","High"][i]}</text></g>);})}
      <text x={pad.l+cw/2} y={h-4} textAnchor="middle" fontSize={10} fill={B.muted}>Volatility</text>
      <text x={10} y={pad.t+ch/2} textAnchor="middle" fontSize={10} fill={B.muted} transform={`rotate(-90,10,${pad.t+ch/2})`}>Return</text>
      {ASSETS.map(a=>{const cx=pad.l+a.vol*cw;const cy=pad.t+(1-a.ret)*ch;const isHl=a.id===highlighted;return(
        <g key={a.id}>
          <circle cx={cx} cy={cy} r={isHl?8:5} fill={a.color} opacity={isHl?1:.25} stroke={isHl?B.darkTeal:"none"} strokeWidth={1.5}/>
          <text x={cx} y={cy-11} textAnchor="middle" fontSize={10} fontWeight={isHl?600:400} fill={isHl?B.darkTeal:B.muted}>{a.short}</text>
        </g>
      );})}
    </svg>
  );
};

const AssetDetail = ({asset})=>(
  <div style={{background:B.cream,borderRadius:8,padding:"16px 18px",marginTop:8,marginBottom:4}}>
    <div style={{maxWidth:320,marginBottom:14}}>
      <RiskReturnChart highlighted={asset.id}/>
    </div>
    <div style={{fontSize:13,color:B.body,lineHeight:1.6,marginBottom:10}}>{asset.edu}</div>
    <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:12}}>
      {asset.traits.map((t,i)=>(
        <div key={i} style={{fontSize:11,color:B.teal,display:"flex",alignItems:"baseline",gap:6}}>
          <span style={{width:4,height:4,borderRadius:1,background:asset.color,flexShrink:0,marginTop:4}}/>
          <span>{t}</span>
        </div>
      ))}
    </div>
    <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
      <div style={{fontSize:11,color:B.muted}}><span style={{fontWeight:600,color:B.darkTeal}}>Lockup:</span> {asset.lockup} years</div>
      <div style={{fontSize:11,color:B.muted}}><span style={{fontWeight:600,color:B.darkTeal}}>Income:</span> {asset.income?`~${(asset.incomeRate*100).toFixed(0)}% annual`:"None"}</div>
      <div style={{fontSize:11,color:B.muted}}><span style={{fontWeight:600,color:B.darkTeal}}>J-Curve:</span> {asset.jCurve?"Yes":"No"}</div>
    </div>
  </div>
);

const EventTag = ({env})=>{
  const neg=["recession","credit_crunch","inflation"].includes(env.id);
  const pos=["boom","tech_surge","rate_cut"].includes(env.id);
  return(<span style={{display:"inline-block",padding:"5px 12px",borderRadius:5,fontSize:12,fontWeight:500,background:neg?"#fdf0ed":pos?"#edfaf2":B.gray,color:neg?B.red:pos?B.green:B.body,marginRight:6,marginBottom:6}}>{env.label}</span>);
};

/* ── App ── */
export default function App() {
  const [phase, setPhase] = useState("intro");
  const [alloc, setAlloc] = useState({pe:100000,pc:100000,re:100000,vc:100000,infra:100000});
  const gsRef = useRef(null);
  const [gs, setGs] = useState(null);
  const [decision, setDecision] = useState(null);
  const [summary, setSummary] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [expandedAsset, setExpandedAsset] = useState(null);

  const totalAlloc = Object.values(alloc).reduce((a,b)=>a+b,0);
  const over = totalAlloc > 500000;
  const reserve = 500000 - totalAlloc;

  function runAdvance(state) {
    const result = advanceUntilDecision(state);
    gsRef.current = result.state;
    setGs(result.state);
    setDecision(result.decision);
    setSummary(result.summary);
    setPhase(result.done ? "results" : "play");
  }

  function startGame() {
    const envs = Array.from({length:10},()=>pickEnv());
    const init = {
      year:0, alloc:{...alloc}, cash:Math.max(0,reserve), totalIncome:0, envs,
      history:[{year:0,alloc:{...alloc},cash:Math.max(0,reserve),totalPortfolio:500000,env:null}],
      decisions:[], penaltyPe:false, distressedBonus:false,
      capitalCallFunded:null, earlyExitSold:null, incomeReinvested:null, deferralPenalty:false,
    };
    runAdvance(init);
  }

  function handleChoice(opt) {
    if(opt.disabled) return;
    const newState = opt.apply(gsRef.current);
    runAdvance(newState);
  }

  function resetAll() {
    setPhase("intro");
    setAlloc({pe:100000,pc:100000,re:100000,vc:100000,infra:100000});
    gsRef.current=null; setGs(null); setDecision(null); setSummary(null); setShowConfirm(false); setExpandedAsset(null);
  }

  const score = phase==="results"&&gs ? calcScore(gs.history,gs.decisions) : null;

  /* ── INTRO ── */
  if(phase==="intro") return(
    <div style={{fontFamily:font,background:B.white,minHeight:"100vh"}}>
      <div style={{background:B.darkTeal,padding:"56px 28px",textAlign:"center"}}>
        <div style={{fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:".2em",color:B.lime,marginBottom:10}}>WILLOW WEALTH</div>
        <h1 style={{color:B.white,fontSize:34,fontWeight:500,margin:"0 0 10px",lineHeight:1.2}}>Portfolio Architect</h1>
        <p style={{color:B.ltTeal,fontSize:15,maxWidth:460,margin:"0 auto 28px",lineHeight:1.6}}>Build a $500K private markets portfolio and manage it through a simulated decade of market conditions, capital calls, and liquidity decisions.</p>
        <Btn primary onClick={()=>setPhase("allocate")} style={{padding:"16px 52px",fontSize:16,borderRadius:8,boxShadow:"0 2px 12px rgba(0,0,0,.25)",letterSpacing:".04em"}}>Begin</Btn>
      </div>
      <div style={{maxWidth:540,margin:"0 auto",padding:"36px 24px"}}>
        {[
          {n:"01",t:"Allocate",d:"Spread your capital across five asset classes. Any amount you choose not to invest is held as a cash reserve."},
          {n:"02",t:"Decide",d:"Several times during the simulation, you will face a decision: fund a new commitment, sell a position early, reinvest income, or rebalance. Each choice reshapes your portfolio going forward."},
          {n:"03",t:"Review",d:"After ten years, see how your portfolio performed and what your decisions cost or gained you. You receive a score based on returns, risk management, and diversification."},
        ].map(s=>(
          <div key={s.n} style={{display:"flex",gap:14,marginBottom:20}}>
            <div style={{fontWeight:600,fontSize:13,color:B.teal,minWidth:28,paddingTop:1}}>{s.n}</div>
            <div><div style={{fontWeight:600,color:B.darkTeal,fontSize:14,marginBottom:3}}>{s.t}</div><div style={{color:B.body,fontSize:13,lineHeight:1.55}}>{s.d}</div></div>
          </div>
        ))}
        <div style={{marginTop:24,padding:14,background:B.cream,borderRadius:8,fontSize:11,color:B.muted,lineHeight:1.5}}>Simulated performance for educational purposes only. Not indicative of actual results or future returns. All investments involve risk, including loss of principal.</div>
      </div>
    </div>
  );

  /* ── ALLOCATE ── */
  const rangeStyle = `input[type="range"]{-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;outline:none;background:#ddd}input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;cursor:pointer;background:var(--thumb-color,#014a4c);border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)}input[type="range"]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;cursor:pointer;background:var(--thumb-color,#014a4c);border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)}`;
  if(phase==="allocate") return(
    <div style={{fontFamily:font,background:B.white,minHeight:"100vh"}}>
      <style>{rangeStyle}</style>
      <div style={{background:B.darkTeal,padding:"20px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".18em",color:B.lime}}>STEP 1</div>
          <div style={{color:B.white,fontSize:18,fontWeight:500,marginTop:3}}>Allocate $500K</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:".1em",color:B.ltTeal}}>Cash Reserve</div>
          <div style={{fontSize:20,fontWeight:500,color:reserve<0?"#ff6b6b":reserve>50000?B.mint:B.lime}}>{fmt(Math.max(0,reserve))}</div>
        </div>
      </div>
      <div style={{maxWidth:560,margin:"0 auto",padding:"28px 24px"}}>
        <PieChart alloc={alloc} reserve={reserve}/>
        {ASSETS.map(a=>{
          const p=((alloc[a.id]/500000)*100).toFixed(0);
          const isOpen=expandedAsset===a.id;
          return(
            <div key={a.id} style={{marginBottom:14,borderBottom:`1px solid ${B.ltTeal}`,paddingBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                <div style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}} onClick={()=>setExpandedAsset(isOpen?null:a.id)}>
                  <span style={{width:10,height:10,borderRadius:2,background:a.color,display:"inline-block",flexShrink:0}}/>
                  <span style={{fontWeight:600,color:B.darkTeal,fontSize:13}}>{a.name}</span>
                  <span style={{fontSize:11,color:B.muted}}>{a.lockup}yr lockup</span>
                  <span style={{fontSize:10,color:B.teal,fontWeight:500,marginLeft:2}}>{isOpen?"\u25B2":"\u25BC"}</span>
                </div>
                <div><span style={{fontWeight:600,color:B.teal,fontSize:14}}>{fmt(alloc[a.id])}</span><span style={{color:B.muted,fontSize:11,marginLeft:5}}>{p}%</span></div>
              </div>
              <input type="range" min={0} max={500000} step={10000} value={alloc[a.id]} onChange={e=>setAlloc(prev=>({...prev,[a.id]:parseInt(e.target.value)}))} style={{width:"100%","--thumb-color":a.color,background:`linear-gradient(to right, ${a.color} ${(alloc[a.id]/500000)*100}%, #ddd ${(alloc[a.id]/500000)*100}%)`}}/>
              {!isOpen&&<div style={{fontSize:11,color:B.muted,marginTop:1,lineHeight:1.4}}>{a.desc} <span style={{color:B.teal,cursor:"pointer",fontWeight:500}} onClick={()=>setExpandedAsset(a.id)}>Learn more</span></div>}
              {isOpen&&<AssetDetail asset={a}/>}
            </div>
          );
        })}
        {reserve===0&&(
          <div style={{background:"#fdf0ed",borderRadius:8,padding:"12px 16px",fontSize:13,color:B.red,marginBottom:12,lineHeight:1.5}}>You have no cash reserves. During the simulation, you will encounter opportunities and obligations that require available cash. With everything invested, you will not be able to respond to them.</div>
        )}
        {reserve>0&&reserve<=500000&&(
          <div style={{background:B.ltTeal,borderRadius:8,padding:"12px 16px",fontSize:13,color:B.teal,marginBottom:12,lineHeight:1.5}}>{fmt(reserve)} held in cash reserves. Reserves earn no return, but they are the only capital available when commitments come due or investment opportunities appear during the simulation.</div>
        )}
        {over&&<div style={{background:"#fdf0ed",borderRadius:8,padding:"12px 16px",fontSize:13,color:B.red,marginBottom:12}}>Over budget by {fmt(totalAlloc-500000)}. Reduce allocations.</div>}
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <Btn onClick={()=>{setShowConfirm(false);setPhase("intro");}}>Back</Btn>
          <Btn primary disabled={over||totalAlloc===0} onClick={()=>setShowConfirm(true)} style={{flex:1}}>Run Simulation</Btn>
        </div>
        {showConfirm&&(
          <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,46,48,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}}>
            <div style={{background:B.cream,borderRadius:12,padding:"32px 28px",maxWidth:440,width:"100%",boxShadow:"0 8px 32px rgba(0,0,0,.2)"}}>
              <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".18em",color:B.teal,marginBottom:6}}>PORTFOLIO REVIEW</div>
              <div style={{fontSize:17,fontWeight:500,color:B.darkTeal,marginBottom:18,lineHeight:1.3}}>Confirm your allocation before entering the simulation.</div>
              <div style={{marginBottom:16}}>
                {ASSETS.map(a=>{
                  const amt=alloc[a.id];
                  if(amt<=0) return null;
                  const pct=((amt/500000)*100).toFixed(0);
                  return(
                    <div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${B.ltTeal}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{width:8,height:8,borderRadius:2,background:a.color,display:"inline-block"}}/>
                        <span style={{fontSize:13,fontWeight:500,color:B.darkTeal}}>{a.name}</span>
                      </div>
                      <div>
                        <span style={{fontSize:13,fontWeight:600,color:B.teal}}>{fmt(amt)}</span>
                        <span style={{fontSize:11,color:B.muted,marginLeft:6}}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{background:B.white,borderRadius:8,padding:"12px 14px",marginBottom:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".1em",color:B.muted}}>Cash Reserves</div>
                    <div style={{fontSize:18,fontWeight:500,color:reserve>0?B.teal:B.red,marginTop:2}}>{fmt(Math.max(0,reserve))}</div>
                  </div>
                  <div style={{fontSize:11,color:B.muted,maxWidth:200,textAlign:"right",lineHeight:1.4}}>{reserve>0?"Available for commitments and new investments during the simulation.":"No available cash. You will not be able to fund new commitments or invest in opportunities that arise."}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <Btn onClick={()=>setShowConfirm(false)} style={{flex:1}}>Go Back</Btn>
                <Btn primary onClick={()=>{setShowConfirm(false);startGame();}} style={{flex:1}}>Confirm and Start</Btn>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ── PLAY ── */
  if(phase==="play"&&gs) {
    const totalPort=Object.values(gs.alloc).reduce((a,b)=>a+b,0)+gs.cash;
    const changeTot=((totalPort-500000)/500000)*100;
    const yearChg=summary?((summary.totalPortfolio-summary.prevTotal)/summary.prevTotal*100):0;
    return(
      <div style={{fontFamily:font,background:B.white,minHeight:"100vh"}}>
        <div style={{background:B.darkTeal,padding:"20px 28px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".18em",color:B.lime}}>YEAR {gs.year} OF 10</div>
              <div style={{color:B.white,fontSize:18,fontWeight:500,marginTop:2}}>Decision Required</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:22,fontWeight:500,color:B.lime}}>{fmt(totalPort)}</div>
              <div style={{fontSize:12,color:changeTot>=0?B.mint:"#ff9f9f"}}>{pctFmt(changeTot)} total</div>
            </div>
          </div>
          <div style={{marginTop:14,height:4,background:"rgba(255,255,255,.12)",borderRadius:2}}>
            <div style={{height:"100%",width:`${(gs.year/10)*100}%`,background:B.lime,borderRadius:2,transition:"width .3s"}}/>
          </div>
        </div>
        <div style={{maxWidth:600,margin:"0 auto",padding:"24px 24px"}}>
          {gs.history.length>1&&<Chart history={gs.history}/>}
          {summary&&(
            <div style={{display:"flex",gap:10,flexWrap:"wrap",margin:"16px 0"}}>
              <Stat label="Portfolio" value={fmt(summary.totalPortfolio)}/>
              <Stat label="This Period" value={pctFmt(yearChg)} color={yearChg>=0?B.green:B.red}/>
              <Stat label="Cash Reserves" value={fmt(gs.cash)} sub={gs.cash<30000?"Low":"Healthy"} color={gs.cash<30000?B.warn:B.teal}/>
            </div>
          )}
          {summary&&summary.env&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.muted,marginBottom:6}}>Market Events</div>
              <div style={{display:"flex",flexWrap:"wrap"}}>{gs.history.filter(h=>h.env).map((h,i)=><EventTag key={i} env={h.env}/>)}</div>
            </div>
          )}
          {decision&&(
            <div style={{background:B.cream,borderRadius:10,padding:"24px 24px",marginBottom:20}}>
              <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".15em",color:B.teal,marginBottom:6}}>DECISION</div>
              <h3 style={{fontSize:19,fontWeight:500,color:B.darkTeal,margin:"0 0 10px"}}>{decision.title}</h3>
              <p style={{fontSize:14,color:B.body,lineHeight:1.6,margin:"0 0 18px"}}>{decision.body}</p>
              {decision.lowCashNote&&(
                <div style={{background:"#fdf0ed",borderRadius:6,padding:"10px 14px",fontSize:13,color:B.red,marginBottom:14,lineHeight:1.5}}>{decision.lowCashNote}</div>
              )}
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {decision.options.map(opt=>(
                  <Btn key={opt.id} primary={opt.id!=="decline"&&opt.id!=="hold"&&opt.id!=="cash"&&opt.id!=="cant"} disabled={opt.disabled} onClick={()=>handleChoice(opt)} style={{flex:"1 1 auto",minWidth:140}}>
                    {opt.label}
                  </Btn>
                ))}
              </div>
            </div>
          )}
          <div style={{marginTop:8}}>
            <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.muted,marginBottom:8}}>Current Allocation</div>
            <AllocBar alloc={gs.alloc}/>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:8}}>
              {ASSETS.map(a=>gs.alloc[a.id]>0?<div key={a.id} style={{fontSize:12,color:B.body}}><span style={{fontWeight:600,color:a.color}}>{a.short}</span> {fmt(gs.alloc[a.id])}</div>:null)}
              {gs.cash>0&&<div style={{fontSize:12,color:B.body}}><span style={{fontWeight:600,color:B.muted}}>CASH</span> {fmt(gs.cash)}</div>}
            </div>
          </div>
          {gs.decisions.length>0&&(
            <div style={{marginTop:20}}>
              <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.muted,marginBottom:6}}>Your Decisions</div>
              {gs.decisions.map((d,i)=><div key={i} style={{fontSize:12,color:B.body,padding:"4px 0",borderBottom:`1px solid ${B.ltTeal}`}}>{d}</div>)}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── RESULTS ── */
  if(phase==="results"&&gs&&score) {
    return(
      <div style={{fontFamily:font,background:B.white,minHeight:"100vh"}}>
        <div style={{background:B.darkTeal,padding:"36px 28px",textAlign:"center"}}>
          <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".2em",color:B.lime,marginBottom:8}}>SIMULATION COMPLETE</div>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:72,height:72,borderRadius:"50%",border:`3px solid ${B.lime}`,marginBottom:10}}>
            <span style={{fontSize:32,fontWeight:600,color:B.lime}}>{score.grade}</span>
          </div>
          <div style={{fontSize:16,color:B.white,fontWeight:500}}>Score: {score.overall}/100</div>
          <div style={{fontSize:13,color:B.ltTeal,marginTop:4}}>{fmt(500000)} over 10 simulated years</div>
          {buildNarrative(gs)&&<div style={{fontSize:13,color:B.ltTeal,marginTop:10,maxWidth:440,margin:"10px auto 0",lineHeight:1.5,fontStyle:"italic"}}>{buildNarrative(gs)}</div>}
        </div>
        <div style={{maxWidth:640,margin:"0 auto",padding:"28px 24px"}}>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
            <Stat label="Final Value" value={fmt(score.finalValue)} sub={`${pctFmt(parseFloat(score.totalReturn))} total`} color={parseFloat(score.totalReturn)>=0?B.teal:B.red}/>
            <Stat label="Max Drawdown" value={`${score.maxDrawdown}%`} sub="Largest peak-to-trough decline" color={parseFloat(score.maxDrawdown)>20?B.warn:B.teal}/>
            <Stat label="Cash Remaining" value={fmt(gs.cash)}/>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:24}}>
            <Stat label="Return" value={score.retScore}/><Stat label="Risk Management" value={score.riskScore}/><Stat label="Diversification" value={score.divScore}/>
          </div>
          <Chart history={gs.history}/>
          <div style={{margin:"20px 0"}}>
            <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.muted,marginBottom:6}}>Market Scenario</div>
            <div style={{display:"flex",flexWrap:"wrap"}}>{gs.history.filter(h=>h.env).map((h,i)=><EventTag key={i} env={h.env}/>)}</div>
          </div>
          <div style={{margin:"20px 0"}}>
            <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".12em",color:B.muted,marginBottom:8}}>Decision History</div>
            <div style={{background:B.cream,borderRadius:8,padding:"16px 18px"}}>
              {gs.decisions.length>0?gs.decisions.map((d,i)=>(
                <div key={i} style={{fontSize:13,color:B.body,padding:"6px 0",borderBottom:i<gs.decisions.length-1?`1px solid ${B.ltTeal}`:"none"}}>{d}</div>
              )):<div style={{fontSize:13,color:B.muted}}>No decisions reached.</div>}
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn primary onClick={resetAll} style={{flex:1}}>Play Again</Btn>
            <Btn onClick={()=>{setPhase("allocate");gsRef.current=null;setGs(null);setDecision(null);setSummary(null);}} style={{flex:1}}>New Allocation</Btn>
          </div>
          <div style={{marginTop:28,padding:14,background:B.cream,borderRadius:8,fontSize:11,color:B.muted,lineHeight:1.5}}>Simulated performance for educational purposes only. Not indicative of actual results or future returns. Past performance, real or simulated, does not guarantee future results. All investments involve risk, including possible loss of principal.</div>
        </div>
      </div>
    );
  }

  return <div style={{fontFamily:font,padding:40,textAlign:"center",color:B.muted}}>Loading...</div>;
}
