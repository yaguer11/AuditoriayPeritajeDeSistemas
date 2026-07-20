/**
 * Descarga los íconos 3D de 3dicons.co (CC0) usados por las líneas de tiempo
 * al directorio public/assets/icons3d/, para que la app funcione sin Internet.
 *
 * Uso:
 *   npm run icons                      → estilo por defecto (dynamic + clay)
 *   npm run icons -- dynamic color     → ángulo y variante explícitos
 *   npm run icons -- iso gradient
 *
 * Ángulos: dynamic | front | iso
 * Variantes: color | gradient | clay | premium
 *
 * Debe coincidir con ICONOS_3D en src/components/TimelineNode.jsx.
 * Requiere Node 18+ (fetch nativo). Sin dependencias.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ANGLE = process.argv[2] || "dynamic";
const VARIANT = process.argv[3] || "clay";

const CDN = `https://3dicons.sgp1.cdn.digitaloceanspaces.com/v1/${ANGLE}/${VARIANT}`;

// Nombres según el campo "icono" de src/data/data.json
const ICONOS = [
  "map-pin", "flash", "wifi", "lock", "tool", "copy", "tick", "lab",
  "folder", "key", "trash-can", "wallet", "file-text", "locker",
  "flag", "notebook", "calender", "sheild", "chart",
];

const destino = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..", "public", "assets", "icons3d"
);

await mkdir(destino, { recursive: true });

let ok = 0;
for (const nombre of ICONOS) {
  const archivo = `${nombre}-${ANGLE}-${VARIANT}.png`;
  try {
    const res = await fetch(`${CDN}/${archivo}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(path.join(destino, archivo), Buffer.from(await res.arrayBuffer()));
    ok++;
    console.log(`✔ ${archivo}`);
  } catch (err) {
    console.error(`✘ ${archivo}: ${err.message}`);
  }
}

console.log(`\n${ok}/${ICONOS.length} íconos (${ANGLE}/${VARIANT}) en public/assets/icons3d/`);
