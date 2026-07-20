import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Text } from "@react-three/drei";
import * as THREE from "three";

/* ════════════════════════════════════════════════════════════════════════
   InvestigationBoard
   ------------------
   Tablero de investigación completo como componente independiente:
   habitación (paredes, techo, suelo), tablero de corcho, hilos rojos,
   mobiliario y decoración de oficina de investigación.

   API:
     computeBoardLayout(eventos)     → { boardEventos, boardW, boardH, columns, rows }
     computeRoomDims(boardW, boardH) → dimensiones de la habitación (para límites de cámara)
     getPinPos(evento)               → Vector3 de la chincheta (para hilos/focus)
     <InvestigationBoard boardW boardH boardEventos />
   ════════════════════════════════════════════════════════════════════════ */

const HANDWRITTEN_FONT = "/ArchitectsDaughter.ttf";

/* ─── Layout del tablero ────────────────────────────────────────────────── */
const COL_WIDTH = 2.55;
const ROW_HEIGHT = 1.95;

export const getCardType = (evento) => {
  const t = evento.titulo.toLowerCase();
  if (
    t.includes("inicio") || t.includes("revisión") || t.includes("planificación") ||
    t.includes("dictamen") || t.includes("informe") || t.includes("respuesta")
  ) return "document";
  const n = parseInt(evento.id.replace(/^\D+/g, ""), 10) || 0;
  return n % 2 === 0 ? "note" : "polaroid";
};

export const getLocalPinY = (type) =>
  type === "note" ? 0.52 : type === "document" ? 0.82 : 0.65;

export function computeBoardLayout(eventos) {
  const columns = eventos.length > 9 ? 4 : 3;
  const rows = Math.ceil(eventos.length / columns);
  const boardW = columns * COL_WIDTH + 1.0;
  const boardH = rows * ROW_HEIGHT + 1.0;

  const boardEventos = eventos.map((ev, i) => {
    const row = Math.floor(i / columns);
    const col = i % columns;
    const targetCol = row % 2 !== 0 ? columns - 1 - col : col; // serpentina
    const x = (targetCol - (columns - 1) / 2) * COL_WIDTH + Math.sin(i * 12.3) * 0.18;
    const y = ((rows - 1) / 2 - row) * ROW_HEIGHT + Math.cos(i * 7.7) * 0.14;
    const z = 0.02 + 0.01 * (i % 3);
    const cardType = getCardType(ev);
    return {
      ...ev,
      boardPosition: new THREE.Vector3(x, y, z),
      boardRotationZ: Math.sin(i * 8.9) * 0.08,
      col, row, columns,
      cardType,
      localPinY: getLocalPinY(cardType),
    };
  });

  return { boardEventos, boardW, boardH, columns, rows };
}

/* ─── Dimensiones de la habitación (exportadas para límites de cámara) ──── */
export function computeRoomDims(boardW, boardH) {
  const ROOM_HALF_W = boardW / 2 + 5.5;
  const FLOOR_Y = -(boardH / 2) - 2.2;
  const CEILING_Y = boardH / 2 + 1.4; // el techo siempre supera el tablero
  const ROOM_D = 24; // Aumentado de 14 a 24 para dar mucha más profundidad y espacio a la cámara
  return {
    ROOM_HALF_W,
    FLOOR_Y,
    CEILING_Y,
    ROOM_D,
    ROOM_CZ: ROOM_D / 2 - 2, // Posición central en Z recalculada dinámicamente
    WALL_H: CEILING_Y - FLOOR_Y,
    WALL_CY: (CEILING_Y + FLOOR_Y) / 2,
  };
}

export function getPinPos(ev) {
  const { x, y, z } = ev.boardPosition;
  const rot = ev.boardRotationZ, py = ev.localPinY;
  return new THREE.Vector3(x - py * Math.sin(rot), y + py * Math.cos(rot), z + 0.015);
}

/* ─── Texturas procedurales ─────────────────────────────────────────────── */
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

function buildParquetTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d");
  const PLANK_W = 64, PLANK_H = 16;
  const cols = Math.ceil(512 / PLANK_W) + 1;
  const rowsN = Math.ceil(512 / PLANK_H) + 1;
  const palettes = [["#3b2712", "#4a3118", "#5a3e22"], ["#2e1d0e", "#3d2a14", "#4b3419"]];
  for (let row = 0; row < rowsN; row++) {
    const pal = palettes[row % palettes.length];
    const offset = row % 2 === 0 ? 0 : PLANK_W / 2;
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

/* ─── Decoración de pared ───────────────────────────────────────────────── */
function WallPicture({ position, rotation = [0, 0, 0], w = 1.2, h = 0.9 }) {
  return (
    <group position={position} rotation={rotation}>
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

/* Reloj de pared — construido mirando a +Z; se rota el grupo según la pared */
function WallClock({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Aro */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.05, 24]} />
        <meshStandardMaterial color="#263238" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Esfera */}
      <mesh position={[0, 0, 0.028]}>
        <circleGeometry args={[0.3, 24]} />
        <meshStandardMaterial color="#f5f2ea" roughness={0.6} />
      </mesh>
      {/* Agujas: 10:10 */}
      <mesh position={[0, 0, 0.035]} rotation={[0, 0, 1.05]}>
        <boxGeometry args={[0.02, 0.24, 0.008]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0, 0, 0.04]} rotation={[0, 0, -1.05]}>
        <boxGeometry args={[0.026, 0.17, 0.008]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      {/* Centro */}
      <mesh position={[0, 0, 0.045]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#8b1c1c" />
      </mesh>
    </group>
  );
}

/* Ventana nocturna con persianas americanas */
function WindowBlinds({ position, rotation = [0, 0, 0], w = 2.4, h = 1.7 }) {
  const slats = Math.floor(h / 0.14);
  return (
    <group position={position} rotation={rotation}>
      {/* Marco */}
      <mesh>
        <boxGeometry args={[w + 0.16, h + 0.16, 0.06]} />
        <meshStandardMaterial color="#4a3424" roughness={0.7} />
      </mesh>
      {/* Noche detrás */}
      <mesh position={[0, 0, 0.032]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#0a1526" roughness={1} emissive="#16263f" emissiveIntensity={0.5} />
      </mesh>
      {/* Persianas */}
      {Array.from({ length: slats }).map((_, i) => (
        <mesh
          key={i}
          position={[0, h / 2 - 0.1 - i * 0.14, 0.05]}
          rotation={[0.5, 0, 0]}
        >
          <boxGeometry args={[w - 0.06, 0.1, 0.008]} />
          <meshStandardMaterial color="#cfc8b8" roughness={0.8} />
        </mesh>
      ))}
      {/* Cordón */}
      <mesh position={[w / 2 - 0.1, -h / 4, 0.06]}>
        <cylinderGeometry args={[0.006, 0.006, h / 2, 6]} />
        <meshStandardMaterial color="#e0dcd0" roughness={0.9} />
      </mesh>
    </group>
  );
}

/* Puerta de oficina */
function OfficeDoor({ position, rotation = [0, 0, 0], h = 3.0, w = 1.3 }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Marco */}
      <mesh>
        <boxGeometry args={[w + 0.18, h + 0.12, 0.08]} />
        <meshStandardMaterial color="#4a3424" roughness={0.65} />
      </mesh>
      {/* Hoja */}
      <mesh position={[0, -0.02, 0.03]}>
        <boxGeometry args={[w, h - 0.06, 0.05]} />
        <meshStandardMaterial color="#5d432c" roughness={0.55} />
      </mesh>
      {/* Vidrio esmerilado superior */}
      <mesh position={[0, h / 4, 0.06]}>
        <planeGeometry args={[w - 0.24, h / 2 - 0.3]} />
        <meshPhysicalMaterial color="#dfe8ec" roughness={0.9} transparent opacity={0.55} />
      </mesh>
      <Text
        font={HANDWRITTEN_FONT}
        fontSize={0.13}
        color="#2b2b2b"
        position={[0, h / 4, 0.07]}
        anchorX="center"
        anchorY="middle"
      >
        UFECI · INVESTIGACIONES
      </Text>
      {/* Picaporte */}
      <mesh position={[w / 2 - 0.14, -0.1, 0.09]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.14, 10]} />
        <meshStandardMaterial color="#b0a173" metalness={0.85} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* Luminaria fluorescente de techo */
function CeilingFixture({ position, w = 2.4 }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[w, 0.07, 0.5]} />
        <meshStandardMaterial color="#8d8578" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[w - 0.16, 0.02, 0.34]} />
        <meshStandardMaterial color="#fffbee" emissive="#fff3d6" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* Cajas de evidencia apiladas */
