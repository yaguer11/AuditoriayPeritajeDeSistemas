import { useEffect, useMemo, useRef, useState } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { REPORT_SECTIONS } from "../data/reportData.js";

const HANDWRITTEN_FONT = "/ArchitectsDaughter.ttf";

/* ─── Dimensiones de la pantalla ─── */
const CW = 1280;
const CH = 720;
const SCREEN_W = 4.7;
const SCREEN_H = SCREEN_W * (CH / CW); // 16:9

/* Grilla de íconos (home) */
const PER_ROW = [5, 5, 3]; // 13 secciones
const AREA_X = 90;
const AREA_Y = 176;
const AREA_W = 1100;
const AREA_H = 470;
const TILE_W = 150;
const TILE_H = 150;

/* Área de contenido de una sección */
const SEC_X = 66;
const SEC_W = 1148;
const SEC_TOP = 148;
const SEC_BOTTOM = 668;
const SEC_H = SEC_BOTTOM - SEC_TOP;

/* ─── Helpers ─── */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function measureWrap(ctx, text, maxW, font) {
  ctx.font = font;
  return wrapText(ctx, text, maxW);
}

function rectToLocal(cx, cy, w, h) {
  return {
    x: (cx / CW - 0.5) * SCREEN_W,
    y: (0.5 - cy / CH) * SCREEN_H,
    w: (w / CW) * SCREEN_W,
    h: (h / CH) * SCREEN_H,
  };
}

function computeIconLayout() {
  const layout = [];
  const rowH = AREA_H / PER_ROW.length;
  const spacing = AREA_W / 5;
  let idx = 0;
  PER_ROW.forEach((count, r) => {
    const cy = AREA_Y + rowH * r + rowH / 2;
    const startX = AREA_X + (AREA_W - count * spacing) / 2 + spacing / 2;
    for (let c = 0; c < count; c++) {
      const cx = startX + c * spacing;
      if (idx < REPORT_SECTIONS.length) {
        layout.push({ ...REPORT_SECTIONS[idx], cx, cy });
      }
      idx++;
    }
  });
  return layout;
}

/* Botones de la vista sección (coords en canvas) */
const BACK_BTN = { cx: 116, cy: 66, w: 156, h: 50 };
const UP_BTN = { cx: 1246, cy: SEC_TOP + 26, w: 42, h: 42 };
const DOWN_BTN = { cx: 1246, cy: SEC_BOTTOM - 26, w: 42, h: 42 };

/* Fondo común */
function paintBackground(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, CH);
  grad.addColorStop(0, "#0c1524");
  grad.addColorStop(0.55, "#0a1019");
  grad.addColorStop(1, "#070b12");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);
  const glow = ctx.createRadialGradient(CW / 2, 40, 40, CW / 2, 40, 720);
  glow.addColorStop(0, "rgba(0, 229, 255, 0.09)");
  glow.addColorStop(1, "rgba(0, 229, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CW, CH);
}

/* ─── Home: grilla de íconos ─── */
function drawGrid(ctx, layout) {
  paintBackground(ctx);

  // Skyline sutil
  ctx.fillStyle = "rgba(124, 77, 255, 0.08)";
  for (let i = 0; i < 26; i++) {
    const bw = 26 + ((i * 37) % 34);
    const bh = 60 + ((i * 53) % 150);
    ctx.fillRect(i * 50, CH - bh, bw, bh);
  }

  // Barra superior
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(0, 0, CW, 116);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffb300";
  ctx.font = "bold 40px Segoe UI, Arial, sans-serif";
  ctx.fillText("📄  Informe Final de Auditoría de Sistemas", 44, 56);
  ctx.fillStyle = "#c9d4e8";
  ctx.font = "24px Segoe UI, Arial, sans-serif";
  ctx.fillText(
    "Despegar S.A.  ·  ISO/IEC 27002:2022  ·  Controles 8.5 y 8.23",
    46,
    94,
  );
  ctx.textAlign = "right";
  ctx.fillStyle = "#8ea3c4";
  ctx.font = "22px Segoe UI, Arial, sans-serif";
  ctx.fillText("v2.0 · 07 May 2026", CW - 44, 62);
  ctx.fillText("09:00", CW - 44, 94);

  // Íconos
  layout.forEach((it) => {
    const x = it.cx - TILE_W / 2;
    const y = it.cy - TILE_H / 2;
    ctx.fillStyle = "rgba(20, 28, 45, 0.92)";
    ctx.strokeStyle = "rgba(0, 229, 255, 0.35)";
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, TILE_W, TILE_H, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffb300";
    ctx.beginPath();
    ctx.arc(x + 26, y + 26, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#20160a";
    ctx.font = "bold 20px Segoe UI, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(it.num), x + 26, y + 27);

    ctx.textBaseline = "alphabetic";
    ctx.font = "58px Segoe UI Emoji, Apple Color Emoji, Arial, sans-serif";
    ctx.fillText(it.icono, it.cx, it.cy + 8);

    ctx.fillStyle = "#dfe8f7";
    ctx.font = "bold 16px Segoe UI, Arial, sans-serif";
    const lines = wrapText(ctx, it.titulo, TILE_W - 16).slice(0, 2);
    lines.forEach((ln, li) => ctx.fillText(ln, it.cx, it.cy + 44 + li * 18));
  });

  ctx.fillStyle = "#7c8db0";
  ctx.font = "22px Segoe UI, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "Toca un ícono para abrir la sección del informe",
    CW / 2,
    CH - 22,
  );
}

