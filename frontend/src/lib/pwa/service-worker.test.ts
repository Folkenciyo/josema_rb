/**
 * @jest-environment node
 *
 * The worker is a plain script in `public/`, so it is loaded here into a fake
 * service worker scope. What is tested is the routing: which requests are
 * answered from the caches when the gym has no coverage, and which must never be.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ORIGIN = "https://josema.fholk.com";

type FakeRequest = { method: string; url: string; mode?: string };

interface FakeEvent {
  request: FakeRequest;
  respondWith: (response: Promise<Response>) => void;
  waitUntil: (work: Promise<unknown>) => void;
}

type Handler = (event: FakeEvent) => void;

function keyOf(request: { url: string } | string): string {
  return typeof request === "string"
    ? new URL(request, ORIGIN).href
    : request.url;
}

/** Same-origin responses reach a worker as `basic`; the worker refuses the rest. */
function sameOriginResponse(body: string): Response {
  const response = new Response(body);
  Object.defineProperty(response, "type", { value: "basic" });
  return response;
}

/** Inside a worker a relative URL resolves against the scope, not against nothing. */
class ScopedRequest {
  readonly url: string;
  readonly method = "GET";

  constructor(input: string) {
    this.url = new URL(input, ORIGIN).href;
  }
}

function loadWorker(fetchStub: jest.Mock) {
  const listeners = new Map<string, Handler>();
  const caches = new Map<string, Map<string, Response>>();

  function openCache(name: string) {
    const store = caches.get(name) ?? new Map<string, Response>();
    caches.set(name, store);
    return {
      put: async (request: { url: string }, response: Response) => {
        store.set(keyOf(request), response);
      },
      match: async (request: { url: string }) => store.get(keyOf(request)),
      add: async (request: { url: string }) => {
        store.set(keyOf(request), await fetchStub(request));
      },
      keys: async () => [...store.keys()].map((url) => ({ url })),
      delete: async (request: { url: string }) => store.delete(keyOf(request)),
    };
  }

  const cacheStorage = {
    open: async (name: string) => openCache(name),
    match: async (request: { url: string } | string) => {
      for (const store of caches.values()) {
        const hit = store.get(keyOf(request));
        if (hit) {
          return hit;
        }
      }
      return undefined;
    },
    keys: async () => [...caches.keys()],
    delete: async (name: string) => caches.delete(name),
  };

  const scope = {
    addEventListener: (type: string, handler: Handler) => {
      listeners.set(type, handler);
    },
    location: { origin: ORIGIN },
    clients: { claim: jest.fn() },
  };

  const source = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");
  new Function(
    "self",
    "caches",
    "fetch",
    "Request",
    "Response",
    "URL",
    "AbortController",
    "setTimeout",
    "clearTimeout",
    source,
  )(
    scope,
    cacheStorage,
    fetchStub,
    ScopedRequest,
    Response,
    URL,
    AbortController,
    setTimeout,
    clearTimeout,
  );

  return listeners;
}

function dispatch(
  handler: Handler,
  url: string,
  { method = "GET", mode = "cors" } = {},
): Promise<Response> | null {
  let answered: Promise<Response> | null = null;
  handler({
    request: { method, url, mode },
    respondWith: (response) => {
      answered = response;
    },
    waitUntil: () => {},
  });
  return answered;
}

/** Runs the install step and waits for the work it hands to `waitUntil`. */
async function install(handler: Handler): Promise<void> {
  const pending: Promise<unknown>[] = [];
  handler({
    request: { method: "GET", url: `${ORIGIN}/` },
    respondWith: () => {},
    waitUntil: (work) => {
      pending.push(work);
    },
  });
  await Promise.all(pending);
}

/** Delivers a `postMessage` and waits for the work it hands to `waitUntil`. */
async function message(handler: Handler, data: unknown): Promise<void> {
  const pending: Promise<unknown>[] = [];
  (
    handler as unknown as (event: {
      data: unknown;
      waitUntil: (w: Promise<unknown>) => void;
    }) => void
  )({
    data,
    waitUntil: (work) => {
      pending.push(work);
    },
  });
  await Promise.all(pending);
}

