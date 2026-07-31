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
  onPlayOnCurrentPlayer?: () => void;
  canPlayOnCurrentPlayer?: boolean;
}

type IconProps = { className?: string };

function MusicIcon({ className = "h-6 w-6" }: IconProps) {
  return <svg viewBox="0 0 64 64" className={className} fill="none"><path d="M24 46V18l26-5v27" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="17" cy="47" r="8" stroke="currentColor" strokeWidth="4"/><circle cx="43" cy="41" r="8" stroke="currentColor" strokeWidth="4"/><path d="M24 27l26-5" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>;
}
function HistoryIcon({ className = "h-6 w-6" }: IconProps) {
  return <svg viewBox="0 0 64 64" className={className} fill="none"><path d="M10 20h44M15 20l17-10 17 10M16 24v22m11-22v22m10-22v22m11-22v22M10 50h44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function TrophyIcon({ className = "h-20 w-20" }: IconProps) {
  return <svg viewBox="0 0 64 64" className={className} fill="none"><path d="M20 10h24v12c0 11-5 18-12 18s-12-7-12-18V10Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/><path d="M20 16H10v4c0 8 5 13 12 14M44 16h10v4c0 8-5 13-12 14M32 40v9M23 55h18" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>;
}
function TokenIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg viewBox="0 0 64 64" className={className} fill="none"><circle cx="32" cy="32" r="23" stroke="currentColor" strokeWidth="4"/><path d="m32 18 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1 4-9Z" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round"/></svg>;
}
function FlameIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg viewBox="0 0 64 64" className={className} fill="none"><path d="M34 7c4 12-4 14 2 23 3-6 8-8 9-14 8 8 11 16 9 25-2 11-11 17-22 17S12 51 10 40c-2-10 4-19 13-27 0 8 4 11 7 15 3-7 1-13 4-21Z" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round"/></svg>;
}

