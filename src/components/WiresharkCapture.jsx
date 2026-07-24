import { useEffect, useMemo, useRef, useState } from "react";

/**
 * WiresharkCapture
 * ----------------
 * Recreación DIDÁCTICA (simulada) de una captura en vivo de Wireshark para el
 * caso Fútbol Libre. Reproduce, paquete a paquete, cómo el TAP de red pasivo
 * (EV-004) interceptó el tráfico de streaming HLS: resolución DNS, handshake
 * TCP y la descarga continua de listas .m3u8 y segmentos de video .ts.
 *
 * Se abre escuchando el evento global `open-wireshark` (lo dispara la ficha de
 * la evidencia H-02 / FASE III). Es un overlay DOM, independiente del lienzo 3D.
 */

/* ─── Datos de la captura simulada ─── */
const CLIENT = "192.168.1.37"; // Workstation EV-001 (Dynamax)
const DNSSRV = "192.168.1.1"; // Router / DNS local
const CDN1 = "104.21.48.132"; // Cloudflare CDN
const HOST = "futbollibre.tv";
const BASE = "/en-vivo/hls-stream-1337";

// Fases usadas para la explicación lateral
const PHASES = {
  dns: {
    titulo: "1 · Resolución DNS",
    texto:
      "El equipo pregunta al DNS por la dirección IP del dominio de streaming. La respuesta apunta a una IP de la CDN Cloudflare que distribuye la señal.",
  },
  tcp: {
    titulo: "2 · Conexión TCP (3-way handshake)",
    texto:
      "Antes de pedir datos se abre la conexión con SYN → SYN,ACK → ACK. Confirma que el equipo estableció comunicación con el servidor de video.",
  },
  playlist: {
    titulo: "3 · Listas de reproducción HLS (.m3u8)",
    texto:
      "El reproductor pide el master.m3u8 y luego el chunklist.m3u8. Estos archivos son el 'índice' del stream: indican qué segmentos de video descargar y en qué orden.",
  },
  segments: {
    titulo: "4 · Segmentos de video .ts (EVIDENCIA)",
    texto:
      "Descarga continua de fragmentos .ts (MPEG-TS) de ~2 s cada uno. La repetición constante de estos GET es la prueba de la transmisión en vivo no autorizada capturada in situ.",
  },
};

