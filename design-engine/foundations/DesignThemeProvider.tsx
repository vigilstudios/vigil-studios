import type { ReactNode } from "react";
import { getDesignTheme, mergeDesignTokens, themeVariables, type DesignTokenOverrides } from "./themes";
import { getTypographyProfile, typographyVariables, type TypographyProfileId } from "./typography/profiles";
import type { FontBindings, TypographyProfile } from "./typography/types";
import { artDirectionVariables, getArtDirection, type ArtDirection, type ArtDirectionId, type MotionDirection } from "./art-direction";
import { MotionPolicyProvider } from "../motion/MotionPolicy";

export function DesignThemeProvider({ theme = "neutral", overrides, typography, artDirection, fonts, motion, children, className = "" }: {
  theme?: string; overrides?: DesignTokenOverrides;
  typography?: TypographyProfileId | TypographyProfile;
  artDirection?: ArtDirectionId | ArtDirection;
  fonts?: FontBindings;
  motion?: MotionDirection;
  children?: ReactNode; className?: string;
}) {
  const tokens = mergeDesignTokens(getDesignTheme(theme).tokens, overrides);
  const type = typeof typography === "string" ? getTypographyProfile(typography) : typography;
  const art = typeof artDirection === "string" ? getArtDirection(artDirection) : artDirection;
  // Theme supplies brand colors and legacy defaults. Independent profiles own their dimensions.
  const style = { ...themeVariables(tokens), ...(art ? artDirectionVariables(art) : {}), ...(type ? typographyVariables(type, fonts) : {}) };
  return <MotionPolicyProvider mode={motion ?? art?.motion}>
    <div className={`de-root ${className}`} style={style} data-typography={type?.id} data-art-direction={art?.id} data-density={art?.density} data-grid={art?.grid} data-alignment={art?.alignment} data-action={art?.action} data-decoration={art?.decoration} data-motion={motion ?? art?.motion}>{children}</div>
  </MotionPolicyProvider>;
}
