# Beatline – produktionsplan med MVP först

## 1. Leveransordning

Arbetet är strikt uppdelat i grindar. Ingen fördjupningsfas påbörjas innan föregående grind är godkänd.

1. **MVP-grind:** spelbar, testbar och juridiskt säker grund.
2. **Stabiliseringsgrind:** automatiserade tester, felhantering, telemetri och säkerhet.
3. **Produktionsgrind:** serverauktoritativ realtid, databas, drift och skalning.
4. **Tillväxtgrind:** redaktionella verktyg, licensierade musikkällor, analys och fler spellägen.

---

# 2. Spelbar MVP – levereras och godkänns först

## 2.1 Omfattning

MVP:n ska endast omfatta:

- skapa lokalt spel,
- skapa onlinerum,
- ansluta som deltagare med rumskod,
- lobby med namn och redo-status,
- starta spel,
- spela ett fullständigt parti,
- placera låt eller händelse på tidslinjen,
- rätta svaret,
- uppdatera poäng,
- gå vidare till nästa spelare,
- återansluta efter tillfälligt avbrott,
- avsluta eller starta om spelet,
- använda lagliga länkar eller användarstyrd extern uppspelning i stället för att distribuera musikfiler.

Allt annat är uttryckligen utanför MVP:n.

## 2.2 Acceptanskriterier

MVP:n är godkänd först när samtliga kriterier är uppfyllda.

### Funktion

- [ ] En värd kan skapa ett rum utan manuell serverkonfiguration.
- [ ] Minst två deltagare kan ansluta från separata enheter.
- [ ] Endast aktiv spelare kan göra ett speldrag.
- [ ] Alla anslutna klienter visar samma spelstatus efter varje godkänt drag.
- [ ] Ett fullständigt parti kan genomföras utan omladdning.
- [ ] En tappad deltagaranslutning kan återanslutas med bevarad identitet.
- [ ] Värden kan återställa spelet.
- [ ] Horisontell tidslinje fungerar med touch för både värd och deltagare.

### Prestanda

- [ ] Första användbara vy visas inom 2,5 sekunder på normal 4G och modern mobil.
- [ ] JavaScript-paketet är högst 300 kB gzip för MVP, exklusive tredjepartsmedia.
- [ ] Lokala UI-aktioner svarar inom 100 ms.
- [ ] Ett normalt realtidsdrag syns hos övriga spelare inom 500 ms vid stabil anslutning.
- [ ] Ingen lång uppgift över 200 ms uppstår under normal spelrunda.

### Tillgänglighet

- [ ] Alla knappar kan användas med tangentbord.
- [ ] Synlig fokusmarkering finns.
- [ ] Text och kontroller uppfyller minst WCAG 2.2 AA-kontrast.
- [ ] Viktig status uttrycks inte enbart med färg.
- [ ] Touchytor är minst 44 × 44 CSS-pixlar.

### Robusthet

- [ ] Ogiltiga nätverksmeddelanden ignoreras utan krasch.
- [ ] Dubbelklick eller upprepade meddelanden skapar inte dubbla drag.
- [ ] Klienten visar begripligt fel vid avbruten anslutning.
- [ ] Oväntade fel fångas av en Error Boundary.

### Juridik

- [ ] Inga ljudfiler, omslagsbilder eller texter lagras utan dokumenterad rättighet.
- [ ] Spotify-, Apple Music- eller YouTube-innehåll används endast enligt respektive plattforms villkor.
- [ ] Appen utger sig inte för att vara godkänd eller sponsrad av en musiktjänst.
- [ ] Datamodellen lagrar främst metadata, externa identifierare och länkar.
- [ ] Integritetstext beskriver vilka personuppgifter och telemetridata som behandlas.

### Kvalitet

- [ ] `npm run build` går igenom.
- [ ] `npm test` går igenom.
- [ ] Kritisk spellogik har enhetstester.
- [ ] Ett automatiserat end-to-end-test täcker skapa rum → anslut → starta → spela drag → nästa tur.

## 2.3 Beslut efter MVP-grinden

MVP:n får gå vidare endast när:

- inga blockerande fel finns,
- samtliga juridiska kriterier är uppfyllda,
- minst 95 % av prioriterade acceptanstester passerar,
- samtliga säkerhetskritiska tester passerar,
- mätvärdena för laddtid och realtid ligger inom gränserna ovan.

---

# 3. Arkitektur

## 3.1 MVP-arkitektur

- **Klient:** React + TypeScript + Vite.
- **Stil:** Tailwind CSS.
- **Realtid:** befintlig PeerJS-lösning för snabb MVP-validering.
- **Persistens:** lokal lagring för anonym spelaridentitet och klientinställningar.
- **Hosting:** statisk publicering via GitHub Pages.

