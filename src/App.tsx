import { useState } from "react";
import { GameBoard } from "./components/GameBoard";
import { SetupScreen } from "./components/SetupScreen";
import { type AudioTarget } from "./components/SongQrCard";
import { useGame } from "./hooks/useGame";

export default function App() {
  const {
    state,
    startGame,
    placeCard,
    continueRound,
    bankAndEnd,
    skipSong,
    redrawAudioFail,
    reset,
  } = useGame();

  const [audioTarget, setAudioTarget] = useState<AudioTarget>("both");

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      {/* Cinematic stage background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(91,33,182,0.35),_transparent_55%)]" />
        <div className="absolute -left-40 top-0 h-[32rem] w-[32rem] rounded-full bg-violet-600/25 blur-[140px]" />
        <div className="absolute -right-28 top-1/4 h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-amber-500/10 blur-[110px]" />
        {/* soft rings */}
        <div className="absolute left-1/2 top-24 h-[480px] w-[480px] -translate-x-1/2 rounded-full border border-white/[0.04]" />
        <div className="absolute left-1/2 top-40 h-[320px] w-[320px] -translate-x-1/2 rounded-full border border-white/[0.03]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.72)_100%)]" />
      </div>

      <div className="relative z-10">
        {state.phase === "setup" ? (
          <SetupScreen onStart={startGame} />
        ) : (
          <GameBoard
            state={state}
            onPlace={placeCard}
            onContinue={continueRound}
            onBank={bankAndEnd}
            onSkip={skipSong}
            onRedrawAudioFail={redrawAudioFail}
            onReset={reset}
            audioTarget={audioTarget}
            onAudioTargetChange={setAudioTarget}
          />
        )}
      </div>
    </div>
  );
}
