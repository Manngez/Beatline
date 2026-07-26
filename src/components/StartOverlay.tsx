import { useEffect, useState } from "react";

type Mode = "local" | "online";

function WaveLogo() {
  const bars = [18, 34, 54, 82, 116, 82, 54, 34, 18];
  return (
    <div className="start-wave" aria-hidden="true">
      {bars.map((height, index) => <span key={index} style={{ height }} />)}
    </div>
  );
}

function LocalIcon() {
  return (
    <svg viewBox="0 0 180 140" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="62" y="14" width="56" height="102" rx="10" />
        <circle cx="90" cy="104" r="3" fill="currentColor" />
        <path d="M82 52v28l24-14-24-14Z" />
        <circle cx="31" cy="94" r="17" />
        <path d="M7 132c2-21 10-31 24-31s22 10 24 31" />
        <circle cx="149" cy="94" r="17" />
        <path d="M125 132c2-21 10-31 24-31s22 10 24 31" />
        <path d="M48 54 38 44M132 54l10-10" />
      </g>
    </svg>
  );
}

function OnlineIcon() {
  return (
    <svg viewBox="0 0 180 140" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="90" cy="51" r="33" />
        <path d="M57 51h66M90 18c12 12 18 23 18 33S102 72 90 84M90 18C78 30 72 41 72 51s6 21 18 33" />
        <rect x="14" y="66" width="35" height="60" rx="7" />
        <rect x="72" y="72" width="36" height="60" rx="7" />
        <rect x="131" y="66" width="35" height="60" rx="7" />
        <path d="M49 82c8-8 14-12 23-14M108 68c9 2 15 6 23 14" strokeDasharray="5 7" />
      </g>
    </svg>
  );
}

export function StartOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const sync = () => {
      const chooser = Array.from(document.querySelectorAll("h1")).some((node) => node.textContent?.includes("Hur vill ni spela"));
      if (chooser) setVisible(true);
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    sync();
    return () => observer.disconnect();
  }, []);

  const choose = (mode: Mode) => {
    const label = mode === "local" ? "Lokalt på en enhet" : "Flera enheter";
    const button = Array.from(document.querySelectorAll("button")).find((node) => node.textContent?.includes(label)) as HTMLButtonElement | undefined;
    button?.click();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="beatline-start-overlay">
      <div className="start-ambient start-ambient-left" />
      <div className="start-ambient start-ambient-right" />
      <main className="start-shell">
        <header className="start-header">
          <WaveLogo />
          <div className="start-wordmark">BEATLINE</div>
          <h1>Hur vill ni<br />spela?</h1>
          <p>Musik eller historia väljs i nästa steg.</p>
        </header>

        <section className="start-options" aria-label="Välj spelläge">
          <button className="start-card start-card-local" onClick={() => choose("local")}>
            <div className="start-card-icon"><LocalIcon /></div>
            <div className="start-card-copy">
              <span className="start-pill">LOKALT SPEL</span>
              <h2>På en enhet</h2>
              <strong>2–8 spelare</strong>
              <p>Alla spelar på samma telefon eller surfplatta.</p>
            </div>
            <span className="start-arrow">›</span>
          </button>

          <button className="start-card start-card-online" onClick={() => choose("online")}>
            <div className="start-card-icon"><OnlineIcon /></div>
            <div className="start-card-copy">
              <span className="start-pill">FLERA ENHETER</span>
              <h2>Med mobiler</h2>
              <strong>2–20 spelare</strong>
              <p>Anslut med era mobiler via QR-kod.</p>
            </div>
            <span className="start-arrow">›</span>
          </button>
        </section>

        <footer className="start-footer">
          <span>⚙<small>Inställningar</small></span>
          <div><b>♥</b><p>FEEL THE BEAT.<br />PLAY THE LINE.</p></div>
          <span>?<small>Hjälp</small></span>
        </footer>
      </main>
    </div>
  );
}
