import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraControls, Line, Stars, Grid } from "@react-three/drei";
import * as THREE from "three";
import useTimelineData from "../hooks/useTimelineData.js";
import TimelineNode from "./TimelineNode.jsx";
import InvestigationBoard, { computeBoardLayout, computeRoomDims } from "./InvestigationBoard.jsx";

/**
 * TimelineScene
 * -------------
 * Orquesta las dos vistas:
 *  - Vista A (Fase IV activa): tablero de investigación → <InvestigationBoard>
 *  - Vista B (resto): escenario 3D digital clásico (spline, estrellas, grilla)
 * La habitación, el corcho, los hilos y el mobiliario viven en
 * InvestigationBoard.jsx; acá solo queda cámara, navegación y los nodos.
 */
function SceneContent({ timelineId }) {
  const { timeline, eventos, curvePoints } = useTimelineData(timelineId);
  const controlsRef = useRef();
  const [activeId, setActiveId] = useState(null);

  // ¿El hito activo pertenece a la FASE IV / FASE 4?
  const activeEvento = useMemo(
    () => eventos.find((ev) => ev.id === activeId),
    [eventos, activeId]
  );
  const isFaseIV = useMemo(() => {
    if (!activeEvento) return false;
    const f = activeEvento.fase.toUpperCase();
    return f.includes("IV") || f.includes("4");
  }, [activeEvento]);

  /* Layout del tablero (posiciones, tipo de tarjeta, dimensiones) */
  const { boardEventos, boardW, boardH } = useMemo(
    () => computeBoardLayout(eventos),
    [eventos]
  );

  /* Tema de la vista clásica */
  const classicTheme = useMemo(
    () =>
      timelineId === "auditoria"
        ? {
            background: "#142b4d", fog: "#142b4d",
            gridCell: "#16243a", gridSection: "#24406a",
            ambient: 0.65, directional: 1.4, point: 0.9,
          }
        : {
            background: "#1b3146", fog: "#1b3146",
            gridCell: "#182537", gridSection: "#2b5874",
            ambient: 0.55, directional: 1.25, point: 0.8,
          },
    [timelineId]
  );

  /* Navegación y cámara */
  const focusOn = useCallback(
    (evento) => {
      setActiveId(evento.id);
      const f = evento.fase.toUpperCase();
      const isFaseIVNode = f.includes("IV") || f.includes("4");

      if (isFaseIVNode) {
        const p = boardEventos[evento.index].boardPosition;
        controlsRef.current?.setLookAt(p.x, p.y, 3.0, p.x, p.y, 0, true);
      } else {
        const p = evento.position;
        controlsRef.current?.setLookAt(
          p.x + 1.5, p.y + 1.2, p.z + 6.5,
          p.x, p.y + 0.6, p.z,
          true
        );
      }
    },
    [boardEventos]
  );

  const clearFocus = useCallback(() => {
    setActiveId(null);
    controlsRef.current?.setLookAt(0, 6, 26, 0, 0, 0, true);
  }, []);

  useEffect(() => {
    setActiveId(null);
    controlsRef.current?.setLookAt(0, 6, 26, 0, 0, 0, false);
  }, [timelineId]);

  /* Límite de cámara: en la vista tablero la cámara queda ENCERRADA en la
     habitación (boundary de camera-controls); en la vista clásica, libre. */
  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    if (isFaseIV) {
      const d = computeRoomDims(boardW, boardH);
      const box = new THREE.Box3(
        new THREE.Vector3(-d.ROOM_HALF_W + 0.7, d.FLOOR_Y + 0.7, 0.5),
        new THREE.Vector3(d.ROOM_HALF_W - 0.7, d.CEILING_Y - 0.7, d.ROOM_D - 2.8)
      );
      c.setBoundary(box);
      c.boundaryEnclosesCamera = true;
    } else {
      c.setBoundary(undefined);
      c.boundaryEnclosesCamera = false;
    }
  }, [isFaseIV, boardW, boardH]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") return clearFocus();
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const idx = boardEventos.findIndex((ev) => ev.id === activeId);
      const next =
        e.key === "ArrowRight"
          ? boardEventos[Math.min(idx + 1, boardEventos.length - 1)]
          : boardEventos[Math.max(idx - 1, 0)];
      if (next) focusOn(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId, boardEventos, focusOn, clearFocus]);

  return (
    <>
      {isFaseIV ? (
        /* ════ VISTA A: Tablero de investigación ════ */
        <InvestigationBoard boardW={boardW} boardH={boardH} boardEventos={boardEventos} />
      ) : (
        /* ════ VISTA B: Escenario 3D digital clásico ════ */
        <>
          <color attach="background" args={[classicTheme.background]} />
          <fog attach="fog" args={[classicTheme.fog, 25, 70]} />

          <ambientLight intensity={classicTheme.ambient} />
          <directionalLight position={[10, 12, 8]} intensity={classicTheme.directional} />
          <pointLight position={[0, 8, 0]} intensity={classicTheme.point} color={timeline.colorPrimario} />

          <Stars radius={90} depth={40} count={2500} factor={3} saturation={0} fade speed={0.6} />
          <Grid position={[0, -4, 0]} args={[80, 80]} cellColor={classicTheme.gridCell}
            sectionColor={classicTheme.gridSection} fadeDistance={55} infiniteGrid />

          <Line points={curvePoints} color={timeline.colorPrimario} lineWidth={2.5} transparent opacity={0.85} />
          <Line points={curvePoints.map((p) => [p.x, p.y - 0.06, p.z])} color={timeline.colorAcento}
            lineWidth={1} transparent opacity={0.25} />
        </>
      )}

      {/* Nodos (tarjetas del tablero o esferas clásicas según la vista) */}
      {boardEventos.map((evento) => (
        <TimelineNode
          key={evento.id}
          evento={evento}
          color={timeline.colorPrimario}
          accent={timeline.colorAcento}
          isActive={activeId === evento.id}
          onSelect={focusOn}
          onClose={clearFocus}
          isBoardView={isFaseIV}
        />
      ))}

      <CameraControls
        ref={controlsRef}
        minDistance={2.5}
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
      shadows
    >
      <SceneContent timelineId={timelineId} />
    </Canvas>
  );
}
