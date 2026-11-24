/**
 * The phone pass over the panel: what a trainer standing in the gym actually
 * gets at 390px. One screen at a time, it measures four things — the page
 * pushing sideways, content clipped inside a box, type too small to read, and
 * taps smaller than a thumb — and leaves a picture of each screen next to the
 * numbers.
 */

/**
 * A phone, at 390 CSS pixels and a retina scale.
 *
 * Deliberately not `isMobile`: Chrome's phone emulation widens the layout
 * viewport to fit whatever overflows, so a page 1200px wide reports a viewport
 * 1200px wide and every measurement comes out self-referentially fine. With a
 * plain 390px window the number says what it means — the page is wider than
 * the screen — which is the whole point of this pass.
 */
export const PHONE = {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  hasTouch: true,
};

/** Apple's and Google's floor for anything a finger has to hit. */
const TAP_FLOOR = 44;
/** Under this, body copy stops being read and starts being guessed. */
const TYPE_FLOOR = 12;

/**
 * Every screen of the panel, in the order the day goes: the lists first, then
 * the two heavy editors, the client's own page, and the settings tail.
 * `path` receives the ids of the client the pass follows.
 */
export const PANEL_ROUTES = [
  { name: "inicio", label: "Inicio", path: () => "/dashboard" },
  { name: "clientes", label: "Clientes (listado)", path: () => "/clients" },
  {
    name: "ficha-cliente",
    label: "Ficha del cliente (calendario y medidas)",
    path: (ids) => `/clients/${ids.client}`,
    // The whole page is as wide as its widest table: this is the one.
    details: [
      { name: "medidas", find: "text=Medidas corporales" },
      { name: "calendario", find: "text=Calendario de entrenos" },
    ],
  },
  {
    name: "editor-rutina",
    label: "Editor de rutina",
    path: (ids) => `/clients/${ids.client}/training-plans/${ids.plan}`,
    details: [{ name: "serie", find: "text=Series" }],
  },
  {
    name: "editor-dieta",
    label: "Editor de dieta",
    path: (ids) => `/clients/${ids.client}/diet-plans/${ids.diet}`,
    details: [{ name: "comida", find: "text=Desayuno" }],
  },
  {
    name: "fotos-cliente",
    label: "Fotos de progreso",
    path: (ids) => `/clients/${ids.client}/photos`,
  },
  {
    name: "ejercicios",
    label: "Ejercicios (catálogo)",
    path: () => "/exercises",
  },
  // A template is a plan with no client: it opens in the very same editor as
  // «editor-rutina», so the list is the only thing worth measuring here.
  { name: "rutinas", label: "Rutinas (plantillas)", path: () => "/routines" },
  {
    name: "alimentos",
    label: "Alimentos",
    path: () => "/foods",
    details: [{ name: "fila", find: "text=Aguacate" }],
  },
  {
    name: "comidas",
    label: "Comidas",
    path: () => "/meal-templates",
    details: [{ name: "tarjeta", find: "text=Nueva comida" }],
  },
  { name: "menus", label: "Menús", path: () => "/menus" },
  { name: "motivacion", label: "Motivación", path: () => "/quotes" },
  { name: "ajustes", label: "Ajustes", path: () => "/settings" },
  { name: "ayuda", label: "Guía de uso", path: () => "/ayuda" },
];

/**
 * The client's portal, reached through the door link the trainer sends. It was
 * born for the phone, which is exactly why it gets measured like the panel.
 * `path` receives that client's portal token and one of their workout days.
 */
const portal = (tail) => (ids) => ids.token && `/p/${ids.token}${tail}`;

export const PORTAL_ROUTES = [
  { name: "portal-inicio", label: "Portal · Inicio", path: portal("") },
  { name: "portal-rutina", label: "Portal · Rutina", path: portal("/rutina") },
  {
    name: "portal-entreno",
    label: "Portal · Entrenar",
    path: portal("/entreno"),
  },
  {
    name: "portal-sesion",
    label: "Portal · Un día de entreno",
    path: (ids) => ids.dayId && portal(`/entreno/${ids.dayId}`)(ids),
  },
  { name: "portal-dieta", label: "Portal · Dieta", path: portal("/dieta") },
  { name: "portal-peso", label: "Portal · Peso", path: portal("/peso") },
  {
    name: "portal-progreso",
    label: "Portal · Progreso",
    path: portal("/progreso"),
  },
  { name: "portal-fotos", label: "Portal · Fotos", path: portal("/fotos") },
  {
    name: "portal-cuestionario",
    label: "Portal · Cuestionario",
    path: portal("/cuestionario"),
  },
];

