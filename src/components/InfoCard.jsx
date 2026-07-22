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
export default function InfoCard({
  evento,
  color,
  onClose,
  onEnterRoom,
  onEnterCrimeScene,
  position = [0, 1.4, 0],
}) {
  const badge = CRITICIDAD_COLORS[evento.criticidad] ?? "#54a0ff";
  const linkHref =
    evento.linkUrl ??
    (typeof evento.link === "string" && evento.link.startsWith("http")
      ? evento.link
      : null);
  const linkLabel =
    evento.linkLabel ?? (linkHref ? evento.hallazgo : evento.link);

  return (
    <Html
      position={position}
      center
      distanceFactor={6.8}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: "auto" }}
    >
      <div
        className="info-card"
        style={{ "--card-accent": color, "--card-badge": badge }}
      >
        <button
          className="info-card__close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>

        <div className="info-card__media">
          <img
            src={evento.imagen}
            alt={evento.titulo}
            onError={(e) => {
              // Placeholder si la imagen aún no existe en /assets
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement.classList.add(
                "info-card__media--empty",
              );
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
            <strong>Link:</strong>
            {linkHref ? (
              <a
                href={linkHref}
                target="_blank"
                rel="noopener noreferrer"
                className="info-card__hallazgo-link"
              >
                {linkLabel}
              </a>
            ) : (
              <span>{evento.hallazgo}</span>
            )}
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

          {evento.isRoomLauncher && onEnterRoom && (
            <div className="info-card__link">
              <button
                type="button"
                className="info-card__link-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEnterRoom();
                }}
              >
                🔍 Ingresar al Cuarto de Investigación 3D
              </button>
            </div>
          )}

          {evento.isCrimeSceneLauncher && onEnterCrimeScene && (
            <div className="info-card__link">
              <button
                type="button"
                className="info-card__link-btn"
                style={{ borderColor: "#00e5ff", background: "rgba(0, 229, 255, 0.15)" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEnterCrimeScene();
                }}
              >
                🏠 Explorar Escena del Allanamiento 3D (EV-001)
              </button>
            </div>
          )}
        </div>
      </div>
    </Html>
  );
}