### Motivering

Detta minimerar förändring, kostnad och leveranstid. Den befintliga lösningen är tillräcklig för att bevisa spelupplevelsen, men inte slutarkitekturen för större publik.

## 3.2 Produktionsarkitektur

- **Webbklient:** React + TypeScript.
- **API:** Node.js med Fastify.
- **Realtid:** WebSocket via Socket.IO eller native WebSocket med schema-validerade meddelanden.
- **Databas:** PostgreSQL.
- **Cache och room presence:** Redis.
- **Objektlagring:** endast för egna/licensierade bilder eller redaktionellt material.
- **Drift:** containerbaserad plattform med minst två applikationsinstanser.
- **Observability:** OpenTelemetry, strukturerade loggar, felspårning och mätvärden.

### Motivering

- Fastify ger låg overhead, bra TypeScript-stöd och tydlig schemavalidering.
- PostgreSQL ger transaktioner, relationer, migrationsstöd och lång livslängd.
- Redis gör rum, närvaro, rate limiting och horisontell WebSocket-skalning enklare.
- Serverauktoritativ spellogik minskar fusk, desynk och klientberoende.

---

# 4. Datamodell

## Kärntabeller

### users

- id UUID PK
- display_name varchar(80)
- email nullable
- created_at timestamptz
- deleted_at nullable

### game_rooms

- id UUID PK
- public_code varchar(12) unique
- host_user_id nullable
- status enum: lobby, active, finished, expired
- rules jsonb
- created_at timestamptz
- expires_at timestamptz

### room_players

- id UUID PK
- room_id UUID FK
- user_id nullable
- reconnect_token_hash varchar
- display_name varchar(80)
- seat_index integer
- ready boolean
- connected boolean
- score integer
- joined_at timestamptz

### game_sessions

- id UUID PK
- room_id UUID FK
- state_version bigint
- current_turn integer
- phase varchar
- started_at timestamptz
- finished_at nullable

### game_events

- id UUID PK
- session_id UUID FK
- sequence bigint
- actor_player_id UUID nullable
- event_type varchar
- payload jsonb
- created_at timestamptz

### tracks

- id UUID PK
- title varchar
- artist varchar
- release_year integer
- category varchar
- provider varchar
- provider_track_id varchar
- external_url text
- preview_url nullable
- rights_status enum: metadata_only, provider_embed, licensed, blocked
- rights_note text nullable

### telemetry_events

- id UUID PK
- anonymous_session_id UUID
- event_name varchar
- properties jsonb
- occurred_at timestamptz
- retention_until timestamptz

## Beslut

`game_events` blir den revisionsbara sanningen. Ett materialiserat aktuellt tillstånd används för snabb läsning, medan eventströmmen gör felsökning och återställning möjlig.

---

# 5. REST-API

Alla endpoints versioneras under `/api/v1`.

## Rum

- `POST /rooms` – skapa rum.
- `POST /rooms/{code}/join` – anslut spelare.
- `GET /rooms/{code}` – hämta publik lobbystatus.
- `POST /rooms/{code}/ready` – ändra redo-status.
- `POST /rooms/{code}/start` – värden startar spelet.
- `POST /rooms/{code}/leave` – lämna rum.

## Spel

- `GET /games/{gameId}` – hämta aktuell snapshot.
- `POST /games/{gameId}/actions` – reservväg för spelaktion när WebSocket saknas.
- `POST /games/{gameId}/reconnect` – återanslut med roterat token.

## Innehåll

- `GET /tracks` – filtrera tillåtet frågeinnehåll.
- `GET /categories` – hämta kategorier.

## API-regler

- JSON Schema på alla in- och utdata.
- Idempotency-Key på muterande endpoints.
- Rate limiting per IP, rum och anonym identitet.
- Problem Details (`application/problem+json`) för fel.
- Ingen intern databasidentifierare exponeras i onödan.

---

# 6. WebSocket-protokoll

## Anslutning

`wss://host/ws?roomCode=...`

Klienten autentiseras med kortlivad anslutningsbiljett från REST-API:t.

## Klient → server

- `room.ready.set`
- `game.card.place`
- `game.round.continue`
- `game.round.bank`
- `game.song.skip`
- `game.reset`
- `client.ping`

## Server → klient

- `room.snapshot`
- `room.player.joined`
- `room.player.left`
- `game.snapshot`
- `game.event.applied`
- `game.action.rejected`
- `server.pong`
- `server.error`

## Gemensamt meddelandeformat

