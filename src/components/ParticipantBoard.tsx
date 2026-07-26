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
    return <main className="mx-auto flex min-h-[75vh] max-w-lg flex-col items-center justify-center px-4 text-center"><div className="text-7xl">🏆</div><p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-amber-200/70">Matchen är slut</p><h1 className="brand-text mt-2 text-4xl font-black">{winner?.name ?? "Vinnare"}</h1><div className="mt-8 w-full space-y-2">{state.players.slice().sort((a, b) => b.timeline.length - a.timeline.length).map((player, index) => <div key={player.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><span>{index + 1}. {player.name}</span><strong>{player.timeline.length} kort</strong></div>)}</div><p className="mt-6 text-sm text-white/45">Spelledaren startar nästa match.</p></main>;
  }

  if (!isMyTurn) {
    return <main className="mx-auto flex min-h-[75vh] max-w-lg flex-col justify-center px-4 py-8"><div className="rounded-[2rem] border border-white/10 bg-white/5 p-7 text-center"><div className="text-5xl">{isHistory ? "📚" : "🎧"}</div><p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-white/40">Vänta på din tur</p><h1 className="mt-2 text-3xl font-black">{currentPlayer?.name ?? "Nästa spelare"} spelar</h1><p className="mt-3 text-white/55">Din mobil aktiveras automatiskt när det är din tur.</p>{me && <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-4"><div className="text-sm text-white/45">Din ställning</div><div className="mt-1 text-2xl font-black">{me.timeline.length} kort{state.useTokens ? ` · ${me.tokens} tokens` : ""}</div></div>}</div></main>;
  }

  return (
    <main className="mx-auto min-h-[75vh] max-w-2xl px-3 py-6">
      <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-4 text-center"><p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Din tur</p><h1 className="mt-1 text-xl font-black">{state.message}</h1></div>
      {isHistory && isListening && state.currentSong && <div className="mb-5 flex justify-center"><HistoryPromptCard event={state.currentSong} /></div>}
      {isListening && <div className="mb-4 grid grid-cols-2 gap-2 text-center text-sm"><div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-3"><div className="text-white/45">Vid rätt svar</div><div className="mt-1 font-black text-emerald-200">Potten blir {pot + 1}</div></div><div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-3"><div className="text-white/45">Vid fel svar</div><div className="mt-1 font-black text-rose-200">Du förlorar {pot}</div></div></div>}
      {isResult && state.revealedSong && <div className="mb-5 space-y-4"><div className="flex justify-center"><RevealedCard song={state.revealedSong} result={state.lastResult} /></div>{isHistory && <HistoryExplanation event={state.revealedSong} />}</div>}
      {currentPlayer && <Timeline player={currentPlayer} cards={state.workingTimeline} isActive interactive={isListening} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} highlightIds={state.roundCards.map((card) => card.id)} showYears label={pot > 0 ? `${currentPlayer.timeline.length} säkra + ${pot} i potten` : "Tryck mellan rätt årtal"} />}
      <div className="mx-auto mt-5 max-w-sm space-y-3">
        {isListening && <><button type="button" disabled={selectedSlot === null} onClick={confirmPlace} className="w-full rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400 py-4 text-lg font-black disabled:opacity-35">{selectedSlot === null ? "Välj en plats" : `Placera på position ${selectedSlot + 1}`}</button>{state.useTokens && <button type="button" onClick={onSkip} disabled={!currentPlayer || currentPlayer.tokens < 1 || state.deck.length === 0} className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 font-semibold text-white/70 disabled:opacity-35">Hoppa över {isHistory ? "händelsen" : "låten"} · 1 token</button>}</>}
        {isResult && state.lastResult === "correct" && <><button type="button" onClick={onContinue} className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-4 text-lg font-black">Fortsätt spela 🔥</button><button type="button" onClick={onBank} className="w-full rounded-2xl border border-emerald-400/30 bg-emerald-500/15 py-4 font-black text-emerald-200">Stanna och banka +{pot}</button></>}
        {isResult && state.lastResult === "wrong" && <button type="button" onClick={onBank} className="w-full rounded-2xl bg-white/10 py-4 font-black">Lämna över turen</button>}
      </div>
    </main>
  );
}