export function GameBoard({ state, onPlace, onContinue, onBank, onSkip, onRedrawAudioFail, onReset, audioTarget, onAudioTargetChange, onPlayOnCurrentPlayer, canPlayOnCurrentPlayer = false }: GameBoardProps) {
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
    return <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center overflow-hidden px-4 py-14 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,_rgba(245,158,11,0.20),_transparent_35%),radial-gradient(circle_at_50%_70%,_rgba(217,70,239,0.14),_transparent_45%)]" />
      <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-amber-300/40 bg-amber-400/10 text-amber-300 shadow-[0_0_60px_rgba(245,158,11,0.28)]"><TrophyIcon /></div>
      <p className="relative mt-7 text-xs font-black uppercase tracking-[0.3em] text-amber-200/70">Matchen är slut</p>
      <h1 className="brand-text brand-glow relative mt-3 text-5xl font-black sm:text-6xl">{winner?.name ?? "Vinnare"}</h1>
      <p className="relative mt-3 text-white/55">{state.message}</p>
      <div className="relative mt-8 w-full space-y-3">{state.players.slice().sort((a, b) => b.timeline.length - a.timeline.length).map((player, index) => <div key={player.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-4 backdrop-blur-xl"><div className="flex items-center gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-full font-black ${index === 0 ? "bg-amber-400 text-black" : "bg-white/10"}`}>{index + 1}</span><span className="font-bold">{player.name}</span></div><span className="font-black text-fuchsia-200">{player.timeline.length} kort</span></div>)}</div>
      <button type="button" onClick={onReset} className="relative mt-8 w-full rounded-2xl border border-fuchsia-300/50 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 px-10 py-4 text-lg font-black shadow-[0_0_32px_rgba(217,70,239,0.30)]">Spela igen</button>
    </main>;
  }

  return <main className="relative mx-auto min-h-screen max-w-6xl overflow-hidden px-3 pb-10 pt-5 sm:px-6 sm:pt-8">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_50%_0%,_rgba(139,92,246,0.24),_transparent_60%)]" />
    <header className="relative mb-5 rounded-[1.7rem] border border-white/10 bg-black/25 p-4 backdrop-blur-xl sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${isHistory ? "border-violet-400/40 bg-violet-500/10 text-violet-300" : "border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-300"}`}>{isHistory ? <HistoryIcon /> : <MusicIcon />}</div><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Beatline tävling</p><h1 className="mt-1 text-2xl font-black">{isHistory ? "Historia" : "Musik"}</h1><p className="mt-1 text-xs text-white/45">{meta.label} · {state.deck.length + (state.currentSong ? 1 : 0)} kvar · först till {CARDS_TO_WIN}</p></div></div>
        <div className="flex items-center gap-2">{pot > 0 && <span className="flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-2 text-xs font-black text-fuchsia-200"><TokenIcon className="h-4 w-4" /> Pott {pot}</span>}<button type="button" onClick={onReset} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/55">Avsluta</button></div>
      </div>
    </header>

    <div className="relative mb-6 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/[0.07] px-4 py-3 text-center text-sm font-bold text-white/80 shadow-[0_0_22px_rgba(217,70,239,0.10)]">{state.message}</div>

    <div className="relative grid min-w-0 items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <section className="flex flex-col items-center gap-4 rounded-[1.8rem] border border-white/10 bg-black/20 p-4 backdrop-blur-xl">
        {isHistory ? <>{isListening && state.currentSong && <HistoryPromptCard event={state.currentSong} />}{isResult && state.revealedSong && <><RevealedCard song={state.revealedSong} result={state.lastResult} /><HistoryExplanation event={state.revealedSong} /></>}</> : <><div>{isResult && state.revealedSong ? <RevealedCard song={state.revealedSong} result={state.lastResult} /> : <MysteryCard />}</div><SongQrCard song={state.currentSong} active={isListening} audioTarget={audioTarget} onAudioTargetChange={onAudioTargetChange} />{onPlayOnCurrentPlayer && isListening && <button type="button" onClick={onPlayOnCurrentPlayer} disabled={!canPlayOnCurrentPlayer} className="w-full max-w-sm rounded-2xl border border-sky-400/30 bg-sky-500/15 px-4 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-35">Spela på {currentPlayer?.name ?? "spelarens"} mobil</button>}{(playLocal || audioStatus === "error") && <MusicPlayer song={state.currentSong} autoPlay={false} active={isListening} playLocal={playLocal} onPlaybackStatus={setAudioStatus} onRequestNewCard={() => { setSelectedSlot(null); onRedrawAudioFail(); }} canRequestNewCard={state.deck.length > 0} showExternalLinks={audioTarget === "local"} />}</>}

        <div className="w-full max-w-sm space-y-2.5">
          {isListening && <><button type="button" disabled={selectedSlot === null} onClick={confirmPlace} className="w-full rounded-2xl border border-fuchsia-300/50 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 py-4 font-black shadow-[0_0_24px_rgba(217,70,239,0.25)] disabled:opacity-35">{selectedSlot === null ? "Välj plats på tidslinjen" : `Placera på position ${selectedSlot + 1}`}</button>{state.useTokens && <button type="button" onClick={() => { setSelectedSlot(null); onSkip(); }} disabled={!currentPlayer || currentPlayer.tokens < 1 || state.deck.length === 0} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white/70 disabled:opacity-35"><TokenIcon /> Hoppa över {isHistory ? "händelsen" : "låten"} · 1 token</button>}{!isHistory && audioStatus === "error" && <button type="button" onClick={onRedrawAudioFail} disabled={state.deck.length === 0} className="w-full rounded-2xl border border-amber-400/30 bg-amber-500/15 py-3 font-bold text-amber-100">Nytt kort på grund av ljudfel</button>}</>}
          {isResult && state.lastResult === "correct" && <><div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-center text-sm text-emerald-100">Rätt! Banka {pot} kort säkert eller fortsätt och riskera dem.</div><button type="button" onClick={onContinue} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-4 font-black"><FlameIcon /> Fortsätt spela</button><button type="button" onClick={onBank} className="w-full rounded-2xl border border-emerald-400/30 bg-emerald-500/15 py-4 font-black text-emerald-200">Stanna och banka +{pot}</button></>}
          {isResult && state.lastResult === "wrong" && <button type="button" onClick={onBank} className="w-full rounded-2xl border border-white/10 bg-white/10 py-4 font-black">Nästa spelares tur</button>}
        </div>
      </section>

      <section className="min-w-0 space-y-4">
        {currentPlayer && <Timeline player={currentPlayer} cards={state.workingTimeline} isActive interactive={isListening} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} highlightIds={state.roundCards.map((card) => card.id)} showYears label={pot > 0 ? `${currentPlayer.timeline.length} bankade + ${pot} i potten` : "Placera kortet mellan rätt årtal"} />}
        {state.players.filter((player) => player.id !== currentPlayer?.id).length > 0 && <div className="grid min-w-0 gap-3 md:grid-cols-2">{state.players.filter((player) => player.id !== currentPlayer?.id).map((player) => <Timeline key={player.id} player={player} showYears />)}</div>}
      </section>
    </div>
  </main>;
}
