"use client";
/* eslint-disable @next/next/no-img-element -- Private, expiring image URLs are normalized by the upload service. */
import { useLayoutEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Type,
  Heading2,
  ImagePlus,
} from "lucide-react";
import {
  insertStoryBlock,
  type StoryBlock,
} from "@/lib/vigil/blog/visual-story";
import type { BlogImage as Image } from "@/lib/vigil/blog/media-contract";
import { BlogImage } from "./BlogImage";
function StoryText({
  block,
  index,
  disabled,
  active,
  onChange,
  onFocus,
}: {
  block: StoryBlock;
  index: number;
  disabled: boolean;
  active: boolean;
  onChange: (text: string) => void;
  onFocus: () => void;
}) {
  const field = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    if (active) field.current?.focus();
  }, [active]);
  useLayoutEffect(() => {
    const el = field.current;
    if (el) {
      el.style.height = "0px";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [block.text, block.kind]);
  return (
    <textarea
      ref={field}
      aria-label={`${block.kind === "heading" ? "Heading" : "Paragraph"} ${index + 1}`}
      value={block.text}
      rows={1}
      maxLength={60000}
      disabled={disabled}
      placeholder={
        block.kind === "heading"
          ? "Give this section a heading…"
          : "Tell your story…"
      }
      onFocus={onFocus}
      onChange={(event) => onChange(event.target.value)}
      className={`block w-full resize-none overflow-hidden rounded-md border-0 bg-transparent px-2 py-2 text-[color:var(--text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--border)] ${block.kind === "heading" ? "text-2xl font-semibold leading-snug sm:text-3xl" : "text-base leading-8"}`}
    />
  );
}
export function VisualStoryEditor({
  blocks,
  onChange,
  images,
  disabled,
  active,
  onActive,
  onUpload,
}: {
  blocks: StoryBlock[];
  onChange: (blocks: StoryBlock[]) => void;
  images: Image[];
  disabled: boolean;
  active: string | null;
  onActive: (id: string) => void;
  onUpload: () => void;
}) {
  const [photos, setPhotos] = useState(false);
  const add = (kind: "paragraph" | "heading" | "image", text = "") => {
    const block = { id: crypto.randomUUID(), kind, text };
    onChange(insertStoryBlock(blocks, block, active));
    onActive(block.id);
    setPhotos(false);
  };
  const move = (index: number, delta: number) => {
    const next = [...blocks];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  };
  return (
    <section aria-labelledby="story-editor-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="story-editor-title" className="font-semibold">
          Your story
        </h2>
        <span className="text-xs text-[color:var(--text-secondary)]">
          Visual editor
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-[color:var(--border)]">
        <div
          className="flex flex-wrap gap-2 border-b border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-3"
          role="group"
          aria-label="Add to your story"
        >
          <button
            type="button"
            className="btn-secondary flex items-center gap-2 text-sm"
            disabled={disabled}
            onClick={() => add("paragraph")}
          >
            <Type size={16} /> Add text
          </button>
          <button
            type="button"
            className="btn-secondary flex items-center gap-2 text-sm"
            disabled={disabled}
            onClick={() => add("heading")}
          >
            <Heading2 size={16} /> Add heading
          </button>
          <button
            type="button"
            className="btn-secondary flex items-center gap-2 text-sm"
            disabled={disabled}
            aria-expanded={photos}
            onClick={() => setPhotos((value) => !value)}
          >
            <ImagePlus size={16} /> Add photo
          </button>
        </div>
        {photos && (
          <div className="border-b border-[color:var(--border)] p-4">
            <p className="mb-3 text-sm">
              Choose a photo to place in your story.
            </p>
            <button
              type="button"
              className="btn-primary mb-4 text-sm"
              disabled={disabled || images.length >= 10}
              onClick={onUpload}
            >
              Upload a new photo
            </button>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={image.id}
                  disabled={disabled}
                  onClick={() => add("image", image.id)}
                  className="overflow-hidden rounded-lg border border-[color:var(--border)] text-left"
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    width={180}
                    height={120}
                    className="h-28 w-full object-cover"
                  />
                  <span className="block p-2 text-xs">
                    {image.alt || `Photo ${index + 1}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mx-auto max-w-3xl space-y-3 px-3 py-5 sm:px-6 sm:py-7">
          {blocks.map((block, index) => {
            const image =
              block.kind === "image"
                ? images.find((item) => item.id === block.text)
                : undefined;
            return (
              <div
                key={block.id}
                className={`group rounded-lg p-2 ${active === block.id ? "bg-[color:var(--bg-surface-soft)]" : "hover:bg-[color:var(--bg-surface-soft)]"}`}
                onFocus={() => onActive(block.id)}
              >
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-[color:var(--text-secondary)]">
                  <div>
                    {block.kind === "image" ? (
                      <span>Photo</span>
                    ) : (
                      <label className="flex items-center gap-2">
                        <span className="sr-only">
                          Style for section {index + 1}
                        </span>
                        <select
                          aria-label={`Style for section ${index + 1}`}
                          className="rounded-md bg-transparent px-2 py-1"
                          disabled={disabled}
                          value={block.kind}
                          onChange={(event) =>
                            onChange(
                              blocks.map((item) =>
                                item.id === block.id
                                  ? {
                                      ...item,
                                      kind: event.target.value as
                                        | "heading"
                                        | "paragraph",
                                    }
                                  : item,
                              ),
                            )
                          }
                        >
                          <option value="paragraph">Text</option>
                          <option value="heading">Heading</option>
                        </select>
                      </label>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="rounded-md p-2 hover:bg-[color:var(--border)]"
                      aria-label={`Move section ${index + 1} up`}
                      disabled={disabled || index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-2 hover:bg-[color:var(--border)]"
                      aria-label={`Move section ${index + 1} down`}
                      disabled={disabled || index === blocks.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown size={15} />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-2 hover:bg-[color:var(--border)]"
                      aria-label={`Remove section ${index + 1}`}
                      disabled={disabled}
                      onClick={() => {
                        onChange(blocks.filter((item) => item.id !== block.id));
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {block.kind === "image" ? (
                  image ? (
                    <BlogImage image={image} />
                  ) : (
                    <p className="p-4 text-sm">
                      This photo is unavailable. Choose another from your
                      photos.
                    </p>
                  )
                ) : (
                  <StoryText
                    block={block}
                    index={index}
                    disabled={disabled}
                    active={active === block.id}
                    onFocus={() => onActive(block.id)}
                    onChange={(text) =>
                      onChange(
                        blocks.map((item) =>
                          item.id === block.id ? { ...item, text } : item,
                        ),
                      )
                    }
                  />
                )}
              </div>
            );
          })}
          {blocks.length === 0 && (
            <p className="py-8 text-center text-sm text-[color:var(--text-secondary)]">
              Start your story with text, a heading or a photo.
            </p>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-[color:var(--text-secondary)]">
        Click any section to write. Add text, headings or photos above, and use
        the arrows to move them. Save your draft when you’re ready.
      </p>
    </section>
  );
}