function EvidenceBox({ position, rotation = [0, 0, 0], label = "EVIDENCIA" }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.72, 0.42, 0.5]} />
        <meshStandardMaterial color="#9c7a52" roughness={0.85} />
      </mesh>
      {/* Tapa */}
      <mesh position={[0, 0.225, 0]}>
        <boxGeometry args={[0.76, 0.05, 0.54]} />
        <meshStandardMaterial color="#8a6a45" roughness={0.85} />
      </mesh>
      {/* Etiqueta */}
      <mesh position={[0, 0.02, 0.253]}>
        <planeGeometry args={[0.4, 0.18]} />
        <meshStandardMaterial color="#f5f2e8" roughness={0.9} />
      </mesh>
      <Text
        font={HANDWRITTEN_FONT}
        fontSize={0.065}
        color="#8b1c1c"
        position={[0, 0.02, 0.256]}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

/* Papelera con papeles arrugados */
function TrashBin({ position }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.2, 0.16, 0.44, 16, 1, true]} />
        <meshStandardMaterial color="#4e5a60" roughness={0.5} metalness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {[[0.05, 0.42, 0.02], [-0.06, 0.4, -0.04], [0.3, 0.05, 0.12]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[0.07, 0]} />
          <meshStandardMaterial color="#f0ede4" roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/* Pila de carpetas manila */
function FolderStack({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.sin(i * 4) * 0.03, 0.018 + i * 0.035, Math.cos(i * 3) * 0.02]}
          rotation={[0, Math.sin(i * 7) * 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.62, 0.03, 0.45]} />
          <meshStandardMaterial color={i === 1 ? "#c9a35e" : "#d7b56d"} roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0.1, 0.11, 0]} rotation={[0, -0.1, 0]}>
        <boxGeometry args={[0.55, 0.012, 0.4]} />
        <meshStandardMaterial color="#f4f1e8" roughness={0.9} />
      </mesh>
    </group>
  );
}

/* Alfombra bajo la mesa */
function Rug({ position, w, d }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#5a2222" roughness={0.98} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[w - 0.5, d - 0.5]} />
        <meshStandardMaterial color="#6e2c2c" roughness={0.98} />
      </mesh>
    </group>
  );
}

/* ─── Mobiliario ────────────────────────────────────────────────────────── */
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

/* Lámpara de pie — reconstruida: luz y haz integrados y alineados */
function FloorLamp({ position, rotationY = 0 }) {
  const beamRef = useRef();
  useFrame(({ clock }) => {
    if (beamRef.current) {
      beamRef.current.material.opacity =
        0.045 + Math.sin(clock.getElapsedTime() * 0.4) * 0.012;
    }
  });
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Base */}
      <mesh castShadow receiveShadow position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.2, 0.24, 0.06, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Poste recto */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.024, 1.95, 10]} />
        <meshStandardMaterial color="#212121" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Cabezal inclinado hacia la habitación */}
      <group position={[0, 1.98, 0]} rotation={[0.45, 0, 0]}>
        <mesh castShadow>
          <coneGeometry args={[0.27, 0.32, 18, 1, true]} />
          <meshStandardMaterial color="#c8860a" roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        {/* Bombilla */}
        <mesh position={[0, -0.06, 0]}>
          <sphereGeometry args={[0.06, 10, 10]} />
          <meshStandardMaterial color="#fffde7" emissive="#fff9c4" emissiveIntensity={4} toneMapped={false} />
        </mesh>
        {/* Luz real de la lámpara */}
        <pointLight position={[0, -0.18, 0]} intensity={2.0} color="#ffd54f" distance={8} decay={2} />
        {/* Haz de luz alineado con el cabezal */}
        <mesh ref={beamRef} position={[0, -1.15, 0]}>
          <coneGeometry args={[0.75, 2.1, 16, 1, true]} />
          <meshBasicMaterial color="#fff8dc" transparent opacity={0.05} side={THREE.BackSide} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

