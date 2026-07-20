import { Component, Suspense, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Billboard, Image as DreiImage } from "@react-three/drei";
import InfoCard from "./InfoCard.jsx";

// CDN oficial de 3dicons.co (mismo origen que usa su plugin de Figma, CC0)
const ICONS_CDN =
  "https://3dicons.sgp1.cdn.digitaloceanspaces.com/v1/dynamic/color";

/**
 * IconBoundary
 * ------------
 * Si el PNG local del ícono no existe, renderiza el fallback (CDN).
 * Si también falla, no se muestra el ícono — sin derribar el Canvas.
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
 * Ícono 3D de 3dicons.co renderizado como billboard (siempre mira a la
 * cámara) flotando sobre la esfera del hito, con animación de levitación.
 * Los PNG (estilo "dynamic/color", CC0) viven en /assets/icons3d/.
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
 * TimelineNode
 * ------------
 * Nodo interactivo sobre la curva. Esfera con anillo orbital, ícono 3D
 * flotante representativo de la fase, glow al hover, etiqueta flotante
 * y despliegue de la InfoCard al estar activo.
 */
export default function TimelineNode({
  evento,
  color,
  accent,
  isActive,
  onSelect,
  onClose,
}) {
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
        Math.min(1, delta * 8),
      );
    }
  });

  const nodeColor = isActive || hovered ? accent : color;

  return (
    <group position={evento.position}>
      {/* Esfera principal */}
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

      {/* Anillo orbital decorativo */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.55, 0.02, 16, 64]} />
        <meshBasicMaterial
          color={nodeColor}
          transparent
          opacity={hovered || isActive ? 0.9 : 0.35}
        />
      </mesh>

      {/* Ícono 3D de la fase (3dicons.co) flotando sobre la esfera.
          Intenta primero el PNG local (npm run icons); si no existe,
          cae automáticamente al CDN oficial de 3dicons. */}
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

      {/* Etiqueta breve siempre visible */}
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

      {/* Tarjeta de detalle */}
      {isActive && (
        <InfoCard evento={evento} color={accent} onClose={onClose} />
      )}
    </group>
  );
}
