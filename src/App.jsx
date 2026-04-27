import { useState, useRef, useCallback } from "react";
import { CLASSES } from "./tokens.js";
import { totalPortfolio, advanceUntilDecision, pickEnv } from "./engine/simulation.js";
import { buildDecision } from "./engine/decisions.js";
import { YearTransition } from "./components/YearTransition.jsx";
import { IntroScreen } from "./screens/IntroScreen.jsx";
import { PresetScreen } from "./screens/PresetScreen.jsx";
import { AllocateScreen } from "./screens/AllocateScreen.jsx";
import { PlayScreen } from "./screens/PlayScreen.jsx";
import { ResultsScreen } from "./screens/ResultsScreen.jsx";

const TOTAL = 500000;

export default function App() {
  const [phase, setPhase] = useState("intro");
  const [alloc, setAlloc] = useState({ pe: 0, re: 0, pc: 0, vc: 0 });
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [gs, setGs] = useState(null);
  const [decision, setDecision] = useState(null);
  const [summary, setSummary] = useState(null);
  const [transitions, setTransitions] = useState(null);
  const gsRef = useRef(null);
  const stateHistoryRef = useRef([]);

  const totalAlloc = Object.values(alloc).reduce((a, b) => a + b, 0);
  const reserve = Math.max(0, TOTAL - totalAlloc);

  const onTransitionComplete = useCallback(() => setTransitions(null), []);

  function runAdvance(state) {
    const result = advanceUntilDecision(state);
    gsRef.current = result.state;
    setGs(result.state);
    setDecision(result.decision);
    setSummary(result.summary);
    if (result.transitions.length > 0) setTransitions(result.transitions);
    setPhase(result.done ? "results" : "play");
  }

  function startGame() {
    const envs = Array.from({ length: 10 }, () => pickEnv());
    const initPos = {};
    CLASSES.forEach(c => {
      initPos[c.id + "_core"] = alloc[c.id] || 0;
      initPos[c.id + "_sat"] = 0;
    });
    const cashStart = reserve;
    const init = {
      year: 0, positions: initPos, cash: cashStart,
      totalIncome: 0, cumulativeIncome: 0, yearlyIncome: 0, envs,
      history: [{ year: 0, positions: { ...initPos }, cash: cashStart, totalPortfolio: TOTAL, env: null, yearlyIncome: 0 }],
      decisions: [], penaltyPe: false, deferralPenalty: false, forcedLiquidation: false,
      concentrationPenalty: null, subscriptionFunded: null, firstSatellite: null,
      earlyExitSold: null, incomeReinvested: null, premiumExit: false, satelliteDeployed: 0,
    };
    stateHistoryRef.current = [];
    runAdvance(init);
  }

  function handleChoice(opt) {
    if (opt.disabled) return;
    stateHistoryRef.current = [...stateHistoryRef.current, JSON.parse(JSON.stringify(gsRef.current))];
    runAdvance(opt.apply(gsRef.current));
  }

  function handlePresetSelect(preset) {
    setAlloc({ ...preset.alloc });
    setSelectedPreset(preset);
    setPhase("allocate");
  }

  function handleBlankStart() {
    setAlloc({ pe: 0, re: 0, pc: 0, vc: 0 });
    setSelectedPreset(null);
    setPhase("allocate");
  }

  function handleAllocReset() {
    if (selectedPreset) setAlloc({ ...selectedPreset.alloc });
  }

  function handleAllocLock() {
    startGame();
  }

  function handleAllocChange(id, val) {
    setAlloc(prev => ({ ...prev, [id]: val }));
  }

  function handleRestart() {
    setPhase("intro");
    setAlloc({ pe: 0, re: 0, pc: 0, vc: 0 });
    setSelectedPreset(null);
    setGs(null);
    setDecision(null);
    setSummary(null);
    setTransitions(null);
    gsRef.current = null;
    stateHistoryRef.current = [];
  }

  return (
    <>
      {phase === "intro" && (
        <IntroScreen onStart={() => setPhase("preset")} />
      )}

      {phase === "preset" && (
        <PresetScreen onSelect={handlePresetSelect} onBlank={handleBlankStart} />
      )}

      {phase === "allocate" && (
        <AllocateScreen
          alloc={alloc}
          onChange={handleAllocChange}
          onLock={handleAllocLock}
          onReset={handleAllocReset}
          selectedPreset={selectedPreset}
        />
      )}

      {phase === "play" && gs && (
        <>
          {transitions && transitions.length > 0 && (
            <YearTransition transitions={transitions} onComplete={onTransitionComplete} />
          )}
          <PlayScreen
            gs={gs}
            decision={decision}
            summary={summary}
            onChoose={handleChoice}
          />
        </>
      )}

      {phase === "results" && gs && (
        <ResultsScreen gs={gs} onRestart={handleRestart} />
      )}
    </>
  );
}