/* ─── Layout del contenido de una sección → lista de comandos ─── */
const F = {
  h: "bold 27px Segoe UI, Arial, sans-serif",
  p: "22px Segoe UI, Arial, sans-serif",
  li: "22px Segoe UI, Arial, sans-serif",
  callout: "21px Segoe UI, Arial, sans-serif",
  th: "bold 19px Segoe UI, Arial, sans-serif",
  td: "19px Segoe UI, Arial, sans-serif",
};

function layoutSection(ctx, section) {
  const cmds = [];
  const x = SEC_X + 8;
  const w = SEC_W - 16;
  let y = 0;

  const push = (c) => cmds.push(c);

  section.bloques.forEach((b) => {
    if (b.h) {
      y += 10;
      push({ k: "text", x, y, s: b.h, f: F.h, c: "#ffb300" });
      y += 34;
    } else if (b.p) {
      const lines = measureWrap(ctx, b.p, w, F.p);
      lines.forEach((ln) => {
        push({ k: "text", x, y, s: ln, f: F.p, c: "#d7dff0" });
        y += 30;
      });
      y += 10;
    } else if (b.list) {
      b.list.forEach((item) => {
        const lines = measureWrap(ctx, item, w - 26, F.li);
        push({ k: "text", x, y, s: "•", f: F.li, c: "#ffb300" });
        lines.forEach((ln, i) => {
          push({ k: "text", x: x + 24, y, s: ln, f: F.li, c: "#cdd6ea" });
          y += 30;
        });
        y += 4;
      });
      y += 8;
    } else if (b.callout) {
      const tones = {
        ok: ["rgba(0,200,120,0.14)", "#00c878", "#c8ffe6"],
        warn: ["rgba(255,179,0,0.14)", "#ffb300", "#fff0cc"],
        crit: ["rgba(255,61,113,0.14)", "#ff3d71", "#ffd6e0"],
      };
      const [bg, br, fg] = tones[b.tone] || tones.warn;
      const lines = measureWrap(ctx, b.callout, w - 32, F.callout);
      const boxH = lines.length * 29 + 24;
      push({ k: "rect", x, y, w, h: boxH, fill: bg, r: 8 });
      push({ k: "rect", x, y, w: 5, h: boxH, fill: br });
      let ty = y + 14;
      lines.forEach((ln) => {
        push({ k: "text", x: x + 18, y: ty, s: ln, f: F.callout, c: fg });
        ty += 29;
      });
      y += boxH + 12;
    } else if (b.table) {
      const cols = b.table.headers.length;
      const colW = w / cols;
      const pad = 9;
      const lineH = 25;
      const startY = y;

      // Encabezado
      const headLines = b.table.headers.map((h) =>
        measureWrap(ctx, h, colW - 2 * pad, F.th),
      );
      const headRows = Math.max(...headLines.map((l) => l.length));
      const headH = headRows * lineH + 16;
      push({ k: "rect", x, y, w, h: headH, fill: "rgba(124,77,255,0.28)" });
      b.table.headers.forEach((_, ci) => {
        headLines[ci].forEach((ln, li) => {
          push({
            k: "text",
            x: x + ci * colW + pad,
            y: y + 8 + li * lineH,
            s: ln,
            f: F.th,
            c: "#eae2ff",
          });
        });
      });
      y += headH;

      // Filas
      b.table.rows.forEach((row, ri) => {
        const cellLines = row.map((cell) =>
          measureWrap(ctx, String(cell), colW - 2 * pad, F.td),
        );
        const rows = Math.max(...cellLines.map((l) => l.length));
        const rowH = rows * lineH + 14;
        if (ri % 2 === 0)
          push({
            k: "rect",
            x,
            y,
            w,
            h: rowH,
            fill: "rgba(255,255,255,0.035)",
          });
        row.forEach((_, ci) => {
          cellLines[ci].forEach((ln, li) => {
            push({
              k: "text",
              x: x + ci * colW + pad,
              y: y + 8 + li * lineH,
              s: ln,
              f: F.td,
              c: "#cdd6ea",
            });
          });
        });
        push({
          k: "line",
          x1: x,
          y1: y + rowH,
          x2: x + w,
          y2: y + rowH,
          c: "rgba(255,255,255,0.08)",
          lw: 1,
        });
        y += rowH;
      });

      // Separadores de columna
      for (let ci = 1; ci < cols; ci++) {
        push({
          k: "line",
          x1: x + ci * colW,
          y1: startY,
          x2: x + ci * colW,
          y2: y,
          c: "rgba(255,255,255,0.06)",
          lw: 1,
        });
      }
      y += 14;
    }
  });

  return { cmds, totalHeight: y + 12 };
}

