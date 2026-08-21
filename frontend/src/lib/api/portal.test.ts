import { portalExportHref, portalPhotoUrl } from "./portal";

describe("portalPhotoUrl", () => {
  const token = "abc123";
  const photoId = "11111111-2222-3333-4444-555555555555";

  it("goes through the token, never through the trainer's endpoint", () => {
    // /api/photos/<id>/file needs a session: from the portal it would be a 401.
    expect(portalPhotoUrl(token, photoId)).toBe(
      `/api/portal/${token}/photos/${photoId}/file`,
    );
  });

  it("asks for the thumbnail when the gallery only needs one", () => {
    expect(portalPhotoUrl(token, photoId, { thumbnail: true })).toBe(
      `/api/portal/${token}/photos/${photoId}/file?thumbnail=true`,
    );
  });
});

describe("portalExportHref", () => {
  it("points at the client's own downloads", () => {
    expect(portalExportHref("abc123", "training-plan", "pdf")).toBe(
      "/api/portal/abc123/training-plan/export/pdf",
    );
  });
});