/* Construye la secuencia completa de paquetes (una sola vez) */
function buildPackets() {
  const pk = [];
  let no = 0;
  let t = 0;
  const push = (p) => {
    no += 1;
    t += p.dt ?? 0.0007;
    pk.push({ no, time: t.toFixed(6), ...p });
  };

  // ─ DNS ─
  push({
    phase: "dns", proto: "DNS", src: CLIENT, dst: DNSSRV, len: 74,
    info: `Standard query 0x8f21 A ${HOST}`,
    tree: [
      ["Frame 1: 74 bytes on wire", ["Encapsulation type: Ethernet", "Protocols in frame: eth:ip:udp:dns"]],
      ["Internet Protocol Version 4", [`Source: ${CLIENT}`, `Destination: ${DNSSRV}`, "Protocol: UDP (17)"]],
      ["User Datagram Protocol", ["Source Port: 51344", "Destination Port: 53"]],
      ["Domain Name System (query)", ["Transaction ID: 0x8f21", `Queries: ${HOST}: type A, class IN`]],
    ],
  });
  push({
    phase: "dns", proto: "DNS", src: DNSSRV, dst: CLIENT, len: 90, dt: 0.021,
    info: `Standard query response 0x8f21 A ${HOST} A ${CDN1}`,
    tree: [
      ["Domain Name System (response)", ["Transaction ID: 0x8f21", "Answers: 1", `${HOST}: type A, addr ${CDN1}`]],
    ],
  });

  // ─ Handshake TCP ─
  const hs = [
    ["49512 → 443 [SYN] Seq=0 Win=64240 Len=0", CLIENT, CDN1, 66, 0.019],
    ["443 → 49512 [SYN, ACK] Seq=0 Ack=1 Win=65535 Len=0", CDN1, CLIENT, 66, 0.024],
    ["49512 → 443 [ACK] Seq=1 Ack=1 Win=131072 Len=0", CLIENT, CDN1, 60, 0.0006],
  ];
  hs.forEach(([info, src, dst, len, dt]) =>
    push({
      phase: "tcp", proto: "TCP", src, dst, len, info, dt,
      tree: [
        ["Transmission Control Protocol", ["Source Port: 49512", "Destination Port: 443", info.includes("SYN") ? "Flags: 0x002 (SYN)" : "Flags: 0x010 (ACK)"]],
      ],
    }),
  );

  // ─ Peticiones de listas HLS ─
  const req = (uri) => ({
    info: `GET ${uri} HTTP/1.1`,
    tree: [
      ["Hypertext Transfer Protocol", [`GET ${uri} HTTP/1.1`, `Host: ${HOST}`, "User-Agent: VLC/3.0 LibVLC/3.0", "Accept: */*"]],
    ],
  });
  const resp = (code, ctype, len) => ({
    info: `HTTP/1.1 ${code} (${ctype})`,
    tree: [
      ["Hypertext Transfer Protocol", [`HTTP/1.1 ${code}`, `Content-Type: ${ctype}`, "Server: cloudflare", `Content-Length: ${len}`]],
    ],
  });

  const m3u8 = "application/vnd.apple.mpegurl";
  push({ phase: "playlist", proto: "HTTP", src: CLIENT, dst: CDN1, len: 421, dt: 0.03, ...req(`${BASE}/master.m3u8`) });
  push({ phase: "playlist", proto: "HTTP", src: CDN1, dst: CLIENT, len: 318, dt: 0.041, ...resp("200 OK", m3u8, 240) });
  push({ phase: "playlist", proto: "HTTP", src: CLIENT, dst: CDN1, len: 428, dt: 0.008, ...req(`${BASE}/chunklist.m3u8`) });
  push({ phase: "playlist", proto: "HTTP", src: CDN1, dst: CLIENT, len: 512, dt: 0.037, ...resp("200 OK", m3u8, 604) });

  // ─ Descarga de segmentos .ts (bucle) ─
  const mp2t = "video/mp2t";
  for (let i = 1; i <= 9; i++) {
    const seg = `${BASE}/fra-esp_${String(i).padStart(5, "0")}.ts`;
    push({ phase: "segments", proto: "HTTP", src: CLIENT, dst: CDN1, len: 431, dt: i === 1 ? 0.05 : 0.9, ...req(seg), seg: true });
    push({ phase: "segments", proto: "HTTP", src: CDN1, dst: CLIENT, len: 1494, dt: 0.06, ...resp("200 OK", mp2t, 188376), segData: true });
  }
  return pk;
}

const PROTO_COLOR = {
  DNS: "#4fc3f7",
  TCP: "#9aa4b2",
  TLS: "#b388ff",
  HTTP: "#69f0ae",
};

function TreeNode({ node, depth = 0 }) {
  const [label, children] = node;
  const [open, setOpen] = useState(depth < 2);
  const hasKids = Array.isArray(children) && children.length > 0;
  return (
    <div style={{ marginLeft: depth * 12 }}>
      <div
        onClick={() => hasKids && setOpen((o) => !o)}
        style={{ cursor: hasKids ? "pointer" : "default", color: "#cdd6e5", padding: "1px 0", userSelect: "none" }}
      >
        {hasKids ? <span style={{ color: "#7c8db0", marginRight: 4 }}>{open ? "▾" : "▸"}</span> : <span style={{ marginRight: 12 }} />}
        {label}
      </div>
      {hasKids && open &&
        children.map((c, i) =>
          Array.isArray(c) ? (
            <TreeNode key={i} node={c} depth={depth + 1} />
          ) : (
            <div key={i} style={{ marginLeft: (depth + 1) * 12 + 12, color: "#9fb0c9", padding: "1px 0" }}>{c}</div>
          ),
        )}
    </div>
  );
}

