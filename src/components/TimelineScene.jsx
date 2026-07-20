import { useRef, useState, useCallback, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { CameraControls, Line, Stars, Grid } from "@react-three/drei";
import useTimelineData from "../hooks/useTimelineData.js";
import TimelineNode from "./TimelineNode.jsx";
import * as THREE from "three";

/* ─── helpers de clasificación ────────────────────────────────────────── */
const getCardType = (evento) => {
  const t = evento.titulo.toLowerCase();
  if (
    t.includes("inicio") || t.includes("revisión") || t.includes("planificación") ||
    t.includes("dictamen") || t.includes("informe") || t.includes("respuesta")
  ) return "document";
  const n = parseInt(evento.id.replace(/^\D+/g, ""), 10) || 0;
  return n % 2 === 0 ? "note" : "polaroid";
};
const getLocalPinY = (type) =>
  type === "note" ? 0.52 : type === "document" ? 0.82 : 0.65;

/* ─── Textura procedural de corcho ────────────────────────────────────── */
function buildCorkTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#dcb18a"; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 45000; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const s = Math.random() * 1.5 + 0.5, r = Math.random();
    ctx.fillStyle = r < 0.35 ? "#b4855e" : r < 0.65 ? "#e9c6a6" : r < 0.8 ? "#9c6d48" : "rgba(255,255,255,0.12)";
    ctx.fillRect(x, y, s, s);
  }
  for (let i = 0; i < 180; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "#c2936a" : "#aa7a54";
    ctx.fillRect(Math.random() * 512, Math.random() * 512, Math.random() * 8 + 3, Math.random() * 5 + 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 3);
  return tex;
}

/* ─── Textura procedural de parqué ────────────────────────────────────── */
function buildParquetTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d");
  const PLANK_W = 64, PLANK_H = 16;
  const cols = Math.ceil(512 / PLANK_W) + 1;
  const rowsN = Math.ceil(512 / PLANK_H) + 1;
  const palettes = [["#3b2712","#4a3118","#5a3e22"],["#2e1d0e","#3d2a14","#4b3419"]];
  for (let row = 0; row < rowsN; row++) {
    const pal = palettes[row % palettes.length];
    const offset = (row % 2 === 0) ? 0 : PLANK_W / 2;
    for (let col = 0; col < cols; col++) {
      const x = col * PLANK_W - offset;
      const y = row * PLANK_H;
      ctx.fillStyle = pal[Math.floor(Math.random() * pal.length)];
      ctx.fillRect(x, y, PLANK_W - 1, PLANK_H - 1);
      ctx.strokeStyle = "rgba(255,180,80,0.04)";
      ctx.lineWidth = 1;
      for (let g = 0; g < 3; g++) {
        ctx.beginPath();
        ctx.moveTo(x + g * 22, y);
        ctx.lineTo(x + g * 22 + 8, y + PLANK_H);
        ctx.stroke();
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

/* ─── Textura de pared con pinceladas de pintura ───────────────────────── */
function buildWallTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ccc1b0"; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4000; i++) {
    const alpha = (Math.random() * 0.04).toFixed(3);
    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? "200,180,140" : "120,100,80"},${alpha})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, Math.random() * 12 + 2, Math.random() * 3 + 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

/* ─── Cuadro de pared ───────────────────────────────────────────────────── */
function WallPicture({ position, w = 1.2, h = 0.9 }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[w + 0.1, h + 0.1, 0.04]} />
        <meshStandardMaterial color="#5a3e28" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.022]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#8a9a7a" roughness={0.9} />
      </mesh>
    </group>
  );
}

/* ─── Archivador metálico ─────────────────────────────────────────────── */
function FilingCabinet({ position }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.55, 1.4, 0.5]} />
        <meshStandardMaterial color="#607d8b" roughness={0.55} metalness={0.35} />
      </mesh>
      {[-0.42, 0, 0.42].map((dy, i) => (
        <group key={i} position={[0, dy * (1.4 / 3) * 0.85, 0.26]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.38, 0.02]} />
            <meshStandardMaterial color="#546e7a" roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.018]}>
            <boxGeometry args={[0.16, 0.022, 0.022]} />
            <meshStandardMaterial color="#b0bec5" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ─── Lámpara de pie ────────────────────────────────────────────────────── */
