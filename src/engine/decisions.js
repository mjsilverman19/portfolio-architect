import { CLASSES } from "../tokens.js";
import { fmt } from "../tokens.js";
import { coreTotal, satTotal, totalPortfolio } from "./simulation.js";

export function buildDecision(st) {
  /* Y2: Fund subscription window */
  if (st.year === 2) {
    const cv = coreTotal(st);
    if (cv <= 0) return null;
    const cost = Math.round(cv * 0.12);
    return {
      title: "Fund Subscription Window",
      body: `Your diversified funds are accepting additional capital this quarter. Deploying ${fmt(cost)} from your cash reserve increases your exposure and compounds your position through the current market cycle.`,
      options: [
        {
          id: "fund", label: `Deploy ${fmt(cost)}`, disabled: st.cash < cost,
          apply: s => {
            const ct = coreTotal(s); const newPos = { ...s.positions };
            CLASSES.forEach(c => { const k = c.id + "_core"; if (newPos[k] > 0) newPos[k] += cost * (newPos[k] / ct); });
            return { ...s, cash: s.cash - cost, positions: newPos, subscriptionFunded: true, decisions: [...s.decisions, `Deployed ${fmt(cost)} into diversified funds (Y2)`] };
          },
        },
        { id: "decline", label: "Hold Cash", disabled: false, apply: s => ({ ...s, subscriptionFunded: false, decisions: [...s.decisions, "Held cash, passed on fund subscription (Y2)"] }) },
      ],
      lowCashNote: st.cash < cost ? `This requires ${fmt(cost)}. Your cash reserve holds ${fmt(st.cash)}.` : null,
    };
  }

  /* Y3: Direct investment */
  if (st.year === 3) {
    const eligible = CLASSES.map(c => ({ cls: c, val: st.positions[c.id + "_core"] || 0 })).filter(x => x.val > 0);
    if (eligible.length === 0) return null;
    const minInvest = 75000;
    if (eligible.length === 1) {
      const target = eligible[0].cls;
      const lockup = target.sat.lockup;
      return {
        title: `${target.name} Direct Investment`,
        body: `A ${target.name.toLowerCase()} fund is raising capital for a new vintage. This is a direct investment with a ${lockup}-year lockup and higher return potential than your diversified fund position. The minimum commitment is ${fmt(minInvest)}.`,
        options: st.cash >= minInvest ? [
          {
            id: "invest", label: `Invest ${fmt(minInvest)}`, disabled: false,
            apply: s => {
              const newPos = { ...s.positions };
              newPos[target.id + "_sat"] = (newPos[target.id + "_sat"] || 0) + minInvest;
              return { ...s, cash: s.cash - minInvest, positions: newPos, firstSatellite: target.id, satelliteDeployed: (s.satelliteDeployed || 0) + minInvest, decisions: [...s.decisions, `Invested ${fmt(minInvest)} in ${target.name} direct deal (Y3)`] };
            },
          },
          { id: "pass", label: "Stay in Diversified Funds", disabled: false, apply: s => ({ ...s, firstSatellite: null, decisions: [...s.decisions, "Stayed in diversified funds (Y3)"] }) },
        ] : [
          { id: "cant", label: "Pass (Insufficient Cash)", disabled: false, apply: s => ({ ...s, firstSatellite: null, decisions: [...s.decisions, "Insufficient cash for direct deal (Y3)"] }) },
        ],
        lowCashNote: st.cash < minInvest ? `This requires ${fmt(minInvest)}. Your cash reserve holds ${fmt(st.cash)}.` : null,
      };
    }
    return {
      title: "Direct Investment Opportunity",
      body: `Several funds are raising capital for new vintages. Each offers a direct investment with a multi-year lockup and higher return potential than your diversified position. The minimum commitment is ${fmt(minInvest)}. Choose which asset class to go direct in, or stay diversified.`,
      options: [
        ...eligible.map(({ cls }) => ({
          id: `invest_${cls.id}`, label: `${cls.short} Direct (${cls.sat.lockup}yr)`,
          disabled: st.cash < minInvest,
          apply: s => {
            const newPos = { ...s.positions };
            newPos[cls.id + "_sat"] = (newPos[cls.id + "_sat"] || 0) + minInvest;
            return { ...s, cash: s.cash - minInvest, positions: newPos, firstSatellite: cls.id, satelliteDeployed: (s.satelliteDeployed || 0) + minInvest, decisions: [...s.decisions, `Invested ${fmt(minInvest)} in ${cls.name} direct deal (Y3)`] };
          },
        })),
        { id: "pass", label: "Stay Diversified", disabled: false, apply: s => ({ ...s, firstSatellite: null, decisions: [...s.decisions, "Stayed in diversified funds (Y3)"] }) },
      ],
      lowCashNote: st.cash < minInvest ? `This requires ${fmt(minInvest)}. Your cash reserve holds ${fmt(st.cash)}.` : null,
    };
  }

  /* Y4: Co-investment */
  if (st.year === 4 && st.firstSatellite) {
    const available = CLASSES.filter(c => c.id !== st.firstSatellite && (st.positions[c.id + "_core"] || 0) > 0);
    if (available.length === 0) return null;
    const target = available[0];
    const cost = 50000;
    return {
      title: "Co-Investment Opportunity",
      body: `A ${target.name.toLowerCase()} manager is offering a co-investment alongside their flagship fund. Minimum: ${fmt(cost)}. Co-investments carry lower fees but concentrate your exposure in a single deal.`,
      options: st.cash >= cost ? [
        {
          id: "coinvest", label: `Co-invest ${fmt(cost)}`, disabled: false,
          apply: s => {
            const newPos = { ...s.positions };
            newPos[target.id + "_sat"] = (newPos[target.id + "_sat"] || 0) + cost;
            return { ...s, cash: s.cash - cost, positions: newPos, satelliteDeployed: (s.satelliteDeployed || 0) + cost, decisions: [...s.decisions, `Co-invested ${fmt(cost)} in ${target.name} deal (Y4)`] };
          },
        },
        { id: "pass", label: "Decline", disabled: false, apply: s => ({ ...s, decisions: [...s.decisions, `Declined ${target.name} co-investment (Y4)`] }) },
      ] : [
        { id: "cant", label: "Decline (Insufficient Cash)", disabled: false, apply: s => ({ ...s, decisions: [...s.decisions, `Insufficient cash for co-investment (Y4)`] }) },
      ],
      lowCashNote: st.cash < cost ? `Requires ${fmt(cost)}. Cash reserve: ${fmt(st.cash)}.` : null,
    };
  }

  /* Y5: Secondary exit or new direct deal */
  if (st.year === 5) {
    const satPositions = CLASSES.map(c => ({ cls: c, val: st.positions[c.id + "_sat"] || 0 })).filter(x => x.val > 0).sort((a, b) => b.val - a.val);
    if (satPositions.length === 0) {
      const largest = CLASSES.map(c => ({ cls: c, val: st.positions[c.id + "_core"] || 0 })).filter(x => x.val > 0).sort((a, b) => b.val - a.val);
      if (largest.length === 0) return null;
      const target = largest[0].cls;
      const cost = 60000;
      return {
        title: `${target.name} Direct Opportunity`,
        body: `A ${target.name.toLowerCase()} fund is raising capital at favorable terms. Minimum: ${fmt(cost)}. This would be your first direct investment, moving beyond your diversified fund allocation.`,
        options: st.cash >= cost ? [
          {
            id: "invest", label: `Invest ${fmt(cost)}`, disabled: false,
            apply: s => {
              const newPos = { ...s.positions };
              newPos[target.id + "_sat"] = (newPos[target.id + "_sat"] || 0) + cost;
              return { ...s, cash: s.cash - cost, positions: newPos, satelliteDeployed: (s.satelliteDeployed || 0) + cost, decisions: [...s.decisions, `Invested ${fmt(cost)} in ${target.name} direct deal (Y5)`] };
            },
          },
          { id: "pass", label: "Pass", disabled: false, apply: s => ({ ...s, decisions: [...s.decisions, `Passed on ${target.name} direct deal (Y5)`] }) },
        ] : [
          { id: "cant", label: "Pass (Insufficient Cash)", disabled: false, apply: s => ({ ...s, decisions: [...s.decisions, `Insufficient cash for ${target.name} deal (Y5)`] }) },
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
          {
            id: "sell", label: `Sell for ${fmt(premium)}`, disabled: false,
            apply: s => { const newPos = { ...s.positions }; newPos["vc_sat"] = 0; return { ...s, cash: s.cash + premium, positions: newPos, earlyExitSold: true, premiumExit: true, decisions: [...s.decisions, `Sold VC direct position at 25% premium for ${fmt(premium)} (Y5)`] }; },
          },
          { id: "hold", label: "Hold for More Upside", disabled: false, apply: s => ({ ...s, earlyExitSold: false, premiumExit: false, decisions: [...s.decisions, "Held VC direct position through premium offer (Y5)"] }) },
        ],
      };
    }
    if (top.cls.id === "re" && currentEnv && currentEnv.id === "rate_hike") {
      const distressedPrice = Math.round(top.val * 0.70);
      return {
        title: "Distressed Exit Pressure",
        body: `Rising rates have compressed your Real Estate direct position's valuation. A buyer is offering ${fmt(distressedPrice)}, a 30% discount to your entry basis. Holding exposes you to further rate increases, but selling crystallizes the loss.`,
        options: [
          {
            id: "sell", label: `Sell for ${fmt(distressedPrice)}`, disabled: false,
            apply: s => { const newPos = { ...s.positions }; newPos["re_sat"] = 0; return { ...s, cash: s.cash + distressedPrice, positions: newPos, earlyExitSold: true, decisions: [...s.decisions, `Sold RE direct position at 30% discount for ${fmt(distressedPrice)} (Y5)`] }; },
          },
          { id: "hold", label: "Hold Through the Cycle", disabled: false, apply: s => ({ ...s, earlyExitSold: false, decisions: [...s.decisions, "Held RE direct position through rate pressure (Y5)"] }) },
        ],
      };
    }
    const disc = top.cls.id === "vc" ? 0.75 : 0.80;
    const proceeds = Math.round(top.val * disc);
    return {
      title: "Secondary Market Offer",
      body: `A buyer wants your ${top.cls.name} direct position at ${fmt(proceeds)}, a ${Math.round((1 - disc) * 100)}% discount to estimated value. Selling returns capital to your cash reserve. Holding maintains exposure as the position approaches its primary value-creation window.`,
      options: [
        {
          id: "sell", label: `Sell for ${fmt(proceeds)}`, disabled: false,
          apply: s => { const newPos = { ...s.positions }; newPos[top.cls.id + "_sat"] = 0; return { ...s, cash: s.cash + proceeds, positions: newPos, earlyExitSold: true, decisions: [...s.decisions, `Sold ${top.cls.name} direct position for ${fmt(proceeds)} (Y5)`] }; },
        },
        { id: "hold", label: "Hold Position", disabled: false, apply: s => ({ ...s, earlyExitSold: false, decisions: [...s.decisions, `Held ${top.cls.name} direct position through offer (Y5)`] }) },
      ],
    };
  }

  /* Y6: Forced liquidation or concentration warning */
  if (st.year === 6) {
    if (st.cash < 5000) {
      const corePositions = CLASSES.map(c => ({ id: c.id + "_core", cls: c, val: st.positions[c.id + "_core"] || 0 })).filter(x => x.val > 0).sort((a, b) => a.val - b.val);
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
            {
              id: "force_sell", label: `Forced Sale: −${fmt(positionCost)} position`, disabled: false,
              apply: s => {
                const newPos = { ...s.positions };
                newPos[sellTarget.id] = Math.max(0, (newPos[sellTarget.id] || 0) - sellAmt);
                return { ...s, cash: s.cash + proceeds - callAmt, positions: newPos, forcedLiquidation: true, decisions: [...s.decisions, `Forced to sell ${sellTarget.cls.name} position at 15% discount to meet ${fmt(callAmt)} capital call (Y6)` + (s.history[0].cash === 0 ? ". This outcome was driven by entering the simulation with no cash reserve." : "")] };
              },
            },
          ],
          lowCashNote: `Your cash reserve is ${fmt(st.cash)}. With no liquidity buffer, you have no choice but to sell at a discount.`,
        };
      }
    }
    const portVal = totalPortfolio(st) - (st.cash || 0);
    if (portVal > 0) {
      const classTotals = CLASSES.map(c => ({
        cls: c, total: (st.positions[c.id + "_core"] || 0) + (st.positions[c.id + "_sat"] || 0),
      })).sort((a, b) => b.total - a.total);
      const top = classTotals[0];
      const pct = top.total / portVal;
      if (pct > 0.55) {
        const rebalAmt = Math.round((st.positions[top.cls.id + "_core"] || 0) * 0.25);
        const second = classTotals.find(c => c.cls.id !== top.cls.id && c.total > 0);
        if (second && rebalAmt >= 5000) {
          return {
            title: "Concentration Warning",
            body: `${top.cls.name} represents ${Math.round(pct * 100)}% of your invested capital. Concentrated portfolios amplify both gains and losses. You can rebalance ${fmt(rebalAmt)} from ${top.cls.name} into ${second.cls.name}, or accept the concentration risk. Accepting will apply an ongoing performance drag from reduced diversification.`,
            options: [
              {
                id: "rebalance", label: `Rebalance ${fmt(rebalAmt)}`, disabled: false,
                apply: s => {
                  const newPos = { ...s.positions };
                  newPos[top.cls.id + "_core"] = Math.max(0, (newPos[top.cls.id + "_core"] || 0) - rebalAmt);
                  newPos[second.cls.id + "_core"] = (newPos[second.cls.id + "_core"] || 0) + rebalAmt;
                  return { ...s, positions: newPos, decisions: [...s.decisions, `Rebalanced ${fmt(rebalAmt)} from ${top.cls.short} to ${second.cls.short} (Y6)`] };
                },
              },
              { id: "hold", label: "Accept Concentration", disabled: false, apply: s => ({ ...s, concentrationPenalty: top.cls.id, decisions: [...s.decisions, `Accepted ${top.cls.name} concentration at ${Math.round(pct * 100)}% (Y6)`] }) },
            ],
          };
        }
      }
    }
  }

  /* Y7: Distribution redeployment */
  if (st.year === 7 && st.totalIncome > 5000) {
    const inc = Math.round(st.totalIncome);
    return {
      title: "Redeploy Distributions",
      body: `Over the past several years, your income-producing positions have distributed ${fmt(inc)} into your cash reserve. You can redeploy that capital into your diversified fund positions to compound growth, or keep it as liquidity for future commitments.`,
      options: [
        {
          id: "reinvest", label: "Redeploy into Funds", disabled: false,
          apply: s => {
            const ct = coreTotal(s); const newPos = { ...s.positions };
            const deployAmt = Math.min(s.totalIncome, s.cash);
            if (ct > 0) { CLASSES.forEach(c => { const k = c.id + "_core"; if (newPos[k] > 0) newPos[k] += deployAmt * (newPos[k] / ct); }); }
            else { newPos["pc_core"] = (newPos["pc_core"] || 0) + deployAmt; }
            return { ...s, cash: s.cash - deployAmt, positions: newPos, totalIncome: 0, incomeReinvested: true, decisions: [...s.decisions, `Redeployed ${fmt(deployAmt)} of accumulated distributions into diversified funds (Y7)`] };
          },
        },
        { id: "cash", label: "Keep as Liquidity", disabled: false, apply: s => ({ ...s, totalIncome: 0, incomeReinvested: false, decisions: [...s.decisions, `Kept ${fmt(inc)} in distributions as cash reserve (Y7)`] }) },
      ],
    };
  }

  /* Y8 (reinvested path): Liquidity crunch */
  if (st.year === 8 && st.incomeReinvested === true) {
    const allPos = [
      ...CLASSES.map(c => ({ id: c.id + "_core", cls: c, val: st.positions[c.id + "_core"] || 0, type: "diversified" })),
      ...CLASSES.map(c => ({ id: c.id + "_sat", cls: c, val: st.positions[c.id + "_sat"] || 0, type: "direct" })),
    ].filter(x => x.val > 0).sort((a, b) => a.val - b.val);
    const sellTarget = allPos[0];
    if (!sellTarget) return null;
    const proceeds = Math.round(sellTarget.val * 0.80);
    const label = `${sellTarget.cls.name} ${sellTarget.type} position`;
    return {
      title: "Liquidity Crunch",
      body: `A commitment is due and your cash reserve is thin after reinvesting distributions. You can sell your ${label} on the secondary market at a 20% discount for ${fmt(proceeds)}, or request a deferral that may reduce your priority in future distributions.`,
      options: [
        {
          id: "sell", label: `Sell for ${fmt(proceeds)}`, disabled: false,
          apply: s => { const newPos = { ...s.positions }; newPos[sellTarget.id] = 0; return { ...s, cash: s.cash + proceeds, positions: newPos, decisions: [...s.decisions, `Sold ${label} at 20% discount for ${fmt(proceeds)} (Y8)`] }; },
        },
        { id: "defer", label: "Request Deferral", disabled: false, apply: s => ({ ...s, deferralPenalty: true, decisions: [...s.decisions, "Requested deferral, reduced distribution priority (Y8)"] }) },
      ],
    };
  }

  /* Y8 (cash path): New fund vintage */
  if (st.year === 8 && st.incomeReinvested === false) {
    const cost = 60000;
    const sorted = CLASSES.map(c => ({ cls: c, total: (st.positions[c.id + "_core"] || 0) + (st.positions[c.id + "_sat"] || 0) })).sort((a, b) => a.total - b.total);
    const target = sorted[0].cls;
    return {
      title: "New Fund Vintage",
      body: `A top-quartile ${target.name.toLowerCase()} manager is raising a new fund with favorable early-commitment terms. With ${fmt(st.cash)} in cash reserves, you can commit ${fmt(cost)}. This adds a direct position and reduces your liquidity.`,
      options: st.cash >= cost ? [
        {
          id: "commit", label: `Commit ${fmt(cost)}`, disabled: false,
          apply: s => {
            const newPos = { ...s.positions };
            newPos[target.id + "_sat"] = (newPos[target.id + "_sat"] || 0) + cost;
            return { ...s, cash: s.cash - cost, positions: newPos, satelliteDeployed: (s.satelliteDeployed || 0) + cost, decisions: [...s.decisions, `Committed ${fmt(cost)} to ${target.name} fund vintage (Y8)`] };
          },
        },
        { id: "pass", label: "Pass", disabled: false, apply: s => ({ ...s, decisions: [...s.decisions, "Passed on new fund vintage (Y8)"] }) },
      ] : [
        { id: "cant", label: "Pass (Insufficient Cash)", disabled: false, apply: s => ({ ...s, decisions: [...s.decisions, "Insufficient cash for new fund vintage (Y8)"] }) },
      ],
      lowCashNote: st.cash < cost ? `Requires ${fmt(cost)}. Cash reserve: ${fmt(st.cash)}.` : null,
    };
  }

  /* Y9: Rebalance */
  if (st.year === 9) {
    const classTotals = CLASSES.map(c => ({ cls: c, total: (st.positions[c.id + "_core"] || 0) + (st.positions[c.id + "_sat"] || 0) })).filter(x => x.total > 0);
    const portTotal = classTotals.reduce((a, b) => a + b.total, 0);
    if (portTotal <= 0) return null;
    const sorted = classTotals.sort((a, b) => b.total - a.total);
    const top = sorted[0]; const bottom = sorted[sorted.length - 1];
    if (top.cls.id === bottom.cls.id) return null;
    const moveAmt = Math.round((st.positions[top.cls.id + "_core"] || 0) * 0.2);
    if (moveAmt < 5000) return null;
    return {
      title: "Rebalance Opportunity",
      body: `${top.cls.name} now represents ${Math.round(top.total / portTotal * 100)}% of your portfolio. You can move ${fmt(moveAmt)} from your ${top.cls.name} diversified position into ${bottom.cls.name} to reduce concentration.`,
      options: [
        {
          id: "rebalance", label: "Rebalance", disabled: false,
          apply: s => {
            const newPos = { ...s.positions };
            newPos[top.cls.id + "_core"] = Math.max(0, (newPos[top.cls.id + "_core"] || 0) - moveAmt);
            newPos[bottom.cls.id + "_core"] = (newPos[bottom.cls.id + "_core"] || 0) + moveAmt;
            return { ...s, positions: newPos, decisions: [...s.decisions, `Rebalanced ${fmt(moveAmt)} from ${top.cls.short} to ${bottom.cls.short} (Y9)`] };
          },
        },
        { id: "hold", label: "Keep Current Position", disabled: false, apply: s => ({ ...s, decisions: [...s.decisions, "Maintained current allocation (Y9)"] }) },
      ],
    };
  }
  return null;
}
