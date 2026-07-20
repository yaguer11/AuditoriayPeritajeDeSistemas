import { Html } from "@react-three/drei";

const CRITICIDAD_COLORS = {
  CRÍTICA: "#ff3d71",
  ALTA: "#ff9f43",
  MEDIA: "#feca57",
  INFO: "#54a0ff",
};

/**
 * InfoCard
 * --------
 * Tarjeta glassmorphism renderizada como overlay HTML (<Html> de drei)
 * anclada al nodo activo en el espacio 3D. Muestra el detalle completo
 * del hito: fecha, hora, responsable, herramientas, hallazgo e imagen.
 */
export default function InfoCard({ evento, color, onClose }) {
  const badge = CRITICIDAD_COLORS[evento.criticidad] ?? "#54a0ff";

  return (
    <Html
      position={[0, 1.4, 0]}
      center
      distanceFactor={9}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: "auto" }}
    >
      <div className="info-card" style={{ "--card-accent": color, "--card-badge": badge }}>
        <button className="info-card__close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>

        <div className="info-card__media">
          <img
            src={evento.imagen}
            alt={evento.titulo}
            onError={(e) => {
              // Placeholder si la imagen aún no existe en /assets
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement.classList.add("info-card__media--empty");
            }}
          />
          <span className="info-card__fase">{evento.fase}</span>
          <span className="info-card__criticidad">{evento.criticidad}</span>
        </div>

        <div className="info-card__body">
          <h3>{evento.titulo}</h3>

          <div className="info-card__meta">
            <span title="Fecha">📅 {evento.fecha}</span>
            <span title="Hora">🕒 {evento.hora}</span>
          </div>

          <p className="info-card__descripcion">{evento.descripcion}</p>

          <div className="info-card__hallazgo">
            <strong>Hallazgo:</strong> {evento.hallazgo}
          </div>

          <div className="info-card__row">
            <span className="info-card__label">Responsable</span>
            <span>{evento.responsable}</span>
          </div>

          <div className="info-card__row">
            <span className="info-card__label">Herramientas</span>
            <div className="info-card__tools">
              {evento.herramientas.map((h) => (
                <span key={h} className="info-card__tool">
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Html>
  );
}
