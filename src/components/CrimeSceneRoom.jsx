import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Html, Line } from "@react-three/drei";
import * as THREE from "three";

const HANDWRITTEN_FONT = "/ArchitectsDaughter.ttf";

/* ─── 1. Textura procedural para el Monitor Izquierdo (Google Dark Mode) ─── */
function buildGoogleScreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 576;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#202124";
  ctx.fillRect(0, 0, 1024, 576);

  ctx.fillStyle = "#171717";
  ctx.fillRect(0, 0, 1024, 42);
  ctx.fillStyle = "#292a2d";
  ctx.fillRect(10, 8, 220, 34);
  ctx.fillStyle = "#e8eaed";
  ctx.font = "14px Segoe UI, sans-serif";
  ctx.fillText("Nueva pestaña", 30, 30);

  ctx.fillStyle = "#292a2d";
  ctx.fillRect(0, 42, 1024, 45);
  ctx.fillStyle = "#3c4043";
  ctx.beginPath();
  ctx.roundRect(140, 50, 744, 30, 15);
  ctx.fill();
  ctx.fillStyle = "#9aa0a6";
  ctx.font = "14px Segoe UI, sans-serif";
  ctx.fillText("🔍  Buscar en Google o escribir una URL", 160, 70);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 78px Segoe UI, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Google", 512, 250);

  ctx.fillStyle = "#202124";
  ctx.strokeStyle = "#5f6368";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(262, 290, 500, 48, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#9aa0a6";
  ctx.font = "16px Segoe UI, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("🔍  Buscar en Google o escribir una URL", 290, 321);
  ctx.fillStyle = "#8ab4f8";
  ctx.fillText("🎙️  📷", 710, 321);

  const shortcuts = ["YouTube", "Gmail", "Drive", "GitHub"];
  shortcuts.forEach((sc, i) => {
    const sx = 352 + i * 110;
    ctx.fillStyle = "#3c4043";
    ctx.beginPath();
    ctx.arc(sx, 400, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#bdc1c6";
    ctx.font = "12px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(sc, sx, 442);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/* ─── 2. Textura procedural para el Monitor Derecho (Fútbol Libre TV en vivo) ─── */
function buildFutbolLibreScreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 576;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1024, 576);

  ctx.fillStyle = "#f1f3f4";
  ctx.fillRect(0, 0, 1024, 45);
  ctx.fillStyle = "#e8eaed";
  ctx.fillRect(10, 8, 220, 37);
  ctx.fillStyle = "#202124";
  ctx.font = "bold 13px Segoe UI, sans-serif";
  ctx.fillText("⚽ Fútbol Libre TV", 28, 30);

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#dadce0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(140, 50, 744, 28, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#1e8e3e";
  ctx.font = "13px Segoe UI, monospace";
  ctx.fillText("🔒 https://futbollibre.tv/en-vivo/hls-stream-1337", 160, 69);

  ctx.fillStyle = "#1b5e20";
  ctx.fillRect(0, 85, 1024, 50);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px Segoe UI, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Fútbol Libre TV", 50, 120);

  ctx.font = "bold 13px Segoe UI, sans-serif";
  ctx.fillStyle = "#e8f5e9";
  ctx.fillText("ESPN  |  DirectTV Sports  |  TyC Sports  |  Win Sports+  |  TLN  |  Fox Sports", 480, 118);

  ctx.fillStyle = "#111111";
  ctx.font = "bold 32px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Fútbol Libre TV", 512, 185);

  ctx.fillStyle = "#444444";
  ctx.font = "14px Segoe UI, sans-serif";
  ctx.fillText(
    "Fútbol Libre es una plataforma donde puedes ver todos los Partidos de Fútbol favoritos gratis.",
    512,
    215
  );

  ctx.fillStyle = "#000000";
  ctx.font = "bold 22px Segoe UI, sans-serif";
  ctx.fillText("Ver Fútbol Libre Para Todos en Vivo", 512, 285);

  ctx.fillStyle = "#2e7d32";
  ctx.beginPath();
  ctx.roundRect(100, 310, 824, 44, 6);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Agenda — Lunes 15 de Julio de 2024 — EN VIVO", 512, 338);

  ctx.fillStyle = "#f9f9f9";
  ctx.strokeStyle = "#e0e0e0";
  ctx.beginPath();
  ctx.roundRect(100, 362, 824, 55, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#d32f2f";
  ctx.font = "bold 14px Segoe UI, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("🔴 20:00  hs", 120, 395);

  ctx.fillStyle = "#111111";
  ctx.font = "bold 16px Segoe UI, sans-serif";
  ctx.fillText("🏆 Copa Mundial / Transmisión Especial: Francia vs España (Señal HLS)", 240, 395);

  ctx.fillStyle = "#2e7d32";
  ctx.fillRect(800, 375, 105, 30);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("VER REPRODUCTOR", 852, 395);

  ctx.fillStyle = "#c62828";
  ctx.font = "bold 20px Segoe UI, sans-serif";
  ctx.fillText("Ver Canales de Fútbol Online en Vivo y en Directo", 512, 470);

  ctx.fillStyle = "rgba(255, 61, 113, 0.15)";
  ctx.fillRect(0, 500, 1024, 76);
  ctx.strokeStyle = "#ff3d71";
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 504, 1016, 68);

  ctx.fillStyle = "#ff3d71";
  ctx.font = "bold 16px Segoe UI, monospace";
  ctx.textAlign = "center";
  ctx.fillText("EVIDENCIA VOLÁTIL REGISTRADA IN SITU: EV-001 STREAMING HLS ACTIVO", 512, 542);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/* ─── 3. Textura procedural para el Switch TP-Link TL-SG108E (EV-003) ─── */
function buildTpLinkSwitchTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1c1d22";
  ctx.fillRect(0, 0, 1024, 320);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 38px Segoe UI, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("tp-link", 45, 80);

  ctx.font = "bold 30px Segoe UI, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("TL-SG108E", 975, 80);

  ctx.fillStyle = "#00e676";
  ctx.beginPath();
  ctx.arc(65, 200, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#a0a0a5";
  ctx.font = "bold 14px Segoe UI, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Power", 46, 240);

  for (let i = 0; i < 8; i++) {
    const px = 175 + i * 98;
    const py = 125;

    ctx.fillStyle = "#0d0e12";
    ctx.strokeStyle = "#555560";
    ctx.lineWidth = 3;
    ctx.fillRect(px, py, 78, 100);
    ctx.strokeRect(px, py, 78, 100);

    ctx.fillStyle = i < 3 ? "#00e676" : "#223326";
    ctx.beginPath();
    ctx.arc(px + 20, py - 20, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + 58, py - 20, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#888899";
    ctx.font = "bold 20px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${i + 1}`, px + 39, py + 135);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/* ─── 4. Textura de madera para el escritorio ─── */
function buildDarkWoodTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#3e2723";
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 400; i++) {
    const y = Math.random() * 512;
    const h = Math.random() * 8 + 2;
    const alpha = Math.random() * 0.15;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(30,15,10,${alpha})` : `rgba(80,50,30,${alpha})`;
    ctx.fillRect(0, y, 512, h);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

/* ─── 5. Componente de Teclado Mecánico 3D ─── */
function MechanicalKeyboard3D({ onClick, hovered, setHovered }) {
  return (
    <group
      position={[-0.2, 1.71, -1.7]}
      rotation={[0.04, -0.02, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.07, 0.52]} />
        <meshStandardMaterial
          color={hovered ? "#24283b" : "#1a1c23"}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[0, 0.038, 0]}>
        <boxGeometry args={[1.42, 0.01, 0.44]} />
        <meshStandardMaterial
          color="#00e5ff"
          emissive="#00e5ff"
          emissiveIntensity={hovered ? 3.0 : 2.0}
          toneMapped={false}
        />
      </mesh>

      {[-0.16, -0.05, 0.06, 0.17].map((rowZ, rIdx) => {
        const numKeys = rIdx === 3 ? 9 : 13;
        return (
          <group key={rIdx}>
            {Array.from({ length: numKeys }).map((_, kIdx) => {
              const startX = -0.63;
              const stepX = 0.1;
              const keyX = startX + kIdx * stepX;

              if (rIdx === 3 && kIdx === 4) {
                return (
                  <mesh key={kIdx} position={[0, 0.058, rowZ]} castShadow>
                    <boxGeometry args={[0.42, 0.032, 0.08]} />
                    <meshStandardMaterial color="#2a2e3d" roughness={0.4} />
                  </mesh>
                );
              }
              if (rIdx === 3 && kIdx > 3 && kIdx < 8) return null;

              return (
                <mesh key={kIdx} position={[keyX, 0.058, rowZ]} castShadow>
                  <boxGeometry args={[0.082, 0.032, 0.08]} />
                  <meshStandardMaterial color="#21242e" roughness={0.4} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

/**
 * CrimeSceneRoom
 * --------------
 * Recreación 3D de la Escena del Allanamiento con gabinete tapado en su cara frontal,
 * pendrive desplazado a la izquierda para no superponer con el teclado, TAP pasivo ubicado
 * bajo/detrás del escritorio con cable conectado al switch y cámara con zoom suave y encuadre general.
 */
export default function CrimeSceneRoom({ onFocusEvidence, onResetCamera }) {
  const googleTex = useMemo(() => buildGoogleScreenTexture(), []);
  const futbolLibreTex = useMemo(() => buildFutbolLibreScreenTexture(), []);
  const tpLinkTex = useMemo(() => buildTpLinkSwitchTexture(), []);
  const woodTex = useMemo(() => buildDarkWoodTexture(), []);

  const [hoveredItem, setHoveredItem] = useState(null);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  const rearFanRef = useRef();

  useFrame((_, delta) => {
    if (rearFanRef.current) rearFanRef.current.rotation.z += delta * 12;
  });

  // Catálogo completo de evidencias
  const EVIDENCE_DATA = {
    gabinete: {
      codigo: "EV-001 (Hardware PC)",
      titulo: "Workstation Dynamax — Servidor de Streaming HLS",
      fase: "FASE II & III",
      herramientas: ["Winpmem (RAM)", "FTK Imager", "Tableau T35689iu"],
      descripcion:
        "Computadora de escritorio hallada encendida in situ ejecutando el servidor de streaming HLS. Se realizó el volcado de memoria RAM de 16 GB antes del apagado para preservar procesos volátiles y claves criptográficas.",
      hallazgo: "PC Dynamax encendida con transmisión HLS activa. RAM preservada.",
      criticidad: "CRÍTICA",
      imagen: "/assets/escena-allanamiento.png",
      pos: { x: 2.2, y: 2.5, z: -2.4 },
    },
    streaming: {
      codigo: "EV-001 (Pantalla HLS)",
      titulo: "Transmisión Activa en vivo — Fútbol Libre TV",
      fase: "FASE II",
      herramientas: ["Captura in situ", "Wireshark", "Acta de escena"],
      descripcion:
        "Monitor secundario con el sitio web https://futbollibre.tv transmitiendo la señal 'Copa Mundial: Francia vs España'. Se constató la red de distribución HLS y la captura de paquetes .m3u8 en caliente.",
      hallazgo: "Señal HLS capturada en directo sin alteraciones del sistema.",
      criticidad: "CRÍTICA",
      imagen: "/assets/escena-allanamiento.png",
      pos: { x: 0.2, y: 2.4, z: -2.5 },
    },
    switch: {
      codigo: "EV-003",
      titulo: "Switch Gigabit TP-Link TL-SG108E (8 Puertos)",
      fase: "FASE II & IV",
      herramientas: ["Secuestro físico", "Inspección de red", "Acta N° 04"],
      descripcion:
        "Switch de escritorio de 8 puertos Easy Smart TP-Link TL-SG108E hallado con cables de red conectando hacia el TAP de red EV-004 e infraestructura saliente.",
      hallazgo: "Switch EV-003 secuestrado e ingresado a cadena de custodia.",
      criticidad: "ALTA",
      imagen: "/assets/extraccion-nvme.png",
      pos: { x: -2.9, y: 1.88, z: -2.2 },
    },
    tap: {
      codigo: "EV-004",
      titulo: "TAP de Red Pasivo Interpuesto",
      fase: "FASE II & III",
      herramientas: ["TAP Pasivo", "Wireshark", "Captura HLS"],
      descripcion:
        "Dispositivo de captura de tráfico de red en tránsito interpuesto en la línea Ethernet (conectado al Switch EV-003). Permitió interceptar las peticiones GET .m3u8 y fragmentos de video .ts sin inyectar paquetes ni alterar el canal.",
      hallazgo: "Tráfico de streaming capturado en caliente mediante TAP pasivo EV-004.",
      criticidad: "CRÍTICA",
      imagen: "/assets/wireshark-ts.jpg",
      pos: { x: -2.5, y: 0.2, z: -2.8 },
    },
    usb: {
      codigo: "USB-REG-001",
      titulo: "Pendrive Forense Estéril USB 3.0 (Winpmem)",
      fase: "FASE I & III",
      herramientas: ["Winpmem", "Script CMD Triage", "KAPE"],
      descripcion:
        "Unidad USB 3.0 estéril previamente verificada utilizada por el equipo pericial para ejecutar Winpmem y scripts de triage in situ en la escena del allanamiento, almacenando la imagen de la memoria RAM.",
      hallazgo: "Volcado de RAM de 16 GB y triage inicial alojados en unidad estéril USB-REG-001.",
      criticidad: "ALTA",
      imagen: "/assets/ram-dump.png",
      pos: { x: -2.1, y: 1.74, z: -1.7 },
    },
    google: {
      codigo: "EV-001 (Navegador)",
      titulo: "Monitor Izquierdo — Navegador Google Chrome",
      fase: "FASE II & VI",
      herramientas: ["Historial Web", "SQLite Browser", "Artifacts"],
      descripcion:
        "Pantalla principal que exhibía el navegador Chrome en modo oscuro. El análisis posterior recuperó sesiones de administración, accesos a paneles de control y chats de Telegram.",
      hallazgo: "Sesiones de administración y rastros de accesos web recuperados.",
      criticidad: "MEDIA",
      imagen: "/assets/dev-tools.jpg",
      pos: { x: -2.1, y: 2.4, z: -2.4 },
    },
  };

  const handleSelect = (key) => {
    const data = EVIDENCE_DATA[key];
    if (data) {
      setSelectedEvidence(data);
      if (onFocusEvidence && data.pos) {
        onFocusEvidence(data.pos);
      }
    }
  };

  const handleClose = () => {
    setSelectedEvidence(null);
    if (onResetCamera) onResetCamera();
  };

  return (
    <group position={[0, -0.75, 0]}>
      {/* ─── 1. PAREDES Y PISO DE LA HABITACIÓN ─── */}
      <mesh position={[0, 3.5, -4.0]} receiveShadow>
        <planeGeometry args={[20, 12]} />
        <meshStandardMaterial color="#d8d2c8" roughness={0.9} />
      </mesh>

      <mesh position={[7.5, 3.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#d0c9bd" roughness={0.9} />
      </mesh>

      <mesh position={[-7.5, 3.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#d0c9bd" roughness={0.9} />
      </mesh>

      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 14]} />
        <meshStandardMaterial map={woodTex} roughness={0.7} />
      </mesh>

      <ambientLight intensity={0.75} />
      <directionalLight
        position={[3, 9, 6]}
        intensity={1.3}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* ─── 2. CAMA SIMPLE PEGADA A LA PARED DERECHA Y AL FONDO ─── */}
      <group position={[6.4, 0.45, -2.1]}>
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[2.0, 0.35, 3.6]} />
          <meshStandardMaterial color="#3e2723" roughness={0.6} />
        </mesh>
        <mesh castShadow position={[0, 0.55, -1.75]}>
          <boxGeometry args={[2.0, 1.1, 0.12]} />
          <meshStandardMaterial color="#2d1a0e" roughness={0.5} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0.32, 0.05]}>
          <boxGeometry args={[1.85, 0.38, 3.3]} />
          <meshStandardMaterial color="#f5f5f7" roughness={0.9} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0.48, 0.45]}>
          <boxGeometry args={[1.87, 0.1, 2.4]} />
          <meshStandardMaterial color="#1a2b4c" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 0.52, -1.1]}>
          <boxGeometry args={[1.5, 0.14, 0.55]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      </group>

      {/* ─── 3. ESCRITORIO MÁS ALTO Y PEGADO A LA PARED DEL FONDO (z = -2.5) ─── */}
      <group position={[0, 0, -2.5]}>
        <mesh position={[0, 1.65, 0]} castShadow receiveShadow>
          <boxGeometry args={[7.4, 0.1, 2.9]} />
          <meshStandardMaterial map={woodTex} roughness={0.4} metalness={0.1} />
        </mesh>

        <mesh position={[0, 1.58, 1.44]} receiveShadow>
          <boxGeometry args={[7.42, 0.05, 0.04]} />
          <meshStandardMaterial color="#2d1a0e" roughness={0.5} />
        </mesh>

        <mesh position={[-3.4, 0.8, 0]} castShadow>
          <boxGeometry args={[0.14, 1.6, 2.7]} />
          <meshStandardMaterial color="#1e1008" roughness={0.6} />
        </mesh>
        <mesh position={[3.4, 0.8, 0]} castShadow>
          <boxGeometry args={[0.14, 1.6, 2.7]} />
          <meshStandardMaterial color="#1e1008" roughness={0.6} />
        </mesh>
      </group>

      {/* ─── 4. Monitor Izquierdo (LG — Google Dark Mode) ─── */}
      <group
        position={[-2.1, 1.7, -2.4]}
        onClick={(e) => {
          e.stopPropagation();
          handleSelect("google");
        }}
        onPointerOver={() => {
          setHoveredItem("google");
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHoveredItem(null);
          document.body.style.cursor = "auto";
        }}
      >
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.42, 0.03, 20]} />
          <meshStandardMaterial color="#111" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.4, -0.1]} rotation={[0.1, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.75, 0.08]} />
          <meshStandardMaterial color="#191919" roughness={0.4} metalness={0.6} />
        </mesh>

        <group position={[0, 0.82, -0.02]} rotation={[0, 0.08, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.05, 1.22, 0.07]} />
            <meshStandardMaterial
              color={hoveredItem === "google" ? "#1e88e5" : "#151515"}
              roughness={0.3}
              metalness={0.4}
            />
          </mesh>
          <mesh position={[0, 0, 0.036]}>
            <planeGeometry args={[1.96, 1.12]} />
            <meshBasicMaterial map={googleTex} />
          </mesh>
          <Text
            font={HANDWRITTEN_FONT}
            fontSize={0.05}
            color="#888888"
            position={[0, -0.57, 0.037]}
            anchorX="center"
          >
            LG
          </Text>
          <pointLight position={[0, 0, 0.4]} intensity={0.4} color="#8ab4f8" distance={3} />
        </group>
      </group>

      {/* ─── 5. Monitor Derecho (Samsung — Fútbol Libre TV en vivo) ─── */}
      <group
        position={[0.2, 1.7, -2.5]}
        onClick={(e) => {
          e.stopPropagation();
          handleSelect("streaming");
        }}
        onPointerOver={() => {
          setHoveredItem("streaming");
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHoveredItem(null);
          document.body.style.cursor = "auto";
        }}
      >
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.03, 24]} />
          <meshStandardMaterial color="#111" roughness={0.3} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.4, -0.08]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.76, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.5} />
        </mesh>

        <group position={[0, 0.82, 0]} rotation={[0, -0.04, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.08, 1.24, 0.07]} />
            <meshStandardMaterial
              color={hoveredItem === "streaming" ? "#00e5ff" : "#121212"}
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>
          <mesh position={[0, 0, 0.036]}>
            <planeGeometry args={[1.98, 1.14]} />
            <meshBasicMaterial map={futbolLibreTex} />
          </mesh>
          <Text
            font={HANDWRITTEN_FONT}
            fontSize={0.045}
            color="#aaaaaa"
            position={[0, -0.58, 0.037]}
            anchorX="center"
          >
            SAMSUNG
          </Text>
          <pointLight position={[0, 0, 0.5]} intensity={0.65} color="#00e5ff" distance={3.5} />
        </group>
      </group>

      {/* ─── 6. GABINETE PC TOWER EV-001 (PANEL FRONTAL CUBIERTO / TAPA SOLIDA) ─── */}
      <group
        position={[2.2, 1.7, -2.45]}
        onClick={(e) => {
          e.stopPropagation();
          handleSelect("gabinete");
        }}
        onPointerOver={() => {
          setHoveredItem("gabinete");
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHoveredItem(null);
          document.body.style.cursor = "auto";
        }}
      >
        {/* Chasis Principal (Pared derecha, tapa superior/inferior, parte trasera) */}
        <mesh position={[0.42, 0.85, 0]}>
          <boxGeometry args={[0.02, 1.62, 1.7]} />
          <meshStandardMaterial color="#0c0d10" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 1.65, 0]}>
          <boxGeometry args={[0.85, 0.02, 1.7]} />
          <meshStandardMaterial color="#0c0d10" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[0.85, 0.02, 1.7]} />
          <meshStandardMaterial color="#0c0d10" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.85, -0.84]}>
          <boxGeometry args={[0.85, 1.62, 0.02]} />
          <meshStandardMaterial color="#0c0d10" roughness={0.4} metalness={0.7} />
        </mesh>

        {/* TAPA / PANEL FRONTAL SÓLIDO (Cubre completamente la vista frontal del interior) */}
        <group position={[0, 0, 0.85]}>
          <mesh position={[0, 0.85, 0.02]} castShadow>
            <boxGeometry args={[0.81, 1.58, 0.04]} />
            <meshStandardMaterial color="#0f1117" roughness={0.6} metalness={0.8} />
          </mesh>
          <Text
            font={HANDWRITTEN_FONT}
            fontSize={0.06}
            color="#cccccc"
            position={[0, 1.52, 0.045]}
            anchorX="center"
          >
            Dynamax
          </Text>

          {/* Anillos LED frontales decorativos */}
          <group position={[0, 1.15, 0.042]}>
            <mesh>
              <torusGeometry args={[0.32, 0.02, 16, 32]} />
              <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={3.5} toneMapped={false} />
            </mesh>
          </group>
          <group position={[0, 0.52, 0.042]}>
            <mesh>
              <torusGeometry args={[0.32, 0.02, 16, 32]} />
              <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={3.5} toneMapped={false} />
            </mesh>
          </group>
        </group>

        {/* Ventana de cristal en el costado izquierdo (-X) */}
        <mesh position={[-0.425, 0.85, 0]}>
          <boxGeometry args={[0.015, 1.58, 1.66]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transparent
            opacity={0.12}
            roughness={0.05}
            transmission={0.98}
            ior={1.5}
          />
        </mesh>

        {/* Componentes internos visibles solo desde el vidrio lateral */}
        <group position={[-0.05, 0.85, 0]}>
          <mesh position={[0.3, 0, 0]}>
            <boxGeometry args={[0.02, 1.35, 1.45]} />
            <meshStandardMaterial color="#1a237e" roughness={0.5} />
          </mesh>
          <group position={[-0.05, -0.1, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.38, 0.14, 0.9]} />
              <meshStandardMaterial color="#212121" metalness={0.8} roughness={0.2} />
            </mesh>
            <Text
              font={HANDWRITTEN_FONT}
              fontSize={0.055}
              color="#76b900"
              position={[-0.2, 0, 0]}
              rotation={[0, -Math.PI / 2, 0]}
            >
              GEFORCE RTX
            </Text>
          </group>
          <group position={[0.12, 0.45, -0.65]}>
            <mesh ref={rearFanRef} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.22, 0.02, 12, 24]} />
              <meshStandardMaterial color="#80d8ff" emissive="#80d8ff" emissiveIntensity={3.5} toneMapped={false} />
            </mesh>
          </group>
        </group>

        <pointLight position={[-0.2, 0.9, 0]} intensity={2.5} color="#00e5ff" distance={3.0} />

        {/* Micrófono superior */}
        <group position={[0, 1.7, 0.2]}>
          <mesh castShadow>
            <boxGeometry args={[0.3, 0.08, 0.4]} />
            <meshStandardMaterial color="#424242" metalness={0.7} roughness={0.3} />
          </mesh>
          <Line
            points={[
              [0, 0.04, -0.1],
              [0, 0.35, -0.15],
              [0, 0.52, -0.05],
            ]}
            color="#111111"
            lineWidth={4}
          />
          <mesh position={[0, 0.54, -0.02]}>
            <cylinderGeometry args={[0.025, 0.02, 0.08, 12]} />
            <meshStandardMaterial color="#212121" roughness={0.8} />
          </mesh>
        </group>
      </group>

      {/* ─── 7. SWITCH GIGABIT TP-LINK TL-SG108E (EV-003) ─── */}
      <group
        position={[-2.9, 1.79, -2.2]}
        rotation={[0, 0.12, 0]}
        onClick={(e) => {
          e.stopPropagation();
          handleSelect("switch");
        }}
        onPointerOver={() => {
          setHoveredItem("switch");
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHoveredItem(null);
          document.body.style.cursor = "auto";
        }}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.84, 0.18, 0.56]} />
          <meshStandardMaterial
            color={hoveredItem === "switch" ? "#2c3e50" : "#1b1c20"}
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>

        <mesh position={[0, 0, 0.282]}>
          <planeGeometry args={[0.82, 0.16]} />
          <meshBasicMaterial map={tpLinkTex} />
        </mesh>

        {/* Cables del switch saliendo hacia el lateral y bajando directamente al TAP */}
        <Line
          points={[
            [-0.25, 0, 0.29],
            [-0.38, 0, 0.35],
            [-0.45, -0.4, 0.1],
            [-0.4, -1.7, -0.5],
          ]}
          color="#1e88e5"
          lineWidth={5}
        />
        <Line
          points={[
            [-0.17, 0, 0.29],
            [-0.32, 0, 0.35],
            [-0.42, -0.4, 0.1],
            [-0.38, -1.7, -0.5],
          ]}
          color="#151515"
          lineWidth={5}
        />
      </group>

      {/* ─── 8. EV-004: TAP DE RED PASIVO UBICADO EN EL PISO ATRÁS/ABAJO DEL ESCRITORIO ─── */}
      <group
        position={[-2.5, 0.04, -2.8]}
        rotation={[0, 0.3, 0]}
        onClick={(e) => {
          e.stopPropagation();
          handleSelect("tap");
        }}
        onPointerOver={() => {
          setHoveredItem("tap");
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHoveredItem(null);
          document.body.style.cursor = "auto";
        }}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.16, 0.045, 0.09]} />
          <meshStandardMaterial
            color={hoveredItem === "tap" ? "#00e5ff" : "#d5d8dc"}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
        <Text
          font={HANDWRITTEN_FONT}
          fontSize={0.04}
          color="#111111"
          position={[0, 0.024, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          anchorX="center"
          anchorY="middle"
        >
          TAP
        </Text>

        {/* Cable 1: Viene bajando desde el Switch TP-Link hasta el TAP */}
        <Line
          points={[
            [-0.4, 1.75, 0.6],
            [-0.2, 0.8, 0.3],
            [-0.08, 0.01, 0],
          ]}
          color="#1e88e5"
          lineWidth={5}
        />

        {/* Cable 2: Sale del TAP y se mete bajo la pared del fondo sin verse donde termina */}
        <Line
          points={[
            [0.08, 0.01, 0],
            [0.4, 0.01, -0.6],
            [0.9, 0.01, -1.5],
          ]}
          color="#1e88e5"
          lineWidth={5}
        />
      </group>

      {/* ─── 9. USB-REG-001: PENDRIVE DESPLAZADO MÁS A LA IZQUIERDA (x = -2.1) ─── */}
      <group
        position={[-2.1, 1.71, -1.7]}
        rotation={[0, 0.4, 0]}
        onClick={(e) => {
          e.stopPropagation();
          handleSelect("usb");
        }}
        onPointerOver={() => {
          setHoveredItem("usb");
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHoveredItem(null);
          document.body.style.cursor = "auto";
        }}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.04, 0.11]} />
          <meshStandardMaterial
            color={hoveredItem === "usb" ? "#00e5ff" : "#78909c"}
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[-0.16, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.055, 0.015, 16, 32]} />
          <meshStandardMaterial color="#607d8b" metalness={0.9} roughness={0.2} />
        </mesh>
        <Text
          font={HANDWRITTEN_FONT}
          fontSize={0.038}
          color="#ffffff"
          position={[0.02, 0.022, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          anchorX="center"
          anchorY="middle"
        >
          USB 3.0
        </Text>
      </group>

      {/* ─── 10. TECLADO MECÁNICO 3D ─── */}
      <MechanicalKeyboard3D
        onClick={() => handleSelect("gabinete")}
        hovered={hoveredItem === "keyboard"}
        setHovered={(h) => setHoveredItem(h ? "keyboard" : null)}
      />

      {/* Mousepad y Mouse */}
      <mesh position={[1.05, 1.702, -1.7]} receiveShadow>
        <boxGeometry args={[0.65, 0.005, 0.55]} />
        <meshStandardMaterial color="#111318" roughness={0.95} />
      </mesh>
      <group position={[1.05, 1.725, -1.73]} rotation={[0, -0.1, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.07, 0.28]} />
          <meshStandardMaterial color="#181a20" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.038, 0.06]}>
          <circleGeometry args={[0.025, 12]} />
          <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
      </group>

      {/* ─── 11. POPUP MODAL INTERACTIVO DE DETALLES DE EVIDENCIA ─── */}
      {selectedEvidence && (
        <Html position={[0, 2.8, -1.5]} center zIndexRange={[100, 0]}>
          <div
            style={{
              background: "rgba(12, 16, 28, 0.95)",
              border: `2px solid ${
                selectedEvidence.criticidad === "CRÍTICA" ? "#ff3d71" : "#00e5ff"
              }`,
              boxShadow: "0 0 35px rgba(0, 229, 255, 0.4)",
              backdropFilter: "blur(16px)",
              borderRadius: "16px",
              padding: "22px 28px",
              color: "#ffffff",
              width: "480px",
              maxWidth: "90vw",
              fontFamily: "Segoe UI, sans-serif",
              pointerEvents: "auto",
              position: "relative",
            }}
          >
            <button
              onClick={handleClose}
              style={{
                position: "absolute",
                top: "14px",
                right: "18px",
                background: "transparent",
                border: "none",
                color: "#99aabb",
                fontSize: "1.3rem",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ✕
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  background: "#00e5ff",
                  color: "#0a0d1a",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                }}
              >
                {selectedEvidence.codigo}
              </span>
              <span
                style={{
                  background: "rgba(255, 61, 113, 0.2)",
                  color: "#ff3d71",
                  border: "1px solid #ff3d71",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 800,
                }}
              >
                {selectedEvidence.criticidad}
              </span>
              <span style={{ fontSize: "12px", color: "#8899aa" }}>
                {selectedEvidence.fase}
              </span>
            </div>

            <h3
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                margin: "0 0 10px",
                color: "#ffffff",
                lineHeight: "1.3",
              }}
            >
              {selectedEvidence.titulo}
            </h3>

            <p
              style={{
                fontSize: "0.88rem",
                color: "#c5d2ec",
                lineHeight: "1.5",
                marginBottom: "14px",
              }}
            >
              {selectedEvidence.descripcion}
            </p>

            <div
              style={{
                background: "rgba(0, 229, 255, 0.08)",
                borderLeft: "4px solid #00e5ff",
                padding: "10px 14px",
                borderRadius: "4px",
                fontSize: "0.84rem",
                marginBottom: "14px",
                color: "#e2f8ff",
              }}
            >
              <strong>Hallazgo In Situ:</strong> {selectedEvidence.hallazgo}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {selectedEvidence.herramientas.map((h) => (
                <span
                  key={h}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "4px",
                    padding: "3px 8px",
                    fontSize: "11px",
                    color: "#a0b5d0",
                  }}
                >
                  🛠️ {h}
                </span>
              ))}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
