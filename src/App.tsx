import { useCallback, useEffect, useRef, useState } from "react";
import Peer, { type DataConnection } from "peerjs";
import { GameBoard } from "./components/GameBoard";
import { ParticipantBoard } from "./components/ParticipantBoard";
import { SetupScreen } from "./components/SetupScreen";
import { type AudioTarget } from "./components/SongQrCard";
import { useGame } from "./hooks/useGame";
import { CATEGORY_META, type GameState, type SongCategory } from "./types";

type OnlineRole = "offline" | "host" | "guest";
type OnlineStatus = "idle" | "connecting" | "connected" | "error";
type LobbyPlayer = { id: string; name: string; ready: boolean; isHost: boolean };
type RemoteAction =
  | { type: "PLACE_CARD"; slotIndex: number }
  | { type: "CONTINUE_ROUND" }
  | { type: "BANK_AND_END" }
  | { type: "SKIP_SONG" }
  | { type: "REDRAW_AUDIO_FAIL" }
  | { type: "RESET" };

type NetworkMessage =
  | { type: "STATE"; state: GameState }
  | { type: "ACTION"; action: RemoteAction; playerId: string }
  | { type: "JOIN"; name: string; playerId: string }
  | { type: "LEAVE"; playerId: string }
  | { type: "IDENTITY"; playerId: string }
  | { type: "READY"; ready: boolean }
  | { type: "LOBBY"; players: LobbyPlayer[] };

const CATEGORIES: SongCategory[] = ["mixed", "pop", "swedish", "rap", "rock"];

