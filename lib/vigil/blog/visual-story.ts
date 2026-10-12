import { imageInBlock, imageMarker } from "./media-contract";
export type StoryBlock = {
  id: string;
  kind: "paragraph" | "heading" | "image";
  text: string;
};
/** Existing storage stays compatible; the author only sees formatted content. */
export function readStoryBlocks(body: string): StoryBlock[] {
  const blocks = body
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .filter((text) => text.trim())
    .map((text, index) => {
      const image = imageInBlock(text);
      return {
        id: `section-${index}`,
        kind: image
          ? "image"
          : text.trim().startsWith("## ")
            ? "heading"
            : "paragraph",
        text:
          image ??
          (text.trim().startsWith("## ") ? text.trim().slice(3) : text.trim()),
      } as StoryBlock;
    });
  return blocks.length
    ? blocks
    : [{ id: "section-0", kind: "paragraph", text: "" }];
}
export function writeStoryBlocks(blocks: StoryBlock[]): string {
  return blocks
    .filter((block) => block.text.trim())
    .map((block) =>
      block.kind === "image"
        ? imageMarker(block.text)
        : block.kind === "heading"
          ? `## ${block.text.replace(/\r?\n/g, " ").trim()}`
          : block.text.trim(),
    )
    .join("\n\n");
}
export function insertStoryBlock(
  blocks: StoryBlock[],
  block: StoryBlock,
  after: string | null,
): StoryBlock[] {
  const index = blocks.findIndex((item) => item.id === after);
  return [
    ...blocks.slice(0, index < 0 ? blocks.length : index + 1),
    block,
    ...blocks.slice(index < 0 ? blocks.length : index + 1),
  ];
}
