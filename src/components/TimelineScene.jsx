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
 *  - Vista A (isBoardActive = true): tablero de investigación → <InvestigationBoard>
 *  - Vista B (resto): escenario 3D digital clásico (spline, estrellas, grilla)
 */
function SceneContent({
  timelineId,
  activeId,
  setActiveId,
  isBoardActive,
  setIsBoardActive,
}) {
  const { timeline, eventos, curvePoints } = useTimelineData(timelineId);
  const controlsRef = useRef();

  // ¿El hito activo pertenece a la FASE IV / FASE 4 o es una evidencia de laboratorio (ID h-XX)?
  const activeEvento = useMemo(() => {
    return (
      eventos.find((ev) => ev.id === activeId) ||
      (timeline.evidencias && timeline.evidencias.find((ev) => ev.id === activeId))
    );
  }, [eventos, timeline.evidencias, activeId]);

  /* Layout del tablero (posiciones, tipo de tarjeta, dimensiones) */
  const { boardEventos, boardW, boardH } = useMemo(
    () => computeBoardLayout((isBoardActive && timeline.evidencias) ? timeline.evidencias : eventos),
    [eventos, timeline.evidencias, isBoardActive]
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
  const DEF_Z = useMemo(() => {
    const columns = eventos.length > 9 ? 4 : 3;
    return columns === 4 ? 12.0 : 9.5;
  }, [eventos]);

  const focusOn = useCallback(
    (evento) => {
      setActiveId(evento.id);
      const isEvid = evento.id.startsWith("h-");
      const f = evento.fase.toUpperCase();
      const isFaseIVNode = isEvid || f.includes("IV") || f.includes("4");

      if (timelineId === "peritaje" && isFaseIVNode) {
        setIsBoardActive(true); // Activa la vista tablero solo en peritaje
        const matched = boardEventos.find((be) => be.id === evento.id);
        if (matched) {
          const p = matched.boardPosition;
          controlsRef.current?.setLookAt(p.x, p.y, 4.3, p.x, p.y, 0, true); // Cerca pero permitiendo ver el entorno
        }
      } else {
        const p = evento.position;
        controlsRef.current?.setLookAt(
          p.x + 1.5, p.y + 1.2, p.z + 6.5,
          p.x, p.y + 0.6, p.z,
          true
        );
      }
    },
    [boardEventos, setActiveId, setIsBoardActive, timelineId]
  );

  const clearFocus = useCallback(() => {
    setActiveId(null);
    if (isBoardActive) {
      // Si el tablero está activo, al cerrar la tarjeta volvemos a la vista general de la oficina
      controlsRef.current?.setLookAt(0, 1.0, DEF_Z, 0, -0.4, 0, true);
    } else {
      // Si estamos en modo clásico, volvemos a la vista general clásica
      controlsRef.current?.setLookAt(0, 6, 26, 0, 0, 0, true);
    }
  }, [isBoardActive, DEF_Z, setActiveId]);

  // Al cambiar de timeline o salir, resetear cámara
  useEffect(() => {
    setActiveId(null);
    setIsBoardActive(false);
    controlsRef.current?.setLookAt(0, 6, 26, 0, 0, 0, false);
  }, [timelineId, setActiveId, setIsBoardActive]);

  // Efecto para volar de vuelta a la vista clásica al desactivar el tablero
  const prevBoardActive = useRef(isBoardActive);
  useEffect(() => {
    if (prevBoardActive.current && !isBoardActive) {
      controlsRef.current?.setLookAt(0, 6, 26, 0, 0, 0, true);
    }
    prevBoardActive.current = isBoardActive;
  }, [isBoardActive]);

  /* Límite de cámara: en la vista tablero la cámara queda encerrada; en la clásica, libre. */
  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    if (isBoardActive) {
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
  }, [isBoardActive, boardW, boardH]);

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
      {isBoardActive ? (
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
          isBoardView={isBoardActive}
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
  const [activeId, setActiveId] = useState(null);
  const [isBoardActive, setIsBoardActive] = useState(false);

  const handleGoBack = () => {
    setActiveId(null);
    setIsBoardActive(false);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [0, 6, 26], fov: 50 }}
        dpr={[1, 2]}
        onPointerMissed={() => {}}
        shadows
      >
        <SceneContent
          timelineId={timelineId}
          activeId={activeId}
          setActiveId={setActiveId}
          isBoardActive={isBoardActive}
          setIsBoardActive={setIsBoardActive}
        />
      </Canvas>

      {isBoardActive && (
        <button className="timeline-scene__back-btn" onClick={handleGoBack}>
          ← Volver al Espacio Digital
        </button>
      )}
    </div>
  );
}
