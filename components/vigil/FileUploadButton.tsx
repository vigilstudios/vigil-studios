"use client";

import type { ReactNode } from "react";
import { clsx } from "clsx";

type FileUploadButtonProps = {
  ariaLabel: string;
  accept: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  id?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
};

/**
 * Keeps the native file control inside the visible upload button.
 *
 * Native file inputs must not be visually hidden elsewhere in the document.
 * Some browsers scroll a focused, off-screen input beyond the page bounds.
 */
export function FileUploadButton({ ariaLabel, accept, children, className, disabled = false, id, multiple = false, onFiles }: FileUploadButtonProps) {
  return (
    <label
      aria-disabled={disabled}
      className={clsx(
        "relative inline-flex max-w-full cursor-pointer overflow-hidden disabled:cursor-not-allowed",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      {children}
      <input
        id={id}
        aria-label={ariaLabel}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) onFiles(files);
        }}
      />
    </label>
  );
}
