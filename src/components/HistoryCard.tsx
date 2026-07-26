import type { Song } from "../types";

export function HistoryPromptCard({ event }: { event: Song }) {
  return (
    <div className="w-full max-w-sm rounded-[1.75rem] border border-amber-400/25 bg-gradient-to-br from-amber-500/15 via-white/5 to-black/30 p-6 text-center shadow-2xl">
      <div className="text-5xl">{event.icon ?? "📚"}</div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/70">När hände detta?</p>
      <h2 className="mt-3 text-2xl font-black leading-tight text-white">{event.title}</h2>
      <p className="mt-3 text-sm text-white/45">{event.artist}</p>
      <div className="mt-5 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/55">Placera händelsen mellan de årtal du redan har.</div>
    </div>
  );
}

export function HistoryExplanation({ event }: { event: Song }) {
  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-left">
      <div className="flex items-start gap-3"><span className="text-2xl">{event.icon ?? "📚"}</span><div><div className="font-black text-amber-100">{event.title} · {event.year}</div><p className="mt-1 text-sm leading-relaxed text-white/65">{event.summary}</p><div className="mt-2 text-xs font-semibold uppercase tracking-wider text-amber-200/60">{event.artist}</div></div></div>
    </div>
  );
}