function normalizeRoomCode(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function roomPeerId(code: string) {
  const bytes = new TextEncoder().encode(normalizeRoomCode(code).toLocaleLowerCase("sv-SE"));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return `beatline-${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")}`;
}

function makePlayerId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `guest-${crypto.randomUUID()}`;
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getStoredPlayerId(code: string) {
  const key = `beatline-player-${roomPeerId(code)}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return stored;
    const created = makePlayerId();
    localStorage.setItem(key, created);
    return created;
  } catch {
    return makePlayerId();
  }
}

export default function App() {
  const { state, startGame, placeCard, continueRound, bankAndEnd, skipSong, redrawAudioFail, setRemoteState, reset } = useGame();
  const [audioTarget, setAudioTarget] = useState<AudioTarget>("both");
  const [role, setRole] = useState<OnlineRole>("offline");
  const [status, setStatus] = useState<OnlineStatus>("idle");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [onlineError, setOnlineError] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([]);
  const [category, setCategory] = useState<SongCategory>("mixed");
  const [useTokens, setUseTokens] = useState(true);

  const peerRef = useRef<Peer | null>(null);
  const hostConnectionRef = useRef<DataConnection | null>(null);
  const guestConnectionsRef = useRef<DataConnection[]>([]);
  const connectionPlayerIdsRef = useRef(new Map<DataConnection, string>());
  const stateRef = useRef(state);
  const lobbyRef = useRef(lobbyPlayers);
  stateRef.current = state;
  lobbyRef.current = lobbyPlayers;

  const broadcastLobby = useCallback((players: LobbyPlayer[]) => {
    const message: NetworkMessage = { type: "LOBBY", players };
    guestConnectionsRef.current.forEach((connection) => connection.open && connection.send(message));
  }, []);

  const updateLobby = useCallback((updater: (players: LobbyPlayer[]) => LobbyPlayer[]) => {
    setLobbyPlayers((current) => {
      const next = updater(current);
      lobbyRef.current = next;
      broadcastLobby(next);
      return next;
    });
  }, [broadcastLobby]);

  const currentTurnPlayerId = state.phase === "setup" ? "" : lobbyPlayers[state.currentPlayerIndex]?.id ?? "";
  const isMyTurn = role === "offline" || currentTurnPlayerId === playerId;
  const myPlayerIndex = Math.max(0, lobbyPlayers.findIndex((player) => player.id === playerId));

  const applyRemoteAction = useCallback((action: RemoteAction, senderId: string) => {
    const activeId = lobbyRef.current[stateRef.current.currentPlayerIndex]?.id;
    if (action.type !== "RESET" && senderId !== activeId) return;
    if (action.type === "RESET" && senderId !== "host") return;
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
    connection.on("open", () => {
      connection.send({ type: "STATE", state: stateRef.current } satisfies NetworkMessage);
      connection.send({ type: "LOBBY", players: lobbyRef.current } satisfies NetworkMessage);
    });
    connection.on("data", (raw) => {
      const message = raw as NetworkMessage;
      if (message.type === "JOIN") {
        const id = message.playerId || `guest-${connection.peer}`;
        connectionPlayerIdsRef.current.set(connection, id);
        connection.send({ type: "IDENTITY", playerId: id } satisfies NetworkMessage);
        updateLobby((players) => {
          const existing = players.find((player) => player.id === id);
          if (existing) return players.map((player) => player.id === id ? { ...player, name: message.name.trim() || player.name } : player);
          return [...players, { id, name: message.name.trim() || "Spelare", ready: false, isHost: false }].slice(0, 6);
        });
        connection.send({ type: "STATE", state: stateRef.current } satisfies NetworkMessage);
      }
      if (message.type === "LEAVE") updateLobby((players) => players.filter((player) => player.id !== message.playerId));
      if (message.type === "READY") {
        const id = connectionPlayerIdsRef.current.get(connection);
        if (id) updateLobby((players) => players.map((player) => player.id === id ? { ...player, ready: message.ready } : player));
      }
      if (message.type === "ACTION") applyRemoteAction(message.action, message.playerId);
    });
    const detach = () => {
      guestConnectionsRef.current = guestConnectionsRef.current.filter((item) => item !== connection);
      connectionPlayerIdsRef.current.delete(connection);
    };
    connection.on("close", detach);
    connection.on("error", detach);
  }, [applyRemoteAction, updateLobby]);

  const closeGuestTransport = useCallback(() => {
    const connection = hostConnectionRef.current;
    hostConnectionRef.current = null;
    connection?.close();
    const peer = peerRef.current;
    peerRef.current = null;
    peer?.destroy();
  }, []);

  const disconnectOnline = useCallback(() => {
    if (role === "guest" && playerId && hostConnectionRef.current?.open) hostConnectionRef.current.send({ type: "LEAVE", playerId } satisfies NetworkMessage);
    guestConnectionsRef.current.forEach((connection) => connection.close());
    guestConnectionsRef.current = [];
    connectionPlayerIdsRef.current.clear();
    closeGuestTransport();
    setRole("offline"); setStatus("idle"); setRoomCode(""); setJoinCode("");
    setLobbyPlayers([]); setPlayerId(""); setOnlineError(""); reset();
  }, [closeGuestTransport, playerId, reset, role]);

  const createRoom = useCallback(() => {
    const code = normalizeRoomCode(roomCode);
    if (!playerName.trim()) { setOnlineError("Skriv ditt namn först."); return; }
    if (!code) { setOnlineError("Skriv en rumskod först."); return; }
    disconnectOnline();
    const peer = new Peer(roomPeerId(code));
    peerRef.current = peer;
    setRole("host"); setStatus("connecting"); setRoomCode(code); setPlayerId("host"); setOnlineError("");
    const hostPlayer = [{ id: "host", name: playerName.trim(), ready: true, isHost: true }];
    setLobbyPlayers(hostPlayer); lobbyRef.current = hostPlayer;
    peer.on("open", () => peerRef.current === peer && setStatus("connected"));
    peer.on("connection", attachHostConnection);
    peer.on("error", (error) => {
      if (peerRef.current !== peer) return;
      setStatus("error");
      setOnlineError(error.type === "unavailable-id" ? "Den rumskoden används redan." : error.message || "Kunde inte skapa rummet.");
    });
  }, [attachHostConnection, disconnectOnline, playerName, roomCode]);

  const connectGuest = useCallback((code: string, id: string) => {
    closeGuestTransport();
    setRole("guest"); setStatus("connecting"); setOnlineError(""); setJoinCode(code); setPlayerId(id);
    const peer = new Peer();
    peerRef.current = peer;
    peer.on("open", () => {
      if (peerRef.current !== peer) return;
      const connection = peer.connect(roomPeerId(code), { reliable: true });
      hostConnectionRef.current = connection;
      connection.on("open", () => {
        if (hostConnectionRef.current !== connection) return;
        setStatus("connected"); setOnlineError("");
        connection.send({ type: "JOIN", name: playerName.trim(), playerId: id } satisfies NetworkMessage);
      });
      connection.on("data", (raw) => {
        const message = raw as NetworkMessage;
        if (message.type === "STATE") setRemoteState(message.state);
        if (message.type === "IDENTITY") setPlayerId(message.playerId);
        if (message.type === "LOBBY") setLobbyPlayers(message.players);
      });
      connection.on("close", () => {
        if (hostConnectionRef.current === connection) { setStatus("error"); setOnlineError("Anslutningen bröts. Återanslut till samma rum."); }
      });
      connection.on("error", () => {
        if (hostConnectionRef.current === connection) { setStatus("error"); setOnlineError("Kunde inte ansluta. Kontrollera rumskoden."); }
      });
    });
    peer.on("error", (error) => {
      if (peerRef.current === peer) { setStatus("error"); setOnlineError(error.message || "Kunde inte ansluta."); }
    });
  }, [closeGuestTransport, playerName, setRemoteState]);

  const joinRoom = useCallback(() => {
    const code = normalizeRoomCode(joinCode);
    if (!playerName.trim()) { setOnlineError("Skriv ditt namn först."); return; }
    if (!code) { setOnlineError("Skriv rumskoden först."); return; }
    connectGuest(code, getStoredPlayerId(code));
  }, [connectGuest, joinCode, playerName]);

  const reconnectRoom = useCallback(() => {
    const code = normalizeRoomCode(joinCode);
    if (role === "guest" && code) connectGuest(code, playerId || getStoredPlayerId(code));
  }, [connectGuest, joinCode, playerId, role]);

  useEffect(() => {
    if (role !== "host" || status !== "connected") return;
    const message: NetworkMessage = { type: "STATE", state };
    guestConnectionsRef.current.forEach((connection) => connection.open && connection.send(message));
  }, [role, state, status]);

  useEffect(() => () => peerRef.current?.destroy(), []);

  const sendOrRun = useCallback((action: RemoteAction, localAction: () => void) => {
    if (!isMyTurn && action.type !== "RESET") return;
    if (role === "guest") {
      if (hostConnectionRef.current?.open) hostConnectionRef.current.send({ type: "ACTION", action, playerId } satisfies NetworkMessage);
      return;
    }
    localAction();
  }, [isMyTurn, playerId, role]);

  const me = lobbyPlayers.find((player) => player.id === playerId);
  const allReady = lobbyPlayers.length >= 2 && lobbyPlayers.every((player) => player.ready);
  const toggleReady = () => {
    if (role !== "guest" || !me) return;
    const ready = !me.ready;
    setLobbyPlayers((players) => players.map((player) => player.id === playerId ? { ...player, ready } : player));
    hostConnectionRef.current?.send({ type: "READY", ready } satisfies NetworkMessage);
  };

  const onlinePanel = (
    <div className="fixed left-1/2 top-3 z-50 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-white/15 bg-black/90 p-3 shadow-2xl backdrop-blur-xl">
      {role === "offline" ? (
        <div className="space-y-3">
          <input value={playerName} onChange={(event) => setPlayerName(event.target.value.slice(0, 16))} placeholder="Ditt namn" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-3">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-violet-200">Spelledare</div>
              <input value={roomCode} onChange={(event) => setRoomCode(event.target.value.slice(0, 40))} placeholder="Välj valfri rumskod" className="mb-2 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-white outline-none" />
              <button onClick={createRoom} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 font-bold">Skapa rum</button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">Deltagare</div>
              <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.slice(0, 40))} placeholder="Skriv rumskoden" className="mb-2 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-3 text-white outline-none" />
              <button onClick={joinRoom} className="w-full rounded-xl bg-white/10 px-4 py-3 font-bold">Gå med</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-white/45">{role === "host" ? "Spelledare" : "Deltagare"}</div>
            <div className="font-bold">{status === "connected" ? `${role === "host" ? roomCode : joinCode} · ${lobbyPlayers.length} spelare` : status === "connecting" ? "Ansluter…" : onlineError}</div>
          </div>
          <div className="flex gap-2">
            {role === "guest" && status === "error" && <button onClick={reconnectRoom} className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-bold">Återanslut</button>}
            <button onClick={disconnectOnline} className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-white/70">Lämna</button>
          </div>
        </div>
      )}
      {onlineError && <p className="mt-2 text-sm text-red-300">{onlineError}</p>}
    </div>
  );

  const onlineLobby = role !== "offline" && state.phase === "setup" && status === "connected";

  return (
    <div className="min-h-screen bg-[#05050a] pt-24 text-white">
      {onlinePanel}
      <div className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(91,33,182,0.35),_transparent_55%)]" /><div className="absolute -right-28 top-1/4 h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/20 blur-[120px]" /></div>
      <div className="relative z-10">
        {onlineLobby ? (
          <div className="mx-auto max-w-xl px-4 py-8">
            <div className="glass-panel rounded-[1.75rem] p-5 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-300">{role === "host" ? "Spelledarvy" : "Deltagarvy"}</p>
              <h1 className="mt-1 text-3xl font-black">{role === "host" ? "Förbered matchen" : "Du är med i lobbyn"}</h1>
              <p className="mt-2 text-white/55">{role === "host" ? "Du styr kategori, ljud och matchstart. Deltagarna får en förenklad mobilvy." : "Markera dig som redo. Spelledaren sköter resten."}</p>
              <div className="mt-6 space-y-2">{lobbyPlayers.map((player, index) => <div key={player.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"><div><span className="font-bold">{index + 1}. {player.name}</span>{player.isHost && <span className="ml-2 text-xs text-violet-300">SPELLEDARE</span>}</div><span className={player.ready ? "text-emerald-300" : "text-amber-300"}>{player.ready ? "✓ Redo" : "Väntar"}</span></div>)}</div>
              {role === "guest" && <button onClick={toggleReady} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-4 font-black">{me?.ready ? "Jag är inte redo" : "Jag är redo"}</button>}
              {role === "host" && <div className="mt-6 space-y-4"><div><label className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/45">Kategori</label><select value={category} onChange={(event) => setCategory(event.target.value as SongCategory)} className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-3">{CATEGORIES.map((key) => <option key={key} value={key}>{CATEGORY_META[key].label}</option>)}</select></div><label className="flex items-center gap-3"><input type="checkbox" checked={useTokens} onChange={(event) => setUseTokens(event.target.checked)} /> Använd tokens</label><button onClick={() => allReady && startGame(lobbyPlayers.map((player) => player.name), useTokens, category)} disabled={!allReady} className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-4 font-black disabled:opacity-35">{lobbyPlayers.length < 2 ? "Väntar på deltagare" : !allReady ? "Väntar tills alla är redo" : "Starta matchen"}</button></div>}
            </div>
          </div>
        ) : state.phase === "setup" ? (
          role === "offline" ? <SetupScreen onStart={startGame} /> : <div className="mx-auto py-20 text-center text-white/60">Ansluter till lobbyn…</div>
        ) : role === "guest" ? (
          <ParticipantBoard state={state} isMyTurn={isMyTurn} myPlayerIndex={myPlayerIndex} onPlace={(slotIndex) => sendOrRun({ type: "PLACE_CARD", slotIndex }, () => placeCard(slotIndex))} onContinue={() => sendOrRun({ type: "CONTINUE_ROUND" }, continueRound)} onBank={() => sendOrRun({ type: "BANK_AND_END" }, bankAndEnd)} onSkip={() => sendOrRun({ type: "SKIP_SONG" }, skipSong)} />
        ) : (
          <><div className="mx-auto mb-3 max-w-xl rounded-2xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 text-center font-bold text-violet-200">Spelledarvy · full kontroll och överblick</div><GameBoard state={state} onPlace={(slotIndex) => sendOrRun({ type: "PLACE_CARD", slotIndex }, () => placeCard(slotIndex))} onContinue={() => sendOrRun({ type: "CONTINUE_ROUND" }, continueRound)} onBank={() => sendOrRun({ type: "BANK_AND_END" }, bankAndEnd)} onSkip={() => sendOrRun({ type: "SKIP_SONG" }, skipSong)} onRedrawAudioFail={() => sendOrRun({ type: "REDRAW_AUDIO_FAIL" }, redrawAudioFail)} onReset={() => sendOrRun({ type: "RESET" }, reset)} audioTarget={audioTarget} onAudioTargetChange={setAudioTarget} /></>
        )}
      </div>
    </div>
  );
}
