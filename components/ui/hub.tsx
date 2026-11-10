"use client";

import type { ComponentProps, CSSProperties } from "react";
import { Hub as HairlineHub } from "@lucasmarkes/hairline/react";

const tokens = {
  "--hairline-plate": "var(--bg-primary)",
  "--hairline-hi": "var(--text-primary)",
  "--hairline-edge": "var(--text-secondary)",
  "--hairline-mid": "color-mix(in oklab, var(--text-secondary) 65%, var(--bg-primary))",
  "--hairline-lo": "color-mix(in oklab, var(--text-secondary) 35%, var(--bg-primary))",
} as CSSProperties;

export default function Hub({ style, ...props }: ComponentProps<typeof HairlineHub>) {
  return <HairlineHub style={{ ...tokens, ...style }} {...props} />;
}
