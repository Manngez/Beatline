import { useEffect, useRef, useState } from "react";
import type { Song } from "../types";
import {
  resolvePreview,
  spotifySearchUrl,
  youtubeSearchUrl,
  type PreviewResult,
} from "../utils/musicPreview";
import { cn } from "../utils/cn";

export type AudioStatus = "loading" | "ready" | "error" | "idle";

interface MusicPlayerProps {
  song: Song | null;
  /** Always manual via play button unless explicitly enabled */
  autoPlay?: boolean;
  playLocal?: boolean;
  active?: boolean;
  onPlaybackStatus?: (status: AudioStatus) => void;
  onRequestNewCard?: () => void;
  canRequestNewCard?: boolean;
  showExternalLinks?: boolean;
}

export function MusicPlayer({
  song,
  autoPlay = false,
  playLocal = true,
  active = true,
  onPlaybackStatus,
  onRequestNewCard,
  canRequestNewCard = true,
  showExternalLinks = true,
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0);

  // Stop & cleanup helper
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(false);
    setProgress(0);
  };

  // Resolve preview when song changes – never autoplay
  useEffect(() => {
    stopAudio();
    if (!song || !active) {
      setPreview(null);
      setError(false);
      setLoading(false);
      onPlaybackStatus?.("idle");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    setPreview(null);
    onPlaybackStatus?.("loading");

    resolvePreview(song).then((result) => {
      if (cancelled) return;
      if (!result) {
        setLoading(false);
        setError(true);
        onPlaybackStatus?.("error");
        return;
      }
      setPreview(result);
      setLoading(false);
      onPlaybackStatus?.("ready");
    });

    return () => {
      cancelled = true;
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id, active]);

  // Prepare audio element when preview is ready (no auto play)
  useEffect(() => {
    stopAudio();
    if (!preview?.url || !active || !playLocal) return;

    const audio = new Audio(preview.url);
    audioRef.current = audio;
    audio.preload = "auto";
    audio.volume = 0.9;

    const onTime = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
    };
    const onError = () => {
      setPlaying(false);
      setError(true);
      onPlaybackStatus?.("error");
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    // Only autoplay if explicitly requested (default false)
    if (autoPlay) {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview?.url, active, playLocal, autoPlay]);

  const toggle = async () => {
    if (!playLocal) return;
    let audio = audioRef.current;
    if (!audio && preview?.url) {
      audio = new Audio(preview.url);
      audioRef.current = audio;
      audio.volume = 0.9;
      audio.addEventListener("timeupdate", () => {
        if (audio!.duration) setProgress(audio!.currentTime / audio!.duration);
      });
      audio.addEventListener("ended", () => {
        setPlaying(false);
        setProgress(0);
      });
      audio.addEventListener("error", () => {
        setError(true);
        onPlaybackStatus?.("error");
      });
    }
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      try {
        await audio.play();
        setPlaying(true);
        setError(false);
      } catch {
        setPlaying(false);
      }
    }
  };

  if (!song || !active) return null;

  const sourceLabel =
    preview?.source === "deezer"
      ? "Deezer · 30s"
      : preview?.source === "itunes"
        ? "Apple Music · 30s"
        : "—";

  return (
    <div className="glass-panel w-full overflow-hidden rounded-3xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              playing && "animate-pulse bg-emerald-400 shadow-[0_0_10px_#34d399]",
              !playing && error && "bg-rose-500",
              !playing && !error && loading && "animate-pulse bg-violet-400",
              !playing && !error && !loading && "bg-white/25"
            )}
          />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
            {playLocal ? "Manuell uppspelning" : "Tyst läge"}
          </span>
        </div>
        <span className="text-[11px] text-white/35">{sourceLabel}</span>
      </div>

      {playLocal ? (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggle}
            disabled={loading || (!preview && !error)}
            className={cn(
              "group relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full transition duration-300",
              loading && "animate-pulse bg-white/10 text-white/40",
              error && !preview && "bg-white/5 text-white/30",
              !loading &&
                preview &&
                "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 text-white shadow-[0_10px_40px_rgba(168,85,247,0.45)] hover:scale-105 active:scale-95"
            )}
            aria-label={playing ? "Pausa" : "Spela"}
          >
            {playing && (
              <span className="absolute inset-0 animate-ping rounded-full bg-fuchsia-400/20" />
            )}
            {/* Play / Pause icons */}
            <span className="relative">
              {loading ? (
                <span className="text-lg">…</span>
              ) : error && !preview ? (
                <span className="text-lg">!</span>
              ) : playing ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                  <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86a1 1 0 0 0-1.5.86z" />
                </svg>
              )}
            </span>
          </button>

          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold text-white">
              {loading
                ? "Laddar låt..."
                : error && !preview
                  ? "Kunde inte hitta ljud"
                  : playing
                    ? "Spelar – tryck för att pausa"
                    : "Tryck play när ni är redo"}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300 transition-all duration-200"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-white/35">
              Låten startar aldrig av sig själv · 30s preview
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          Ljudet spelas via QR på andra enheter. Denna enhet är tyst.
        </div>
      )}

      {(error || (!preview && !loading)) && onRequestNewCard && (
        <button
          type="button"
          disabled={!canRequestNewCard}
          onClick={onRequestNewCard}
          className="mt-4 w-full rounded-2xl border border-amber-400/30 bg-amber-500/15 py-3 text-sm font-bold text-amber-100 transition hover:bg-amber-500/25 disabled:opacity-40"
        >
          Nytt kort (ljudfel) – gratis
        </button>
      )}

      {showExternalLinks && song && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <a
            href={spotifySearchUrl(song)}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/25"
          >
            Spotify
          </a>
          <a
            href={youtubeSearchUrl(song)}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-rose-500/15 px-3 py-1.5 text-[11px] font-semibold text-rose-300 ring-1 ring-rose-500/25"
          >
            YouTube
          </a>
        </div>
      )}
    </div>
  );
}
