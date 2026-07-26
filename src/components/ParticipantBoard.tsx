import { useState } from "react";
import type { GameState } from "../types";
import { playClickSound } from "../utils/sounds";
import { HistoryExplanation, HistoryPromptCard } from "./HistoryCard";
import { RevealedCard, Timeline } from "./Timeline";

type ParticipantBoardProps = {
  state: GameState;
  isMyTurn: boolean;
  myPlayerIndex: number;
  onPlace: (slot: number) => void;
  onContinue: () => void;
  onBank: () => void;
  onSkip: () => void;
};

type IconProps = { className?: string };

function MusicIcon({ className = "h-10 w-10" }: IconProps) {
  return <svg viewBox="0 0 64 64" className={className} fill="none"><path d="M24 46V18l26-5v27" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="17" cy="47" r="8" stroke="currentColor" strokeWidth="4"/><circle cx="43" cy="41" r="8" stroke="currentColor" strokeWidth="4"/><path d="M24 27l26-5" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>;
}
function HistoryIcon({ className = "h-10 w-10" }: IconProps) {
  return <svg viewBox="0 0 64 64" className={className} fill="none"><path d="M10 20h44M15 20l17-10 17 10M16 24v22m11-22v22m10-22v22m11-22v22M10 50h44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function TrophyIcon({ className = "h-16 w-16" }: IconProps) {
  return <svg viewBox="0 0 64 64" className={className} fill="none"><path d="M20 10h24v12c0 11-5 18-12 18s-12-7-12-18V10Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/><path d="M20 16H10v4c0 8 5 13 12 14M44 16h10v4c0 8-5 13-12 14M32 40v9M23 55h18" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>;
}
function TokenIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg viewBox="0 0 64 64" className={className} fill="none"><circle cx="32" cy="32" r="23" stroke="currentColor" strokeWidth="4"/><path d="m32 18 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1 4-9Z" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round"/></svg>;
}
function FlameIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg viewBox="0 0 64 64" className={className} fill="none"><path d="M34 7c4 12-4 14 2 23 3-6 8-8 9-14 8 8 11 16 9 25-2 11-11 17-22 17S12 51 10 40c-2-10 4-19 13-27 0 8 4 11 7 15 3-7 1-13 4-21Z" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round"/></svg>;
}

