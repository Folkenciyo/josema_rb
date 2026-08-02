import { ApiError, api } from "./http";

function mockResponse(
  status: number,
  body?: unknown,
  { rejectJson = false } = {},
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: rejectJson
      ? jest.fn().mockRejectedValue(new Error("not json"))
      : jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("api client", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("prefixes requests with /api and keeps same-origin credentials", async () => {
    fetchMock.mockResolvedValue(mockResponse(200, { id: "1" }));

    await expect(api.get("/clients")).resolves.toEqual({ id: "1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/clients",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("returns undefined for 204 responses without parsing a body", async () => {
    const response = mockResponse(204);
    fetchMock.mockResolvedValue(response);

    await expect(api.delete("/clients/1")).resolves.toBeUndefined();
    expect(response.json).not.toHaveBeenCalled();
  });

  it("surfaces the FastAPI detail string as the error message", async () => {
    fetchMock.mockResolvedValue(mockResponse(403, { detail: "Ejercicio importado" }));

    await expect(api.get("/exercises/1")).rejects.toMatchObject({
      status: 403,
      message: "Ejercicio importado",
    });
  });

  it("surfaces the first message of a validation error list", async () => {
    fetchMock.mockResolvedValue(
      mockResponse(422, { detail: [{ msg: "Falta el campo nombre" }] }),
    );

    await expect(api.post("/clients", {})).rejects.toMatchObject({
      message: "Falta el campo nombre",
    });
  });

  it("falls back to a generic message when the body is not JSON", async () => {
    fetchMock.mockResolvedValue(mockResponse(404, undefined, { rejectJson: true }));

    await expect(api.get("/clients/missing")).rejects.toMatchObject({
      message: "No se ha encontrado el recurso.",
    });
  });

  it("flags 401 responses so the session can be reset", async () => {
    fetchMock.mockResolvedValue(mockResponse(401, { detail: "Not authenticated" }));

    expect.assertions(2);
    await api.get("/auth/me").catch((error: unknown) => {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).isUnauthorized).toBe(true);
    });
  });

  it("reports a connection error when fetch itself fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(api.get("/clients")).rejects.toMatchObject({
      status: 0,
      message: "No se ha podido conectar con el servidor.",
    });
  });
});