```json
{
  "type": "game.card.place",
  "messageId": "uuid",
  "roomId": "uuid",
  "stateVersion": 42,
  "sentAt": "2026-07-27T21:00:00Z",
  "payload": {}
}
```

## Konsistensregler

- Servern godkänner endast aktioner mot aktuell `stateVersion`.
- Varje godkänd händelse får monoton sekvens.
- Dublett av `messageId` returnerar tidigare resultat.
- Klienten begär snapshot vid sekvenslucka.

---

# 7. Projektstruktur

```text
apps/
  web/
  api/
packages/
  game-engine/
  protocol/
  ui/
  config/
infra/
  docker/
  migrations/
  monitoring/
docs/
  adr/
  api/
  legal/
tests/
  e2e/
```

## Motivering

Monorepo gör att klient, server och tester delar samma typer och protokoll utan kopiering. Spellogiken ligger i ett rent paket utan React eller nätverksberoenden.

---

# 8. Körbarhet och installation

## MVP

```bash
npm ci
npm test
npm run build
npm run dev
```

## Produktionsmiljö

```bash
cp .env.example .env
docker compose up --build
npm run db:migrate
npm run seed
```

## Miljövariabler

- `DATABASE_URL`
- `REDIS_URL`
- `PUBLIC_APP_URL`
- `SESSION_SECRET`
- `SENTRY_DSN`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `MUSIC_PROVIDER_CLIENT_ID`
- `MUSIC_PROVIDER_CLIENT_SECRET`

Hemligheter får aldrig checkas in.

---

# 9. Docker

## Krav

- multi-stage builds,
- icke-root-användare,
- read-only root filesystem där möjligt,
- healthcheck för API och WebSocket,
- separata images för webb och API,
- PostgreSQL och Redis endast för lokal utveckling i Compose,
- versionslåsta basimages.

---

# 10. CI/CD

## Pull request

1. installera med `npm ci`,
2. lint,
3. typkontroll,
4. enhetstester,
5. integrations- och kontraktstester,
6. bygg alla paket,
7. dependency- och secret-scan,
8. Playwright smoke test,
9. Lighthouse-budget.

## Main

1. skapa signerad containerimage,
2. generera SBOM,
3. deploy till staging,
4. kör smoke test,
5. manuell eller policybaserad produktionsgrind,
6. rullande eller blue/green-deploy,
7. automatisk rollback vid felbudgetöverträdelse.

---

# 11. Testplan

## Enhetstest

- placering före, mellan och efter tidslinjekort,
- rätt och fel årtal,
- poäng och tokenregler,
- turväxling,
- idempotenta aktioner,
- validering av nätverksmeddelanden.

## Integrationstest

- rumskapande och anslutning,
- två samtidiga klienter,
- återanslutning,
- Redis pub/sub mellan två API-instanser,
- databastransaktion och eventsekvens.

## End-to-end

- mobil värd + mobil deltagare,
- touchscroll för båda roller,
- full spelrunda,
- nätverksavbrott,
- återupptag efter sidladdning.

## Belastning

- 1 000 samtidiga rum,
- 6 spelare per rum,
- p95 WebSocket-broadcast under 250 ms,
- inga förlorade godkända events,
- CPU under 70 % vid mållast.

---

# 12. Övervakning

## Golden signals

- latency,
- traffic,
- errors,
- saturation.

## Produktmätvärden

- skapade rum,
- lyckade anslutningar,
- tid till första spelstart,
- andel slutförda spel,
- återanslutningsgrad,
- vanligaste felpunkt.

## Larm

- API 5xx över 2 % i fem minuter,
- p95 över 750 ms,
- WebSocket disconnect-spik,
- databaspool över 85 %,
- Redis otillgänglig,
- överskriden felbudget.

Personuppgifter och råa meddelandeinnehåll ska inte loggas.

---

# 13. Juridisk musikstrategi

## Tillåten MVP-strategi

MVP:n distribuerar inte musik. Den visar egen metadata och öppnar eller bäddar in innehåll endast där leverantörens villkor uttryckligen tillåter detta. Användaren ansvarar för uppspelning via sin egen tjänst eller lokala källa.

## Produktionsalternativ

1. **Metadata-only:** titel, artist, år och laglig extern länk.
2. **Officiell embed/SDK:** uppspelning sker via leverantörens godkända spelare och användarens konto.
3. **Direkt licensiering:** avtal för master, komposition och nödvändiga territoriella rättigheter.
4. **Royalty-free/originalmusik:** separat katalog med dokumenterad licens.

## Förbjudet utan avtal