function drawCmd(ctx, c) {
  if (c.k === "text") {
    ctx.font = c.f;
    ctx.fillStyle = c.c;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(c.s, c.x, c.y);
  } else if (c.k === "rect") {
    if (c.r) roundRect(ctx, c.x, c.y, c.w, c.h, c.r);
    else {
      ctx.beginPath();
      ctx.rect(c.x, c.y, c.w, c.h);
    }
    if (c.fill) {
      ctx.fillStyle = c.fill;
      ctx.fill();
    }
    if (c.stroke) {
      ctx.strokeStyle = c.stroke;
      ctx.lineWidth = c.lw || 1;
      ctx.stroke();
    }
  } else if (c.k === "line") {
    ctx.strokeStyle = c.c;
    ctx.lineWidth = c.lw || 1;
    ctx.beginPath();
    ctx.moveTo(c.x1, c.y1);
    ctx.lineTo(c.x2, c.y2);
    ctx.stroke();
  }
}

/* ─── Vista de una sección dentro de la pantalla ─── */
function drawSection(ctx, section, scroll) {
  paintBackground(ctx);

  // Botón Volver
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.strokeStyle = "#ffb300";
  ctx.lineWidth = 2;
  roundRect(
    ctx,
    BACK_BTN.cx - BACK_BTN.w / 2,
    BACK_BTN.cy - BACK_BTN.h / 2,
    BACK_BTN.w,
    BACK_BTN.h,
    12,
  );
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffd27a";
  ctx.font = "bold 22px Segoe UI, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("‹  Volver", BACK_BTN.cx, BACK_BTN.cy + 1);

  // Encabezado de sección
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = "46px Segoe UI Emoji, Apple Color Emoji, Arial, sans-serif";
  ctx.fillText(section.icono, 240, 84);
  ctx.fillStyle = "#8ea3c4";
  ctx.font = "bold 18px Segoe UI, Arial, sans-serif";
  ctx.fillText(`SECCIÓN ${section.num}`, 306, 56);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Segoe UI, Arial, sans-serif";
  const titleLines = wrapText(ctx, section.titulo, 880);
  ctx.fillText(titleLines[0], 306, 92);

  // Línea divisoria
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(SEC_X, 128);
  ctx.lineTo(CW - 66, 128);
  ctx.stroke();

  // Contenido con clip + scroll
  const { cmds, totalHeight } = layoutSection(ctx, section);
  const maxScroll = Math.max(0, totalHeight - SEC_H);
  const sc = Math.max(0, Math.min(scroll, maxScroll));

  ctx.save();
  ctx.beginPath();
  ctx.rect(SEC_X - 6, SEC_TOP, SEC_W + 12, SEC_H);
  ctx.clip();
  ctx.translate(0, SEC_TOP - sc);
  cmds.forEach((c) => {
    if (c.y + (c.h || 40) >= sc - 40 && c.y <= sc + SEC_H + 40) drawCmd(ctx, c);
  });
  ctx.restore();

  // Scrollbar + botones
  if (maxScroll > 0) {
    const trackTop = SEC_TOP + 52;
    const trackH = SEC_H - 104;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(ctx, 1243, trackTop, 6, trackH, 3);
    ctx.fill();
    const thumbH = Math.max(30, (SEC_H / totalHeight) * trackH);
    const thumbY = trackTop + (sc / maxScroll) * (trackH - thumbH);
    ctx.fillStyle = "#ffb300";
    roundRect(ctx, 1243, thumbY, 6, thumbH, 3);
    ctx.fill();

    [UP_BTN, DOWN_BTN].forEach((b, i) => {
      ctx.fillStyle = "rgba(124,77,255,0.35)";
      ctx.beginPath();
      ctx.arc(b.cx, b.cy, b.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#eae2ff";
      ctx.font = "bold 22px Segoe UI, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(i === 0 ? "▲" : "▼", b.cx, b.cy + 1);
    });
  }

  // Pie
  ctx.fillStyle = "#7c8db0";
  ctx.font = "18px Segoe UI, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(
    "Usá los botones ▲ ▼ para desplazar  ·  ‹ Volver para regresar al menú",
    CW / 2,
    CH - 16,
  );

  return maxScroll;
}

