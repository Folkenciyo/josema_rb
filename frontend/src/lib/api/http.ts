/**
 * Thin fetch wrapper for the browser. Requests go to the frontend's own origin and
 * are rewritten to the backend by `next.config.ts`, so the httpOnly session cookie
 * is sent automatically and no CORS handshake is involved.
 */

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: "Los datos enviados no son válidos.",
  401: "Tu sesión ha caducado. Vuelve a iniciar sesión.",
  403: "No tienes permiso para hacer esto.",
  404: "No se ha encontrado el recurso.",
  409: "La operación entra en conflicto con datos existentes.",
  422: "Los datos enviados no son válidos.",
};

/** FastAPI reports errors as `{ detail: string }` or, on validation, `{ detail: [...] }`. */
async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    const detail = (body as { detail?: unknown }).detail;

    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: unknown };
      if (typeof first.msg === "string") {
        return first.msg;
      }
    }
  } catch {
    // Body was empty or not JSON — fall through to the generic message.
  }

  return DEFAULT_MESSAGES[response.status] ?? "Ha ocurrido un error inesperado.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`/api${path}`, {
      credentials: "same-origin",
      ...init,
    });
  } catch {
    throw new ApiError(0, "No se ha podido conectar con el servidor.");
  }

  if (!response.ok) {
    throw new ApiError(response.status, await extractErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function jsonRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  return request<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => jsonRequest<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) =>
    jsonRequest<T>("PATCH", path, body),
  put: <T>(path: string, body?: unknown) => jsonRequest<T>("PUT", path, body),
  delete: <T = void>(path: string) => request<T>(path, { method: "DELETE" }),
  /** Multipart upload — the browser sets the boundary, so no Content-Type here. */
  postForm: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "POST", body: formData }),
  patchForm: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "PATCH", body: formData }),
};
