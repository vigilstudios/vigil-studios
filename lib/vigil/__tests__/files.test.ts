import { describe, expect, it } from "vitest";
import { buildEntitlements } from "../entitlements";
import { filePath, kindForType, MB, validateFileBatch, type FileLimits } from "../files";
import { fileLimitsFor } from "../services/project-files";

const limits: FileLimits = { maxCount: 60, maxFileBytes: 500 * MB, maxTotalBytes: 10240 * MB, videoEnabled: true };
const photo = (name = "a.jpg", size = 2 * MB) => ({ name, type: "image/jpeg", size });
const video = (name = "clip.mp4", size = 120 * MB) => ({ name, type: "video/mp4", size });

describe("project file rules", () => {
  it("accepts photos, PDFs and videos within the room", () => {
    expect(validateFileBatch([photo(), video(), { name: "deck.pdf", type: "application/pdf", size: MB }], limits, { count: 10, bytes: 100 * MB })).toEqual([]);
  });

  it("judges the batch as a whole against the count and size limits", () => {
    const [problem] = validateFileBatch([photo("1.jpg"), photo("2.jpg"), photo("3.jpg")], limits, { count: 58, bytes: 0 });
    expect(problem).toMatchObject({ name: "*" });
    expect(problem.reason).toMatch(/Room for 2 more/);
    expect(validateFileBatch([photo()], limits, { count: 60, bytes: 0 })[0].reason).toMatch(/library is full \(60 files\)/);
    expect(validateFileBatch([video("big.mp4", 300 * MB)], limits, { count: 0, bytes: 10000 * MB })[0].reason).toMatch(/out of|past your library/);
  });

  it("names the file that is the wrong type, too large, or a video when video is off", () => {
    expect(validateFileBatch([{ name: "x.exe", type: "application/octet-stream", size: 10 }], limits, { count: 0, bytes: 0 })[0]).toMatchObject({ name: "x.exe" });
    expect(validateFileBatch([video("huge.mp4", 501 * MB)], limits, { count: 0, bytes: 0 })[0].reason).toMatch(/Larger than 500 MB/);
    expect(validateFileBatch([video()], { ...limits, videoEnabled: false }, { count: 0, bytes: 0 })[0].reason).toMatch(/Video is not enabled/);
  });

  it("treats NULL limits as unlimited", () => {
    expect(validateFileBatch([video("v.mp4", 900 * MB)], { maxCount: null, maxFileBytes: null, maxTotalBytes: null, videoEnabled: true }, { count: 5000, bytes: 0 })).toEqual([]);
  });

  it("maps types to library kinds and safe paths", () => {
    expect(kindForType("video/quicktime")).toBe("video");
    expect(kindForType("image/svg+xml")).toBe("logo");
    expect(kindForType("text/html")).toBeNull();
    expect(filePath("org", "proj", "video/mp4", "r1")).toBe("org/proj/r1.mp4");
  });

  it("reads the limits from entitlement rows", () => {
    const ent = buildEntitlements([
      { feature_code: "files.max_count", value: 2000, source: "override", plan_code: null },
      { feature_code: "files.max_file_mb", value: 500, source: "default", plan_code: null },
      { feature_code: "files.max_total_mb", value: null, source: "override", plan_code: null },
      { feature_code: "files.video_enabled", value: true, source: "default", plan_code: null },
    ]);
    expect(fileLimitsFor(ent)).toEqual({ maxCount: 2000, maxFileBytes: 500 * MB, maxTotalBytes: null, videoEnabled: true });
  });
});