- lagra eller strömma kommersiella ljudfiler,
- kopiera previews från tredjepart,
- använda omslag eller artistbilder utan rättighet,
- visa låttexter,
- kringgå reklam, geografiska begränsningar eller abonnemang,
- använda leverantörsdata utanför tillåten cachetid.

## Juridisk grind före lansering

- leverantörsvillkor granskas,
- rättighetsmatris finns per innehållstyp,
- takedown-process finns,
- integritetspolicy och personuppgiftsbiträden dokumenteras,
- cookie/telemetrisamtycke implementeras där det krävs,
- varumärkesanvändning granskas.

Detta är en teknisk riskreducering och ersätter inte juridisk rådgivning.

---

# 14. Säkerhet och integritet

- serverauktoritativ spelmotor,
- schema-validering av varje meddelande,
- kortlivade tokens,
- hashade återanslutningstokens,
- CSRF-skydd där cookies används,
- strikt CSP,
- rate limiting,
- dependency scanning,
- minimerad personuppgiftsinsamling,
- definierade retentiontider,
- export och radering av konto- och telemetridata.

---

# 15. Riskanalys

| Risk | Sannolikhet | Konsekvens | Motåtgärd |
|---|---:|---:|---|
| Musikrättigheter överträds | Medel | Kritisk | Metadata-only som standard, rättighetsregister, juridisk grind |
| PeerJS-rum blir instabila | Medel | Hög | Accepteras endast i MVP; migrera till serverauktoritativ WebSocket |
| Klienter desynkar | Medel | Hög | Versionsnummer, sekvens, snapshot och idempotens |
| Fusk eller manipulerade drag | Hög i P2P | Medel | Servervalidering i produktionsfas |
| Mobil touch fungerar olika | Medel | Medel | Playwright på riktiga viewportar och manuell enhetstest |
| Kostnad växer med samtidighet | Medel | Medel | Lasttest, autoskalning, rumsexpiration och budgetlarm |
| Telemetri samlar för mycket data | Låg | Hög | Dataminimering, schema, retention och privacy review |
| En värd lämnar P2P-rummet | Medel | Hög | MVP visar tydligt beroende; produktion lagrar rum på server |

---

# 16. Implementeringsfaser

## Fas 0 – MVP-grind

- lås MVP-omfattningen,
- rätta blockerande mobil- och värdproblem,
- komplettera acceptanstester,
- verifiera bygg och test,
- dokumentera juridisk musiklösning.

**Exit:** alla kriterier i avsnitt 2 är uppfyllda.

## Fas 1 – Stabilisering

- bryt ut ren spelmotor,
- lägg till protokollscheman,
- Error Boundary och robust felhantering,
- Playwright-flöden,
- telemetri med privacy-filter,
- Lighthouse-budget.

**Exit:** stabil staging med mätbar kvalitet.

## Fas 2 – Serverauktoritativ realtid

- Fastify API,
- WebSocket gateway,
- PostgreSQL och Redis,
- eventlogg,
- återanslutning,
- rate limiting.

**Exit:** två appinstanser kan driva samma rum utan desynk.

## Fas 3 – Produktionsdrift

- Docker,
- migrationspipeline,
- observability,
- larm,
- backup och återställning,
- blue/green eller rullande deploy.

**Exit:** dokumenterad SLO, rollback och incidentrutin.

## Fas 4 – Innehåll och tillväxt

- adminverktyg,
- licensregister,
- fler kategorier,
- moderation,
- produktanalys,
- konton och historik vid verifierat behov.

---

# 17. Beslutskriterier

## Prestanda

Välj enklaste lösning som klarar mätbara budgetar. Optimera inte utifrån antaganden; profilera först.

## Skalbarhet

Behåll statisk klient. Flytta auktoritativt tillstånd till server. Använd Redis först när flera instanser faktiskt krävs.

## Vidareutveckling

Domänlogik får inte ligga i React-komponenter eller WebSocket-handlers. Delade kontrakt och ADR-dokument krävs för större beslut.

## Juridik

Inget innehåll publiceras utan spårbar rättighetsstatus. `blocked` är standard när rättigheten är oklar.

## Kostnad

Varje ny driftkomponent måste ha tydligt behov, ägare, mätvärde och avvecklingsplan.

---

# 18. Definition of Done

En funktion är inte klar förrän:

- acceptanskriterier är dokumenterade och uppfyllda,
- tester finns på rätt nivå,
- fel- och tomlägen är hanterade,
- tillgänglighet är verifierad,
- telemetri är definierad utan onödig persondata,
- dokumentation är uppdaterad,
- säkerhets- och juridisk påverkan är bedömd,
- CI passerar,
- rollback eller feature flag finns för riskfyllda ändringar.