/* ─── Textura de madera clara ─── */
function buildWoodFloorTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#6b4a2f";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 400; i++) {
    const y = Math.random() * 512;
    const h = Math.random() * 7 + 2;
    const a = Math.random() * 0.16;
    ctx.fillStyle =
      Math.random() > 0.5 ? `rgba(60,38,22,${a})` : `rgba(150,110,70,${a})`;
    ctx.fillRect(0, y, 512, h);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

/* ─── Textura de pared con paneles ─── */
function buildPanelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#3b4048";
  ctx.fillRect(0, 0, 512, 384);
  ctx.strokeStyle = "rgba(20,22,26,0.55)";
  ctx.lineWidth = 3;
  for (let x = 0; x <= 512; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 384);
    ctx.stroke();
  }
  for (let y = 0; y <= 384; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  for (let x = 0; x < 512; x += 128)
    for (let y = 0; y < 384; y += 128) ctx.fillRect(x + 6, y + 6, 116, 8);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  return texture;
}

/* ─── Textura de skyline para el ventanal ─── */
function buildSkylineTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const sky = ctx.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, "#bcd3e8");
  sky.addColorStop(0.6, "#e6eef5");
  sky.addColorStop(1, "#f4f7fa");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 40; i++) {
    const bw = 30 + Math.random() * 55;
    const bh = 120 + Math.random() * 300;
    const bx = i * 27;
    const shade = 150 + Math.floor(Math.random() * 50);
    ctx.fillStyle = `rgb(${shade},${shade + 8},${shade + 18})`;
    ctx.fillRect(bx, 512 - bh, bw, bh);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (let wy = 512 - bh + 12; wy < 500; wy += 20)
      for (let wx = bx + 6; wx < bx + bw - 6; wx += 14)
        if (Math.random() > 0.4) ctx.fillRect(wx, wy, 6, 10);
  }
  return new THREE.CanvasTexture(canvas);
}

/* ─── Silla de reunión ─── */
function ConferenceChair({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.04, 5]} />
        <meshStandardMaterial color="#0e0f12" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.55, 12]} />
        <meshStandardMaterial color="#3a3d42" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.56, 0.09, 0.54]} />
        <meshStandardMaterial color="#17191f" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.98, -0.26]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[0.52, 0.7, 0.07]} />
        <meshStandardMaterial color="#1b1e25" roughness={0.6} />
      </mesh>
    </group>
  );
}

/**
 * MeetingRoom
 * -----------
 * Sala de reunión 3D. La pantalla muestra una grilla de íconos (uno por sección
 * del Informe Final). Al hacer clic, la cámara enfoca la pantalla y el contenido
 * de esa sección se dibuja DENTRO de la misma pantalla (con scroll).
 */