function FloorPaper({ position, rotation }) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={[0.45, 0.58]} />
      <meshStandardMaterial color="#f5f3ee" roughness={0.95} />
    </mesh>
  );
}

function OfficeChair({ position, rotationY = 0, scale = 1.30 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
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

/* Mesa de reuniones — tamaño razonable (ya no ocupa la pared entera) */
function MeetingTable({ position, width, depth }) {
  const legPositions = [
    [-(width / 2 - 0.15), (depth / 2 - 0.15)],
    [(width / 2 - 0.15), (depth / 2 - 0.15)],
    [-(width / 2 - 0.15), -(depth / 2 - 0.15)],
    [(width / 2 - 0.15), -(depth / 2 - 0.15)],
  ];
  return (
    <group position={position}>
      {/* Tapa — madera algo más clara para que se lea en la penumbra */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, 0.08, depth]} />
        <meshStandardMaterial color="#4a3018" roughness={0.3} metalness={0.05} />
      </mesh>
      {/* Canto */}
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[width + 0.02, 0.05, depth + 0.02]} />
        <meshStandardMaterial color="#2c1c0e" roughness={0.35} />
      </mesh>
      {/* Patas */}
      {legPositions.map(([lx, lz], idx) => (
        <mesh key={idx} position={[lx, -0.64, lz]} castShadow>
          <boxGeometry args={[0.11, 1.2, 0.11]} />
          <meshStandardMaterial color="#241608" roughness={0.5} />
        </mesh>
      ))}
      {/* Travesaño */}
      <mesh position={[0, -1.05, 0]}>
        <boxGeometry args={[width - 0.5, 0.05, 0.08]} />
        <meshStandardMaterial color="#241608" roughness={0.5} />
      </mesh>
    </group>
  );
}

function DeskItems({ surfaceY, tableZ, tableW, scale = 1.30 }) {
  return (
    <group position={[0, surfaceY, tableZ]} scale={[scale, scale, scale]}>
      {/* Taza de café */}
      <group position={[tableW * 0.22, 0.12, 0.35]} rotation={[0, -0.4, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.11, 0.09, 0.22, 20]} />
          <meshStandardMaterial color="#bf360c" roughness={0.18} metalness={0.08} />
        </mesh>
        <mesh position={[0.1, 0, 0]} castShadow>
          <torusGeometry args={[0.055, 0.016, 8, 16, Math.PI * 1.5]} />
          <meshStandardMaterial color="#bf360c" roughness={0.18} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.09, 0.088, 0.015, 14]} />
          <meshStandardMaterial color="#1a0900" roughness={0.06} />
        </mesh>
      </group>

      {/* Lupa */}
      <group position={[-tableW * 0.22, 0.07, 0.4]} rotation={[0.08, 0.65, -0.04]}>
        <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.24, 8]} />
          <meshStandardMaterial color="#5d4037" roughness={0.72} />
        </mesh>
        <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.14, 0.02, 8, 24]} />
          <meshStandardMaterial color="#cfd8dc" metalness={0.95} roughness={0.05} />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <cylinderGeometry args={[0.127, 0.127, 0.007, 16]} />
          <meshPhysicalMaterial color="#d0eeee" transparent opacity={0.22} roughness={0.04}
            transmission={0.94} thickness={0.1} />
        </mesh>
      </group>

      {/* Lapiceras */}
      <group position={[0.35, 0.03, -0.45]} rotation={[Math.PI / 2, 0, 0.4]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.34, 8]} />
          <meshStandardMaterial color="#1565c0" roughness={0.32} />
        </mesh>
      </group>
      <group position={[0.52, 0.03, -0.35]} rotation={[Math.PI / 2, 0, 0.75]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.011, 0.011, 0.32, 8]} />
          <meshStandardMaterial color="#b71c1c" roughness={0.35} />
        </mesh>
      </group>

      {/* Anotador con espiral */}
      <group position={[-0.6, 0.05, -0.3]} rotation={[0, 0.14, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.025, 0.85]} />
          <meshStandardMaterial color="#263238" roughness={0.62} />
        </mesh>
        <mesh position={[0, 0.012, 0]} receiveShadow>
          <boxGeometry args={[0.56, 0.02, 0.81]} />
          <meshStandardMaterial color="#f9f9f9" roughness={0.92} />
        </mesh>
        {[-0.32, -0.18, -0.04, 0.1, 0.24].map((zv, i) => (
          <mesh key={i} position={[-0.28, 0.015, zv]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <torusGeometry args={[0.035, 0.007, 6, 12, Math.PI * 1.28]} />
            <meshStandardMaterial color="#90a4ae" metalness={0.82} roughness={0.12} />
          </mesh>
        ))}
      </group>

      {/* Hoja suelta */}
      <mesh position={[tableW * 0.18, 0.003, 0.5]} rotation={[-Math.PI / 2, 0, 0.25]} receiveShadow>
        <planeGeometry args={[0.36, 0.26]} />
        <meshStandardMaterial color="#f0ede5" roughness={0.9} />
      </mesh>

      {/* Carpetas manila */}
      <FolderStack position={[-tableW * 0.15, 0, 0.15]} rotation={[0, -0.15, 0]} />
    </group>
  );
}

