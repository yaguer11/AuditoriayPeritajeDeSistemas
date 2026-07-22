/**
 * reportData.js
 * -------------
 * Contenido estructurado del "INFORME FINAL DE AUDITORÍA DE SISTEMAS"
 * (Despegar S.A. — Controles ISO/IEC 27002:2022 8.5 y 8.23).
 *
 * Cada sección se muestra como un ícono en la pantalla de la Sala de Reunión 3D
 * (MeetingRoom.jsx). Al hacer clic, se abre el detalle de esa sección.
 *
 * Bloques soportados por el renderizador:
 *   { h: "Subtítulo" }
 *   { p: "Párrafo..." }
 *   { list: ["item", ...] }
 *   { table: { headers: [...], rows: [[...], ...] } }
 *   { callout: "Texto destacado", tone: "ok" | "warn" | "crit" }
 */

export const REPORT_META = {
  titulo: "Informe Final de Auditoría de Sistemas",
  organizacion: "Despegar: tu Agencia de Viajes | Vuelos, Hoteles, Paquetes y más S.A.",
  norma: "ISO/IEC 27002:2022 · Controles 8.5 y 8.23",
  metodologia: "ISO 19011:2018",
  version: "2.0",
  emision: "07 de mayo de 2026",
  clasificacion: "Confidencial — Uso Exclusivo Interno",
  equipo: [
    "Matías Giménez — Auditor Líder",
    "Valentín Giménez — Auditor",
    "Germán Muñoz — Auditor Técnico",
    "Elenio García — Redactor",
  ],
  wikiUrl:
    "https://tvgimenez02.atlassian.net/wiki/spaces/AD/overview?homepageId=31424688",
};