export default function WiresharkCapture() {
  const ALL = useMemo(() => buildPackets(), []);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0); // paquetes visibles
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(650); // ms entre paquetes
  const [selected, setSelected] = useState(null);
  const listRef = useRef(null);

  // Abrir por evento global desde la ficha de la evidencia
  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setCount(0);
      setSelected(null);
      setPlaying(true);
    };
    window.addEventListener("open-wireshark", onOpen);
    return () => window.removeEventListener("open-wireshark", onOpen);
  }, []);

  // Reproducción: agrega un paquete cada `speed` ms
  useEffect(() => {
    if (!open || !playing) return;
    if (count >= ALL.length) return;
    const id = setTimeout(() => {
      setCount((c) => {
        const n = Math.min(c + 1, ALL.length);
        if (selected === null) setSelected(n - 1);
        return n;
      });
    }, count === 0 ? 250 : speed);
    return () => clearTimeout(id);
  }, [open, playing, count, speed, ALL.length, selected]);

  // Auto-scroll al último paquete
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [count]);

  if (!open) return null;

  const shown = ALL.slice(0, count);
  const done = count >= ALL.length;
  const last = shown[shown.length - 1];
  const phase = last ? last.phase : "dns";
  const tsCount = shown.filter((p) => p.segData).length;
  const sel = selected !== null ? ALL[selected] : null;

  const th = { padding: "6px 8px", textAlign: "left", color: "#8ea3c4", fontWeight: 700, position: "sticky", top: 0, background: "#11151d", borderBottom: "1px solid #2a3242" };
  const td = { padding: "3px 8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 3000,
        background: "rgba(4, 7, 12, 0.86)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Segoe UI, sans-serif", pointerEvents: "auto",
      }}
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1120px, 95vw)", height: "min(720px, 92vh)",
          background: "#0e1117", border: "1px solid #2a3242", borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* Barra de título */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#1a2130", borderBottom: "1px solid #2a3242" }}>
          <span style={{ fontSize: 18 }}>🦈</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Wireshark — Captura en vivo (simulada)</div>
            <div style={{ color: "#8ea3c4", fontSize: 11 }}>TAP de red pasivo EV-004 · Interfaz eth0 · Caso Fútbol Libre</div>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: "#9fb0c9", fontSize: 20, cursor: "pointer", fontWeight: 700 }}>✕</button>
        </div>

        {/* Barra de herramientas / filtro */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#141a24", borderBottom: "1px solid #2a3242" }}>
          <button onClick={() => setPlaying((p) => !p)} title="Reproducir / Pausar"
            style={{ ...btn, color: playing ? "#ffcf5c" : "#69f0ae" }}>{playing ? "⏸ Pausar" : "▶ Reproducir"}</button>
          <button onClick={() => { setCount(0); setSelected(null); setPlaying(true); }} style={btn} title="Reiniciar captura">↻ Reiniciar</button>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#8ea3c4", fontSize: 12 }}>
            <span>Velocidad</span>
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ background: "#0e1117", color: "#cdd6e5", border: "1px solid #2a3242", borderRadius: 6, padding: "3px 6px" }}>
              <option value={1100}>Lenta</option>
              <option value={650}>Normal</option>
              <option value={280}>Rápida</option>
            </select>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#0e1117", border: "1px solid #2a3242", borderRadius: 6, padding: "4px 8px", gap: 6 }}>
            <span style={{ color: "#69f0ae", fontSize: 12 }}>⧩</span>
            <span style={{ fontFamily: "monospace", color: "#cdd6e5", fontSize: 12 }}>http || dns || tcp.flags.syn == 1</span>
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: done ? "#8ea3c4" : "#ff5a6a", fontSize: 12, fontWeight: 700 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: done ? "#5a6472" : "#ff5a6a", boxShadow: done ? "none" : "0 0 8px #ff5a6a" }} />
            {done ? "Finalizada" : "Capturando…"}
          </span>
        </div>

        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* Columna principal: lista + detalle */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, borderRight: "1px solid #2a3242" }}>
            {/* Lista de paquetes */}
            <div ref={listRef} style={{ flex: 1.4, overflowY: "auto", fontFamily: "Consolas, monospace", fontSize: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <thead>
                  <tr>
                    <th style={{ ...th, width: 44 }}>No.</th>
                    <th style={{ ...th, width: 78 }}>Time</th>
                    <th style={{ ...th, width: 108 }}>Source</th>
                    <th style={{ ...th, width: 108 }}>Destination</th>
                    <th style={{ ...th, width: 54 }}>Proto</th>
                    <th style={{ ...th, width: 46 }}>Len</th>
                    <th style={th}>Info</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((p, i) => {
                    const isSel = selected === i;
                    const evi = p.seg || p.segData;
                    const bg = isSel ? "#26456b" : evi ? "rgba(255, 179, 0, 0.12)" : i % 2 ? "#12161f" : "#0e1117";
                    return (
                      <tr key={p.no} onClick={() => setSelected(i)} style={{ background: bg, cursor: "pointer", color: "#c7d2e2" }}>
                        <td style={td}>{p.no}</td>
                        <td style={td}>{p.time}</td>
                        <td style={td}>{p.src}</td>
                        <td style={td}>{p.dst}</td>
                        <td style={{ ...td, color: PROTO_COLOR[p.proto], fontWeight: 700 }}>{p.proto}</td>
                        <td style={td}>{p.len}</td>
                        <td style={{ ...td, color: evi ? "#ffcf5c" : "#c7d2e2" }}>{p.info}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Detalle del paquete seleccionado */}
            <div style={{ flex: 1, borderTop: "1px solid #2a3242", background: "#0b0e14", overflowY: "auto", padding: "8px 12px", fontFamily: "Consolas, monospace", fontSize: 12 }}>
              <div style={{ color: "#8ea3c4", fontWeight: 700, marginBottom: 6 }}>
                Detalles del paquete {sel ? `#${sel.no}` : ""}
              </div>
              {sel ? sel.tree.map((n, i) => <TreeNode key={i} node={n} />) : <div style={{ color: "#6b7688" }}>Seleccioná un paquete para ver su detalle.</div>}
            </div>
          </div>

          {/* Panel de explicación */}
          <div style={{ width: 300, background: "#0f141d", display: "flex", flexDirection: "column", padding: 14, gap: 10, overflowY: "auto" }}>
            <div style={{ color: "#00e5ff", fontWeight: 800, fontSize: 13, letterSpacing: "0.02em" }}>¿QUÉ ESTÁS VIENDO?</div>
            <div style={{ background: "rgba(0,229,255,0.07)", border: "1px solid rgba(0,229,255,0.25)", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ color: "#eaf6ff", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{PHASES[phase].titulo}</div>
              <div style={{ color: "#b9c6da", fontSize: 12.5, lineHeight: 1.5 }}>{PHASES[phase].texto}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 2 }}>
              {Object.entries(PHASES).map(([key, ph]) => {
                const active = key === phase;
                const passed = Object.keys(PHASES).indexOf(key) < Object.keys(PHASES).indexOf(phase);
                return (
                  <div key={key} style={{ display: "flex", gap: 8, alignItems: "flex-start", opacity: active ? 1 : passed ? 0.6 : 0.4 }}>
                    <span style={{ marginTop: 1, color: active ? "#00e5ff" : passed ? "#69f0ae" : "#5a6472" }}>{passed ? "✓" : active ? "▸" : "○"}</span>
                    <span style={{ color: active ? "#fff" : "#9fb0c9", fontSize: 12, fontWeight: active ? 700 : 500 }}>{ph.titulo}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "auto", background: "rgba(255,179,0,0.1)", border: "1px solid rgba(255,179,0,0.35)", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ color: "#ffcf5c", fontWeight: 800, fontSize: 12 }}>🎯 SEGMENTOS .ts CAPTURADOS</div>
              <div style={{ color: "#fff", fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>{tsCount}</div>
              <div style={{ color: "#e6d3a3", fontSize: 11.5, lineHeight: 1.4 }}>
                Cada fragmento .ts es ~2 s de video. Su descarga continua confirma la transmisión en vivo del stream ilegal.
              </div>
            </div>

            <div style={{ color: "#6b7688", fontSize: 10.5, lineHeight: 1.4 }}>
              Reconstrucción didáctica del tráfico capturado por el TAP pasivo (EV-004). Los valores son ilustrativos del caso.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const btn = {
  background: "#0e1117", color: "#cdd6e5", border: "1px solid #2a3242",
  borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700,
};