/* ─── Hilos rojos entre chinchetas ──────────────────────────────────────── */
function threadPts(p1, p2) {
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
}
const shadowPts = (pts) =>
  pts.map((p) => new THREE.Vector3(p.x + 0.02, p.y - 0.04, p.z - 0.03));

/* Lámpara de escritorio tipo banquero */
function BankerLamp({ position, scale = 1.25 }) {
  return (
    <group position={position} scale={scale}>
      {/* Base de latón / bronce */}
      <mesh castShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.04, 12]} />
        <meshStandardMaterial color="#c5a059" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Poste central de latón */}
      <mesh castShadow position={[0, 0.22, -0.04]} rotation={[0.15, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.4, 8]} />
        <meshStandardMaterial color="#c5a059" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Codo superior */}
      <mesh castShadow position={[0, 0.42, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.08, 8]} />
        <meshStandardMaterial color="#c5a059" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Pantalla de vidrio verde esmeralda */}
      <group position={[0, 0.43, 0.04]} rotation={[0.2, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.14, 0.18]} />
          <meshStandardMaterial color="#0b5e28" roughness={0.1} metalness={0.1} />
        </mesh>
        {/* Bombilla interna brillante */}
        <mesh position={[0, -0.04, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#fffde7" emissive="#fff59d" emissiveIntensity={3} toneMapped={false} />
        </mesh>
        {/* Luz puntual real de la lámpara */}
        <pointLight position={[0, -0.06, 0]} intensity={1.8} color="#ffe082" distance={3.8} decay={1.8} castShadow />
      </group>
    </group>
  );
}

