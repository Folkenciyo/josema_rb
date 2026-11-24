/**
 * The phone pass: every screen of the panel and of the client's portal at
 * 390px, with a picture and the numbers next to it.
 *
 *   node scripts/phone-pass.mjs panel    the trainer's panel
 *   node scripts/phone-pass.mjs portal   the portal of the same client
 *   node scripts/phone-pass.mjs          both
 *
 * It needs the app running (`npm run dev`) and a client with an active routine
 * and diet. Pictures and reports land in `qa/`, which git ignores.
 *
 *   APP_URL          defaults to http://localhost:3001
 *   TRAINER_EMAIL    the trainer's login
 *   TRAINER_PASSWORD
 *   CLIENT_NAME      part of the client's name to follow (else the first one)
 */

import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

import {
  PANEL_ROUTES,
  PORTAL_ROUTES,
  PHONE,
  auditRoute,
  summarise,
} from "./mobile-audit.mjs";

const APP = process.env.APP_URL ?? "http://localhost:3001";
const EMAIL = process.env.TRAINER_EMAIL;
const PASSWORD = process.env.TRAINER_PASSWORD;
const CLIENT_NAME = process.env.CLIENT_NAME?.toLowerCase();

if (!EMAIL || !PASSWORD) {
  console.error("Faltan TRAINER_EMAIL y TRAINER_PASSWORD.");
  process.exit(1);
}

async function signIn(page) {
  await page.goto(`${APP}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/dashboard/, { timeout: 30_000 });
}

/** Fetched by the page itself, so the session cookie goes with it. */
function getJson(page, url) {
  return page.evaluate((u) => fetch(u).then((r) => r.json()), url);
}

/** The client the pass follows, and the ids its screens need. */
async function clientIds(page) {
  const clients = await getJson(page, "/api/clients");
  const client =
    clients.find((c) => c.full_name.toLowerCase().includes(CLIENT_NAME ?? "")) ??
    clients[0];
  if (!client) throw new Error("No hay ningún cliente que recorrer.");

  const plans = await getJson(page, `/api/clients/${client.id}/training-plans`);
  const diets = await getJson(page, `/api/clients/${client.id}/diet-plans`);
  const pick = (list) =>
    (list.find((p) => p.status === "active") ?? list[0])?.id;

  return { client: client.id, plan: pick(plans), diet: pick(diets) };
}

async function pass(routes, ids, dir, page) {
  await mkdir(dir, { recursive: true });
  const reports = [];
  for (const route of routes) {
    const report = await auditRoute(page, route, ids, { base: APP, dir });
    reports.push(report);
    console.log(`  ${route.name.padEnd(20)} ${summarise(report)}`);
  }
  await writeFile(`${dir}/informe.json`, JSON.stringify(reports, null, 2));
  console.log(`\n  ${dir}/informe.json`);
}

async function panelPass(browser) {
  const context = await browser.newContext({ viewport: PHONE, ...PHONE });
  const page = await context.newPage();
  await signIn(page);
  await pass(PANEL_ROUTES, await clientIds(page), "qa/panel", page);
  await context.close();
}

/**
 * Reads the door link the client already has and never issues one: a new token
 * would lock them out of the link they saved.
 */
async function portalPass(browser) {
  const context = await browser.newContext({ viewport: PHONE, ...PHONE });
  const page = await context.newPage();
  await signIn(page);

  const { client } = await clientIds(page);
  const token = (await getJson(page, `/api/clients/${client}`)).portal_token;
  if (!token) {
    console.log("  el cliente no tiene enlace al portal: créalo en su ficha");
    await context.close();
    return;
  }
  const days = await getJson(page, `/api/portal/${token}/workout/days`);
  const dayId = Array.isArray(days) ? days[0]?.id : undefined;

  // The client comes in with the link alone, never with the trainer's cookie.
  await context.clearCookies();
  await pass(PORTAL_ROUTES, { token, dayId }, "qa/portal", page);
  await context.close();
}

const what = process.argv[2] ?? "todo";
const browser = await chromium.launch();

if (what === "panel" || what === "todo") {
  console.log("Panel a 390 px:");
  await panelPass(browser);
}
if (what === "portal" || what === "todo") {
  console.log("\nPortal del cliente a 390 px:");
  await portalPass(browser);
}

await browser.close();
