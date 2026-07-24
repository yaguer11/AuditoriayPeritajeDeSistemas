import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { CameraControls, Line, Stars, Grid } from "@react-three/drei";
import * as THREE from "three";
import useTimelineData from "../hooks/useTimelineData.js";
import TimelineNode from "./TimelineNode.jsx";
import InvestigationBoard, {
  computeBoardLayout,
  computeRoomDims,
} from "./InvestigationBoard.jsx";
import CrimeSceneRoom from "./CrimeSceneRoom.jsx";
import MeetingRoom from "./MeetingRoom.jsx";

/**
 * SceneContent
 * ------------
 * Orquesta las tres vistas 3D:
 *  1. 'digital': Escenario 3D digital clásico (spline, estrellas, grilla)
 *  2. 'board': Tablero/Cuarto de Investigación de FASE VI (evidencias h-XX)
 *  3. 'crimeScene': Recreación 3D de la Escena del Allanamiento / Workstation EV-001 (FASE II)
 */
function SceneContent({
  timelineId,
  activeId,
  setActiveId,
  viewMode,
  setViewMode,
}) {
  const { timeline, eventos, curvePoints } = useTimelineData(timelineId);
  const controlsRef = useRef();

  const isBoardActive = viewMode === "board";
  const isCrimeSceneActive = viewMode === "crimeScene";
  const isMeetingRoomActive = viewMode === "meetingRoom";

  /* Layout del tablero (posiciones, tipo de tarjeta, dimensiones) */
  const { boardEventos, boardW, boardH } = useMemo(
    () =>
      computeBoardLayout(
        isBoardActive && timeline.evidencias ? timeline.evidencias : eventos,
      ),
    [eventos, timeline.evidencias, isBoardActive],
  );

  /* Tema de la vista clásica */
  const classicTheme = useMemo(
    () =>
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
          },
    [timelineId],
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
      const isLabLauncher = evento.isRoomLauncher || evento.id === "per-lab";
      const isCrimeLauncher =
        evento.isCrimeSceneLauncher || evento.id === "per-01";
      const isMeetingLauncher =
        evento.isMeetingRoomLauncher || evento.id === "aud-08";

      if (timelineId === "auditoria" && isMeetingLauncher) {
        setViewMode("meetingRoom");
        controlsRef.current?.setLookAt(0, 2.4, 5.2, 0, 2.2, -3.9, true);
      } else if (timelineId === "peritaje" && isCrimeLauncher) {
        setViewMode("crimeScene");
        controlsRef.current?.setLookAt(0, 2.3, 2.8, 0, 1.6, -1.8, true);
      } else if (timelineId === "peritaje" && (isEvid || isLabLauncher)) {
        setViewMode("board");
        const matched = boardEventos.find((be) => be.id === evento.id);
        if (matched) {
          const p = matched.boardPosition;
          controlsRef.current?.setLookAt(p.x, p.y, 4.3, p.x, p.y, 0, true);
        } else {
          controlsRef.current?.setLookAt(0, 1.0, DEF_Z, 0, -0.4, 0, true);
        }
      } else {
        setViewMode("digital");
        const p = evento.position;
        if (p) {
          controlsRef.current?.setLookAt(
            p.x + 1.5,
            p.y + 1.2,
            p.z + 6.5,
            p.x,
            p.y + 0.6,
            p.z,
            true,
          );
        }
      }
    },
    [boardEventos, DEF_Z, setActiveId, setViewMode, timelineId],
  );

  const clearFocus = useCallback(() => {
    setActiveId(null);
    if (viewMode === "board") {
      controlsRef.current?.setLookAt(0, 1.0, DEF_Z, 0, -0.4, 0, true);
    } else if (viewMode === "crimeScene") {
      controlsRef.current?.setLookAt(0, 2.3, 2.8, 0, 1.6, -1.8, true);
    } else if (viewMode === "meetingRoom") {
      controlsRef.current?.setLookAt(0, 2.4, 5.2, 0, 2.2, -3.9, true);
    } else {
      controlsRef.current?.setLookAt(0, 6, 26, 0, 0, 0, true);
    }
  }, [viewMode, DEF_Z, setActiveId]);

  // El reseteo al cambiar de timeline se maneja en el componente padre
  // (TimelineScene), para no forzar "digital" en cada remontaje del lienzo.

  // Transición de cámara según modo de vista
  useEffect(() => {
    if (viewMode === "crimeScene") {
      controlsRef.current?.setLookAt(0, 2.3, 2.8, 0, 1.6, -1.8, true);
    } else if (viewMode === "meetingRoom") {
      controlsRef.current?.setLookAt(0, 2.4, 5.2, 0, 2.2, -3.9, true);
    } else if (viewMode === "board") {
      controlsRef.current?.setLookAt(0, 1.0, DEF_Z, 0, -0.4, 0, true);
    } else {
      // Vista digital: reencuadrar la línea de tiempo completa al volver
      controlsRef.current?.setLookAt(0, 6, 26, 0, 0, 0, true);
    }
  }, [viewMode, DEF_Z]);

  /* Límite de cámara */
  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    if (isBoardActive) {
      const d = computeRoomDims(boardW, boardH);
      const box = new THREE.Box3(
        new THREE.Vector3(-d.ROOM_HALF_W + 0.7, d.FLOOR_Y + 0.7, 0.5),
        new THREE.Vector3(
          d.ROOM_HALF_W - 0.7,
          d.CEILING_Y - 0.7,
          d.ROOM_D - 2.8,
        ),
      );
      c.setBoundary(box);
      c.boundaryEnclosesCamera = true;
    } else if (isCrimeSceneActive) {
      const box = new THREE.Box3(
        new THREE.Vector3(-7, -0.5, -3.2),
        new THREE.Vector3(7, 6, 10),
      );
      c.setBoundary(box);
      c.boundaryEnclosesCamera = true;
    } else if (isMeetingRoomActive) {
      const box = new THREE.Box3(
        new THREE.Vector3(-6.5, 0, -1.4),
        new THREE.Vector3(6.5, 6, 7),
      );
      c.setBoundary(box);
      c.boundaryEnclosesCamera = true;
    } else {
      c.setBoundary(undefined);
      c.boundaryEnclosesCamera = false;
    }
  }, [isBoardActive, isCrimeSceneActive, isMeetingRoomActive, boardW, boardH]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") return clearFocus();
      if (viewMode !== "board") return;
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
  }, [activeId, boardEventos, focusOn, clearFocus, viewMode]);

  return (
    <>
      {isBoardActive ? (
        /* ════ VISTA A: Tablero / Cuarto de Investigación (FASE VI) ════ */
        <InvestigationBoard
          boardW={boardW}
          boardH={boardH}
          boardEventos={boardEventos}
        />
      ) : isCrimeSceneActive ? (
        /* ════ VISTA C: Escena del Allanamiento 3D (EV-001 - FASE II) ════ */
        <CrimeSceneRoom
          onFocusHotspot={() => {
            const ev01 = eventos.find((e) => e.id === "per-01");
            if (ev01) setActiveId(ev01.id);
          }}
          onFocusEvidence={(targetPos, cameraEye) => {
            if (controlsRef.current && targetPos) {
              const eyeX = cameraEye ? cameraEye.x : targetPos.x;
              const eyeY = cameraEye ? cameraEye.y : targetPos.y + 0.15;
              const eyeZ = cameraEye ? cameraEye.z : targetPos.z + 3.4;
              controlsRef.current.setLookAt(
                eyeX,
                eyeY,
                eyeZ,
                targetPos.x,
                targetPos.y,
                targetPos.z,
                true,
              );
            }
          }}
          onResetCamera={() => {
            controlsRef.current?.setLookAt(0, 2.3, 2.8, 0, 1.6, -1.8, true);
          }}
        />
      ) : isMeetingRoomActive ? (
        /* ════ VISTA D: Sala de Reunión 3D — Informe Final (FASE 6) ════ */
        <MeetingRoom
          onFocusScreen={() =>
            controlsRef.current?.setLookAt(0, 2.4, -0.75, 0, 2.4, -3.9, true)
          }
          onResetView={() =>
            controlsRef.current?.setLookAt(0, 2.4, 5.2, 0, 2.2, -3.9, true)
          }
        />
      ) : (
        /* ════ VISTA B: Escenario 3D digital clásico ════ */
        <>
          <color attach="background" args={[classicTheme.background]} />
          <fog attach="fog" args={[classicTheme.fog, 25, 70]} />

          <ambientLight intensity={classicTheme.ambient} />
          <directionalLight
            position={[10, 12, 8]}
            intensity={classicTheme.directional}
          />
          <pointLight
            position={[0, 8, 0]}
            intensity={classicTheme.point}
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
            cellColor={classicTheme.gridCell}
            sectionColor={classicTheme.gridSection}
            fadeDistance={55}
            infiniteGrid
          />

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
        </>
      )}

      {/* Nodos (tarjetas del tablero o esferas clásicas según la vista) */}
      {!isCrimeSceneActive &&
        !isMeetingRoomActive &&
        boardEventos.map((evento) => (
          <TimelineNode
            key={evento.id}
            evento={evento}
            color={timeline.colorPrimario}
            accent={timeline.colorAcento}
            isActive={activeId === evento.id}
            onSelect={focusOn}
            onClose={clearFocus}
            onEnterRoom={() => {
              setViewMode("board");
              controlsRef.current?.setLookAt(0, 1.0, DEF_Z, 0, -0.4, 0, true);
            }}
            onEnterCrimeScene={() => {
              setViewMode("crimeScene");
              controlsRef.current?.setLookAt(0, 1.8, 5.2, 0, 1.1, 0, true);
            }}
            isBoardView={isBoardActive}
          />
        ))}

      {/* Si estamos en la escena del allanamiento y se selecciona per-01, renderizamos la InfoCard de FASE II */}
      {isCrimeSceneActive && activeId === "per-01" && (
        <TimelineNode
          evento={eventos.find((e) => e.id === "per-01")}
          color={timeline.colorPrimario}
          accent={timeline.colorAcento}
          isActive={true}
          onSelect={() => {}}
          onClose={() => setActiveId(null)}
          onEnterCrimeScene={() => {}}
          isBoardView={false}
        />
      )}

      <CameraControls
        ref={controlsRef}
        minDistance={1.2}
        maxDistance={isCrimeSceneActive ? 7.5 : isMeetingRoomActive ? 12 : 45}
        minAzimuthAngle={
          isCrimeSceneActive || isMeetingRoomActive ? -Math.PI / 3.2 : undefined
        }
        maxAzimuthAngle={
          isCrimeSceneActive || isMeetingRoomActive ? Math.PI / 3.2 : undefined
        }
        minPolarAngle={
          isCrimeSceneActive || isMeetingRoomActive ? Math.PI / 6 : undefined
        }
        maxPolarAngle={
          isCrimeSceneActive || isMeetingRoomActive
            ? Math.PI / 2.05
            : Math.PI * 0.55
        }
        smoothTime={0.45}
      />
    </>
  );
}