/* ─── Componente principal ──────────────────────────────────────────────── */
export default function InvestigationBoard({ boardW, boardH, boardEventos }) {
  const { ROOM_HALF_W, FLOOR_Y, CEILING_Y, WALL_H, WALL_CY, ROOM_D, ROOM_CZ } =
    computeRoomDims(boardW, boardH);

  /* Mesa de reuniones - redimensionada para ser más imponente y realista */
  const TABLE_W = 9.4;          // Ancho absoluto mayor para dominar la escena frente al tablero achicado
  const TABLE_D = 3.4;          // Más profunda
  const TABLE_Z = 5.3;          // Posición en la sala
  const TABLE_TOP = FLOOR_Y + 1.35; // Un poco más alta
  const SURFACE_Y = TABLE_TOP + 0.04;

  const corkTex = useMemo(buildCorkTexture, []);
  const parquetTex = useMemo(buildParquetTexture, []);
  const wallTex = useMemo(buildWallTexture, []);
  const tallWallTex = useMemo(() => {
    const t = wallTex.clone();
    t.needsUpdate = true;
    t.repeat.set(3, Math.max(2, Math.round(WALL_H / 3)));
    return t;
  }, [wallTex, WALL_H]);

  const threads = useMemo(() => {
    const list = [];
    for (let i = 0; i < boardEventos.length - 1; i++) {
      const tp = threadPts(getPinPos(boardEventos[i]), getPinPos(boardEventos[i + 1]));
      list.push({ id: boardEventos[i].id, tp, sp: shadowPts(tp) });
    }
    return list;
  }, [boardEventos]);

  return (
    <group>
      {/* Fondo y niebla coherentes con la habitación */}
      <color attach="background" args={["#0f0c09"]} />
      <fog attach="fog" args={["#0f0c09", 16, 46]} />

      <ambientLight intensity={0.4} color="#c8b89a" />

      {/* Iluminación */}
      <pointLight position={[0, CEILING_Y - 0.5, 1.5]} intensity={2.2}
        color="#ffe0b2" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <spotLight position={[0, CEILING_Y - 0.2, 2.5]}
        target-position={[0, 0, 0]} angle={0.45} penumbra={0.85}
        intensity={3.5} color="#fff3e0" castShadow />
      {/* Luz cálida sobre la mesa (antes quedaba en penumbra) */}
      <pointLight position={[0, CEILING_Y - 0.6, TABLE_Z]} intensity={1.4}
        color="#ffe8c2" distance={10} decay={2} />
      <directionalLight position={[-ROOM_HALF_W, CEILING_Y - 1, 4]} intensity={0.4} color="#bdd7ee" />

      {/* Pared trasera */}
      <mesh position={[0, WALL_CY, -0.15]} receiveShadow>
        <boxGeometry args={[ROOM_HALF_W * 2 + 2, WALL_H, 0.14]} />
        <meshStandardMaterial map={tallWallTex} roughness={0.88} />
      </mesh>
      {/* Paredes laterales */}
      <mesh position={[-ROOM_HALF_W, WALL_CY, ROOM_CZ]} receiveShadow rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[ROOM_D, WALL_H, 0.14]} />
        <meshStandardMaterial map={tallWallTex} roughness={0.88} />
      </mesh>
      <mesh position={[ROOM_HALF_W, WALL_CY, ROOM_CZ]} receiveShadow rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[ROOM_D, WALL_H, 0.14]} />
        <meshStandardMaterial map={tallWallTex} roughness={0.88} />
      </mesh>

      {/* Techo */}
      <mesh position={[0, CEILING_Y, ROOM_CZ]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_HALF_W * 2 + 2, ROOM_D + 0.4]} />
        <meshStandardMaterial color="#9c9184" roughness={0.95} />
      </mesh>

      {/* Luminarias de techo */}
      <CeilingFixture position={[0, CEILING_Y - 0.05, 1.4]} w={Math.min(boardW * 0.5, 4)} />
      <CeilingFixture position={[0, CEILING_Y - 0.05, TABLE_Z]} w={3} />

      {/* Suelo */}
      <mesh position={[0, FLOOR_Y, ROOM_CZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_HALF_W * 2 + 2, ROOM_D]} />
        <meshStandardMaterial map={parquetTex} roughness={0.62} />
      </mesh>

      {/* Alfombra bajo la mesa */}
      <Rug position={[0, FLOOR_Y + 0.004, TABLE_Z]} w={TABLE_W + 2.4} d={TABLE_D + 2.6} />

      {/* Zócalos */}
      <mesh position={[0, FLOOR_Y + 0.08, -0.06]}>
        <boxGeometry args={[ROOM_HALF_W * 2 + 2, 0.16, 0.06]} />
        <meshStandardMaterial color="#7a5c3e" roughness={0.65} />
      </mesh>
      <mesh position={[-ROOM_HALF_W + 0.09, FLOOR_Y + 0.08, ROOM_CZ]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[ROOM_D, 0.16, 0.06]} />
        <meshStandardMaterial color="#7a5c3e" roughness={0.65} />
      </mesh>
      <mesh position={[ROOM_HALF_W - 0.09, FLOOR_Y + 0.08, ROOM_CZ]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[ROOM_D, 0.16, 0.06]} />
        <meshStandardMaterial color="#7a5c3e" roughness={0.65} />
      </mesh>

      {/* Decoración de paredes */}
      <WallPicture position={[-ROOM_HALF_W + 0.1, 1.5, 1.0]} rotation={[0, Math.PI / 2, 0]} w={1.0} h={0.75} />
      <WallPicture position={[-ROOM_HALF_W + 0.1, 1.5, 3.5]} rotation={[0, Math.PI / 2, 0]} w={0.9} h={1.1} />
      <WallClock position={[ROOM_HALF_W - 0.12, CEILING_Y - 1.5, 2.2]} rotation={[0, -Math.PI / 2, 0]} />
      <WindowBlinds position={[-ROOM_HALF_W + 0.12, WALL_CY + 0.6, 7.6]} rotation={[0, Math.PI / 2, 0]} />
      <OfficeDoor position={[ROOM_HALF_W - 0.12, FLOOR_Y + 1.53, 8.8]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Tablero de corcho con marco */}
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
      {threads.map(({ id, tp, sp }) => (
        <group key={`th-${id}`}>
          <Line points={sp} color="#000" lineWidth={1.4} transparent opacity={0.28} />
          <Line points={tp} color="#e53935" lineWidth={3.8} transparent opacity={0.97} />
        </group>
      ))}

      {/* Mobiliario */}
      <MeetingTable position={[0, TABLE_TOP, TABLE_Z]} width={TABLE_W} depth={TABLE_D} />
      <DeskItems surfaceY={SURFACE_Y} tableZ={TABLE_Z} tableW={TABLE_W} />
      <BankerLamp position={[0, SURFACE_Y, TABLE_Z - 0.1]} />
      <FilingCabinet position={[-ROOM_HALF_W + 0.38, FLOOR_Y + 0.7, -0.08]} />
      <FilingCabinet position={[-ROOM_HALF_W + 1.05, FLOOR_Y + 0.7, -0.08]} />
      <FloorLamp position={[ROOM_HALF_W - 1.3, FLOOR_Y, TABLE_Z + 1.2]} rotationY={-0.6} />
      
      {/* Sillas rodeando la gran mesa de reuniones */}
      <OfficeChair position={[-TABLE_W * 0.25, FLOOR_Y, TABLE_Z + 1.9]} rotationY={0.2} />
      <OfficeChair position={[TABLE_W * 0.22, FLOOR_Y, TABLE_Z + 2.0]} rotationY={-0.25} />
      <OfficeChair position={[-TABLE_W / 2 - 0.45, FLOOR_Y, TABLE_Z]} rotationY={Math.PI / 2} />
      <OfficeChair position={[TABLE_W / 2 + 0.45, FLOOR_Y, TABLE_Z]} rotationY={-Math.PI / 2} />
      
      <TrashBin position={[-TABLE_W / 2 - 0.7, FLOOR_Y, TABLE_Z + 0.5]} />

      {/* Cajas de evidencia apiladas en el rincón */}
      <group position={[ROOM_HALF_W - 1.1, FLOOR_Y, 0.55]} rotation={[0, -0.25, 0]}>
        <EvidenceBox position={[0, 0.21, 0]} label="EVIDENCIA" />
        <EvidenceBox position={[0.04, 0.66, 0.02]} rotation={[0, 0.18, 0]} label="CASO 1337" />
        <EvidenceBox position={[-0.02, 1.11, -0.01]} rotation={[0, -0.12, 0]} label="UFECI" />
      </group>

      {/* Papeles tirados */}
      {[
        [[-0.5, FLOOR_Y + 0.001, 2.8], [-Math.PI / 2, 0, 0.3]],
        [[1.2, FLOOR_Y + 0.001, 3.1], [-Math.PI / 2, 0, -0.15]],
        [[-1.8, FLOOR_Y + 0.001, 2.5], [-Math.PI / 2, 0, 0.7]],
        [[0.2, FLOOR_Y + 0.001, 3.8], [-Math.PI / 2, 0, 1.2]],
        [[-ROOM_HALF_W + 1.6, FLOOR_Y + 0.001, 1.0], [-Math.PI / 2, 0, 0.2]],
      ].map(([pos, rot], i) => (
        <FloorPaper key={i} position={pos} rotation={rot} />
      ))}
    </group>
  );
}
