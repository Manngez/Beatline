import { useEffect, useMemo, useState } from "react";
import type { Song } from "../types";
import {
  LINK_SERVICE_META,
  qrImageUrl,
  songLinkForService,
  type SongLinkService,
} from "../utils/songLinks";
import { cn } from "../utils/cn";
import { playClickSound } from "../utils/sounds";

export type AudioTarget = "local" | "scan" | "both";

export const AUDIO_TARGET_META: Record<
  AudioTarget,
  { label: string; emoji: string; description: string }
> = {
  local: {
    label: "Denna enhet",
    emoji: "📱",
    description: "Tryck play här när ni är redo",
  },
  scan: {
    label: "QR till låt",
    emoji: "📷",
    description: "Skanna koden → öppna i Spotify m.m.",
  },
  both: {
    label: "Båda",
    emoji: "🔊",
    description: "Play här + QR för andra telefoner",
  },
};

interface SongQrCardProps {
  song: Song | null;
  active: boolean;
  audioTarget: AudioTarget;
  onAudioTargetChange: (t: AudioTarget) => void;
  showTargetPicker?: boolean;
}

export function SongQrCard({
  song,
  active,
  audioTarget,
  onAudioTargetChange,
  showTargetPicker = true,
}: SongQrCardProps) {
  const [service, setService] = useState<SongLinkService>("spotify");
  const [copied, setCopied] = useState(false);

  const link = useMemo(
    () => (song ? songLinkForService(song, service) : ""),
    [song, service]
  );

  const showQr =
    active && song && (audioTarget === "scan" || audioTarget === "both");

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copyLink = async () => {
    if (!link) return;
    playClickSound();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      window.prompt("Kopiera länken till låten:", link);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-3">
      {showTargetPicker && (
        <div className="glass-panel overflow-hidden rounded-3xl">
          <div className="border-b border-white/10 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
            Var spelas låten?
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-2.5">
            {(Object.keys(AUDIO_TARGET_META) as AudioTarget[]).map((key) => {
              const meta = AUDIO_TARGET_META[key];
              const selected = audioTarget === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onAudioTargetChange(key);
                  }}
                  className={cn(
                    "rounded-2xl px-1.5 py-2.5 text-center transition",
                    selected
                      ? "bg-violet-500/25 ring-1 ring-violet-400/40"
                      : "hover:bg-white/5"
                  )}
                >
                  <div className="text-base">{meta.emoji}</div>
                  <div
                    className={cn(
                      "mt-1 text-[10px] font-bold leading-tight",
                      selected ? "text-violet-100" : "text-white/45"
                    )}
                  >
                    {meta.label}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="px-4 pb-3 text-[11px] text-white/40">
            {AUDIO_TARGET_META[audioTarget].description}
          </p>
        </div>
      )}

      {showQr && (
        <div className="glass-panel overflow-hidden rounded-3xl p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                Skanna för att spela
              </div>
              <div className="text-sm font-semibold text-white">
                Länk till aktuell låt
              </div>
            </div>
            <div className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-white/60">
              QR
            </div>
          </div>

          <div className="mb-3 flex gap-1 rounded-2xl bg-black/30 p-1">
            {(Object.keys(LINK_SERVICE_META) as SongLinkService[]).map((key) => {
              const meta = LINK_SERVICE_META[key];
              const selected = service === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setService(key);
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-bold transition",
                    selected
                      ? "bg-white/15 text-white"
                      : "text-white/40 hover:text-white/70"
                  )}
                >
                  <span>{meta.emoji}</span>
                  {meta.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div
                className="absolute -inset-3 rounded-3xl opacity-40 blur-2xl"
                style={{ background: LINK_SERVICE_META[service].color }}
              />
              <img
                src={qrImageUrl(link, 220)}
                alt="QR-kod till låten"
                className="relative h-52 w-52 rounded-2xl bg-white p-3 shadow-2xl"
              />
            </div>

            <p className="text-center text-[11px] leading-relaxed text-white/40">
              {LINK_SERVICE_META[service].hint}
              <br />
              <span className="text-white/30">
                Titel kan synas i appen – vänd bort skärmen om det spoilar.
              </span>
            </p>

            <div className="flex w-full gap-2">
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                onClick={() => playClickSound()}
                className="flex flex-1 items-center justify-center rounded-2xl py-2.5 text-xs font-bold text-black transition hover:scale-[1.02]"
                style={{ background: LINK_SERVICE_META[service].color }}
              >
                Öppna {LINK_SERVICE_META[service].label}
              </a>
              <button
                type="button"
                onClick={copyLink}
                className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10"
              >
                {copied ? "Kopierad" : "Kopiera"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