export default function TimelineScene({ timelineId }) {
  const [activeId, setActiveId] = useState(null);
  const [viewMode, setViewMode] = useState("digital"); // 'digital' | 'board' | 'crimeScene' | 'meetingRoom'

  // Al cambiar de línea de tiempo (Peritaje / Auditoría) volvemos siempre a la
  // vista digital. Se maneja aquí (padre) y NO dentro del lienzo, así el
  // remontaje del <Canvas> al cambiar de vista no fuerza la salida de la escena.
  useEffect(() => {
    setActiveId(null);
    setViewMode("digital");
  }, [timelineId]);

  const handleGoBack = () => {
    setActiveId(null);
    setViewMode("digital");
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/*
        Se fuerza el remontaje del lienzo al cambiar de vista (digital / escena /
        tablero / sala). Cada vista arranca con un contexto WebGL y una escena
        limpios —igual que en la carga inicial— evitando que al volver de una
        escena 3D pesada (p. ej. FASE II) el lienzo quede vacío o corrupto.
      */}
      <Canvas
        key={viewMode}
        camera={{ position: [0, 6, 26], fov: 50 }}
        dpr={[1, 2]}
        onPointerMissed={() => {}}
        shadows
      >
        <SceneContent
          timelineId={timelineId}
          activeId={activeId}
          setActiveId={setActiveId}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </Canvas>

      {viewMode !== "digital" && (
        <button className="timeline-scene__back-btn" onClick={handleGoBack}>
          ← Volver al Espacio Digital
        </button>
      )}
    </div>
  );
}
