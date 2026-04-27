export const W = {
  midnight: "#002E30",
  midnightDeep: "#001819",
  green: "#014A4C",
  green400: "#346E70",
  green300: "#558687",
  green200: "#8AACAD",
  green100: "#B0C7C8",
  green50: "#E6EDED",
  white: "#FFFFFF",
  sand: "#F6F4F1",
  sand200: "#F2EFEA",
  sand400: "#E8E4DB",
  sand50: "#FCFCFB",
  mint: "#A3F5C5",
  sky: "#A5F0FF",
  chartreuse: "#DFFA47",
  plum: "#461535",
  plum600: "#8E5179",
  plum300: "#C69FB8",
  plum100: "#F7F1F4",
  indigo: "#063956",
  indigo600: "#2F7399",
  indigo300: "#61A3C9",
  indigo100: "#E6F0F6",
  gold: "#876300",
  gold600: "#A57C1C",
  gold300: "#E0CB91",
  gold100: "#F2ECDC",
  fg: "#002E30",
  fgMuted: "#4A6164",
  fgSubtle: "#7A8E90",
  border: "rgba(0,46,48,0.10)",
  borderStrong: "rgba(0,46,48,0.22)",
  borderInverse: "rgba(255,255,255,0.16)",
  borderInverseStrong: "rgba(255,255,255,0.28)",
  danger: "#B3291C",
};

export const CLASSES = [
  {
    id: "pe", name: "Private Equity", short: "PE", color: W.green,
    core: { ret: 0.14, vol: 0.11, income: false, incomeRate: 0, jCurve: false },
    sat:  { ret: 0.21, vol: 0.19, income: false, incomeRate: 0, jCurve: true, lockup: 5 },
    desc: "Funds that buy, improve, and sell private companies over multi-year holding periods.",
    edu: "Private equity generates returns by acquiring companies, improving operations, and selling them at a profit. Through a diversified fund, your capital is spread across dozens of deals with periodic liquidity. Through a direct investment, you take a concentrated position in a single fund with a multi-year lockup and higher return potential.",
    traits: ["Returns driven by operational improvement and exits", "Diversified fund: broad exposure, periodic liquidity", "Direct investment: concentrated, 5+ year lockup"],
  },
  {
    id: "re", name: "Real Estate", short: "RE", color: W.indigo,
    core: { ret: 0.07, vol: 0.07, income: true, incomeRate: 0.04, jCurve: false },
    sat:  { ret: 0.16, vol: 0.15, income: true, incomeRate: 0.05, jCurve: true, lockup: 4 },
    desc: "Investments in commercial and residential properties that generate rental income and grow in value over time.",
    edu: "Real estate earns returns through rental income and property value appreciation. Diversified fund positions provide exposure across property types and geographies. Direct investments offer concentrated bets on specific properties or strategies with higher income potential and more sensitivity to interest rate cycles.",
    traits: ["Income from rent plus property value growth", "Diversified fund: steady, broad income stream", "Direct investment: concentrated, higher yield potential"],
  },
  {
    id: "pc", name: "Private Credit", short: "PC", color: W.gold600,
    core: { ret: 0.09, vol: 0.05, income: true, incomeRate: 0.06, jCurve: false },
    sat:  { ret: 0.12, vol: 0.09, income: true, incomeRate: 0.08, jCurve: false, lockup: 2 },
    desc: "Lending outside the banking system that generates regular interest income for investors.",
    edu: "Private credit funds lend capital to borrowers and earn interest in return. Diversified fund positions offer floating-rate exposure that tends to perform well when rates rise. Direct investments offer individual lending opportunities with higher yields and more concentrated default risk.",
    traits: ["Regular income from interest payments", "Rates adjust with the market (floating rate)", "Diversified fund: broad. Direct: higher yield, default risk"],
  },
  {
    id: "vc", name: "Venture Capital", short: "VC", color: W.plum,
    core: { ret: 0.11, vol: 0.15, income: false, incomeRate: 0, jCurve: false },
    sat:  { ret: 0.23, vol: 0.25, income: false, incomeRate: 0, jCurve: true, lockup: 7 },
    desc: "Investments in early-stage companies where a small number of successes drive the majority of returns.",
    edu: "Venture capital funds invest in startups. Most fail, but the winners can return multiples of invested capital. Through a diversified fund, your exposure is spread across many companies. Through a direct investment, you take a concentrated position with a 7 to 10 year lockup and the widest return dispersion of any asset class.",
    traits: ["Extreme return dispersion between managers", "Longest lockup period of any asset class", "Diversified fund: managed risk. Direct: highest ceiling"],
  },
];

export const font = "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export const fmt = (n) => {
  const a = Math.abs(n);
  if (a < 1) return "$0";
  const sign = n < 0 ? "−" : "";
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(0)}K`;
  return `${sign}$${Math.round(a)}`;
};

export const pctFmt = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
