import { useMemo } from "react";
import * as THREE from "three";
import rawData from "../data/data.json";

/**
 * useTimelineData
 * ----------------
 * Centraliza el acceso a los datos cronológicos y pre-computa la geometría
 * (curva CatmullRom + posición de cada nodo) para la línea de tiempo activa.
 * Evita prop drilling: los componentes consumen este hook o reciben ya el
 * objeto `timeline` procesado.
 *
 * @param {"peritaje" | "auditoria"} timelineId
 * @returns {{
 *   timeline: object,          // metadatos (título, colores)
 *   eventos: object[],         // eventos con .position (THREE.Vector3) y .t (0..1)
 *   curve: THREE.CatmullRomCurve3,
 *   curvePoints: THREE.Vector3[]
 * }}
 */
export default function useTimelineData(timelineId) {
  return useMemo(() => {
    const timeline = rawData.timelines[timelineId];
    if (!timeline) throw new Error(`Timeline desconocida: ${timelineId}`);

    const n = timeline.eventos.length;

    // Trayectoria serpenteante con elevación progresiva: cada hito avanza en X,
    // oscila en Z y sube levemente en Y — lectura visual de "progreso temporal".
    const controlPoints = timeline.eventos.map((_, i) => {
      const x = (i - (n - 1) / 2) * 4.2;
      const y = Math.sin(i * 0.9) * 1.1 + i * 0.12;
      const z = Math.cos(i * 0.7) * 3.2;
      return new THREE.Vector3(x, y, z);
    });

    const curve = new THREE.CatmullRomCurve3(controlPoints, false, "catmullrom", 0.35);
    const curvePoints = curve.getPoints(n * 24);

    const eventos = timeline.eventos.map((ev, i) => ({
      ...ev,
      index: i,
      t: n > 1 ? i / (n - 1) : 0,
      position: curve.getPoint(n > 1 ? i / (n - 1) : 0),
    }));

    return { timeline, eventos, curve, curvePoints };
  }, [timelineId]);
}

/** Metadatos de todas las líneas disponibles (para el selector de la UI). */
export function getTimelineList() {
  return Object.values(rawData.timelines).map(({ id, titulo, subtitulo, colorPrimario }) => ({
    id,
    titulo,
    subtitulo,
    colorPrimario,
  }));
}
