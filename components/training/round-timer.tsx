"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { advanceRoundTimer, createRoundTimer, type RoundTimerConfig } from "@/lib/domain/round-timer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PRESETS = {
  "3 × 3": { rounds: 3, workSeconds: 180, restSeconds: 60 },
  "5 × 5": { rounds: 5, workSeconds: 300, restSeconds: 60 },
} satisfies Record<string, RoundTimerConfig>;

function clock(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function ringBell(context: AudioContext, strikes: number) {
  for (let strike = 0; strike < strikes; strike += 1) {
    const start = context.currentTime + strike * 0.32;
    const gain = context.createGain();
    const high = context.createOscillator();
    const low = context.createOscillator();
    high.frequency.value = 880;
    low.frequency.value = 440;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.24, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
    high.connect(gain);
    low.connect(gain);
    gain.connect(context.destination);
    high.start(start);
    low.start(start);
    high.stop(start + 0.56);
    low.stop(start + 0.56);
  }
}

export function RoundTimer() {
  const [config, setConfig] = useState<RoundTimerConfig>(PRESETS["3 × 3"]);
  const [timer, setTimer] = useState(() => createRoundTimer(config));
  const [running, setRunning] = useState(false);
  const [muted, setMuted] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const previousPhase = useRef(timer.phase);

  useEffect(() => {
    if (!running || timer.phase === "done") return;
    const id = window.setInterval(() => setTimer((value) => advanceRoundTimer(value, config)), 1000);
    return () => window.clearInterval(id);
  }, [running, config, timer.phase]);

  useEffect(() => {
    if (previousPhase.current !== timer.phase && !muted && audio.current) {
      ringBell(audio.current, timer.phase === "work" ? 1 : 2);
    }
    previousPhase.current = timer.phase;
  }, [timer.phase, muted]);

  function apply(next: RoundTimerConfig) {
    setConfig(next);
    const initial = createRoundTimer(next);
    previousPhase.current = initial.phase;
    setTimer(initial);
    setRunning(false);
  }

  function toggleTimer() {
    if (!running && !audio.current) audio.current = new AudioContext();
    setRunning((value) => !value);
  }

  const isRunning = running && timer.phase !== "done";

  return (
    <section className="grid gap-5 rounded-md border bg-card p-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.55fr)]">
      <div className="flex min-h-52 flex-col items-center justify-center rounded-md bg-[#090a08] p-6 text-[#eedbb1]">
        <p className="text-sm text-[#c7b792]">Round {timer.round} / {config.rounds} · {timer.phase === "work" ? "Travail" : timer.phase === "rest" ? "Repos" : "Terminé"}</p>
        <strong className="font-heading text-[clamp(4rem,10vw,7rem)] leading-none tracking-[-0.07em]">{clock(timer.secondsLeft)}</strong>
        <div className="mt-5 flex gap-2">
          <Button type="button" onClick={toggleTimer} disabled={timer.phase === "done"}>
            {isRunning ? <Pause /> : <Play />}{isRunning ? "Pause" : "Démarrer"}
          </Button>
          <Button type="button" variant="outline" onClick={() => apply(config)}><RotateCcw />Réinitialiser</Button>
          <Button type="button" variant="outline" size="icon" onClick={() => setMuted((value) => !value)} aria-label={muted ? "Activer le son" : "Couper le son"}>
            {muted ? <VolumeX /> : <Volume2 />}
          </Button>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <div className="flex gap-2">
          {Object.entries(PRESETS).map(([label, preset]) => <Button key={label} type="button" variant="outline" onClick={() => apply(preset)}>{label}</Button>)}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <TimerInput label="Rounds" value={config.rounds} onChange={(rounds) => apply({ ...config, rounds })} />
          <TimerInput label="Travail (min)" value={config.workSeconds / 60} onChange={(minutes) => apply({ ...config, workSeconds: minutes * 60 })} />
          <TimerInput label="Repos (sec)" value={config.restSeconds} onChange={(restSeconds) => apply({ ...config, restSeconds })} />
        </div>
        <p className="text-sm text-muted-foreground">Une cloche signale la fin du round et la reprise. Le timer reste actif sur cet écran.</p>
      </div>
    </section>
  );
}

function TimerInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const id = label.replaceAll(" ", "-");
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label><Input id={id} type="number" min={1} value={value} onChange={(event) => onChange(Math.max(1, Number(event.target.value) || 1))} /></div>;
}
