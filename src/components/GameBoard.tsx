import { useState } from "react";
import type { GameState } from "../types";
import { CARDS_TO_WIN, CATEGORY_META, HISTORY_CATEGORY_META } from "../types";
import { playClickSound } from "../utils/sounds";
import { HistoryExplanation, HistoryPromptCard } from "./HistoryCard";
import { MusicPlayer, type AudioStatus } from "./MusicPlayer";
import { SongQrCard, type AudioTarget } from "./SongQrCard";
import { MysteryCard, RevealedCard, Timeline } from "./Timeline";

interface GameBoardProps {
  state: GameState;
  onPlace: (slot: number) => void;
  onContinue: () => void;
  onBank: () => void;
  onSkip: () => void;
  onRedrawAudioFail: () => void;
  onReset: () => void;
  audioTarget: AudioTarget;
  onAudioTargetChange: (target: AudioTarget) => void;
}

export function GameBoard({ state, onPlace, onContinue, onBank, onSkip, onRedrawAudioFail, onReset, audioTarget, onAudioTargetChange }: GameBoardProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("idle");
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isListening = state.phase === "listening";
  const isResult = state.phase === "result";
  const isGameOver = state.phase === "game-over";
  const isHistory = state.contentMode === "history";
  const pot = state.roundCards.length;
  const playLocal = audioTarget === "local" || audioTarget === "both";
  const meta = isHistory ? HISTORY_CATEGORY_META[state.historyCategory] : CATEGORY_META[state.category];

  const confirmPlace = () => {
    if (selectedSlot === null) return;
    playClickSound();
    onPlace(selectedSlot);
    setSelectedSlot(null);
  };

  if (isGameOver) {
    const winner = state.players.find((player) => player.id === state.winnerId);
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="text-7xl">🏆</div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-amber-200/70">Matchen är slut</p>
        <h1 className="brand-text mt-2 text-5xl font-black">{winner?.name ?? "Vinnare"}</h1>
        <p className="mt-3 text-white/50">{state.message}</p>
        <div className="mt-8 w-full space-y-2">{state.players.slice().sort((a, b) => b.timeline.length - a.timeline.length).map((player, index) => <div key={player.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><span className="font-semibold">{index + 1}. {player.name}</span><span className="font-bold">{player.timeline.length} kort</span></div>)}</div>
        <button type="button" onClick={onReset} className="mt-8 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 px-10 py-4 font-bold">Spela igen</button>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-3 py-4 sm:px-6 sm:py-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="brand-text text-2xl font-black">BeatLine · {isHistory ? "Historia" : "Musik"}</h1><p className="text-xs text-white/45">{meta.emoji} {meta.label} · {state.deck.length + (state.currentSong ? 1 : 0)} kvar · först till {CARDS_TO_WIN}</p></div>
        <div className="flex items-center gap-2">{pot > 0 && <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200">Pott {pot}</span>}<button type="button" onClick={onReset} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/55">Avsluta</button></div>
      </header>

      <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white/75">{state.message}</div>

      <div className="grid items-start gap-6 lg:grid-cols-[360px_1fr]">
        <section className="flex flex-col items-center gap-4">
          {isHistory ? (
            <>{isListening && state.currentSong && <HistoryPromptCard event={state.currentSong} />}{isResult && state.revealedSong && <><RevealedCard song={state.revealedSong} result={state.lastResult} /><HistoryExplanation event={state.revealedSong} /></>}</>
          ) : (
            <><div>{isResult && state.revealedSong ? <RevealedCard song={state.revealedSong} result={state.lastResult} /> : <MysteryCard />}</div><SongQrCard song={state.currentSong} active={isListening} audioTarget={audioTarget} onAudioTargetChange={onAudioTargetChange} />{(playLocal || audioStatus === "error") && <MusicPlayer song={state.currentSong} autoPlay={false} active={isListening} playLocal={playLocal} onPlaybackStatus={setAudioStatus} onRequestNewCard={() => { setSelectedSlot(null); onRedrawAudioFail(); }} canRequestNewCard={state.deck.length > 0} showExternalLinks={audioTarget === "local"} />}</>
          )}

          <div className="w-full max-w-sm space-y-2.5">
            {isListening && <><button type="button" disabled={selectedSlot === null} onClick={confirmPlace} className="w-full rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400 py-4 font-black disabled:opacity-35">{selectedSlot === null ? "Välj plats på tidslinjen" : `Placera på position ${selectedSlot + 1}`}</button>{state.useTokens && <button type="button" onClick={() => { setSelectedSlot(null); onSkip(); }} disabled={!currentPlayer || currentPlayer.tokens < 1 || state.deck.length === 0} className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white/70 disabled:opacity-35">Hoppa över {isHistory ? "händelsen" : "låten"} · 1 token</button>}{!isHistory && audioStatus === "error" && <button type="button" onClick={onRedrawAudioFail} disabled={state.deck.length === 0} className="w-full rounded-2xl border border-amber-400/30 bg-amber-500/15 py-3 font-bold text-amber-100">Nytt kort p.g.a. ljudfel</button>}</>}
            {isResult && state.lastResult === "correct" && <><div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-center text-sm text-emerald-100">Rätt: banka {pot} kort säkert eller fortsätt och riskera dem.</div><button type="button" onClick={onContinue} className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-4 font-black">Fortsätt spela 🔥</button><button type="button" onClick={onBank} className="w-full rounded-2xl border border-emerald-400/30 bg-emerald-500/15 py-4 font-black text-emerald-200">Stanna och banka +{pot}</button></>}
            {isResult && state.lastResult === "wrong" && <button type="button" onClick={onBank} className="w-full rounded-2xl bg-white/10 py-4 font-black">Nästa spelares tur →</button>}
          </div>
        </section>

        <section className="space-y-4">
          {currentPlayer && <Timeline player={currentPlayer} cards={state.workingTimeline} isActive interactive={isListening} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} highlightIds={state.roundCards.map((card) => card.id)} showYears label={pot > 0 ? `${currentPlayer.timeline.length} bankade + ${pot} i potten` : "Placera kortet mellan rätt årtal"} />}
          {state.players.filter((player) => player.id !== currentPlayer?.id).length > 0 && <div className="grid gap-3 md:grid-cols-2">{state.players.filter((player) => player.id !== currentPlayer?.id).map((player) => <Timeline key={player.id} player={player} showYears />)}</div>}
        </section>
      </div>
    </main>
  );
}