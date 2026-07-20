# Líneas de Tiempo 3D — Auditoría y Peritaje de Sistemas

Dos líneas de tiempo interactivas en 3D (React + Three.js + @react-three/fiber + @react-three/drei):

1. **Peritaje Informático — Caso Fútbol Libre** (14 hitos forenses, ISO/IEC 27037 y 27042)
2. **Auditoría de Sistemas — Caso Despegar** (9 hitos, caja negra, ISO 27002:2022, controles 8.5 y 8.23)

## Instalación y ejecución

```bash
cd linea-tiempo-3d
npm install
npm run dev
```

Abrir http://localhost:5173

## Estructura

```
src/
├── data/data.json              # Toda la información cronológica centralizada
├── hooks/useTimelineData.js    # Hook: datos + curva CatmullRom + posiciones de nodos
├── components/
│   ├── TimelineScene.jsx       # Canvas, curva, luces, CameraControls, navegación
│   ├── TimelineNode.jsx        # Nodo interactivo (hover, click, etiqueta)
│   └── InfoCard.jsx            # Tarjeta glassmorphism con <Html> de drei
├── App.jsx                     # Selector de línea de tiempo + layout
├── styles.css                  # Estilos glassmorphism / dashboard técnico
└── main.jsx
```

## Controles

| Acción | Efecto |
|---|---|
| Arrastrar | Orbitar la cámara |
| Rueda del mouse | Zoom |
| Click en un hito | La cámara vuela al nodo y despliega la tarjeta de detalle |
| ← / → | Recorrer hitos en orden cronológico |
| Esc o ✕ | Cerrar tarjeta y volver a la vista general |

## Íconos 3D (3dicons.co)

Cada hito muestra un ícono 3D de [3dicons.co](https://3dicons.co) (licencia CC0) flotando sobre su esfera, definido en el campo `icono` de `data.json`. Se cargan automáticamente desde el CDN oficial de 3dicons; no requiere ningún paso extra.

**Estilo configurable** en `ICONOS_3D` (inicio de `TimelineNode.jsx`):

| Opción | Valores | Efecto |
|---|---|---|
| `variant` | `color` \| `gradient` \| `clay` \| `premium` | Estilo de render de 3dicons |
| `angle` | `dynamic` \| `front` \| `iso` | Ángulo de cámara del ícono |
| `tint` | `true` \| `false` | Tiñe el ícono con el color de la línea de tiempo |

Configuración actual: `clay + tint` — los íconos en arcilla blanca se tiñen de cian (peritaje) o violeta (auditoría), integrándose con la paleta glassmorphism de la app y reaccionando al hover. Para el look original multicolor de 3dicons: `variant: "color", tint: false`.

Para tener los PNG localmente (recomendado para presentar sin depender de Internet), con los mismos valores que la config:

```bash
npm run icons                    # dynamic + clay (default)
npm run icons -- dynamic color   # si usás variant "color"
```

Los archivos van a `public/assets/icons3d/`; la app siempre prefiere el archivo local y usa el CDN como respaldo.

## Imágenes

Las tarjetas referencian imágenes en `public/assets/` (ej.: `ram-dump.jpg`, `dev-tools.jpg`, `regripper-usbstor.jpg`). Si una imagen no existe, la tarjeta muestra un placeholder automáticamente — para la presentación final basta copiar las capturas del informe (H-01 a H-05, etc.) a `public/assets/` con esos nombres. La lista completa de rutas está en `src/data/data.json` (campo `imagen`).

## Integración en un proyecto React existente

Copiar `src/data`, `src/hooks`, `src/components` y `src/styles.css`, instalar dependencias (`three`, `@react-three/fiber`, `@react-three/drei`) y renderizar:

```jsx
import TimelineScene from "./components/TimelineScene.jsx";

<TimelineScene timelineId="peritaje" />   // o "auditoria"
```

## Decisiones de arquitectura

- **Separación de responsabilidades:** los datos viven solo en `data.json`; `useTimelineData` los expone ya procesados (posiciones 3D pre-computadas con `useMemo`), evitando prop drilling y recálculos por frame.
- **Curva:** `THREE.CatmullRomCurve3` serpenteante con elevación progresiva — el avance en X + subida en Y comunica visualmente el progreso temporal.
- **Cámara:** `CameraControls` de drei con `setLookAt(..., true)` para vuelos animados al hacer click en un hito.
- **Overlay:** `<Html distanceFactor>` de drei ancla las tarjetas al espacio 3D manteniendo el DOM accesible (scroll interno, botones, imágenes).
