import { describe, expect, it } from "vitest";
import {
  readStoryBlocks,
  writeStoryBlocks,
  insertStoryBlock,
} from "../blog/visual-story";
const image = "ba000000-0000-4000-8000-000000000041";
describe("visual authoring of existing drafts", () => {
  it("opens existing headings and photos as visual sections and preserves the stored article", () => {
    const article = `First paragraph.\n\n## A heading\n\nSecond paragraph.\n\n[[image:${image}]]`;
    const sections = readStoryBlocks(article);
    expect(sections.map((s) => s.kind)).toEqual([
      "paragraph",
      "heading",
      "paragraph",
      "image",
    ]);
    expect(sections[1].text).toBe("A heading");
    expect(sections[3].text).toBe(image);
    expect(writeStoryBlocks(sections)).toBe(article);
  });
  it("inserts a photo after the selected paragraph without splitting its words", () => {
    const sections = readStoryBlocks(
      "Keep this sentence together.\n\nThe next paragraph.",
    );
    const result = insertStoryBlock(
      sections,
      { id: "photo", kind: "image", text: image },
      sections[0].id,
    );
    expect(writeStoryBlocks(result)).toBe(
      `Keep this sentence together.\n\n[[image:${image}]]\n\nThe next paragraph.`,
    );
  });
  it("preserves literal HTML as text and supports reordered heading and paragraph sections", () => {
    const blocks = readStoryBlocks("<script>literal</script>\n\n## End");
    expect(writeStoryBlocks([blocks[1], blocks[0]])).toBe(
      "## End\n\n<script>literal</script>",
    );
  });
  it("starts an empty draft with a blank writing section and omits empty additions from storage", () => {
    expect(readStoryBlocks("")[0]).toMatchObject({
      kind: "paragraph",
      text: "",
    });
    expect(writeStoryBlocks(readStoryBlocks(""))).toBe("");
  });
});