function FloorLamp({ position }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.06, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.022, 2.0, 8]} />
        <meshStandardMaterial color="#212121" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0.22, 1.92, 0]} rotation={[0, 0, -0.35]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.55, 8]} />
        <meshStandardMaterial color="#212121" roughness={0.4} metalness={0.7} />
      </mesh>
      <group position={[0.44, 1.78, 0]} rotation={[0.2, 0, 0]}>
        <mesh castShadow>
          <coneGeometry args={[0.28, 0.32, 16, 1, true]} />
          <meshStandardMaterial color="#c8860a" roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#fffde7" emissive="#fff9c4" emissiveIntensity={4} />
        </mesh>
      </group>
    </group>
  );
}

/* ─── Papel tirado en el suelo ────────────────────────────────────────── */
function FloorPaper({ position, rotation }) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={[0.45, 0.58]} />
      <meshStandardMaterial color="#f5f3ee" roughness={0.95} />
    </mesh>
  );
}

/* ─── Silla de oficina ──────────────────────────────────────────────────── */
function OfficeChair({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.52, 0.08, 0.52]} />
        <meshStandardMaterial color="#2c2c2c" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.88, -0.22]} castShadow>
        <boxGeometry args={[0.48, 0.72, 0.06]} />
        <meshStandardMaterial color="#2c2c2c" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.26, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.52, 8]} />
        <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.28, 0.04, Math.sin(angle) * 0.28]} castShadow>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color="#333" roughness={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ─── Mesa de reuniones amplia ────────────────────────────────────────── */
function MeetingTable({ position, width, depth }) {
  const legPositions = [
    [-(width / 2 - 0.12),  (depth / 2 - 0.12)],
    [ (width / 2 - 0.12),  (depth / 2 - 0.12)],
    [-(width / 2 - 0.12), -(depth / 2 - 0.12)],
    [ (width / 2 - 0.12), -(depth / 2 - 0.12)],
  ];
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, 0.08, depth]} />
        <meshStandardMaterial color="#2a1a0e" roughness={0.28} metalness={0.04} />
      </mesh>
      <mesh>
        <boxGeometry args={[width + 0.01, 0.04, depth + 0.01]} />
        <meshStandardMaterial color="#1a0f07" roughness={0.22} metalness={0.06} />
      </mesh>
      {legPositions.map(([lx, lz], idx) => (
        <mesh key={idx} position={[lx, -0.62, lz]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 1.2, 10]} />
          <meshStandardMaterial color="#111" roughness={0.45} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Items sobre la mesa ─────────────────────────────────────────────── */
function DeskItems({ surfaceY, tableZ }) {
  return (
    <group>
      <group position={[1.8, surfaceY + 0.22, tableZ + 0.35]} rotation={[0, -0.4, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.19, 0.16, 0.38, 20]} />
          <meshStandardMaterial color="#bf360c" roughness={0.18} metalness={0.08} />
        </mesh>
        <mesh position={[0.16, 0, 0]} castShadow>
          <torusGeometry args={[0.085, 0.024, 8, 16, Math.PI * 1.5]} />
          <meshStandardMaterial color="#bf360c" roughness={0.18} />
        </mesh>
        <mesh position={[0, -0.22, 0]} receiveShadow>
          <cylinderGeometry args={[0.26, 0.26, 0.02, 16]} />
          <meshStandardMaterial color="#eeeeee" roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.16, 0.15, 0.02, 14]} />
          <meshStandardMaterial color="#1a0900" roughness={0.06} />
        </mesh>
      </group>

      <group position={[-2.0, surfaceY + 0.09, tableZ + 0.5]} rotation={[0.08, 0.65, -0.04]}>
        <mesh position={[0, 0, -0.24]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.28, 8]} />
          <meshStandardMaterial color="#5d4037" roughness={0.72} />
        </mesh>
        <mesh position={[0, 0, -0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.024, 0.024, 0.04, 8]} />
          <meshStandardMaterial color="#b0bec5" metalness={0.95} roughness={0.05} />
        </mesh>
        <mesh position={[0, 0, 0.1]} castShadow>
          <torusGeometry args={[0.17, 0.024, 8, 24]} />
          <meshStandardMaterial color="#cfd8dc" metalness={0.95} roughness={0.05} />
        </mesh>
        <mesh position={[0, 0, 0.1]}>
          <cylinderGeometry args={[0.155, 0.155, 0.008, 16]} />
          <meshPhysicalMaterial color="#d0eeee" transparent opacity={0.22} roughness={0.04}
            transmission={0.94} thickness={0.1} />
        </mesh>
      </group>

      <group position={[0.4, surfaceY + 0.09, tableZ - 0.55]} rotation={[0.03, -1.3, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.014, 0.014, 0.38, 8]} />
          <meshStandardMaterial color="#1565c0" roughness={0.32} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <coneGeometry args={[0.014, 0.038, 8]} />
          <meshStandardMaterial color="#b0bec5" metalness={0.8} roughness={0.15} />
        </mesh>
        <mesh position={[0, -0.11, 0]} castShadow>
          <cylinderGeometry args={[0.016, 0.016, 0.12, 8]} />
          <meshStandardMaterial color="#0d3c8c" roughness={0.3} />
        </mesh>
      </group>

      <group position={[0.58, surfaceY + 0.09, tableZ - 0.42]} rotation={[0.03, -1.15, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.013, 0.013, 0.36, 8]} />
          <meshStandardMaterial color="#b71c1c" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.19, 0]} castShadow>
          <coneGeometry args={[0.013, 0.034, 8]} />
          <meshStandardMaterial color="#90a4ae" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      <group position={[-0.7, surfaceY + 0.09, tableZ - 0.35]} rotation={[0, 0.14, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.82, 0.028, 1.15]} />
          <meshStandardMaterial color="#263238" roughness={0.62} />
        </mesh>
        <mesh position={[0, 0.012, 0]} receiveShadow>
          <boxGeometry args={[0.78, 0.022, 1.11]} />
          <meshStandardMaterial color="#f9f9f9" roughness={0.92} />
        </mesh>
        {[-0.46, -0.32, -0.18, -0.04, 0.1, 0.24, 0.38].map((zv, i) => (
          <mesh key={i} position={[-0.38, 0.016, zv]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <torusGeometry args={[0.04, 0.008, 6, 12, Math.PI * 1.28]} />
            <meshStandardMaterial color="#90a4ae" metalness={0.82} roughness={0.12} />
          </mesh>
        ))}
      </group>

      <mesh position={[1.2, surfaceY + 0.003, tableZ + 0.55]} rotation={[-Math.PI / 2, 0, 0.25]} receiveShadow>
        <planeGeometry args={[0.38, 0.28]} />
        <meshStandardMaterial color="#f0ede5" roughness={0.9} />
      </mesh>

      <group position={[-1.4, surfaceY + 0.018, tableZ + 0.2]} rotation={[0, -0.1, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.65, 0.04, 0.9]} />
          <meshStandardMaterial color="#5c3317" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.022, 0]} receiveShadow>
          <boxGeometry args={[0.62, 0.02, 0.86]} />
          <meshStandardMaterial color="#fafafa" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/* ─── Haz de luz de la lámpara de pie ─────────────────────────────────── */