export default function MeetingRoom({ onFocusScreen, onResetView }) {
  const layout = useMemo(() => computeIconLayout(), []);
  const woodTex = useMemo(() => buildWoodFloorTexture(), []);
  const panelTex = useMemo(() => buildPanelTexture(), []);
  const skylineTex = useMemo(() => buildSkylineTexture(), []);

  // Un único canvas + textura para la pantalla (se redibuja según el estado)
  const screen = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = CW;
    canvas.height = CH;
    const ctx = canvas.getContext("2d");
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    return { canvas, ctx, texture };
  }, []);

  const [view, setView] = useState("grid"); // 'grid' | 'section'
  const [selIndex, setSelIndex] = useState(0);
  const [scroll, setScroll] = useState(0);
  const [hoveredId, setHoveredId] = useState(null);
  const maxScrollRef = useRef(0);

  // Redibuja la pantalla cuando cambia el estado
  useEffect(() => {
    const { ctx, texture } = screen;
    if (view === "grid") {
      drawGrid(ctx, layout);
      maxScrollRef.current = 0;
    } else {
      maxScrollRef.current = drawSection(
        ctx,
        REPORT_SECTIONS[selIndex],
        scroll,
      );
    }
    texture.needsUpdate = true;
  }, [view, selIndex, scroll, layout, screen]);

  const openSection = (i) => {
    setSelIndex(i);
    setScroll(0);
    setView("section");
    onFocusScreen?.();
  };

  const backToGrid = () => {
    setView("grid");
    setHoveredId(null);
    onResetView?.();
  };

  const scrollBy = (d) =>
    setScroll((s) => Math.max(0, Math.min(maxScrollRef.current, s + d)));

  const SCREEN_Y = 3.15; // dentro del grupo (offset -0.75 → mundo ~2.4)
  const chairRows = [-2.0, -0.7, 0.6, 1.9];

  // Hotspots locales de los íconos
  const iconHotspots = useMemo(
    () =>
      layout.map((it) => ({
        id: it.id,
        i: it.num - 1,
        ...rectToLocal(it.cx, it.cy, TILE_W, TILE_H),
      })),
    [layout],
  );
  const backLocal = rectToLocal(
    BACK_BTN.cx,
    BACK_BTN.cy,
    BACK_BTN.w,
    BACK_BTN.h,
  );
  const upLocal = rectToLocal(UP_BTN.cx, UP_BTN.cy, UP_BTN.w, UP_BTN.h);
  const downLocal = rectToLocal(
    DOWN_BTN.cx,
    DOWN_BTN.cy,
    DOWN_BTN.w,
    DOWN_BTN.h,
  );

  return (
    <group position={[0, -0.75, 0]}>
      {/* Iluminación */}
      <ambientLight intensity={0.75} />
      <directionalLight
        position={[4, 9, 6]}
        intensity={1.15}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[0, 5.2, 1.5]} intensity={0.7} color="#ffffff" />
      <pointLight
        position={[0, 4.0, -3.4]}
        intensity={0.8}
        color="#00e5ff"
        distance={9}
      />

      {/* Piso */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 20]} />
        <meshStandardMaterial map={woodTex} roughness={0.55} />
      </mesh>

      {/* Pared posterior */}
      <mesh position={[0, 3.6, -4.0]} receiveShadow>
        <planeGeometry args={[22, 8]} />
        <meshStandardMaterial map={panelTex} roughness={0.85} />
      </mesh>
      {/* Pared izquierda */}
      <mesh
        position={[-8, 3.6, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial map={panelTex} roughness={0.85} />
      </mesh>
      {/* Pared derecha con ventanal */}
      <mesh
        position={[8, 3.6, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#2f333a" roughness={0.85} />
      </mesh>
      <mesh position={[7.9, 3.7, -0.5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[12, 4.6]} />
        <meshBasicMaterial map={skylineTex} toneMapped={false} />
      </mesh>
      {[-6.5, -3.6, -0.7, 2.2, 5.1].map((mz, i) => (
        <mesh
          key={i}
          position={[7.86, 3.7, mz]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <boxGeometry args={[0.12, 4.7, 0.08]} />
          <meshStandardMaterial
            color="#20232a"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
      ))}
      <mesh position={[7.86, 3.7, -0.5]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[12, 0.12, 0.08]} />
        <meshStandardMaterial color="#20232a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[7.86, 1.45, -0.5]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[12, 0.12, 0.08]} />
        <meshStandardMaterial color="#20232a" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Techo */}
      <mesh position={[0, 7.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 20]} />
        <meshStandardMaterial color="#2a2d33" roughness={0.95} />
      </mesh>
      {[-2.5, 0, 2.5].map((lx, i) => (
        <mesh key={i} position={[lx, 7.32, 0.5]}>
          <boxGeometry args={[1.4, 0.05, 3.2]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.9}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* ─── PANTALLA ─── */}
      <group position={[0, SCREEN_Y, -3.92]}>
        {/* Marco (bien detrás para evitar z-fighting) */}
        <mesh position={[0, 0, -0.1]} castShadow>
          <boxGeometry args={[SCREEN_W + 0.24, SCREEN_H + 0.24, 0.14]} />
          <meshStandardMaterial
            color="#0a0b0e"
            metalness={0.7}
            roughness={0.35}
          />
        </mesh>
        {/* Panel emisor */}
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshBasicMaterial map={screen.texture} toneMapped={false} />
        </mesh>
        <pointLight
          position={[0, 0, 0.8]}
          intensity={0.55}
          color="#bcd8ff"
          distance={5}
        />

        {/* Hotspots — grilla */}
        {view === "grid" &&
          iconHotspots.map((hs) => (
            <group key={hs.id} position={[hs.x, hs.y, 0.06]}>
              {hoveredId === hs.id && (
                <mesh position={[0, 0, -0.008]}>
                  <planeGeometry args={[hs.w * 1.05, hs.h * 1.05]} />
                  <meshBasicMaterial
                    color="#ffb300"
                    transparent
                    opacity={0.25}
                    toneMapped={false}
                  />
                </mesh>
              )}
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  openSection(hs.i);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredId(hs.id);
                  document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                  setHoveredId(null);
                  document.body.style.cursor = "auto";
                }}
              >
                <planeGeometry args={[hs.w, hs.h]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
            </group>
          ))}

        {/* Controles — sección */}
        {view === "section" && (
          <>
            <mesh
              position={[backLocal.x, backLocal.y, 0.07]}
              onClick={(e) => {
                e.stopPropagation();
                backToGrid();
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => (document.body.style.cursor = "auto")}
            >
              <planeGeometry args={[backLocal.w, backLocal.h]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            <mesh
              position={[upLocal.x, upLocal.y, 0.07]}
              onClick={(e) => {
                e.stopPropagation();
                scrollBy(-SEC_H * 0.8);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => (document.body.style.cursor = "auto")}
            >
              <planeGeometry args={[upLocal.w * 1.4, upLocal.h * 1.4]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            <mesh
              position={[downLocal.x, downLocal.y, 0.07]}
              onClick={(e) => {
                e.stopPropagation();
                scrollBy(SEC_H * 0.8);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => (document.body.style.cursor = "auto")}
            >
              <planeGeometry args={[downLocal.w * 1.4, downLocal.h * 1.4]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </>
        )}
      </group>

      {/* Mesa */}
      <group position={[0, 0, 0.2]}>
        <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.12, 6.4]} />
          <meshStandardMaterial
            color="#f3f2ee"
            roughness={0.35}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[0, 1.0, 0]}>
          <boxGeometry args={[2.2, 0.04, 6.2]} />
          <meshStandardMaterial color="#d7d5cf" roughness={0.5} />
        </mesh>
        {[
          [-1.0, -2.9],
          [1.0, -2.9],
          [-1.0, 2.9],
          [1.0, 2.9],
        ].map((p, i) => (
          <mesh key={i} position={[p[0], 0.5, p[1]]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 1.0, 16]} />
            <meshStandardMaterial
              color="#9aa0a6"
              metalness={0.95}
              roughness={0.15}
            />
          </mesh>
        ))}
        <mesh position={[0, 1.12, 0]}>
          <boxGeometry args={[0.5, 0.02, 5.6]} />
          <meshStandardMaterial
            color="#1b1e24"
            roughness={0.4}
            metalness={0.3}
          />
        </mesh>
      </group>

      {/* Sillas */}
      {chairRows.map((z, i) => (
        <ConferenceChair
          key={`l${i}`}
          position={[-1.85, 0, z]}
          rotation={[0, Math.PI / 2, 0]}
        />
      ))}
      {chairRows.map((z, i) => (
        <ConferenceChair
          key={`r${i}`}
          position={[1.85, 0, z]}
          rotation={[0, -Math.PI / 2, 0]}
        />
      ))}
      <ConferenceChair position={[0, 0, 3.7]} rotation={[0, Math.PI, 0]} />
    </group>
  );
}
