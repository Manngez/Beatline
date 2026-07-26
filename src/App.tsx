import { useCallback, useEffect, useRef, useState } from "react";
import Peer, { type DataConnection } from "peerjs";
import { GameBoard } from "./components/GameBoard";
import { ParticipantBoard } from "./components/ParticipantBoard";
import { SetupScreen } from "./components/SetupScreen";
import { type AudioTarget } from "./components/SongQrCard";
import { useGame } from "./hooks/useGame";
import { CATEGORY_META, HISTORY_CATEGORY_META, type GameContentMode, type GameState, type HistoryCategory, type SongCategory } from "./types";

type PlayMode = "chooser" | "local" | "online";
type OnlineRole = "offline" | "host" | "guest";
type OnlineStatus = "idle" | "connecting" | "connected" | "error";
type LobbyPlayer = { id: string; name: string; ready: boolean; isHost: boolean; connected: boolean };
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

const MUSIC_CATEGORIES: SongCategory[] = ["mixed", "pop", "swedish", "rap", "rock"];
const HISTORY_CATEGORIES: HistoryCategory[] = ["all", "world", "science", "society"];
const ACTION_TYPES = new Set(["CONTINUE_ROUND", "BANK_AND_END", "SKIP_SONG", "REDRAW_AUDIO_FAIL", "RESET"]);

function normalizeRoomCode(value: string) { return value.trim().replace(/\s+/g, " "); }
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
  try { const stored = localStorage.getItem(key); if (stored) return stored; const created = makePlayerId(); localStorage.setItem(key, created); return created; } catch { return makePlayerId(); }
}
function isRemoteAction(value: unknown): value is RemoteAction {
  if (!value || typeof value !== "object" || !("type" in value) || typeof value.type !== "string") return false;
  if (value.type === "PLACE_CARD") return "slotIndex" in value && Number.isInteger(value.slotIndex) && Number(value.slotIndex) >= 0;
  return ACTION_TYPES.has(value.type);
}