/**
 * Runs inside the page. Everything it reports is a measurement of the rendered
 * document, never a guess from the source.
 */
function measure({ tapFloor, typeFloor }) {
  const doc = document.documentElement;
  const viewport = { width: doc.clientWidth, height: window.innerHeight };

  const label = (el) => {
    const classes = String(el.className ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .join(".");
    const text = (el.textContent ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 40);
    return `${el.tagName.toLowerCase()}${classes ? `.${classes}` : ""}${
      text ? ` «${text}»` : ""
    }`;
  };

  // The side menu stays in the document, pushed off to the left, so anything
  // parked outside the screen is not something the trainer can read or press.
  const isVisible = (el) => {
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") return false;
    if (Number(style.opacity) === 0) return false;
    const box = el.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return false;
    return box.right > 0 && box.left < viewport.width;
  };

  const all = [...document.querySelectorAll("body *")];

  // Content inside a box that scrolls or clips is not sticking out of the
  // page: that is the box doing its job.
  const contained = (el) => {
    for (
      let p = el.parentElement;
      p && p !== document.body;
      p = p.parentElement
    ) {
      const overflowX = getComputedStyle(p).overflowX;
      if (overflowX !== "visible") return true;
    }
    return false;
  };

  // 1. The page pushing sideways. A parent sticks out because something inside
  // it does, so only the innermost offenders — the ones with no offending child
  // — are worth naming: those are where the fix goes.
  const over = all.filter((el) => {
    const box = el.getBoundingClientRect();
    return box.width > 0 && box.right > viewport.width + 1 && !contained(el);
  });
  const overSet = new Set(over);
  const sideways = over
    .filter((el) => ![...el.children].some((child) => overSet.has(child)))
    .map((el) => ({
      el: label(el),
      right: Math.round(el.getBoundingClientRect().right),
    }))
    .sort((a, b) => b.right - a.right)
    .slice(0, 6);

  // 2. Content wider than its own box. Dragging it is a scroller; an ellipsis
  // is a deliberate cut; anything else is content simply lost off the edge.
  // A label parked off-screen for a screen reader is neither.
  const boxes = all
    .filter((el) => {
      if (!isVisible(el)) return false;
      const box = el.getBoundingClientRect();
      if (box.width < 24 || box.height < 8) return false;
      return el.scrollWidth > el.clientWidth + 1;
    })
    .map((el) => {
      const style = getComputedStyle(el);
      return {
        el: label(el),
        inner: el.scrollWidth,
        box: el.clientWidth,
        scrollable: style.overflowX === "auto" || style.overflowX === "scroll",
        ellipsis: style.textOverflow === "ellipsis",
      };
    });
  const clipped = boxes.filter((b) => !b.scrollable && !b.ellipsis).slice(0, 6);
  const scrollers = boxes.filter((b) => b.scrollable).slice(0, 6);
  const truncated = boxes.filter((b) => !b.scrollable && b.ellipsis).length;

  // 3. Type under the legible floor, counted where the text actually lives.
  const sizes = new Map();
  for (const el of all) {
    const own = [...el.childNodes].some(
      (node) => node.nodeType === 3 && node.textContent.trim().length > 1,
    );
    if (!own || !isVisible(el)) continue;
    const size =
      Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10;
    const bucket = sizes.get(size) ?? { size, count: 0, samples: [] };
    bucket.count += 1;
    if (bucket.samples.length < 3) bucket.samples.push(label(el));
    sizes.set(size, bucket);
  }
  const tiny = [...sizes.values()]
    .filter((bucket) => bucket.size < typeFloor)
    .sort((a, b) => a.size - b.size);

  // 4. Taps a thumb misses. An inline link inside a paragraph is prose, not a
  // control, so it does not count.
  const controls = [
    ...document.querySelectorAll(
      "button, a[href], input, select, textarea, summary, [role='button'], [role='tab'], [role='switch']",
    ),
  ].filter((el) => isVisible(el) && !el.closest("p"));

  // A checkbox or radio inside its label answers to the whole label, so the
  // label is the target the thumb aims at, not the 16px square.
  const target = (el) =>
    el.matches("input[type=checkbox], input[type=radio]") && el.closest("label")
      ? el.closest("label")
      : el;

  const small = controls
    .map((el) => {
      const box = target(el).getBoundingClientRect();
      return {
        el: label(el),
        w: Math.round(box.width),
        h: Math.round(box.height),
      };
    })
    .filter((hit) => hit.h < tapFloor || hit.w < tapFloor)
    .sort((a, b) => a.h * a.w - b.h * b.w);

  // 5. Thumb reach: how far the page runs, and whether the actions that start
  // the work are only up at the very top.
  const primary = controls
    .filter((el) => el.matches("button, a[href]"))
    .map((el) => {
      const box = el.getBoundingClientRect();
      return { el: label(el), y: Math.round(box.top + window.scrollY) };
    });
  const belowFold = primary.filter((hit) => hit.y > viewport.height).length;

  return {
    viewport,
    scrollWidth: doc.scrollWidth,
    scrollHeight: doc.scrollHeight,
    screens: Math.round((doc.scrollHeight / viewport.height) * 10) / 10,
    sideways,
    clipped,
    scrollers,
    truncated,
    tiny,
    tapTargets: {
      total: controls.length,
      small: small.length,
      worst: small.slice(0, 8),
    },
    actions: { total: primary.length, belowFold, top: primary.slice(0, 4) },
  };
}

/** Walks one screen: loads it, lets the data land, measures, and photographs it. */
export async function auditRoute(page, route, ids, { base, dir }) {
  const path = route.path(ids);
  if (!path) {
    return { ...routeHead(route, path), skipped: "el cliente no tiene esa pieza" };
  }

  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.addStyleTag({
    content: "nextjs-portal { display: none !important }",
  });
  // Lists, photos and exercise names arrive after the first paint.
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, 0));

  const found = await page.evaluate(measure, {
    tapFloor: TAP_FLOOR,
    typeFloor: TYPE_FLOOR,
  });

  // A page tens of screens long blows past what the browser will paint in one
  // image, so the picture stops at ten screens and the number keeps the truth.
  const CEILING = PHONE.height * 10;
  const file = `${dir}/${route.name}.jpg`;
  await page.screenshot({
    path: file,
    type: "jpeg",
    quality: 70,
    fullPage: true,
    ...(found.scrollHeight > CEILING
      ? { clip: { x: 0, y: 0, width: found.viewport.width, height: CEILING } }
      : {}),
  });

  // A page thirteen screens long is unreadable shrunk into one picture, so the
  // spots that decide the verdict get a shot at their real size.
  const details = [];
  for (const detail of route.details ?? []) {
    const target = page.locator(detail.find).locator("visible=true").first();
    const reached = await target
      .scrollIntoViewIfNeeded({ timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (!reached) continue;
    await page.waitForTimeout(600);
    const shot = `${dir}/${route.name}-${detail.name}.jpg`;
    await page.screenshot({ path: shot, type: "jpeg", quality: 80 });
    details.push(shot);
  }

  return { ...routeHead(route, path), shot: file, details, ...found };
}

function routeHead(route, path) {
  return { name: route.name, label: route.label, path };
}

/** One line per screen, so the damage reads at a glance in the terminal. */
export function summarise(report) {
  if (report.skipped) return `omitida (${report.skipped})`;

  const notes = [];
  if (report.scrollWidth > report.viewport.width) {
    notes.push(`se desborda a ${report.scrollWidth}px`);
  }
  if (report.clipped.length) {
    notes.push(`${report.clipped.length} cajas cortadas`);
  }
  if (report.scrollers.length) {
    notes.push(`${report.scrollers.length} scrolls internos`);
  }
  if (report.tiny.length) {
    notes.push(`texto a ${report.tiny.map((t) => `${t.size}px`).join("/")}`);
  }
  if (report.tapTargets.small) {
    notes.push(
      `${report.tapTargets.small}/${report.tapTargets.total} toques < ${TAP_FLOOR}px`,
    );
  }
  notes.push(`${report.screens} pantallas`);
  return notes.join(", ");
}
