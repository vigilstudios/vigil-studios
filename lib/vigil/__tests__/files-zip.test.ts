import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { zipEntries, zipStream } from "../services/files-zip";

const file = (kind: string, file_name: string, project: { id: string; name: string } | null = { id: "p1", name: "Website" }, url: string | null = `https://files.test/${kind}/${file_name}`) => ({ kind, file_name, created_at: "2026-09-18T12:00:00Z", url, project });

describe("zipEntries", () => {
  it("files each upload under the customer and its gallery section", () => {
    const entries = zipEntries("Marlow & Fen", [file("photo", "front.jpg"), file("logo", "mark.svg"), file("document", "menu.pdf"), file("weird", "moodboard.png")]);
    expect(entries.map((e) => e.path)).toEqual(["Marlow & Fen/Photos/front.jpg", "Marlow & Fen/Logos/mark.svg", "Marlow & Fen/Documents/menu.pdf", "Marlow & Fen/Inspiration and other/moodboard.png"]);
  });

  it("adds a project folder when there is more than one project, and keeps duplicate names apart", () => {
    const entries = zipEntries("Marlow & Fen", [file("photo", "front.jpg"), file("photo", "front.jpg"), file("photo", "FRONT.jpg"), file("photo", "front.jpg", { id: "p2", name: "Spring menu / 2026" })]);
    expect(entries.map((e) => e.path)).toEqual(["Marlow & Fen/Website/Photos/front.jpg", "Marlow & Fen/Website/Photos/front (2).jpg", "Marlow & Fen/Website/Photos/FRONT (3).jpg", "Marlow & Fen/Spring menu _ 2026/Photos/front.jpg"]);
  });

  it("scrubs path characters out of names and skips files without a link", () => {
    const entries = zipEntries("A:B", [file("photo", "../etc/passwd.jpg"), file("photo", "no-link.jpg", undefined, null)]);
    expect(entries.map((e) => e.path)).toEqual(["A_B/Photos/.._etc_passwd.jpg"]);
  });
});

describe("zipStream", () => {
  const bodies: Record<string, Uint8Array> = { "https://f/a.jpg": new TextEncoder().encode("first file"), "https://f/b.pdf": new Uint8Array(200_000).map((_, i) => i % 251) };
  const fetchFile = async (url: string) => {
    const bytes = bodies[url];
    if (!bytes) return new Response(null, { status: 404 });
    // hand the bytes over in small pieces, as a network would
    const stream = new ReadableStream<Uint8Array>({ start(c) { for (let i = 0; i < bytes.length; i += 7_000) c.enqueue(bytes.slice(i, i + 7_000)); c.close(); } });
    return new Response(stream, { status: 200 });
  };

  it("streams a zip that opens with the files intact", async () => {
    const entries = [{ path: "Cust/Photos/a.jpg", url: "https://f/a.jpg", mtime: new Date("2026-09-18T12:00:00Z") }, { path: "Cust/Documents/b.pdf", url: "https://f/b.pdf", mtime: new Date("2026-09-18T12:00:00Z") }];
    const bytes = new Uint8Array(await new Response(zipStream(entries, fetchFile)).arrayBuffer());
    const zip = await JSZip.loadAsync(bytes);
    expect(Object.keys(zip.files).sort()).toEqual(["Cust/Documents/b.pdf", "Cust/Photos/a.jpg"]);
    expect(await zip.file("Cust/Photos/a.jpg")!.async("string")).toBe("first file");
    expect(new Uint8Array(await zip.file("Cust/Documents/b.pdf")!.async("uint8array"))).toEqual(bodies["https://f/b.pdf"]);
  });

  it("fails the stream when storage refuses a file", async () => {
    const entries = [{ path: "Cust/Photos/missing.jpg", url: "https://f/missing.jpg", mtime: new Date() }];
    await expect(new Response(zipStream(entries, fetchFile)).arrayBuffer()).rejects.toThrow(/storage returned 404/);
  });
});
