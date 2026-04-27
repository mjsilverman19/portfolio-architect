export const PRESETS = [
  {
    id: "growth", label: "Growth",
    desc: "Maximizes long-term appreciation. Heavier PE and VC allocation with minimal cash reserve.",
    alloc: { pe: 200000, re: 50000, pc: 50000, vc: 150000 }, cash: 50000,
  },
  {
    id: "income", label: "Income",
    desc: "Prioritizes steady distributions. Weighted toward Private Credit and Real Estate.",
    alloc: { pe: 50000, re: 150000, pc: 200000, vc: 0 }, cash: 100000,
  },
  {
    id: "balanced", label: "Balanced",
    desc: "Equal exposure across asset classes with a meaningful cash buffer.",
    alloc: { pe: 100000, re: 100000, pc: 100000, vc: 100000 }, cash: 100000,
  },
];

export const ENVS = [
  {
    id: "boom", label: "Economic Expansion",
    narrative: "Strong GDP growth and consumer confidence drive asset values higher across the board.",
    m: { pe: { c: 1.189, s: 1.251 }, re: { c: 1.137, s: 1.222 }, pc: { c: 1.127, s: 1.170 }, vc: { c: 1.108, s: 1.159 } },
    explainer: "Strong GDP growth lifts corporate earnings and startup valuations. PE and VC benefit most from rising exit multiples. Private credit generates steady income but limited upside in expansions. Real estate appreciates on rising rents and occupancy.",
  },
  {
    id: "rate_hike", label: "Rate Hike Cycle",
    narrative: "Central banks raise rates aggressively. Floating-rate credit benefits while equity valuations compress.",
    m: { pe: { c: 0.976, s: 0.968 }, re: { c: 1.060, s: 1.097 }, pc: { c: 1.045, s: 1.060 }, vc: { c: 0.846, s: 0.774 } },
    explainer: "Rising rates increase borrowing costs, pressuring leveraged buyouts and venture valuations. Private credit is the clear winner: floating-rate loans reset higher, increasing income. Real estate holds up as rents adjust upward. VC suffers the steepest decline as higher discount rates compress growth-stage valuations.",
  },
  {
    id: "rate_cut", label: "Rate Cuts Begin",
    narrative: "Easing monetary policy lifts valuations and reopens exit windows for private equity.",
    m: { pe: { c: 1.156, s: 1.207 }, re: { c: 1.100, s: 1.162 }, pc: { c: 1.077, s: 1.103 }, vc: { c: 1.169, s: 1.248 } },
    explainer: "Falling rates lower discount rates, boosting asset valuations across the board. PE and VC benefit most as exit activity picks up and growth-stage companies see multiple expansion. Real estate benefits from cheaper financing. Private credit income declines as floating rates reset lower.",
  },
  {
    id: "credit_crunch", label: "Credit Crunch",
    narrative: "Lending standards tighten sharply. Borrowers struggle and default rates tick up.",
    m: { pe: { c: 1.060, s: 1.080 }, re: { c: 0.964, s: 0.942 }, pc: { c: 1.094, s: 1.126 }, vc: { c: 0.937, s: 0.907 } },
    explainer: "Tightening credit conditions pressure real estate and venture capital. Real estate declines as financing dries up and transaction volume falls. VC startups lose access to growth capital. Private equity and credit prove more resilient, with credit funds benefiting from higher spreads on performing loans.",
  },
  {
    id: "steady", label: "Stable Growth",
    narrative: "Moderate, broad-based growth. All asset classes perform near long-term averages.",
    m: { pe: { c: 1.066, s: 1.088 }, re: { c: 1.001, s: 1.002 }, pc: { c: 1.089, s: 1.119 }, vc: { c: 1.014, s: 1.021 } },
    explainer: "A benign environment with moderate growth and stable rates. PE and private credit lead with steady returns. Real estate and venture capital deliver muted performance. The spread between core and satellite positions is narrow in calm markets.",
  },
];