function LampBeam({ position }) {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.material.opacity =
        0.04 + Math.sin(clock.getElapsedTime() * 0.4) * 0.012;
    }
  });
  return (
    <mesh ref={meshRef} position={position} rotation={[0.1, 0, 0]}>
      <coneGeometry args={[0.85, 2.2, 16, 1, true]} />
      <meshBasicMaterial color="#fff8dc" transparent opacity={0.05} side={THREE.BackSide} />
    </mesh>
  );
}

/* ─── SceneContent principal ─────────────────────────────────────────── */
function SceneContent({ timelineId }) {
  const { timeline, eventos, curvePoints } = useTimelineData(timelineId);
  const controlsRef = useRef();
  const [activeId, setActiveId] = useState(null);

  // Comprobar si el hito activo pertenece a la FASE IV / FASE 4
  const activeEvento = useMemo(() => {
    return eventos.find((ev) => ev.id === activeId);
  }, [eventos, activeId]);

  const isFaseIV = useMemo(() => {
    if (!activeEvento) return false;
    const faseUpper = activeEvento.fase.toUpperCase();
    return faseUpper.includes("IV") || faseUpper.includes("4");
  }, [activeEvento]);

  /* 1. CONFIGURACIÓN DEL TABLERO DE INVESTIGACIÓN (Solo Fase IV) */
  const colWidth = 3.0, rowHeight = 2.3;
  const columns = useMemo(() => (eventos.length > 9 ? 4 : 3), [eventos]);
  const rows    = useMemo(() => Math.ceil(eventos.length / columns), [eventos, columns]);

  const boardW = useMemo(() => columns * colWidth + 1.0, [columns]);
  const boardH = useMemo(() => rows * rowHeight + 1.0,   [rows]);

  const ROOM_HALF_W = boardW / 2 + 5.5;
  const FLOOR_Y     = -(boardH / 2) - 2.2;
  const CEILING_Y   = FLOOR_Y + 7.8;

  const TABLE_W   = boardW + 3.2;
  const TABLE_D   = 3.0;
  const TABLE_Z   = 4.8;
  const TABLE_TOP = FLOOR_Y + 1.26;
  const SURFACE_Y = TABLE_TOP + 0.045;

  const corkTex    = useMemo(buildCorkTexture,    []);
  const parquetTex = useMemo(buildParquetTexture, []);
  const wallTex    = useMemo(buildWallTexture,    []);

  // Asignar coordenadas del tablero a cada evento
  const boardEventos = useMemo(() => {
    return eventos.map((ev, i) => {
      const row = Math.floor(i / columns);
      const col = i % columns;
      const targetCol = (row % 2 !== 0) ? (columns - 1 - col) : col;
      const x  = (targetCol - (columns - 1) / 2) * colWidth + Math.sin(i * 12.3) * 0.18;
      const y  = ((rows - 1) / 2 - row) * rowHeight + Math.cos(i * 7.7) * 0.14;
      const z  = 0.02 + 0.01 * (i % 3);
      const cardType  = getCardType(ev);
      const localPinY = getLocalPinY(cardType);
      return {
        ...ev,
        boardPosition: new THREE.Vector3(x, y, z),
        boardRotationZ: Math.sin(i * 8.9) * 0.08,
        col,
        row,
        columns,
        cardType,
        localPinY,
      };
    });
  }, [eventos, columns, rows]);

  const getPinPos = useCallback((ev) => {
    const { x, y, z } = ev.boardPosition;
    const rot = ev.boardRotationZ, py = ev.localPinY;
    return new THREE.Vector3(x - py * Math.sin(rot), y + py * Math.cos(rot), z + 0.015);
  }, []);

  const threadPts = useCallback((p1, p2) => {
    const pts = [], N = 16, sag = Math.max(0.14, p1.distanceTo(p2) * 0.08);
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      pts.push(new THREE.Vector3(
        p1.x + (p2.x - p1.x) * t,
        p1.y + (p2.y - p1.y) * t - Math.sin(t * Math.PI) * sag,
        p1.z + (p2.z - p1.z) * t + Math.sin(t * Math.PI) * 0.04
      ));
    }
    return pts;
  }, []);

  const shadowPts = useCallback((pts) =>
    pts.map(p => new THREE.Vector3(p.x + 0.02, p.y - 0.04, p.z - 0.03)), []);

  /* 2. CONFIGURACIÓN DE LA ESCENA 3D CLÁSICA ORIGINAL */
  const classicTheme = useMemo(() => {
    return timelineId === "auditoria"
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
  }, [timelineId]);

  /* 3. NAVEGACIÓN Y CÁMARA */
  const DEF_Z = useMemo(() => (columns === 4 ? 12.0 : 9.5), [columns]);

  const focusOn = useCallback((evento) => {
    setActiveId(evento.id);
    const isFaseIVNode = evento.fase.toUpperCase().includes("IV") || evento.fase.includes("4");

    if (isFaseIVNode) {
      // Enfocar tarjeta en coordenadas del Tablero
      const p = boardEventos[evento.index].boardPosition;
      controlsRef.current?.setLookAt(p.x, p.y, 3.0, p.x, p.y, 0, true);
    } else {
      // Enfocar nodo en coordenadas clásicas
      const p = evento.position;
      controlsRef.current?.setLookAt(
        p.x + 1.5,
        p.y + 1.2,
        p.z + 6.5,
        p.x,
        p.y + 0.6,
        p.z,
        true
      );
    }
  }, [boardEventos]);

  const clearFocus = useCallback(() => {
    setActiveId(null);
    // Vuelve al encuadre clásico inicial
    controlsRef.current?.setLookAt(0, 6, 26, 0, 0, 0, true);
  }, []);

  // Resetear al cambiar de timeline
  useEffect(() => {
    setActiveId(null);
    controlsRef.current?.setLookAt(0, 6, 26, 0, 0, 0, false);
  }, [timelineId]);

  // Teclado
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") return clearFocus();
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const idx = boardEventos.findIndex(ev => ev.id === activeId);
      const next = e.key === "ArrowRight"
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
        /* ================= VISTA A: TABLERO DE INVESTIGACIÓN (Fase IV activa) ================= */
        <>
          <fog attach="fog" args={["#bfb5a7", 10, 32]} />
          <ambientLight intensity={0.28} color="#c8b89a" />

          {/* Iluminación de oficina */}
          <pointLight position={[0, CEILING_Y - 0.5, 1.5]} intensity={2.2}
            color="#ffe0b2" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
          <spotLight position={[0, CEILING_Y - 0.2, 2.5]}
            target-position={[0, 0, 0]} angle={0.45} penumbra={0.85}
            intensity={3.5} color="#fff3e0" castShadow />
          <pointLight position={[ROOM_HALF_W - 1.0, FLOOR_Y + 2.55, TABLE_Z + 0.1]}
            intensity={1.8} color="#ffd54f" distance={7} decay={2} />
          <directionalLight position={[-ROOM_HALF_W, 3, 4]} intensity={0.4} color="#bdd7ee" />

          {/* Paredes */}
          <mesh position={[0, (CEILING_Y + FLOOR_Y) / 2, -0.15]} receiveShadow>
            <boxGeometry args={[ROOM_HALF_W * 2 + 2, CEILING_Y - FLOOR_Y + 1, 0.14]} />
            <meshStandardMaterial map={wallTex} roughness={0.88} />
          </mesh>
          <mesh position={[-ROOM_HALF_W, (CEILING_Y + FLOOR_Y) / 2, 5]} receiveShadow rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[14, CEILING_Y - FLOOR_Y + 1, 0.14]} />
            <meshStandardMaterial map={wallTex} roughness={0.88} />
          </mesh>
          <mesh position={[ROOM_HALF_W, (CEILING_Y + FLOOR_Y) / 2, 5]} receiveShadow rotation={[0, -Math.PI / 2, 0]}>
            <boxGeometry args={[14, CEILING_Y - FLOOR_Y + 1, 0.14]} />
            <meshStandardMaterial map={wallTex} roughness={0.88} />
          </mesh>

          {/* Suelo */}
          <mesh position={[0, FLOOR_Y, 5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[ROOM_HALF_W * 2 + 2, 14]} />
            <meshStandardMaterial map={parquetTex} roughness={0.62} />
          </mesh>

          {/* Zócalo */}
          <mesh position={[0, FLOOR_Y + 0.08, -0.06]}>
            <boxGeometry args={[ROOM_HALF_W * 2 + 2, 0.16, 0.06]} />
            <meshStandardMaterial color="#7a5c3e" roughness={0.65} />
          </mesh>

          {/* Cuadros */}
          <WallPicture position={[-ROOM_HALF_W + 0.1, 1.5, 1.0]} w={1.0} h={0.75} />
          <WallPicture position={[-ROOM_HALF_W + 0.1, 1.5, 3.5]} w={0.9} h={1.1}  />
          <WallPicture position={[ROOM_HALF_W - 0.1, 1.5, 2.0]}  w={1.1} h={0.8}  />

          {/* Tablero de corcho */}
          <group position={[0, 0, -0.05]}>
            <mesh receiveShadow castShadow>
              <boxGeometry args={[boardW, boardH, 0.08]} />
              <meshStandardMaterial map={corkTex} roughness={0.96} />
            </mesh>
            {[
              [0, boardH / 2 + 0.175, 0.04, boardW + 0.7, 0.35, 0.16],
              [0, -boardH / 2 - 0.175, 0.04, boardW + 0.7, 0.35, 0.16],
              [-boardW / 2 - 0.175, 0, 0.04, 0.35, boardH + 0.7, 0.16],
              [boardW / 2 + 0.175, 0, 0.04, 0.35, boardH + 0.7, 0.16],
            ].map(([x, y, z, w, h, d], i) => (
              <mesh key={i} position={[x, y, z]} castShadow>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color="#5a3820" roughness={0.6} />
              </mesh>
            ))}
          </group>

          {/* Hilos rojos */}
          {boardEventos.map((ev, i) => {
            if (i === boardEventos.length - 1) return null;
            const nxt = boardEventos[i + 1];
            const tp  = threadPts(getPinPos(ev), getPinPos(nxt));
            const sp  = shadowPts(tp);
            return (
              <group key={`th-${ev.id}`}>
                <Line points={sp} color="#000" lineWidth={1.4} transparent opacity={0.28} />
                <Line points={tp} color="#e53935" lineWidth={3.8} transparent opacity={0.97} />
              </group>
            );
          })}

          {/* Sillas, archivadores y lámpara */}
          <MeetingTable position={[0, TABLE_TOP, TABLE_Z]} width={TABLE_W} depth={TABLE_D} />
          <DeskItems surfaceY={SURFACE_Y} tableZ={TABLE_Z} />
          <FilingCabinet position={[-ROOM_HALF_W + 0.38, FLOOR_Y + 0.7, -0.08]} />
          <FilingCabinet position={[-ROOM_HALF_W + 1.05, FLOOR_Y + 0.7, -0.08]} />
          <FloorLamp position={[ROOM_HALF_W - 1.1, FLOOR_Y, TABLE_Z + 0.8]} />
          <LampBeam  position={[ROOM_HALF_W - 0.66, FLOOR_Y + 2.55, TABLE_Z + 0.85]} />
          <OfficeChair position={[-0.8, FLOOR_Y, TABLE_Z + 1.75]} />
          <OfficeChair position={[1.5,  FLOOR_Y, TABLE_Z + 1.9]}  />

          {/* Papeles tirados */}
          {[
            [[-0.5, FLOOR_Y + 0.001, 2.8], [-Math.PI/2, 0,  0.3]],
            [[ 1.2, FLOOR_Y + 0.001, 3.1], [-Math.PI/2, 0, -0.15]],
            [[-1.8, FLOOR_Y + 0.001, 2.5], [-Math.PI/2, 0,  0.7]],
            [[ 0.2, FLOOR_Y + 0.001, 3.8], [-Math.PI/2, 0,  1.2]],
            [[-ROOM_HALF_W + 1.6, FLOOR_Y + 0.001, 1.0], [-Math.PI/2, 0, 0.2]],
          ].map(([pos, rot], i) => (
            <FloorPaper key={i} position={pos} rotation={rot} />
          ))}
        </>
      ) : (
        /* ================= VISTA B: ESCENARIO 3D DIGITAL CLÁSICO ORIGINAL ================= */
        <>
          <color attach="background" args={[classicTheme.background]} />
          <fog attach="fog" args={[classicTheme.fog, 25, 70]} />

          <ambientLight intensity={classicTheme.ambient} />
          <directionalLight position={[10, 12, 8]} intensity={classicTheme.directional} />
          <pointLight position={[0, 8, 0]} intensity={classicTheme.point} color={timeline.colorPrimario} />

          <Stars radius={90} depth={40} count={2500} factor={3} saturation={0} fade speed={0.6} />
          <Grid position={[0, -4, 0]} args={[80, 80]} cellColor={classicTheme.gridCell}
            sectionColor={classicTheme.gridSection} fadeDistance={55} infiniteGrid />

          {/* Trayectoria temporal (Spline) */}
          <Line points={curvePoints} color={timeline.colorPrimario} lineWidth={2.5} transparent opacity={0.85} />
          <Line points={curvePoints.map((p) => [p.x, p.y - 0.06, p.z])} color={timeline.colorAcento}
            lineWidth={1} transparent opacity={0.25} />
        </>
      )}

      {/* Renderizar eventos - Pasa el prop isBoardView según si es Fase IV activa */}
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

      {/* Controles de cámara unificados */}
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