export const REPORT_SECTIONS = [
  {
    id: "s1",
    num: 1,
    icono: "📘",
    titulo: "Introducción y Contexto",
    resumen: "Organización auditada y justificación de los controles.",
    bloques: [
      { h: "1.1 Descripción de la Organización Auditada" },
      {
        p: "Despegar S.A. es la subsidiaria argentina de una de las agencias de viajes online (OTA) líderes de América Latina. Fundada en 1999, con domicilio legal en Av. Jujuy 2013, CABA (CUIT 30-70130711-5), opera en más de 20 países ofreciendo reserva de vuelos, hoteles, paquetes turísticos, alquiler de vehículos y cruceros.",
      },
      {
        p: "La plataforma procesa millones de transacciones financieras anuales y almacena datos personales y de pago, lo que la convierte en un objetivo de alto valor y obliga a mantener controles robustos sobre autenticación y navegación web corporativa.",
      },
      { h: "1.2 Motivación y Propósito" },
      {
        p: "El inicio de sesión constituye la primera línea de defensa del sistema. El informe evalúa, desde una perspectiva black-box, el cumplimiento de dos controles ISO/IEC 27002:2022: 8.5 (Autenticación Segura) y 8.23 (Filtrado Web).",
      },
      { h: "1.3 Justificación de los Controles Seleccionados" },
      {
        p: "Control 8.5 – Autenticación Segura: regula la verificación de identidad; las cuentas OTA contienen datos financieros y de identidad (alta criticidad); sus requisitos (HTTPS, ocultamiento de contraseña, errores genéricos, bloqueo por intentos, MFA) son verificables desde el exterior; se alinea con riesgos actuales (credential stuffing, fuerza bruta, phishing).",
      },
      {
        p: "Control 8.23 – Filtrado Web: +4500 colaboradores navegan a diario; la ausencia de filtrado expone a malware, phishing y exfiltración; los endpoints corporativos son activos de muy alta criticidad; alineación regulatoria con GDPR, Ley 25.326 y PCI-DSS.",
      },
    ],
  },
  {
    id: "s2",
    num: 2,
    icono: "🎯",
    titulo: "Alcance de la Auditoría",
    resumen: "Alcance funcional, técnico, exclusiones y período.",
    bloques: [
      { h: "2.1 Alcance Funcional" },
      {
        table: {
          headers: ["Área", "Funcionalidad auditada", "Control"],
          rows: [
            ["Autenticación", "Flujo de login en despegar.com.ar/login", "8.5"],
            ["Autenticación federada", "Inicio de sesión con Google y Apple", "8.5"],
            ["Registro de usuario", "Creación de cuenta y validación de contraseña", "8.5"],
            ["Intentos fallidos", "Respuesta ante credenciales incorrectas", "8.5"],
            ["Gestión de sesiones", "Cookies, tokens y comportamiento post-auth", "8.5"],
            ["Filtrado web corporativo", "Control de acceso a contenido web", "8.23"],
            ["Categorización de contenido", "Sitios permitidos, restringidos y bloqueados", "8.23"],
            ["Registro y monitoreo", "Logs de acceso web y revisión periódica", "8.23"],
          ],
        },
      },
      { h: "2.2 Alcance Técnico" },
      {
        list: [
          "Interfaz web (front-end): HTML, JS del cliente, formularios y controles visuales (8.5).",
          "Comunicaciones de red: HTTP/HTTPS, cabeceras, cookies y respuestas del servidor (8.5).",
          "Atributos del certificado TLS/SSL y seguridad de transporte observable (8.5).",
          "Infraestructura de filtrado web corporativo: proxies, DNS filtering, web gateways — Fortinet FortiProxy (8.23).",
        ],
      },
      { h: "2.3 Exclusiones Explícitas" },
      {
        list: [
          "Código fuente del back-end, bases de datos y lógica de negocio interna.",
          "Servidores externos, firewalls perimetrales e IDS fuera del alcance declarado.",
          "Aplicación móvil nativa (iOS / Android).",
          "Pruebas de penetración activas contra producción.",
          "Filtrado de contenido en redes WiFi de clientes finales.",
        ],
      },
      { h: "2.4 Período de Evaluación" },
      {
        table: {
          headers: ["Fase", "Período", "Actividades"],
          rows: [
            ["Planificación y visitas", "14/04/2026 – 22/04/2026", "Visitas a Av. Jujuy 2013, entrevistas y recopilación documental."],
            ["Ejecución y evidencia", "28/04/2026", "Pruebas funcionales y revisión de la infraestructura de filtrado."],
          ],
        },
      },
    ],
  },
  {
    id: "s3",
    num: 3,
    icono: "📐",
    titulo: "Criterios de Auditoría",
    resumen: "Normas y documentos internos de referencia.",
    bloques: [
      { h: "3.1 Normas y Documentos de Referencia" },
      {
        table: {
          headers: ["Documento", "Título", "Versión / Fecha"],
          rows: [
            ["ISO/IEC 27002:2022", "Controles de Seguridad de la Información", "2022"],
            ["ISO 19011:2018", "Directrices para la auditoría de sistemas de gestión", "2018"],
            ["POL-SEC-102", "Política de Control de Accesos y Autenticación Segura", "v3.0 — 15/09/2025"],
            ["PR-SEC-805", "Procedimiento de Autenticación y Gestión de Sesiones", "v4.1 — 12/11/2025"],
            ["REG-CTRL-805", "Registro de Controles Operativos de Autenticación", "v2.3 — 10/01/2026"],
            ["POL-SEC-823", "Política de Filtrado Web y Uso Aceptable de Internet", "v2.0 — 05/03/2026"],
            ["PR-SEC-823", "Procedimiento Estándar de Filtrado Web Corporativo", "v1.3 — 10/03/2026"],
          ],
        },
      },
    ],
  },
  {
    id: "s4",
    num: 4,
    icono: "🗄️",
    titulo: "Identificación de Activos",
    resumen: "Inventario de activos involucrados (A-01 a A-13).",
    bloques: [
      { h: "Activos de información, software e infraestructura" },
      {
        table: {
          headers: ["ID", "Activo", "Tipo", "Criticidad"],
          rows: [
            ["A-01", "Datos de credenciales de usuario", "Información", "Muy Alto"],
            ["A-02", "Datos de sesión (tokens / cookies)", "Información", "Alto"],
            ["A-03", "Datos personales del perfil", "Información", "Alto"],
            ["A-04", "Datos financieros de la cuenta", "Información", "Muy Alto"],
            ["A-05", "Formulario de login (front-end)", "Software", "Alto"],
            ["A-06", "Servicio de autenticación (back-end)", "Software", "Muy Alto"],
            ["A-07", "Base de datos de usuarios", "Software/Datos", "Muy Alto"],
            ["A-08", "Infraestructura de red y TLS", "Infraestructura", "Alto"],
            ["A-09", "Servicio de correo para recuperación", "Servicio", "Alto"],
            ["A-10", "Reputación y confianza de la marca", "Intangible", "Alto"],
            ["A-11", "Endpoints corporativos (laptops/PCs)", "Hardware", "Muy Alto"],
            ["A-12", "Red corporativa / Intranet", "Infraestructura", "Alto"],
            ["A-13", "Infraestructura de filtrado web (FortiProxy)", "Software/Infra.", "Alto"],
          ],
        },
      },
    ],
  },
  {
    id: "s5",
    num: 5,
    icono: "🔬",
    titulo: "Metodología de Auditoría",
    resumen: "Enfoque black-box, fases, técnicas y equipo.",
    bloques: [
      { h: "5.1 Enfoque de Auditoría" },
      {
        p: "Enfoque de caja negra (black-box). Control 8.5: interacción como usuario externo, sin acceso a back-end, código fuente ni bases de datos. Control 8.23: enfoque mixto — visitas presenciales, entrevistas con TI/Infraestructura/SecOps y pruebas observacionales bajo supervisión del Administrador de Sistemas.",
      },
      { h: "5.2 Fases del Proceso Auditor (ISO 19011:2018)" },
      {
        table: {
          headers: ["Fase", "Etapa", "Fecha", "Responsable"],
          rows: [
            ["1", "Inicio de la auditoría", "14–15/04/2026", "Matías Giménez"],
            ["2", "Revisión documental", "16–19/04/2026", "Valentín Giménez"],
            ["3", "Planificación de actividades", "20–22/04/2026", "Matías Giménez + Equipo"],
            ["4", "Ejecución de la auditoría", "28/04/2026", "Germán Muñoz"],
            ["5", "Análisis de evidencias", "29/04/2026", "Elenio García + Equipo"],
            ["6", "Elaboración del informe", "30/04–07/05/2026", "Elenio García"],
          ],
        },
      },
      { h: "5.3 Técnicas Aplicadas" },
      {
        list: [
          "Observación directa de la interfaz de login (8.5.a, 8.5.d).",
          "Prueba funcional: credenciales válidas/inválidas, intentos fallidos, registro (8.5.b, 8.5.e, 8.5.f).",
          "Análisis de cabeceras HTTP (Set-Cookie, HSTS, CSP) vía DevTools (8.5.c, 8.5.g, 8.5.h).",
          "Análisis del certificado TLS: validez, CN/SAN, CA, versión y cipher suite (8.5.g).",
          "Inspección DOM/HTML-JS y enumeración de usuarios (8.5.a, 8.5.d, 8.5.e).",
          "Análisis de sistemas antifraude (DataDome, reCAPTCHA v2/v3) (8.5.b).",
          "Entrevistas presenciales y revisión documental (8.23.a–f).",
        ],
      },
      { h: "5.4 Equipo Auditor" },
      {
        list: [
          "Matías Giménez (Auditor Líder): dirección, alcance y coordinación; interlocutor con la organización.",
          "Valentín Giménez (Auditor): evidencia documental y entrevistas con TI e Infraestructura.",
          "Germán Muñoz (Auditor Técnico): pruebas técnicas y operación de herramientas (DevTools, Wireshark).",
          "Elenio García (Redactor): análisis de evidencias y elaboración del informe final.",
        ],
      },
    ],
  },
  {
    id: "s6",
    num: 6,
    icono: "📑",
    titulo: "Documentación Revisada e Implementación Declarada",
    resumen: "Documentación recolectada e implementación declarada por subcontrol.",
    bloques: [
      { h: "6.1 Documentación Recolectada" },
      {
        list: [
          "POL-SEC-102 v3.0 — Política de Control de Accesos y Autenticación Segura.",
          "PR-SEC-805 v4.1 — Procedimiento de Autenticación y Gestión de Sesiones Seguras.",
          "REG-CTRL-805 v2.3 — Registro de Controles Operativos de Autenticación.",
          "POL-SEC-823 v2.0 — Política de Filtrado Web y Uso Aceptable de Internet.",
          "PR-SEC-823 v1.3 — Procedimiento Estándar de Filtrado Web Corporativo.",
        ],
      },
      { h: "6.2 Implementación Declarada — Control 8.5" },
      {
        table: {
          headers: ["Subcontrol", "Implementación declarada"],
          rows: [
            ["8.5.a", "Contraseñas enmascaradas con campos type='password'."],
            ["8.5.b", "Bloqueo temporal tras 5 intentos (15 min) + WAF DataDome / reCAPTCHA v3."],
            ["8.5.c", "Credenciales sólo por HTTPS con TLS 1.2+ y redirección 301/302."],
            ["8.5.d", "Mensajes de error genéricos ('Email o contraseña incorrectos')."],
            ["8.5.e", "Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo (front + back)."],
            ["8.5.f", "MFA obligatorio para privilegios elevados vía TOTP (RFC 6238)."],
            ["8.5.g", "HTTPS con CA reconocida, redirección automática y HSTS habilitado."],
            ["8.5.h", "Sesiones JWT en cookies HttpOnly/Secure/SameSite=Strict; tokens rotados."],
          ],
        },
      },
      { h: "6.2 Implementación Declarada — Control 8.23" },
      {
        table: {
          headers: ["Subcontrol", "Implementación declarada"],
          rows: [
            ["8.23.a", "POL-SEC-823 define uso aceptable, responsabilidades y consecuencias."],
            ["8.23.b", "Categorías activas en FortiProxy (malware, phishing, adultos, juegos, P2P, proxies)."],
            ["8.23.c", "Filtrado FortiProxy en el perímetro LAN; tráfico inspeccionado antes de salir."],
            ["8.23.d", "FortiProxy deniega acceso a sitios bloqueados según categorización."],
            ["8.23.e", "Logs completos (usuario, URL, categoría, acción); revisión semanal, retención 90 días."],
            ["8.23.f", "Solicitudes de desbloqueo gestionadas por Infraestructura IT (PR-SEC-823:2.5)."],
          ],
        },
      },
    ],
  },
  {
    id: "s7",
    num: 7,
    icono: "🔐",
    titulo: "Hallazgos — Control 8.5 (Autenticación)",
    resumen: "Cumplimiento, no conformidades (NC-01 a NC-04) y fortalezas.",
    bloques: [
      { h: "7.1 Cuadro de Cumplimiento — Control 8.5" },
      {
        table: {
          headers: ["Ref.", "Requisito", "Estado", "Hallazgo"],
          rows: [
            ["8.5.a", "No mostrar contraseña", "CUMPLE", "C-01"],
            ["8.5.b", "Limitación de intentos fallidos", "NO CUMPLE", "NC-01"],
            ["8.5.c", "Transmisión cifrada", "CUMPLE", "C-03"],
            ["8.5.d", "Mensajes de error genéricos", "CUMPLE", "C-02"],
            ["8.5.e", "Complejidad de contraseña", "CUMPLE PARCIAL", "NC-04"],
            ["8.5.f", "Autenticación multifactor (MFA)", "NO CUMPLE", "NC-02"],
            ["8.5.g", "Canal seguro HTTPS/TLS", "CUMPLE", "C-03"],
            ["8.5.h", "Gestión segura de sesiones", "CUMPLE PARCIAL", "NC-03"],
          ],
        },
      },
      { h: "7.2 No Conformidades" },
      {
        callout:
          "NC-01 [CRÍTICO] — Ausencia de bloqueo por intentos fallidos (8.5.b). Tras 10 intentos erróneos consecutivos el sistema no disparó el bloqueo de 15 min declarado en PR-SEC-805:2.2. Riesgo: fuerza bruta, credential stuffing y password spraying sobre cuentas con datos financieros.",
        tone: "crit",
      },
      {
        callout:
          "NC-02 [ALTO] — Ausencia de MFA para cuentas administrativas (8.5.f). El acceso a paneles administrativos se realiza con factor único; la interfaz no ofrece habilitar TOTP (RFC 6238), incumpliendo POL-SEC-102:3.6.",
        tone: "warn",
      },
      {
        callout:
          "NC-03 [MEDIO] — Configuración deficiente de cookies de sesión (8.5.h). La cookie principal carece de HttpOnly y usa SameSite=Lax en vez de Strict. Riesgo: robo de sesión vía XSS/CSRF.",
        tone: "warn",
      },
      {
        callout:
          "NC-04 [MEDIO] — Política de contraseñas insuficiente (8.5.e). El registro acepta la contraseña 'password' sin número ni símbolo, incumpliendo PR-SEC-805:2.5.",
        tone: "warn",
      },
      { h: "7.3 Conformidades y Fortalezas" },
      {
        list: [
          "C-01 — Enmascaramiento correcto de la contraseña (type='password').",
          "C-02 — Mensajes de error genéricos que impiden enumeración de usuarios.",
          "C-03 — Autenticación cifrada con HTTPS/TLS 1.3 y CA pública reconocida.",
          "C-04 — Control compensatorio antifraude activo (DataDome + reCAPTCHA v3).",
        ],
      },
    ],
  },
  {
    id: "s8",
    num: 8,
    icono: "🛡️",
    titulo: "Hallazgos — Control 8.23 (Filtrado Web)",
    resumen: "Cumplimiento, no conformidades (NC-05 a NC-07) y fortalezas.",
    bloques: [
      { h: "8.1 Cuadro de Cumplimiento — Control 8.23" },
      {
        table: {
          headers: ["Ref.", "Requisito", "Estado", "Hallazgo"],
          rows: [
            ["8.23.a", "Política de uso aceptable vigente", "CUMPLE", "C-05"],
            ["8.23.b", "Categorización de sitios restringidos", "CUMPLE", "C-06"],
            ["8.23.c", "Controles técnicos de filtrado", "CUMPLE PARCIAL", "NC-05"],
            ["8.23.d", "Notificación ante acceso bloqueado", "NO CUMPLE", "NC-06"],
            ["8.23.e", "Registro y monitoreo de acceso", "CUMPLE", "C-06"],
            ["8.23.f", "Proceso formal de excepciones", "NO CUMPLE", "NC-07"],
          ],
        },
      },
      { h: "8.2 No Conformidades" },
      {
        callout:
          "NC-05 [MEDIO] — Cobertura parcial: endpoints remotos sin filtrado (8.23.c). La VPN con split tunneling deja el tráfico web general de los remotos fuera de FortiProxy. Riesgo: endpoints con acceso interno como vector inicial de incidente.",
        tone: "warn",
      },
      {
        callout:
          "NC-06 [ALTO] — Ausencia de página de notificación ante bloqueos (8.23.d). FortiProxy resetea la conexión (ERR_CONNECTION_RESET) sin página HTML de bloqueo; la función 'Replacement Message' nunca fue habilitada.",
        tone: "warn",
      },
      {
        callout:
          "NC-07 [MEDIO] — Proceso de excepciones informal y sin trazabilidad (8.23.f). Las excepciones se piden por Slack (#helpdesk-it), sin formulario, aprobador, registro ni caducidad.",
        tone: "warn",
      },
      { h: "8.3 Conformidades y Fortalezas" },
      {
        list: [
          "C-05 — Política POL-SEC-823 v2.0 documentada y vigente (revisada marzo 2026).",
          "C-06 — Categorización activa en FortiProxy + registro semanal firmado por SecOps (retención 90 días).",
        ],
      },
    ],
  },
  {
    id: "s9",
    num: 9,
    icono: "📊",
    titulo: "Cuadro Resumen de Hallazgos",
    resumen: "7 no conformidades y 6 conformidades.",
    bloques: [
      { h: "No Conformidades" },
      {
        table: {
          headers: ["ID", "Hallazgo", "Severidad", "Control", "Estado"],
          rows: [
            ["NC-01", "Sin bloqueo por intentos fallidos", "CRÍTICO", "8.5.b", "No cumple"],
            ["NC-02", "Sin MFA para cuentas administrativas", "ALTO", "8.5.f", "No cumple"],
            ["NC-03", "Cookies de sesión deficientes", "MEDIO", "8.5.h", "Cumple parcial"],
            ["NC-04", "Política de contraseñas insuficiente", "MEDIO", "8.5.e", "Cumple parcial"],
            ["NC-05", "Endpoints remotos sin filtrado", "MEDIO", "8.23.c", "Cumple parcial"],
            ["NC-06", "Sin página de notificación de bloqueo", "ALTO", "8.23.d", "No cumple"],
            ["NC-07", "Excepciones informales sin trazabilidad", "MEDIO", "8.23.f", "No cumple"],
          ],
        },
      },
      { h: "Conformidades" },
      {
        table: {
          headers: ["ID", "Fortaleza", "Control", "Estado"],
          rows: [
            ["C-01", "Ocultamiento de contraseña", "8.5.a", "Cumple"],
            ["C-02", "Mensajes de error genéricos", "8.5.d", "Cumple"],
            ["C-03", "HTTPS/TLS 1.3 con CA válida", "8.5.c, 8.5.g", "Cumple"],
            ["C-04", "Antifraude (DataDome + reCAPTCHA)", "8.5.b (comp.)", "Compensatoria"],
            ["C-05", "Política de uso aceptable vigente", "8.23.a", "Cumple"],
            ["C-06", "Categorización + registro semanal", "8.23.b, 8.23.e", "Cumple"],
          ],
        },
      },
    ],
  },
  {
    id: "s10",
    num: 10,
    icono: "📈",
    titulo: "Valoración General del Estado de Seguridad",
    resumen: "Nivel de madurez por control: fortalezas y brechas.",
    bloques: [
      { h: "10.1 Nivel de Madurez — Control 8.5: intermedio-bajo" },
      {
        p: "De 8 subcontroles: 4 en conformidad plena, 2 parciales y 2 en no cumplimiento. Buenas prácticas en el canal de comunicación (HTTPS/TLS 1.3) y anti-enumeración, pero brechas críticas: sin bloqueo por intentos (NC-01) y sin MFA para administradores (NC-02).",
      },
      {
        list: [
          "✓ HTTPS/TLS 1.3 con CA válida.",
          "✓ Mensajes de error genéricos (anti-enumeración).",
          "✓ Enmascaramiento correcto de contraseña.",
          "✓ Control compensatorio: DataDome + reCAPTCHA.",
          "✗ [CRÍTICO] Sin bloqueo por intentos fallidos.",
          "✗ [ALTO] Sin MFA para cuentas administrativas.",
          "✗ [MEDIO] Atributos de cookies deficientes.",
          "✗ [MEDIO] Política de contraseñas sin validación efectiva.",
        ],
      },
      { h: "10.2 Nivel de Madurez — Control 8.23: intermedio" },
      {
        p: "Política formal vigente (POL-SEC-823) y categorización activa en FortiProxy con monitoreo documentado. Brechas: filtrado no extendido a remotos (NC-05), sin notificación al usuario (NC-06) y proceso de excepciones informal (NC-07).",
      },
      {
        list: [
          "✓ Política POL-SEC-823 documentada y vigente.",
          "✓ Categorización activa auto-actualizada en FortiProxy.",
          "✓ Logs completos con retención 90 días y revisión semanal firmada.",
          "✓ Filtrado efectivo para endpoints en red LAN.",
          "✗ [MEDIO] Endpoints remotos (VPN split tunneling) sin filtrado.",
          "✗ [ALTO] Sin página de notificación ante bloqueos.",
          "✗ [MEDIO] Proceso de excepciones informal sin trazabilidad.",
        ],
      },
    ],
  },
  {
    id: "s11",
    num: 11,
    icono: "✅",
    titulo: "Plan de Recomendaciones",
    resumen: "Acciones priorizadas por plazo (0–90 días).",
    bloques: [
      { h: "Prioridad 1 — Acción Inmediata (0–30 días)" },
      {
        list: [
          "NC-01: Implementar bloqueo temporal de cuenta a nivel de aplicación (5 intentos → 15 min), conforme a PR-SEC-805:2.2. DataDome no reemplaza este requisito.",
          "NC-02: Implementar TOTP (RFC 6238) como segundo factor obligatorio para todos los administradores (Google/Microsoft Authenticator o Authy).",
        ],
      },
      { h: "Prioridad 2 — Corto Plazo (30–60 días)" },
      {
        list: [
          "NC-06: Habilitar 'Replacement Message' en FortiProxy con página de bloqueo que indique motivo, categoría, política (POL-SEC-823) y canal de excepción.",
          "NC-03: Añadir HttpOnly y cambiar SameSite de 'Lax' a 'Strict'; validar en el pipeline CI/CD.",
        ],
      },
      { h: "Prioridad 3 — Mediano Plazo (60–90 días)" },
      {
        list: [
          "NC-04: Rechazar contraseñas débiles (min. 8 con mayús/minús/número/símbolo) en front y back; contrastar con listas comunes.",
          "NC-05: Filtrado para remotos vía VPN full tunneling, agente FortiClient o SWG en la nube (FortiSASE, Zscaler ZIA).",
          "NC-07: Formalizar excepciones con formulario, aprobación firmada, registro central (vencimiento máx. 6 meses) y revisión trimestral.",
        ],
      },
    ],
  },
  {
    id: "s12",
    num: 12,
    icono: "🏁",
    titulo: "Conclusiones",
    resumen: "Nivel de madurez intermedio con brechas de implementación.",
    bloques: [
      {
        p: "La auditoría sobre los controles 8.5 y 8.23 de ISO/IEC 27002:2022 concluye que Despegar S.A. presenta un nivel de madurez intermedio, con fortalezas técnicas en la protección del canal y en la estructura documental, pero con brechas operativas que elevan el riesgo sobre activos de alta criticidad.",
      },
      {
        p: "Control 8.5: se implementan bien los controles de menor complejidad (HTTPS/TLS 1.3, enmascaramiento, mensajes genéricos), pero la falta de bloqueo por intentos (NC-01) y la inexistencia de MFA funcional para administradores (NC-02) son las brechas de mayor impacto.",
      },
      {
        p: "Control 8.23: infraestructura sólida en LAN (FortiProxy con categorización, logs y revisión), limitada por el split tunneling que deja sin cobertura a los remotos. La ausencia de notificación (NC-06) y la informalidad del proceso de excepciones (NC-07) son debilidades procedimentales.",
      },
      {
        callout:
          "Valoración final: la brecha entre lo declarado y lo implementado (especialmente NC-01 y NC-02) es el principal riesgo. Se recomienda auditoría de seguimiento en ≤6 meses para NC-01 y NC-02, y a 12 meses para la verificación integral.",
        tone: "crit",
      },
    ],
  },
  {
    id: "s13",
    num: 13,
    icono: "✍️",
    titulo: "Firmas y Aprobación",
    resumen: "Equipo auditor, lugar y fecha de emisión.",
    bloques: [
      {
        p: "El presente Informe Final de Auditoría fue elaborado por el equipo auditor designado y refleja fielmente los resultados de las actividades realizadas sobre Despegar S.A. durante el período de evaluación declarado.",
      },
      {
        table: {
          headers: ["Integrante", "Rol"],
          rows: [
            ["Matías Giménez", "Auditor Líder"],
            ["Valentín Giménez", "Auditor"],
            ["Germán Muñoz", "Auditor Técnico"],
            ["Elenio García", "Redactor del Informe"],
          ],
        },
      },
      { p: "Lugar y fecha de emisión: Ciudad Autónoma de Buenos Aires, 07 de mayo de 2026." },
    ],
  },
];