export default function App() {
  const { state, startGame, placeCard, continueRound, bankAndEnd, skipSong, redrawAudioFail, setRemoteState, reset } = useGame();
  const [playMode, setPlayMode] = useState<PlayMode>("chooser");
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
  const [contentMode, setContentMode] = useState<GameContentMode>("music");
  const [historyCategory, setHistoryCategory] = useState<HistoryCategory>("all");
  const [useTokens, setUseTokens] = useState(true);
  const [pendingAction, setPendingAction] = useState(false);

  const peerRef = useRef<Peer | null>(null);
  const hostConnectionRef = useRef<DataConnection | null>(null);
  const guestConnectionsRef = useRef<DataConnection[]>([]);
  const connectionPlayerIdsRef = useRef(new Map<DataConnection, string>());
  const stateRef = useRef(state);
  const lobbyRef = useRef(lobbyPlayers);
  const manualDisconnectRef = useRef(false);
  stateRef.current = state;
  lobbyRef.current = lobbyPlayers;

  const broadcastLobby = useCallback((players: LobbyPlayer[]) => {
    const message: NetworkMessage = { type: "LOBBY", players };
    guestConnectionsRef.current.forEach((connection) => connection.open && connection.send(message));
  }, []);
  const updateLobby = useCallback((updater: (players: LobbyPlayer[]) => LobbyPlayer[]) => {
    setLobbyPlayers((current) => { const next = updater(current); lobbyRef.current = next; broadcastLobby(next); return next; });
  }, [broadcastLobby]);
  const setPlayerConnected = useCallback((id: string, connected: boolean) => {
    updateLobby((players) => stateRef.current.phase === "setup" && !connected
      ? players.filter((player) => player.id !== id || player.isHost)
      : players.map((player) => player.id === id ? { ...player, connected, ready: connected ? player.ready : false } : player));
  }, [updateLobby]);

  const currentTurnPlayerId = state.phase === "setup" ? "" : state.players[state.currentPlayerIndex]?.id ?? "";
  const currentLobbyPlayer = lobbyPlayers.find((player) => player.id === currentTurnPlayerId);
  const currentPlayerConnected = role === "offline" || currentLobbyPlayer?.connected === true;
  const isMyTurn = role === "offline" || (currentTurnPlayerId === playerId && status === "connected");
  const myPlayerIndex = Math.max(0, state.players.findIndex((player) => player.id === playerId));

  const applyRemoteAction = useCallback((action: RemoteAction, senderId: string) => {
    const activeId = stateRef.current.players[stateRef.current.currentPlayerIndex]?.id;
    if (action.type === "RESET") { if (senderId === "host") reset(); return; }
    if (!activeId || senderId !== activeId || !lobbyRef.current.find((player) => player.id === senderId)?.connected) return;
    switch (action.type) {
      case "PLACE_CARD": if (action.slotIndex <= stateRef.current.workingTimeline.length) placeCard(action.slotIndex); break;
      case "CONTINUE_ROUND": continueRound(); break;
      case "BANK_AND_END": bankAndEnd(); break;
      case "SKIP_SONG": skipSong(); break;
      case "REDRAW_AUDIO_FAIL": redrawAudioFail(); break;
    }
  }, [bankAndEnd, continueRound, placeCard, redrawAudioFail, reset, skipSong]);

  const attachHostConnection = useCallback((connection: DataConnection) => {
    guestConnectionsRef.current = [...guestConnectionsRef.current, connection];
    connection.on("open", () => { connection.send({ type: "STATE", state: stateRef.current } satisfies NetworkMessage); connection.send({ type: "LOBBY", players: lobbyRef.current } satisfies NetworkMessage); });
    connection.on("data", (raw) => {
      const message = raw as Partial<NetworkMessage>;
      if (message.type === "JOIN" && typeof message.playerId === "string" && typeof message.name === "string") {
        const id = message.playerId || `guest-${connection.peer}`;
        guestConnectionsRef.current.forEach((other) => { if (other !== connection && connectionPlayerIdsRef.current.get(other) === id) other.close(); });
        connectionPlayerIdsRef.current.set(connection, id);
        connection.send({ type: "IDENTITY", playerId: id } satisfies NetworkMessage);
        updateLobby((players) => {
          const existing = players.find((player) => player.id === id);
          if (existing) return players.map((player) => player.id === id ? { ...player, name: message.name!.trim() || player.name, connected: true } : player);
          if (stateRef.current.phase !== "setup" || players.length >= 6) return players;
          return [...players, { id, name: message.name!.trim() || "Spelare", ready: false, isHost: false, connected: true }];
        });
        connection.send({ type: "STATE", state: stateRef.current } satisfies NetworkMessage);
        return;
      }
      const authenticatedId = connectionPlayerIdsRef.current.get(connection);
      if (!authenticatedId) return;
      if (message.type === "LEAVE" && message.playerId === authenticatedId) setPlayerConnected(authenticatedId, false);
      if (message.type === "READY" && typeof message.ready === "boolean") updateLobby((players) => players.map((player) => player.id === authenticatedId ? { ...player, ready: message.ready!, connected: true } : player));
      if (message.type === "ACTION" && message.playerId === authenticatedId && isRemoteAction(message.action)) applyRemoteAction(message.action, authenticatedId);
    });
    const detach = () => { const id = connectionPlayerIdsRef.current.get(connection); guestConnectionsRef.current = guestConnectionsRef.current.filter((item) => item !== connection); connectionPlayerIdsRef.current.delete(connection); if (id) setPlayerConnected(id, false); };
    connection.on("close", detach); connection.on("error", detach);
  }, [applyRemoteAction, setPlayerConnected, updateLobby]);

  const closeGuestTransport = useCallback(() => { const connection = hostConnectionRef.current; hostConnectionRef.current = null; connection?.close(); const peer = peerRef.current; peerRef.current = null; peer?.destroy(); }, []);
  const closeHostTransport = useCallback(() => { guestConnectionsRef.current.forEach((connection) => connection.close()); guestConnectionsRef.current = []; connectionPlayerIdsRef.current.clear(); const peer = peerRef.current; peerRef.current = null; peer?.destroy(); }, []);
  const openHostTransport = useCallback((code: string) => {
    closeHostTransport(); setStatus("connecting"); setOnlineError("");
    const peer = new Peer(roomPeerId(code)); peerRef.current = peer;
    peer.on("open", () => { if (peerRef.current !== peer) return; setStatus("connected"); setOnlineError(""); updateLobby((players) => players.map((player) => player.isHost ? { ...player, connected: true } : player)); });
    peer.on("connection", attachHostConnection);
    peer.on("error", (error) => { if (peerRef.current !== peer) return; setStatus("error"); setOnlineError(error.type === "unavailable-id" ? "Rumskoden används fortfarande. Försök igen om en stund." : error.message || "Kunde inte återansluta rummet."); });
  }, [attachHostConnection, closeHostTransport, updateLobby]);

  const leaveOnline = useCallback(() => {
    manualDisconnectRef.current = true;
    if (role === "guest" && playerId && hostConnectionRef.current?.open) hostConnectionRef.current.send({ type: "LEAVE", playerId } satisfies NetworkMessage);
    closeHostTransport(); closeGuestTransport(); setRole("offline"); setStatus("idle"); setRoomCode(""); setJoinCode(""); setLobbyPlayers([]); setPlayerId(""); setOnlineError(""); setPendingAction(false); setPlayMode("chooser"); reset();
    window.setTimeout(() => { manualDisconnectRef.current = false; }, 0);
  }, [closeGuestTransport, closeHostTransport, playerId, reset, role]);

  const createRoom = useCallback(() => {
    const code = normalizeRoomCode(roomCode);
    if (!playerName.trim()) { setOnlineError("Skriv ditt namn först."); return; }
    if (!code) { setOnlineError("Skriv en rumskod först."); return; }
    closeHostTransport(); closeGuestTransport(); reset(); setPlayMode("online"); setRole("host"); setRoomCode(code); setPlayerId("host"); setOnlineError("");
    const hostPlayer: LobbyPlayer[] = [{ id: "host", name: playerName.trim(), ready: true, isHost: true, connected: true }]; setLobbyPlayers(hostPlayer); lobbyRef.current = hostPlayer;
    window.setTimeout(() => openHostTransport(code), 0);
  }, [closeGuestTransport, closeHostTransport, openHostTransport, playerName, reset, roomCode]);

  const connectGuest = useCallback((code: string, id: string) => {
    closeGuestTransport(); setPlayMode("online"); setRole("guest"); setStatus("connecting"); setOnlineError(""); setJoinCode(code); setPlayerId(id); setPendingAction(false);
    const peer = new Peer(); peerRef.current = peer;
    peer.on("open", () => {
      if (peerRef.current !== peer) return;
      const connection = peer.connect(roomPeerId(code), { reliable: true }); hostConnectionRef.current = connection;
      connection.on("open", () => { if (hostConnectionRef.current !== connection) return; setStatus("connected"); setOnlineError(""); connection.send({ type: "JOIN", name: playerName.trim(), playerId: id } satisfies NetworkMessage); });
      connection.on("data", (raw) => { const message = raw as NetworkMessage; if (message.type === "STATE") { setRemoteState(message.state); setPendingAction(false); } if (message.type === "IDENTITY") setPlayerId(message.playerId); if (message.type === "LOBBY") setLobbyPlayers(message.players); });
      connection.on("close", () => { if (hostConnectionRef.current === connection && !manualDisconnectRef.current) { setStatus("error"); setPendingAction(false); setOnlineError("Anslutningen bröts. Tryck på Återanslut."); } });
      connection.on("error", () => { if (hostConnectionRef.current === connection && !manualDisconnectRef.current) { setStatus("error"); setPendingAction(false); setOnlineError("Kunde inte ansluta. Tryck på Återanslut."); } });
    });
    peer.on("error", (error) => { if (peerRef.current === peer && !manualDisconnectRef.current) { setStatus("error"); setPendingAction(false); setOnlineError(error.message || "Kunde inte ansluta. Tryck på Återanslut."); } });
  }, [closeGuestTransport, playerName, setRemoteState]);

  const joinRoom = useCallback(() => { const code = normalizeRoomCode(joinCode); if (!playerName.trim()) { setOnlineError("Skriv ditt namn först."); return; } if (!code) { setOnlineError("Skriv rumskoden först."); return; } connectGuest(code, getStoredPlayerId(code)); }, [connectGuest, joinCode, playerName]);
  const reconnectRoom = useCallback(() => { if (status === "connecting" || status === "connected") return; if (role === "host") { const code = normalizeRoomCode(roomCode); if (code) openHostTransport(code); } else if (role === "guest") { const code = normalizeRoomCode(joinCode); if (code) connectGuest(code, playerId || getStoredPlayerId(code)); } }, [connectGuest, joinCode, openHostTransport, playerId, role, roomCode, status]);

  useEffect(() => { if (role !== "host" || status !== "connected") return; const message: NetworkMessage = { type: "STATE", state }; guestConnectionsRef.current.forEach((connection) => connection.open && connection.send(message)); }, [role, state, status]);
  useEffect(() => { const tryReconnect = () => { if (document.visibilityState === "visible" && role === "guest" && status !== "connected" && !manualDisconnectRef.current) reconnectRoom(); }; document.addEventListener("visibilitychange", tryReconnect); window.addEventListener("online", tryReconnect); return () => { document.removeEventListener("visibilitychange", tryReconnect); window.removeEventListener("online", tryReconnect); }; }, [reconnectRoom, role, status]);
  useEffect(() => () => peerRef.current?.destroy(), []);

  const sendOrRun = useCallback((action: RemoteAction, localAction: () => void) => { if (!currentPlayerConnected || (!isMyTurn && action.type !== "RESET")) return; if (role === "guest") { if (pendingAction || !hostConnectionRef.current?.open) return; setPendingAction(true); hostConnectionRef.current.send({ type: "ACTION", action, playerId } satisfies NetworkMessage); return; } localAction(); }, [currentPlayerConnected, isMyTurn, pendingAction, playerId, role]);
  const me = lobbyPlayers.find((player) => player.id === playerId);
  const allReady = lobbyPlayers.length >= 2 && lobbyPlayers.every((player) => player.connected && player.ready);
  const toggleReady = () => { if (role !== "guest" || !me || !hostConnectionRef.current?.open) return; const ready = !me.ready; setLobbyPlayers((players) => players.map((player) => player.id === playerId ? { ...player, ready } : player)); hostConnectionRef.current.send({ type: "READY", ready } satisfies NetworkMessage); };

  const statusLabel = status === "connected" ? "Ansluten" : status === "connecting" ? "Återansluter…" : "Frånkopplad";
  const statusDot = status === "connected" ? "bg-emerald-400" : status === "connecting" ? "bg-amber-400 animate-pulse" : "bg-rose-500";
  const onlineLobby = role !== "offline" && state.phase === "setup" && status === "connected";
  const showConnectionBar = playMode === "online" && role !== "offline" && state.phase !== "setup";

  const connectionBar = showConnectionBar ? <div className="sticky top-0 z-50 border-b border-white/10 bg-black/90 px-3 py-2 backdrop-blur-xl"><div className="mx-auto flex max-w-xl flex-wrap items-center justify-between gap-2"><div><div className="text-sm font-bold">Rum: {role === "host" ? roomCode : joinCode}</div><div className="mt-1 flex items-center gap-2 text-xs text-white/65"><span className={`h-2.5 w-2.5 rounded-full ${statusDot}`} />{statusLabel}</div></div><div className="flex gap-2"><button onClick={reconnectRoom} disabled={status === "connecting" || status === "connected"} className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-bold disabled:bg-white/10 disabled:text-white/45">{status === "connecting" ? "Återansluter…" : status === "connected" ? "Ansluten" : "Återanslut"}</button><button onClick={leaveOnline} className="rounded-xl border border-white/15 px-3 py-2 text-sm">Lämna</button></div></div>{!currentPlayerConnected && currentLobbyPlayer && <div className="mx-auto mt-2 max-w-xl rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">Spelet är pausat – {currentLobbyPlayer.name} är frånkopplad.</div>}</div> : null;

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      {connectionBar}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(91,33,182,0.35),_transparent_55%)]" />
      <div className="relative z-10">
        {playMode === "chooser" ? <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-12"><div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.28em] text-violet-300">BeatLine</p><h1 className="brand-text mt-3 text-5xl font-black">Hur vill ni spela?</h1><p className="mt-4 text-white/55">Musik eller historia väljs i nästa steg.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2"><button onClick={() => setPlayMode("local")} className="rounded-[2rem] border border-white/10 bg-white/5 p-7 text-left"><div className="text-5xl">📱</div><h2 className="mt-5 text-2xl font-black">Lokalt på en enhet</h2><p className="mt-2 text-white/55">Alla spelar på samma skärm.</p></button><button onClick={() => setPlayMode("online")} className="rounded-[2rem] border border-white/10 bg-white/5 p-7 text-left"><div className="text-5xl">📲</div><h2 className="mt-5 text-2xl font-black">Flera enheter</h2><p className="mt-2 text-white/55">Skapa ett rum och spela från mobiler.</p></button></div></main>
        : playMode === "local" ? (state.phase === "setup" ? <><button onClick={() => setPlayMode("chooser")} className="fixed left-4 top-4 z-40 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm">← Spelsätt</button><SetupScreen onStart={startGame} /></> : <GameBoard state={state} onPlace={placeCard} onContinue={continueRound} onBank={bankAndEnd} onSkip={skipSong} onRedrawAudioFail={redrawAudioFail} onReset={reset} audioTarget={audioTarget} onAudioTargetChange={setAudioTarget} />)
        : role === "offline" ? <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12"><button onClick={() => setPlayMode("chooser")} className="mb-5 self-start text-sm text-white/55">← Tillbaka</button><div className="glass-panel rounded-[2rem] p-6"><h1 className="text-3xl font-black">Skapa eller gå med i ett rum</h1><input value={playerName} onChange={(event) => setPlayerName(event.target.value.slice(0, 16))} placeholder="Ditt namn" className="mt-6 w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3" /><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><input value={roomCode} onChange={(event) => setRoomCode(event.target.value.slice(0, 40))} placeholder="Välj rumskod" className="mb-2 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-3" /><button onClick={createRoom} className="w-full rounded-xl bg-violet-600 py-3 font-bold">Skapa rum</button></div><div><input value={joinCode} onChange={(event) => setJoinCode(event.target.value.slice(0, 40))} placeholder="Skriv rumskoden" className="mb-2 w-full rounded-xl border border-white/15 bg-black/25 px-3 py-3" /><button onClick={joinRoom} className="w-full rounded-xl bg-white/10 py-3 font-bold">Gå med</button></div></div>{onlineError && <p className="mt-4 text-red-300">{onlineError}</p>}</div></main>
        : onlineLobby ? <div className="mx-auto max-w-xl px-4 py-8"><button onClick={leaveOnline} className="mb-4 text-sm text-white/55">← Lämna rummet</button><div className="glass-panel rounded-[1.75rem] p-5"><h1 className="text-3xl font-black">{role === "host" ? "Förbered matchen" : "Du är med i lobbyn"}</h1><p className="mt-2 text-white/55">Rum: <strong>{role === "host" ? roomCode : joinCode}</strong></p><div className="mt-5 space-y-2">{lobbyPlayers.map((player) => <div key={player.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"><div><strong>{player.name}</strong><div className={`text-xs ${player.connected ? "text-emerald-300" : "text-rose-300"}`}>{player.connected ? "Ansluten" : "Frånkopplad"}</div></div><span>{player.ready ? "✓ Redo" : "Väntar"}</span></div>)}</div>{role === "guest" && <button onClick={toggleReady} className="mt-5 w-full rounded-2xl bg-violet-600 py-4 font-black">{me?.ready ? "Jag är inte redo" : "Jag är redo"}</button>}{role === "host" && <div className="mt-6 space-y-4"><div className="grid grid-cols-2 gap-2"><button onClick={() => setContentMode("music")} className={`rounded-xl border p-3 font-bold ${contentMode === "music" ? "border-fuchsia-400 bg-fuchsia-500/15" : "border-white/10"}`}>🎵 Musik</button><button onClick={() => setContentMode("history")} className={`rounded-xl border p-3 font-bold ${contentMode === "history" ? "border-amber-400 bg-amber-500/15" : "border-white/10"}`}>📚 Historia</button></div>{contentMode === "music" ? <select value={category} onChange={(event) => setCategory(event.target.value as SongCategory)} className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-3">{MUSIC_CATEGORIES.map((key) => <option key={key} value={key}>{CATEGORY_META[key].label}</option>)}</select> : <select value={historyCategory} onChange={(event) => setHistoryCategory(event.target.value as HistoryCategory)} className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-3">{HISTORY_CATEGORIES.map((key) => <option key={key} value={key}>{HISTORY_CATEGORY_META[key].label}</option>)}</select>}<label className="flex items-center gap-3"><input type="checkbox" checked={useTokens} onChange={(event) => setUseTokens(event.target.checked)} /> Använd tokens</label><button onClick={() => allReady && startGame(lobbyPlayers.map((player) => player.name), useTokens, category, lobbyPlayers.map((player) => player.id), contentMode, historyCategory)} disabled={!allReady} className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 py-4 font-black disabled:opacity-35">{allReady ? `Starta ${contentMode === "history" ? "historiamatchen" : "musikmatchen"}` : "Väntar tills alla är redo"}</button></div>}</div></div>
        : state.phase === "setup" ? <div className="mx-auto py-20 text-center text-white/60">{status === "error" ? <button onClick={reconnectRoom} className="rounded-xl bg-violet-600 px-5 py-3 font-bold">Återanslut</button> : "Ansluter till lobbyn…"}</div>
        : role === "guest" ? <div className={pendingAction ? "pointer-events-none opacity-70" : ""}><ParticipantBoard state={state} isMyTurn={isMyTurn && currentPlayerConnected} myPlayerIndex={myPlayerIndex} onPlace={(slot) => sendOrRun({ type: "PLACE_CARD", slotIndex: slot }, () => placeCard(slot))} onContinue={() => sendOrRun({ type: "CONTINUE_ROUND" }, continueRound)} onBank={() => sendOrRun({ type: "BANK_AND_END" }, bankAndEnd)} onSkip={() => sendOrRun({ type: "SKIP_SONG" }, skipSong)} /></div>
        : <div className={!currentPlayerConnected ? "pointer-events-none opacity-65" : ""}><GameBoard state={state} onPlace={(slot) => sendOrRun({ type: "PLACE_CARD", slotIndex: slot }, () => placeCard(slot))} onContinue={() => sendOrRun({ type: "CONTINUE_ROUND" }, continueRound)} onBank={() => sendOrRun({ type: "BANK_AND_END" }, bankAndEnd)} onSkip={() => sendOrRun({ type: "SKIP_SONG" }, skipSong)} onRedrawAudioFail={() => sendOrRun({ type: "REDRAW_AUDIO_FAIL" }, redrawAudioFail)} onReset={() => sendOrRun({ type: "RESET" }, reset)} audioTarget={audioTarget} onAudioTargetChange={setAudioTarget} /></div>}
      </div>
    </div>
  );
}