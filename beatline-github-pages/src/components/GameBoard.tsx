import { useState } from "react";
import type { GameState } from "../types";
import { CARDS_TO_WIN, CATEGORY_META } from "../types";
import { cn } from "../utils/cn";
import { playClickSound } from "../utils/sounds";
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
  onAudioTargetChange: (t: AudioTarget) => void;
}

export function GameBoard({
  state,
  onPlace,
  onContinue,
  onBank,
  onSkip,
  onRedrawAudioFail,
  onReset,
  audioTarget,
  onAudioTargetChange,
}: GameBoardProps) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("idle");
  const playLocal = audioTarget === "local" || audioTarget === "both";

  const currentPlayer = state.players[state.currentPlayerIndex];
  const isListening = state.phase === "listening";
  const isResult = state.phase === "result";
  const isGameOver = state.phase === "game-over";
  const otherPlayers = state.players.filter((p) => p.id !== currentPlayer?.id);
  const pot = state.roundCards.length;
  const highlightIds = state.roundCards.map((s) => s.id);

  const confirmPlace = () => {
    if (selectedSlot === null) return;
    playClickSound();
    onPlace(selectedSlot);
    setSelectedSlot(null);
  };

  if (isGameOver) {
    const winner = state.players.find((p) => p.id === state.winnerId);
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-pulse rounded-full bg-amber-400/30 blur-3xl" />
          <div className="relative text-7xl">🏆</div>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-200/70">
          BeatLine Champion
        </p>
        <h1 className="brand-text mt-2 text-5xl font-black tracking-tight sm:text-6xl">
          {winner ? winner.name : "Game over"}
        </h1>
        <p className="mt-3 max-w-md text-white/50">{state.message}</p>

        {state.revealedSong && (
          <div className="mt-8">
            <RevealedCard song={state.revealedSong} result={state.lastResult} />
          </div>
        )}

        <div className="mt-10 w-full space-y-3">
          {state.players
            .slice()
            .sort((a, b) => b.timeline.length - a.timeline.length)
            .map((p, i) => (
              <div
                key={p.id}
                className="glass-panel flex items-center justify-between rounded-2xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 text-lg">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                  </span>
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: p.color,
                      boxShadow: `0 0 12px ${p.color}`,
                    }}
                  />
                  <span className="font-semibold text-white">{p.name}</span>
                </div>
                <span className="tabular-nums font-bold text-white/80">
                  {p.timeline.length}{" "}
                  <span className="font-normal text-white/40">hits</span>
                </span>
              </div>
            ))}
        </div>

        <button
          type="button"
          onClick={onReset}
          className="mt-10 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 px-10 py-4 font-bold text-white shadow-[0_12px_40px_rgba(168,85,247,0.35)] transition hover:scale-105"
        >
          Spela igen
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-3 py-4 sm:px-6 sm:py-8">
      {/* Top bar */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30">
            <div className="h-3 w-3 rounded-full bg-white/90" />
          </div>
          <div>
            <h1 className="brand-text text-2xl font-black tracking-tight">BeatLine</h1>
            <p className="text-[11px] text-white/40">
              {CATEGORY_META[state.category].emoji}{" "}
              {CATEGORY_META[state.category].label} ·{" "}
              {state.deck.length + (state.currentSong ? 1 : 0)} kvar · först till{" "}
              {CARDS_TO_WIN}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pot > 0 && (
            <div className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.18)]">
              Pott {pot}
              {state.streak > 1 && (
                <span className="ml-1.5 text-emerald-300">· ×{state.streak}</span>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            Avsluta
          </button>
        </div>
      </header>

      {/* Status */}
      <div
        className={cn(
          "glass-panel mb-6 rounded-2xl px-4 py-3.5 text-center text-sm font-medium",
          state.lastResult === "correct" &&
            "border-emerald-400/30 text-emerald-200",
          state.lastResult === "wrong" && "border-rose-400/30 text-rose-200",
          !state.lastResult && "text-white/70"
        )}
      >
        {state.message}
      </div>

      <div className="mb-8 grid items-start gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left: card + audio + actions */}
        <div className="flex flex-col items-center gap-4">
          <div className="float-y">
            {isResult && state.revealedSong ? (
              <RevealedCard song={state.revealedSong} result={state.lastResult} />
            ) : (
              <MysteryCard />
            )}
          </div>

          <SongQrCard
            song={state.currentSong}
            active={isListening}
            audioTarget={audioTarget}
            onAudioTargetChange={onAudioTargetChange}
          />

          {(playLocal || audioStatus === "error") && (
            <MusicPlayer
              song={state.currentSong}
              autoPlay={false}
              active={isListening}
              playLocal={playLocal}
              onPlaybackStatus={setAudioStatus}
              onRequestNewCard={() => {
                playClickSound();
                setSelectedSlot(null);
                onRedrawAudioFail();
              }}
              canRequestNewCard={state.deck.length > 0}
              showExternalLinks={audioTarget === "local"}
            />
          )}

          {pot > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {state.roundCards.map((c) => (
                <div
                  key={c.id}
                  className="rounded-full border border-emerald-400/25 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-200"
                  title={`${c.title} (${c.year})`}
                >
                  {c.year}
                </div>
              ))}
            </div>
          )}

          <div className="flex w-full max-w-sm flex-col gap-2.5">
            {isListening && (
              <>
                <button
                  type="button"
                  disabled={selectedSlot === null}
                  onClick={confirmPlace}
                  className="relative w-full overflow-hidden rounded-2xl py-3.5 font-bold text-white shadow-lg transition enabled:hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400" />
                  <span className="relative">
                    Placera kort
                    {selectedSlot !== null ? ` · pos ${selectedSlot + 1}` : ""}
                  </span>
                </button>

                {audioStatus === "error" && (
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setSelectedSlot(null);
                      onRedrawAudioFail();
                    }}
                    disabled={state.deck.length === 0}
                    className="rounded-2xl border border-amber-400/40 bg-amber-500/20 py-3 text-sm font-bold text-amber-100 transition hover:bg-amber-500/30 disabled:opacity-40"
                  >
                    Nytt kort p.g.a. ljudfel (gratis)
                  </button>
                )}

                {state.useTokens && (
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setSelectedSlot(null);
                      onSkip();
                    }}
                    disabled={currentPlayer.tokens < 1 || state.deck.length === 0}
                    className="rounded-2xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 disabled:opacity-40"
                  >
                    Hoppa över låt (1 token)
                  </button>
                )}
              </>
            )}

            {isResult && state.lastResult === "correct" && (
              <div className="space-y-2">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-center text-xs text-emerald-100/80">
                  Du har{" "}
                  <strong className="text-emerald-200">
                    {pot} {pot === 1 ? "kort" : "kort"}
                  </strong>{" "}
                  i potten. Fortsätt eller banka säkert.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onContinue();
                  }}
                  className="relative w-full overflow-hidden rounded-2xl py-3.5 font-bold text-white transition hover:scale-[1.02]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-500" />
                  <span className="relative">Fortsätt spela 🔥</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onBank();
                  }}
                  className="w-full rounded-2xl border border-emerald-400/30 bg-emerald-500/15 py-3.5 font-bold text-emerald-200 transition hover:bg-emerald-500/25"
                >
                  Stanna & banka {pot > 0 ? `(+${pot})` : ""} ✓
                </button>
              </div>
            )}

            {isResult && state.lastResult === "wrong" && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onBank();
                }}
                className="w-full rounded-2xl bg-gradient-to-r from-zinc-700 to-zinc-800 py-3.5 font-bold text-white transition hover:scale-[1.02]"
              >
                Nästa spelares tur →
              </button>
            )}
          </div>
        </div>

        {/* Right: timeline */}
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
              {isListening ? "Välj plats på tidslinjen" : "Tidslinje denna runda"}
            </h2>
            {isListening && selectedSlot !== null && (
              <span className="text-xs text-fuchsia-300">
                Position {selectedSlot + 1} vald
              </span>
            )}
          </div>

          {currentPlayer && (
            <Timeline
              player={currentPlayer}
              cards={state.workingTimeline}
              isActive
              interactive={isListening}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              highlightIds={highlightIds}
              showYears
              label={
                pot > 0
                  ? `${currentPlayer.timeline.length} bankade + ${pot} i potten`
                  : undefined
              }
            />
          )}

          {isListening && pot > 0 && (
            <div className="glass-panel rounded-2xl p-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-amber-200">
                  Risknivå
                </span>
                <span className="text-amber-100/60">{pot} kort på spel</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(pot, 8) }).map((_, i) => (
                  <div
                    key={i}
                    className="h-2 flex-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 shadow-[0_0_8px_rgba(251,191,36,0.35)]"
                  />
                ))}
                {Array.from({ length: Math.max(0, 8 - pot) }).map((_, i) => (
                  <div
                    key={`e-${i}`}
                    className="h-2 flex-1 rounded-full bg-white/10"
                  />
                ))}
              </div>
            </div>
          )}

          {otherPlayers.length > 0 && (
            <div className="space-y-3 pt-2">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                Motståndare
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {otherPlayers.map((p) => (
                  <Timeline key={p.id} player={p} isActive={false} showYears />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
