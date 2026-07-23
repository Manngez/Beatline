import { useCallback, useEffect, useRef, useState } from "react";
import Peer, { type DataConnection } from "peerjs";
import { GameBoard } from "./components/GameBoard";
import { SetupScreen } from "./components/SetupScreen";
import { type AudioTarget } from "./components/SongQrCard";
import { useGame } from "./hooks/useGame";
import type { GameState } from "./types";

type OnlineRole = "offline" | "host" | "guest";
type OnlineStatus = "idle" | "connecting" | "connected" | "error";
type RemoteAction =
  | { type: "PLACE_CARD"; slotIndex: number }
  | { type: "CONTINUE_ROUND" }
  | { type: "BANK_AND_END" }
  | { type: "SKIP_SONG" }
  | { type: "REDRAW_AUDIO_FAIL" }
  | { type: "RESET" };

type NetworkMessage =
  | { type: "STATE"; state: GameState }
  | { type: "ACTION"; action: RemoteAction };

function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function App() {
  const {
    state,
    startGame,
    placeCard,
    continueRound,
    bankAndEnd,
    skipSong,
    redrawAudioFail,
    setRemoteState,
    reset,
  } = useGame();

  const [audioTarget, setAudioTarget] = useState<AudioTarget>("both");
  const [role, setRole] = useState<OnlineRole>("offline");
  const [status, setStatus] = useState<OnlineStatus>("idle");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [onlineError, setOnlineError] = useState("");
  const [connectedPlayers, setConnectedPlayers] = useState(0);

  const peerRef = useRef<Peer | null>(null);
  const hostConnectionRef = useRef<DataConnection | null>(null);
  const guestConnectionsRef = useRef<DataConnection[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  const applyRemoteAction = useCallback((action: RemoteAction) => {
    switch (action.type) {
      case "PLACE_CARD": placeCard(action.slotIndex); break;
      case "CONTINUE_ROUND": continueRound(); break;
      case "BANK_AND_END": bankAndEnd(); break;
      case "SKIP_SONG": skipSong(); break;
      case "REDRAW_AUDIO_FAIL": redrawAudioFail(); break;
      case "RESET": reset(); break;
    }
  }, [bankAndEnd, continueRound, placeCard, redrawAudioFail, reset, skipSong]);

  const attachHostConnection = useCallback((connection: DataConnection) => {
    guestConnectionsRef.current = [...guestConnectionsRef.current, connection];
    setConnectedPlayers(guestConnectionsRef.current.length);

    connection.on("open", () => {
      connection.send({ type: "STATE", state: stateRef.current } satisfies NetworkMessage);
    });
    connection.on("data", (raw) => {
      const message = raw as NetworkMessage;
      if (message.type === "ACTION") applyRemoteAction(message.action);
    });
    connection.on("close", () => {
      guestConnectionsRef.current = guestConnectionsRef.current.filter((item) => item !== connection);
      setConnectedPlayers(guestConnectionsRef.current.length);
    });
    connection.on("error", () => {
      guestConnectionsRef.current = guestConnectionsRef.current.filter((item) => item !== connection);
      setConnectedPlayers(guestConnectionsRef.current.length);
    });
  }, [applyRemoteAction]);

  const disconnectOnline = useCallback(() => {
    guestConnectionsRef.current.forEach((connection) => connection.close());
    guestConnectionsRef.current = [];
    hostConnectionRef.current?.close();
    hostConnectionRef.current = null;
    peerRef.current?.destroy();
    peerRef.current = null;
    setRole("offline");
    setStatus("idle");
    setRoomCode("");
    setJoinCode("");
    setConnectedPlayers(0);
    setOnlineError("");
  }, []);

  const createRoom = useCallback(() => {
    disconnectOnline();
    const code = makeRoomCode();
    const peer = new Peer(`beatline-${code.toLowerCase()}`);
    peerRef.current = peer;
    setRole("host");
    setStatus("connecting");
    setRoomCode(code);

    peer.on("open", () => setStatus("connected"));
    peer.on("connection", attachHostConnection);
    peer.on("error", (error) => {
      setStatus("error");
      setOnlineError(error.message || "Kunde inte skapa rummet.");
    });
  }, [attachHostConnection, disconnectOnline]);

  const joinRoom = useCallback(() => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      setOnlineError("Rumskoden ska bestå av 6 tecken.");
      return;
    }
    disconnectOnline();
    setJoinCode(code);
    setRole("guest");
    setStatus("connecting");
    setOnlineError("");

    const peer = new Peer();
    peerRef.current = peer;
    peer.on("open", () => {
      const connection = peer.connect(`beatline-${code.toLowerCase()}`, { reliable: true });
      hostConnectionRef.current = connection;
      connection.on("open", () => setStatus("connected"));
      connection.on("data", (raw) => {
        const message = raw as NetworkMessage;
        if (message.type === "STATE") setRemoteState(message.state);
      });
      connection.on("close", () => {
        setStatus("error");
        setOnlineError("Anslutningen till värden bröts.");
      });
      connection.on("error", () => {
        setStatus("error");
        setOnlineError("Kunde inte ansluta till rummet.");
      });
    });
    peer.on("error", (error) => {
      setStatus("error");
      setOnlineError(error.message || "Kunde inte ansluta.");
    });
  }, [disconnectOnline, joinCode, setRemoteState]);

  useEffect(() => {
    if (role !== "host" || status !== "connected") return;
    const message: NetworkMessage = { type: "STATE", state };
    guestConnectionsRef.current.forEach((connection) => {
      if (connection.open) connection.send(message);
    });
  }, [role, state, status]);

  useEffect(() => () => {
    peerRef.current?.destroy();
  }, []);

  const sendOrRun = useCallback((action: RemoteAction, localAction: () => void) => {
    if (role === "guest") {
      const connection = hostConnectionRef.current;
      if (connection?.open) connection.send({ type: "ACTION", action } satisfies NetworkMessage);
      return;
    }
    localAction();
  }, [role]);

  const onlinePanel = (
    <div className="fixed left-1/2 top-3 z-50 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-white/15 bg-black/80 p-3 shadow-2xl backdrop-blur-xl">
      {role === "offline" ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={createRoom} className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 font-bold text-white">
            Skapa onlinerum
          </button>
          <div className="flex flex-1 gap-2">
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
              placeholder="RUMSKOD"
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-mono uppercase tracking-[0.2em] text-white outline-none"
            />
            <button onClick={joinRoom} className="rounded-xl bg-white/10 px-4 py-3 font-bold text-white hover:bg-white/15">
              Gå med
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-white/45">
              {role === "host" ? "Du är värd" : "Ansluten spelare"}
            </div>
            <div className="flex items-center gap-2 font-bold">
              <span className={`h-2.5 w-2.5 rounded-full ${status === "connected" ? "bg-emerald-400" : status === "error" ? "bg-red-400" : "animate-pulse bg-amber-400"}`} />
              {status === "connected" ? (role === "host" ? `Rum ${roomCode} · ${connectedPlayers} anslutna` : `Rum ${joinCode}`) : status === "connecting" ? "Ansluter…" : onlineError}
            </div>
          </div>
          <button onClick={disconnectOnline} className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10">
            Lämna
          </button>
        </div>
      )}
      {onlineError && role === "offline" && <p className="mt-2 text-sm text-red-300">{onlineError}</p>}
    </div>
  );

  const waitingForHost = role === "guest" && state.phase === "setup";

  return (
    <div className="min-h-screen bg-[#05050a] pt-24 text-white">
      {onlinePanel}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(91,33,182,0.35),_transparent_55%)]" />
        <div className="absolute -left-40 top-0 h-[32rem] w-[32rem] rounded-full bg-violet-600/25 blur-[140px]" />
        <div className="absolute -right-28 top-1/4 h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-amber-500/10 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.72)_100%)]" />
      </div>

      <div className="relative z-10">
        {waitingForHost ? (
          <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
            <div className="mb-5 h-16 w-16 animate-pulse rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_60px_rgba(168,85,247,0.55)]" />
            <h1 className="text-3xl font-black">Väntar på värden</h1>
            <p className="mt-3 text-white/55">När värden startar spelet visas samma match automatiskt på den här enheten.</p>
          </div>
        ) : state.phase === "setup" ? (
          <SetupScreen onStart={startGame} />
        ) : (
          <GameBoard
            state={state}
            onPlace={(slotIndex) => sendOrRun({ type: "PLACE_CARD", slotIndex }, () => placeCard(slotIndex))}
            onContinue={() => sendOrRun({ type: "CONTINUE_ROUND" }, continueRound)}
            onBank={() => sendOrRun({ type: "BANK_AND_END" }, bankAndEnd)}
            onSkip={() => sendOrRun({ type: "SKIP_SONG" }, skipSong)}
            onRedrawAudioFail={() => sendOrRun({ type: "REDRAW_AUDIO_FAIL" }, redrawAudioFail)}
            onReset={() => sendOrRun({ type: "RESET" }, reset)}
            audioTarget={audioTarget}
            onAudioTargetChange={setAudioTarget}
          />
        )}
      </div>
    </div>
  );
}
