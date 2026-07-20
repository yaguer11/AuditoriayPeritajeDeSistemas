import { Component, Suspense, useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Billboard, Image as DreiImage, Text } from "@react-three/drei";
import InfoCard from "./InfoCard.jsx";
import * as THREE from "three";

// CDN oficial de 3dicons.co (mismo origen que usa su plugin de Figma, CC0)
const ICONS_CDN =
  "https://3dicons.sgp1.cdn.digitaloceanspaces.com/v1/dynamic/color";

// Fuentes manuscritas locales cargadas en WebGL para evitar problemas de CORS/Worker
const HANDWRITTEN_FONT = "/ArchitectsDaughter.ttf";
const STAMP_FONT = "/ArchitectsDaughter.ttf";

/**
 * IconBoundary
 * ------------
 * Si el PNG local del ícono no existe, renderiza el fallback (CDN).
 */
class IconBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed
      ? (this.props.fallback ?? null)
      : this.props.children;
  }
}

/**
 * FloatingIcon
 * ------------
 * Ícono 3D flotando sobre la esfera de la línea de tiempo clásica.
 */
function FloatingIcon({ url, seed = 0, hovered }) {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = 1.15 + Math.sin(t * 1.6 + seed) * 0.09;
    const s = hovered ? 1.25 : 1;
    groupRef.current.scale.lerp({ x: s, y: s, z: s }, 0.12);
  });

  return (
    <group ref={groupRef} position={[0, 1.15, 0]}>
      <Billboard>
        <DreiImage
          url={url}
          transparent
          scale={[1.15, 1.15]}
          toneMapped={false}
        />
      </Billboard>
    </group>
  );
}

/**
 * PushPin
 * -------
 * Chincheta 3D realista para fijar las tarjetas del tablero.
 */
export function PushPin({ color = "#d32f2f", position = [0, 0, 0] }) {
  return (
    <group position={position} rotation={[0.08, -0.04, 0]}>
      <mesh position={[0, 0, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 8]} />
        <meshStandardMaterial color="#cfd8dc" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.08, 0.12, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0, 0.18]}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.15} />
      </mesh>
    </group>
  );
}

/**
 * ClassicTimelineNode
 * -------------------
 * Renderiza el nodo en 3D original: esfera brillante, anillo orbital,
 * ícono flotante y etiqueta HTML flotante.
 */
function ClassicTimelineNode({ evento, color, accent, isActive, onSelect, onClose }) {
  const meshRef = useRef();
  const ringRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.8;
      ringRef.current.rotation.x += delta * 0.3;
    }
    if (meshRef.current) {
      const target = isActive ? 1.5 : hovered ? 1.25 : 1;
      meshRef.current.scale.lerp(
        { x: target, y: target, z: target },
        Math.min(1, delta * 8)
      );
    }
  });

  const nodeColor = isActive || hovered ? accent : color;

  return (
    <group position={evento.position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(evento);
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
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial
          color={nodeColor}
          emissive={nodeColor}
          emissiveIntensity={isActive ? 2.2 : hovered ? 1.4 : 0.6}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={ringRef}>
        <torusGeometry args={[0.55, 0.02, 16, 64]} />
        <meshBasicMaterial
          color={nodeColor}
          transparent
          opacity={hovered || isActive ? 0.9 : 0.35}
        />
      </mesh>

      {!isActive && evento.icono && (
        <IconBoundary
          fallback={
            <IconBoundary>
              <Suspense fallback={null}>
                <FloatingIcon
                  url={`${ICONS_CDN}/${evento.icono}-dynamic-color.png`}
                  seed={evento.index * 1.7}
                  hovered={hovered}
                />
              </Suspense>
            </IconBoundary>
          }
        >
          <Suspense fallback={null}>
            <FloatingIcon
              url={`/assets/icons3d/${evento.icono}.png`}
              seed={evento.index * 1.7}
              hovered={hovered}
            />
          </Suspense>
        </IconBoundary>
      )}

      {!isActive && (
        <Html
          position={[0, -0.85, 0]}
          center
          distanceFactor={12}
          zIndexRange={[50, 0]}
        >
          <div className="node-label" style={{ "--label-accent": color }}>
            <span className="node-label__fase">{evento.fase}</span>
            <span className="node-label__fecha">{evento.fecha}</span>
          </div>
        </Html>
      )}

      {isActive && (
        <InfoCard evento={evento} color={accent} onClose={onClose} position={[0, 1.4, 0]} />
      )}
    </group>
  );
}

/**
 * BoardTimelineNode
 * -----------------
 * Renderiza la tarjeta física (Polaroid, Nota o Documento) en el tablero de investigación.
 */