describe("service worker routing", () => {
  const offline = () => Promise.reject(new Error("offline"));
  let fetchStub: jest.Mock;
  let onFetch: Handler;
  let onInstall: Handler;
  let onMessage: Handler;

  beforeEach(() => {
    fetchStub = jest.fn();
    const listeners = loadWorker(fetchStub);
    onFetch = listeners.get("fetch")!;
    onInstall = listeners.get("install")!;
    onMessage = listeners.get("message")!;
  });

  it("never touches writes: a weigh-in always goes to the network", () => {
    const answered = dispatch(
      onFetch,
      `${ORIGIN}/api/portal/abc/measurements`,
      {
        method: "POST",
      },
    );

    expect(answered).toBeNull();
  });

  it("ignores other origins", () => {
    expect(dispatch(onFetch, "https://example.com/thing.png")).toBeNull();
  });

  it("serves the plan from the last visit when the network is gone", async () => {
    const url = `${ORIGIN}/api/portal/abc/training-plan`;
    fetchStub.mockResolvedValueOnce(sameOriginResponse('{"plan":"ok"}'));
    await dispatch(onFetch, url);

    fetchStub.mockImplementation(offline);
    const response = await dispatch(onFetch, url)!;

    expect(await response.text()).toBe('{"plan":"ok"}');
  });

  it("prefers the network while there is coverage", async () => {
    const url = `${ORIGIN}/api/portal/abc/training-plan`;
    fetchStub.mockResolvedValueOnce(sameOriginResponse("old"));
    await dispatch(onFetch, url);

    fetchStub.mockResolvedValueOnce(sameOriginResponse("fresh"));
    const response = await dispatch(onFetch, url)!;

    expect(await response.text()).toBe("fresh");
  });

  it("falls back to the offline page for a screen never opened before", async () => {
    fetchStub.mockResolvedValueOnce(sameOriginResponse("Estás sin conexión"));
    await install(onInstall);

    fetchStub.mockImplementation(offline);
    const response = await dispatch(onFetch, `${ORIGIN}/clients`, {
      mode: "navigate",
    })!;

    expect(await response.text()).toBe("Estás sin conexión");
  });

  it("keeps tapping between screens working offline", async () => {
    // A tap fetches the route payload; it never goes through a navigation.
    const url = `${ORIGIN}/p/abc/rutina?_rsc=1a2b3c`;
    fetchStub.mockResolvedValueOnce(sameOriginResponse("payload"));
    await dispatch(onFetch, url);

    fetchStub.mockImplementation(offline);
    const response = await dispatch(onFetch, url)!;

    expect(await response.text()).toBe("payload");
  });

  it("answers a fingerprinted asset from the cache without asking again", async () => {
    const url = `${ORIGIN}/_next/static/chunks/app.js`;
    fetchStub.mockResolvedValueOnce(sameOriginResponse("chunk"));
    await dispatch(onFetch, url);

    const response = await dispatch(onFetch, url)!;

    expect(await response.text()).toBe("chunk");
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["the session", `${ORIGIN}/api/auth/me`],
    ["a PDF download", `${ORIGIN}/api/portal/abc/training-plan/export/pdf`],
  ])("leaves %s out of the caches", (_label, url) => {
    expect(dispatch(onFetch, url)).toBeNull();
  });

  it("forgets everything read while signed in, but keeps the offline page", async () => {
    fetchStub.mockResolvedValueOnce(sameOriginResponse("Estás sin conexión"));
    await install(onInstall);
    fetchStub.mockResolvedValueOnce(
      sameOriginResponse("<html>clientes</html>"),
    );
    await dispatch(onFetch, `${ORIGIN}/clients`, { mode: "navigate" });
    fetchStub.mockResolvedValueOnce(sameOriginResponse('["Laura"]'));
    await dispatch(onFetch, `${ORIGIN}/api/clients`);

    await message(onMessage, { type: "CLEAR_PRIVATE_CACHES" });

    fetchStub.mockImplementation(offline);
    const page = await dispatch(onFetch, `${ORIGIN}/clients`, {
      mode: "navigate",
    })!;
    const data = await dispatch(onFetch, `${ORIGIN}/api/clients`)!;

    expect(await page.text()).toBe("Estás sin conexión");
    expect(data.status).toBe(503);
  });
});
