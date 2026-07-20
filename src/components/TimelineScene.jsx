import { useRef, useState, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraControls, Line, Stars, Grid } from "@react-three/drei";
import useTimelineData from "../hooks/useTimelineData.js";
import TimelineNode from "./TimelineNode.jsx";

/**
 * TimelineScene
 * -------------
 * Escena 3D completa de una línea de tiempo:
 *  - Curva CatmullRom que conecta los hitos (Line de drei)
 *  - Un TimelineNode por evento
 *  - CameraControls: arrastrar para orbitar, rueda para acercarse,
 *    click en un hito → la cámara vuela y lo enfoca (setLookAt animado).
 */
function SceneContent({ timelineId }) {
  const { timeline, eventos, curvePoints } = useTimelineData(timelineId);
  const controlsRef = useRef();
  const [activeId, setActiveId] = useState(null);

  const sceneTheme =
    timelineId === "auditoria"
      ? {
          background: "#142b4d",
          fog: "#142b4d",
          gridCell: "#16243a",
          gridSection: "#24406a",
          ambient: 0.65,
          directional: 1.4,
          point: 0.9,
        }
      : {
          background: "#1b3146",
          fog: "#1b3146",
          gridCell: "#182537",
          gridSection: "#2b5874",
          ambient: 0.55,
          directional: 1.25,
          point: 0.8,
        };

  const focusOn = useCallback((evento) => {
    setActiveId(evento.id);
    const p = evento.position;
    // Cámara a distancia fija del nodo, levemente elevada y hacia +Z
    controlsRef.current?.setLookAt(
      p.x + 1.5,
      p.y + 1.2,
      p.z + 6.5, // posición de cámara
      p.x,
      p.y + 0.6,
      p.z, // punto observado
      true, // transición animada
    );
  }, []);

  const clearFocus = useCallback(() => {
    setActiveId(null);
    controlsRef.current?.setLookAt(0, 6, 26, 0, 0, 0, true);
  }, []);

  // Al cambiar de línea de tiempo, resetear cámara y selección
  useEffect(() => {
    setActiveId(null);
    controlsRef.current?.setLookAt(0, 6, 26, 0, 0, 0, false);
  }, [timelineId]);

  // Navegación con teclado: ← → recorren los hitos, Esc cierra
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") return clearFocus();
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const idx = eventos.findIndex((ev) => ev.id === activeId);
      const next =
        e.key === "ArrowRight"
          ? (eventos[Math.min(idx + 1, eventos.length - 1)] ?? eventos[0])
          : (eventos[Math.max(idx - 1, 0)] ?? eventos[0]);
      focusOn(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId, eventos, focusOn, clearFocus]);

  return (
    <>
      <color attach="background" args={[sceneTheme.background]} />
      <fog attach="fog" args={[sceneTheme.fog, 25, 70]} />

      <ambientLight intensity={sceneTheme.ambient} />
      <directionalLight
        position={[10, 12, 8]}
        intensity={sceneTheme.directional}
      />
      <pointLight
        position={[0, 8, 0]}
        intensity={sceneTheme.point}
        color={timeline.colorPrimario}
      />

      <Stars
        radius={90}
        depth={40}
        count={2500}
        factor={3}
        saturation={0}
        fade
        speed={0.6}
      />
      <Grid
        position={[0, -4, 0]}
        args={[80, 80]}
        cellColor={sceneTheme.gridCell}
        sectionColor={sceneTheme.gridSection}
        fadeDistance={55}
        infiniteGrid
      />

      {/* Trayectoria temporal */}
      <Line
        points={curvePoints}
        color={timeline.colorPrimario}
        lineWidth={2.5}
        transparent
        opacity={0.85}
      />
      <Line
        points={curvePoints.map((p) => [p.x, p.y - 0.06, p.z])}
        color={timeline.colorAcento}
        lineWidth={1}
        transparent
        opacity={0.25}
      />

      {eventos.map((evento) => (
        <TimelineNode
          key={evento.id}
          evento={evento}
          color={timeline.colorPrimario}
          accent={timeline.colorAcento}
          isActive={activeId === evento.id}
          onSelect={focusOn}
          onClose={clearFocus}
        />
      ))}

      <CameraControls
        ref={controlsRef}
        minDistance={4}
        maxDistance={45}
        maxPolarAngle={Math.PI * 0.55}
        smoothTime={0.45}
      />
    </>
  );
}

export default function TimelineScene({ timelineId }) {
  return (
    <Canvas
      camera={{ position: [0, 6, 26], fov: 50 }}
      dpr={[1, 2]}
      onPointerMissed={() => {}}
    >
      <SceneContent timelineId={timelineId} />
    </Canvas>
  );
}
