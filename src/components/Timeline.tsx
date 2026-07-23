import type { Player, Song } from "../types";
import { cn } from "../utils/cn";

interface TimelineProps {
  player: Player;
  cards?: Song[];
  isActive?: boolean;
  interactive?: boolean;
  selectedSlot?: number | null;
  onSelectSlot?: (slot: number) => void;
  highlightIds?: string[];
  showYears?: boolean;
  label?: string;
}

function CardFace({
  song,
  color,
  highlight,
  showYear,
  compact,
}: {
  song: Song;
  color: string;
  highlight?: boolean;
  showYear: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative shrink-0 overflow-hidden rounded-2xl border transition duration-300",
        compact ? "h-[5.5rem] w-[4.25rem]" : "h-28 w-[5.25rem] sm:h-32 sm:w-24",
        highlight
          ? "scale-105 border-emerald-400/60 bg-gradient-to-b from-emerald-500/25 to-zinc-900 shadow-[0_0_24px_rgba(52,211,153,0.35)]"
          : "border-white/10 bg-gradient-to-b from-white/[0.1] to-black/50 shadow-xl hover:-translate-y-0.5"
      )}
    >
      <div
        className="absolute inset-x-0 top-0 h-[3px] opacity-90"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />
      <div
        className="absolute -right-4 -top-4 h-12 w-12 rounded-full opacity-30 blur-xl"
        style={{ background: color }}
      />
      <div
        className={cn(
          "relative flex h-full flex-col justify-between p-2",
          !compact && "sm:p-2.5"
        )}
      >
        <div
          className={cn(
            "line-clamp-3 font-semibold leading-tight text-white",
            compact ? "text-[9px]" : "text-[10px] sm:text-[11px]"
          )}
        >
          {song.title}
        </div>
        <div>
          <div
            className={cn(
              "truncate text-white/40",
              compact ? "text-[8px]" : "text-[9px] sm:text-[10px]"
            )}
          >
            {song.artist}
          </div>
          {showYear && (
            <div
              className={cn(
                "mt-0.5 font-black tabular-nums tracking-tight",
                compact ? "text-sm" : "text-base sm:text-lg"
              )}
              style={{ color }}
            >
              {song.year}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SlotButton({
  selected,
  onClick,
}: {
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-28 w-9 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed transition duration-200 sm:h-32 sm:w-11",
        selected
          ? "scale-105 border-fuchsia-400 bg-fuchsia-500/25 text-fuchsia-100 shadow-[0_0_20px_rgba(232,121,249,0.35)]"
          : "border-white/15 bg-white/[0.03] text-white/40 hover:border-fuchsia-400/50 hover:bg-fuchsia-500/10 hover:text-fuchsia-200"
      )}
    >
      <span className="text-xl font-light">+</span>
    </button>
  );
}