function BoardTimelineNode({ evento, color, accent, isActive, onSelect, onClose }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [iconLoaded, setIconLoaded] = useState(false);
  const [verifiedIconUrl, setVerifiedIconUrl] = useState("");

  useEffect(() => {
    if (!evento.imagen) {
      setImgLoaded(false);
    } else {
      const img = new window.Image();
      img.src = evento.imagen;
      img.onload = () => setImgLoaded(true);
      img.onerror = () => setImgLoaded(false);
    }

    const cdnUrl = `https://3dicons.sgp1.cdn.digitaloceanspaces.com/v1/dynamic/color/${evento.icono}-dynamic-color.png`;
    const localUrl = `/assets/icons3d/${evento.icono}.png`;

    const iconImg = new window.Image();
    iconImg.src = cdnUrl;
    iconImg.onload = () => {
      setVerifiedIconUrl(cdnUrl);
      setIconLoaded(true);
    };
    iconImg.onerror = () => {
      const localIconImg = new window.Image();
      localIconImg.src = localUrl;
      localIconImg.onload = () => {
        setVerifiedIconUrl(localUrl);
        setIconLoaded(true);
      };
      localIconImg.onerror = () => {
        setIconLoaded(false);
      };
    };
  }, [evento.imagen, evento.icono]);

  // El tipo de tarjeta ya viene calculado por computeBoardLayout
  // (InvestigationBoard.jsx) — única fuente de verdad, sin duplicar lógica.
  const cardType = evento.cardType ?? "polaroid";

  useFrame((state, delta) => {
    if (groupRef.current) {
      const s = hovered || isActive ? 1.05 : 1.0;
      groupRef.current.scale.lerp(
        new THREE.Vector3(s, s, s),
        Math.min(1, delta * 12)
      );
    }
  });

  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = "auto";
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(evento);
  };

  const totalCols = evento.columns || 4;
  const infoCardOffset = evento.col < totalCols / 2 ? 1.95 : -1.95;

  const renderCardContent = () => {
    const nodeColor = isActive || hovered ? accent : color;

    if (cardType === "note") {
      const cardWidth = 1.15;
      const cardHeight = 1.15;
      const pinY = 0.52;

      return (
        <group>
          <mesh
            castShadow
            receiveShadow
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={handleClick}
          >
            <boxGeometry args={[cardWidth, cardHeight, 0.015]} />
            <meshStandardMaterial color="#fffde6" roughness={0.85} />
          </mesh>

          {[-0.12, -0.28, -0.44].map((yVal, idx) => (
            <mesh key={idx} position={[0, yVal, 0.009]}>
              <planeGeometry args={[1.0, 0.005]} />
              <meshBasicMaterial color="#dbd6a7" transparent opacity={0.7} />
            </mesh>
          ))}

          <Text
            font={HANDWRITTEN_FONT}
            fontSize={0.045}
            color={nodeColor}
            position={[0, 0.44, 0.009]}
            anchorX="center"
            anchorY="top"
          >
            {evento.fase}
          </Text>

          <Text
            font={HANDWRITTEN_FONT}
            fontSize={0.062}
            color="#2d260f"
            position={[0, 0.22, 0.009]}
            maxWidth={1.0}
            lineHeight={1.2}
            anchorX="center"
            anchorY="top"
            textAlign="center"
          >
            {evento.titulo}
          </Text>

          <Text
            font={HANDWRITTEN_FONT}
            fontSize={0.045}
            color="#685f40"
            position={[0.48, -0.46, 0.009]}
            anchorX="right"
            anchorY="bottom"
          >
            {evento.fecha}
          </Text>

          <PushPin color="#1976d2" position={[0, pinY, 0.012]} />
        </group>
      );
    } else if (cardType === "document") {
      const cardWidth = 1.15;
      const cardHeight = 1.8;
      const pinY = 0.82;

      return (
        <group>
          <mesh
            castShadow
            receiveShadow
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={handleClick}
          >
            <boxGeometry args={[cardWidth, cardHeight, 0.015]} />
            <meshStandardMaterial color="#fcfcfc" roughness={0.75} />
          </mesh>

          <mesh position={[-0.46, 0, 0.008]}>
            <planeGeometry args={[0.005, 1.68]} />
            <meshBasicMaterial color="#ef9a9a" />
          </mesh>

          <Text
            font={HANDWRITTEN_FONT}
            fontSize={0.045}
            color="#888"
            position={[0, 0.78, 0.009]}
            anchorX="center"
            anchorY="top"
          >
            {evento.fase} · INFORME
          </Text>

          <group position={[0, 0.35, 0.009]}>
            {imgLoaded ? (
              <Suspense fallback={null}>
                <DreiImage
                  url={evento.imagen}
                  scale={[0.98, 0.65]}
                  position={[0, 0, 0]}
                />
              </Suspense>
            ) : (
              <group>
                <mesh>
                  <planeGeometry args={[0.98, 0.65]} />
                  <meshStandardMaterial color="#0c1b2f" roughness={0.5} />
                </mesh>
                {iconLoaded ? (
                  <Suspense fallback={null}>
                    <DreiImage
                      url={verifiedIconUrl}
                      transparent
                      scale={[0.42, 0.42]}
                      position={[0, 0, 0.002]}
                    />
                  </Suspense>
                ) : (
                  <Text font={HANDWRITTEN_FONT} fontSize={0.18} color="#fff" position={[0, 0, 0.002]}>
                    📋
                  </Text>
                )}
                <Text
                  font={STAMP_FONT}
                  fontSize={0.08}
                  color="#ff3d71"
                  rotation={[0, 0, 0.18]}
                  position={[0.16, -0.15, 0.005]}
                >
                  INFO
                </Text>
              </group>
            )}
          </group>

          <Text
            font={HANDWRITTEN_FONT}
            fontSize={0.058}
            color="#1b1e22"
            position={[0, -0.06, 0.009]}
            maxWidth={0.92}
            lineHeight={1.15}
            anchorX="center"
            anchorY="top"
          >
            {evento.titulo}
          </Text>

          <Text
            font={HANDWRITTEN_FONT}
            fontSize={0.04}
            color="#555"
            position={[0, -0.32, 0.009]}
            maxWidth={0.92}
            lineHeight={1.2}
            anchorX="center"
            anchorY="top"
          >
            {evento.descripcion.substring(0, 92) + "..."}
          </Text>

          <PushPin color={accent} position={[0, pinY, 0.012]} />
        </group>
      );
    } else {
      const cardWidth = 1.2;
      const cardHeight = 1.45;
      const pinY = 0.65;

      return (
        <group>
          <mesh
            castShadow
            receiveShadow
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={handleClick}
          >
            <boxGeometry args={[cardWidth, cardHeight, 0.015]} />
            <meshStandardMaterial color="#faf9f4" roughness={0.8} />
          </mesh>

          <group position={[0, 0.16, 0.009]}>
            {imgLoaded ? (
              <Suspense fallback={null}>
                <DreiImage
                  url={evento.imagen}
                  scale={[1.05, 0.94]}
                  position={[0, 0, 0]}
                />
              </Suspense>
            ) : (
              <group>
                <mesh>
                  <planeGeometry args={[1.05, 0.94]} />
                  <meshStandardMaterial color="#0e1f38" roughness={0.6} />
                </mesh>
                {iconLoaded ? (
                  <Suspense fallback={null}>
                    <DreiImage
                      url={verifiedIconUrl}
                      transparent
                      scale={[0.55, 0.55]}
                      position={[0, 0, 0.002]}
                    />
                  </Suspense>
                ) : (
                  <Text font={HANDWRITTEN_FONT} fontSize={0.22} color="#fff" position={[0, 0, 0.002]}>
                    📁
                  </Text>
                )}
                <Text
                  font={STAMP_FONT}
                  fontSize={0.09}
                  color="#ff3d71"
                  rotation={[0, 0, 0.22]}
                  position={[0.18, -0.2, 0.005]}
                >
                  PRUEBA
                </Text>
              </group>
            )}
          </group>

          <Text
            font={HANDWRITTEN_FONT}
            fontSize={0.058}
            color="#222"
            position={[0, -0.38, 0.009]}
            maxWidth={1.05}
            lineHeight={1.15}
            anchorX="center"
            anchorY="top"
            textAlign="center"
          >
            {evento.titulo}
          </Text>

          <Text
            font={HANDWRITTEN_FONT}
            fontSize={0.042}
            color="#5a606a"
            position={[0.48, -0.6, 0.009]}
            anchorX="right"
            anchorY="bottom"
          >
            {evento.fecha}
          </Text>

          <PushPin color="#d32f2f" position={[0, pinY, 0.012]} />
        </group>
      );
    }
  };

  return (
    <group position={[evento.boardPosition.x, evento.boardPosition.y, evento.boardPosition.z]}>
      <group ref={groupRef} rotation={[0, 0, evento.boardRotationZ]}>
        {renderCardContent()}
      </group>

      {isActive && (
        <InfoCard
          evento={evento}
          color={accent}
          onClose={onClose}
          position={[infoCardOffset, 0, 0.65]}
        />
      )}
    </group>
  );
}

/**
 * TimelineNode
 * ------------
 * Nodo principal que decide si se muestra en modo Tablero de Investigación o en modo Línea 3D clásica.
 */
export default function TimelineNode({
  evento,
  color,
  accent,
  isActive,
  onSelect,
  onClose,
  isBoardView,
}) {
  if (isBoardView) {
    return (
      <BoardTimelineNode
        evento={evento}
        color={color}
        accent={accent}
        isActive={isActive}
        onSelect={onSelect}
        onClose={onClose}
      />
    );
  }
  return (
    <ClassicTimelineNode
      evento={evento}
      color={color}
      accent={accent}
      isActive={isActive}
      onSelect={onSelect}
      onClose={onClose}
    />
  );
}