export function ParticipantBoard({ state, isMyTurn, myPlayerIndex, onPlace, onContinue, onBank, onSkip }: ParticipantBoardProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const currentPlayer = state.players[state.currentPlayerIndex];
  const me = state.players[myPlayerIndex];
  const isListening = state.phase === "listening";
  const isResult = state.phase === "result";
  const isGameOver = state.phase === "game-over";
  const isHistory = state.contentMode === "history";
  const pot = state.roundCards.length;

  const confirmPlace = () => {
    if (selectedSlot === null || !isMyTurn) return;
    playClickSound();
    onPlace(selectedSlot);
    setSelectedSlot(null);
  };

  if (isGameOver) {
    const winner = state.players.find((player) => player.id === state.winnerId);
    return <main className="relative mx-auto flex min-h-[82vh] max-w-lg flex-col items-center justify-center overflow-hidden px-4 py-10 text-center"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,_rgba(245,158,11,0.20),_transparent_38%),radial-gradient(circle_at_50%_75%,_rgba(217,70,239,0.12),_transparent_45%)]"/><div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-amber-300/40 bg-amber-400/10 text-amber-300 shadow-[0_0_48px_rgba(245,158,11,0.25)]"><TrophyIcon /></div><p className="relative mt-6 text-xs font-black uppercase tracking-[0.28em] text-amber-200/70">Matchen är slut</p><h1 className="brand-text relative mt-3 text-4xl font-black">{winner?.name ?? "Vinnare"}</h1><div className="relative mt-8 w-full space-y-3">{state.players.slice().sort((a, b) => b.timeline.length - a.timeline.length).map((player, index) => <div key={player.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-4"><div className="flex items-center gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-full font-black ${index === 0 ? "bg-amber-400 text-black" : "bg-white/10"}`}>{index + 1}</span><span className="font-bold">{player.name}</span></div><strong className="text-fuchsia-200">{player.timeline.length} kort</strong></div>)}</div><p className="relative mt-6 text-sm text-white/45">Spelledaren startar nästa match.</p></main>;
  }

  if (!isMyTurn) {
    return <main className="relative mx-auto flex min-h-[82vh] max-w-lg flex-col justify-center overflow-hidden px-4 py-8"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,_rgba(139,92,246,0.22),_transparent_45%)]"/><div className="relative rounded-[2rem] border border-violet-400/20 bg-black/30 p-7 text-center shadow-[0_0_36px_rgba(139,92,246,0.12)] backdrop-blur-xl"><div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full border ${isHistory ? "border-violet-400/40 bg-violet-500/10 text-violet-300" : "border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-300"}`}>{isHistory ? <HistoryIcon className="h-12 w-12"/> : <MusicIcon className="h-12 w-12"/>}</div><p className="mt-6 text-xs font-black uppercase tracking-[0.25em] text-white/40">Vänta på din tur</p><h1 className="mt-3 text-3xl font-black">{currentPlayer?.name ?? "Nästa spelare"} spelar</h1><p className="mt-3 text-white/55">Din mobil aktiveras automatiskt när det är din tur.</p>{me && <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"><div className="text-xs uppercase tracking-[0.18em] text-white/35">Kort</div><div className="mt-2 text-3xl font-black text-fuchsia-200">{me.timeline.length}</div></div><div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"><div className="text-xs uppercase tracking-[0.18em] text-white/35">Tokens</div><div className="mt-2 flex items-center justify-center gap-2 text-3xl font-black text-violet-200"><TokenIcon className="h-6 w-6"/>{state.useTokens ? me.tokens : "Av"}</div></div></div>}</div></main>;
  }

  return <main className="relative mx-auto min-h-[82vh] max-w-2xl overflow-hidden px-3 py-6"><div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,_rgba(16,185,129,0.18),_transparent_60%)]"/><div className="relative mb-5 rounded-[1.6rem] border border-emerald-400/30 bg-emerald-500/10 px-4 py-4 text-center shadow-[0_0_26px_rgba(16,185,129,0.12)]"><p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">Din tur</p><h1 className="mt-2 text-xl font-black">{state.message}</h1></div>
    {isHistory && isListening && state.currentSong && <div className="relative mb-5 flex justify-center"><HistoryPromptCard event={state.currentSong} /></div>}
    {isListening && <div className="relative mb-5 grid grid-cols-2 gap-3 text-center text-sm"><div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-4"><div className="text-white/45">Vid rätt svar</div><div className="mt-1 text-lg font-black text-emerald-200">Potten blir {pot + 1}</div></div><div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-4"><div className="text-white/45">Vid fel svar</div><div className="mt-1 text-lg font-black text-rose-200">Du förlorar {pot}</div></div></div>}
    {isResult && state.revealedSong && <div className="relative mb-5 space-y-4"><div className="flex justify-center"><RevealedCard song={state.revealedSong} result={state.lastResult} /></div>{isHistory && <HistoryExplanation event={state.revealedSong} />}</div>}
    <div className="relative">{currentPlayer && <Timeline player={currentPlayer} cards={state.workingTimeline} isActive interactive={isListening} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} highlightIds={state.roundCards.map((card) => card.id)} showYears label={pot > 0 ? `${currentPlayer.timeline.length} säkra + ${pot} i potten` : "Tryck mellan rätt årtal"} />}</div>
    <div className="relative mx-auto mt-5 max-w-sm space-y-3">
      {isListening && <><button type="button" disabled={selectedSlot === null} onClick={confirmPlace} className="w-full rounded-2xl border border-fuchsia-300/50 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 py-4 text-lg font-black shadow-[0_0_24px_rgba(217,70,239,0.24)] disabled:opacity-35">{selectedSlot === null ? "Välj en plats" : `Placera på position ${selectedSlot + 1}`}</button>{state.useTokens && <button type="button" onClick={onSkip} disabled={!currentPlayer || currentPlayer.tokens < 1 || state.deck.length === 0} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white/70 disabled:opacity-35"><TokenIcon /> Hoppa över {isHistory ? "händelsen" : "låten"} · 1 token</button>}</>}
      {isResult && state.lastResult === "correct" && <><button type="button" onClick={onContinue} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-4 text-lg font-black"><FlameIcon /> Fortsätt spela</button><button type="button" onClick={onBank} className="w-full rounded-2xl border border-emerald-400/30 bg-emerald-500/15 py-4 font-black text-emerald-200">Stanna och banka +{pot}</button></>}
      {isResult && state.lastResult === "wrong" && <button type="button" onClick={onBank} className="w-full rounded-2xl border border-white/10 bg-white/10 py-4 font-black">Lämna över turen</button>}
    </div>
  </main>;
}