export function Timeline({
  player,
  cards,
  isActive = false,
  interactive = false,
  selectedSlot = null,
  onSelectSlot,
  highlightIds = [],
  showYears = true,
  label,
}: TimelineProps) {
  const timeline = cards ?? player.timeline;
  const slots = timeline.length + (interactive ? 1 : 0);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border p-3 transition duration-500 sm:p-4",
        isActive
          ? "border-fuchsia-400/35 bg-gradient-to-br from-fuchsia-500/15 via-white/[0.04] to-transparent shadow-[0_0_40px_rgba(232,121,249,0.12)]"
          : "glass-panel"
      )}
    >
      {isActive && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-fuchsia-500/20 blur-3xl" />
      )}

      <div className="relative mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative">
            <div
              className="h-3.5 w-3.5 rounded-full shadow-lg"
              style={{
                backgroundColor: player.color,
                boxShadow: `0 0 12px ${player.color}`,
              }}
            />
            {isActive && (
              <div
                className="absolute inset-0 animate-ping rounded-full opacity-40"
                style={{ backgroundColor: player.color }}
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-bold text-white">{player.name}</div>
            {label && (
              <div className="text-[10px] uppercase tracking-wider text-white/35">
                {label}
              </div>
            )}
          </div>
          {isActive && (
            <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-200 ring-1 ring-fuchsia-400/30">
              Tur
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="rounded-full bg-black/30 px-2.5 py-1 tabular-nums text-white/60 ring-1 ring-white/10">
            <span className="font-bold text-white">{player.timeline.length}</span>
            <span className="text-white/35">/10</span>
          </div>
          {player.tokens > 0 && (
            <div className="flex items-center gap-0.5" title="Tokens">
              {Array.from({ length: player.tokens }).map((_, i) => (
                <span
                  key={i}
                  className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative flex items-center gap-1.5 overflow-x-auto pb-1">
        {interactive
          ? Array.from({ length: slots }).map((_, slotIdx) => (
              <div key={`g-${slotIdx}`} className="flex items-center gap-1.5">
                <SlotButton
                  selected={selectedSlot === slotIdx}
                  onClick={() => onSelectSlot?.(slotIdx)}
                />
                {slotIdx < timeline.length && (
                  <CardFace
                    song={timeline[slotIdx]}
                    color={player.color}
                    highlight={highlightIds.includes(timeline[slotIdx].id)}
                    showYear={showYears}
                  />
                )}
              </div>
            ))
          : timeline.map((song) => (
              <CardFace
                key={song.id}
                song={song}
                color={player.color}
                highlight={highlightIds.includes(song.id)}
                showYear={showYears}
                compact
              />
            ))}
        {!interactive && timeline.length === 0 && (
          <div className="py-6 text-sm text-white/30">Inga hits än</div>
        )}
      </div>
    </div>
  );
}

export function MysteryCard() {
  return (
    <div className="relative mx-auto">
      <div className="absolute inset-0 animate-pulse rounded-[1.75rem] bg-gradient-to-br from-violet-500/40 via-fuchsia-500/30 to-amber-400/30 blur-xl" />
      <div className="relative flex h-48 w-36 flex-col items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/20 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-500 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_45%)]" />
        <div className="absolute inset-3 rounded-[1.25rem] border border-white/10" />
        <div className="spin-slow relative flex h-16 w-16 items-center justify-center rounded-full bg-black/30 ring-2 ring-white/20 backdrop-blur-sm">
          <div className="h-4 w-4 rounded-full bg-white/90 shadow-lg" />
          <div className="absolute inset-1 rounded-full border border-white/10" />
          <div className="absolute inset-3 rounded-full border border-white/10" />
        </div>
        <div className="relative mt-4 text-center">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-white">
            Mystery
          </div>
          <div className="mt-1 text-[10px] font-medium text-white/70">Beat · ????</div>
        </div>
      </div>
    </div>
  );
}

export function RevealedCard({
  song,
  result,
}: {
  song: Song;
  result?: "correct" | "wrong" | null;
}) {
  return (
    <div className="relative mx-auto">
      <div
        className={cn(
          "absolute inset-0 rounded-[1.75rem] blur-xl transition",
          result === "correct" && "bg-emerald-400/40",
          result === "wrong" && "bg-rose-500/40",
          !result && "bg-fuchsia-500/30"
        )}
      />
      <div
        className={cn(
          "card-reveal relative flex h-52 w-40 flex-col justify-between overflow-hidden rounded-[1.75rem] border p-4 shadow-2xl",
          result === "correct" &&
            "border-emerald-400/40 bg-gradient-to-b from-emerald-950 to-zinc-950",
          result === "wrong" &&
            "border-rose-400/40 bg-gradient-to-b from-rose-950 to-zinc-950",
          !result &&
            "border-white/15 bg-gradient-to-b from-zinc-800 to-zinc-950"
        )}
      >
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-1.5",
            result === "correct" && "bg-gradient-to-r from-emerald-400 to-teal-300",
            result === "wrong" && "bg-gradient-to-r from-rose-500 to-orange-400",
            !result && "bg-gradient-to-r from-violet-500 to-amber-400"
          )}
        />
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
            {song.decade}
          </div>
          <div className="mt-2 text-base font-bold leading-snug text-white">
            {song.title}
          </div>
          <div className="mt-1 text-sm text-white/45">{song.artist}</div>
        </div>
        <div
          className={cn(
            "text-4xl font-black tabular-nums tracking-tight",
            result === "correct" && "text-emerald-300",
            result === "wrong" && "text-rose-300",
            !result && "text-fuchsia-300"
          )}
        >
          {song.year}
        </div>
      </div>
    </div>
  );
}
