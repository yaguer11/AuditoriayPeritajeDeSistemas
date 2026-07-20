import { useState } from "react";
import TimelineScene from "./components/TimelineScene.jsx";
import { getTimelineList } from "./hooks/useTimelineData.js";
import "./styles.css";

/**
 * App
 * ---
 * Contenedor principal: selector de línea de tiempo (Peritaje / Auditoría)
 * + escena 3D a pantalla completa + leyenda de uso.
 */
export default function App() {
  const timelines = getTimelineList();
  const [activeTimeline, setActiveTimeline] = useState(timelines[0].id);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const current = timelines.find((t) => t.id === activeTimeline);

  const tooltipContent = {
    integrantes: {
      title: "Integrantes",
      items: [
        "Matias Gimenez",
        "Valentin Gimenez",
        "German Muñoz",
        "Elenio Garcia",
      ],
    },
    profesor: {
      title: "Profesor",
      items: ["Walter Orlando Lucero"],
    },
  };

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__title">
          <h1>{current.titulo}</h1>
          <p>{current.subtitulo}</p>
        </div>
        <div className="app__headerActions">
          <nav className="app__tabs">
            {timelines.map((t) => (
              <button
                key={t.id}
                className={`app__tab ${t.id === activeTimeline ? "app__tab--active" : ""}`}
                style={{ "--tab-color": t.colorPrimario }}
                onClick={() => setActiveTimeline(t.id)}
              >
                {t.id === "peritaje"
                  ? "🔍 Peritaje — Fútbol Libre"
                  : "🛡️ Auditoría — Despegar"}
              </button>
            ))}
          </nav>

          <div className="app__logoChip" title="UNViMe">
            <img src="/logoUNVIME.png" alt="Logo de la UNViMe" />
          </div>
        </div>
      </header>

      <main className="app__scene">
        <TimelineScene timelineId={activeTimeline} />
      </main>

      <footer className="app__help">
        <div className="app__footerLeft">
          <button
            type="button"
            className={`app__chip ${activeTooltip === "integrantes" ? "app__chip--active" : ""}`}
            onClick={() =>
              setActiveTooltip((current) =>
                current === "integrantes" ? null : "integrantes",
              )
            }
          >
            👥 Integrantes
          </button>
          <button
            type="button"
            className={`app__chip ${activeTooltip === "profesor" ? "app__chip--active" : ""}`}
            onClick={() =>
              setActiveTooltip((current) =>
                current === "profesor" ? null : "profesor",
              )
            }
          >
            👨‍🏫 Profesor
          </button>

          {activeTooltip && (
            <div className="app__tooltip" role="tooltip">
              <strong>{tooltipContent[activeTooltip].title}</strong>
              <ul>
                {tooltipContent[activeTooltip].items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="app__footerText">
          <span className="app__footerChip">📘 Auditoría y Peritaje de Sistemas</span>
          <span className="app__footerChip">🎓 Ingeniería en Sistemas de Información</span>
        </div>
      </footer>
    </div>
  );
}
