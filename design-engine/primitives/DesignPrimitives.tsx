import { VideoPlayer } from "../media/VideoPlayer";
import { isVideoAsset } from "../media/source";
import type { VideoPlayback } from "../media/types";
import type { ReactNode } from "react";
import { VigilIcon } from "../icons/VigilIcon";

export function DesignSection({ children, id, labelledBy, tone = "background", spacing = "regular", className = "" }: {
  children: ReactNode;
  id?: string;
  labelledBy?: string;
  tone?: "background" | "surface" | "elevated";
  spacing?: "compact" | "regular";
  className?: string;
}) {
  return <section id={id} aria-labelledby={labelledBy} className={`de-section de-section--${tone} de-section--${spacing} ${className}`}>{children}</section>;
}

export function DesignStack({ children, direction = "vertical", gap = "regular", align = "stretch", className = "" }: {
  children: ReactNode;
  direction?: "vertical" | "horizontal";
  gap?: "compact" | "regular" | "spacious";
  align?: "start" | "center" | "end" | "stretch";
  className?: string;
}) {
  return <div className={`de-stack de-stack--${direction} de-stack--${gap} de-stack--align-${align} ${className}`}>{children}</div>;
}

export function DesignGrid({ children, columns = 3, className = "" }: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  return <div className={`de-grid de-grid--${columns} ${className}`}>{children}</div>;
}

export function DesignHeading({ children, as: Tag = "h2", scale = "section", id, className = "" }: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "h4";
  scale?: "display" | "section" | "subsection";
  id?: string;
  className?: string;
}) {
  return <Tag id={id} className={`de-heading de-heading--${scale} ${className}`}>{children}</Tag>;
}

export function DesignText({ children, as: Tag = "p", tone = "default", size = "body", className = "" }: {
  children: ReactNode;
  as?: "p" | "span" | "div";
  tone?: "default" | "muted";
  size?: "lead" | "body" | "small";
  className?: string;
}) {
  return <Tag className={`de-text de-text--${tone} de-text--${size} ${className}`}>{children}</Tag>;
}

export function DesignLink({ href, children, treatment = "underline", external = false, className = "" }: {
  href: string;
  children: ReactNode;
  treatment?: "plain" | "underline" | "arrow";
  external?: boolean;
  className?: string;
}) {
  return <a href={href} className={`de-link de-link--${treatment} ${className}`} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
    {children}{treatment === "arrow" ? <VigilIcon name="arrow-up-right" decorative size={16} /> : null}
  </a>;
}

export function DesignBadge({ children, tone = "neutral", className = "" }: {
  children: ReactNode;
  tone?: "neutral" | "accent";
  className?: string;
}) {
  return <span className={`de-badge de-badge--${tone} ${className}`}>{children}</span>;
}

export function DesignCard({ children, as: Tag = "article", treatment = "bordered", className = "" }: {
  children: ReactNode;
  as?: "article" | "div";
  treatment?: "bordered" | "raised" | "flat";
  className?: string;
}) {
  return <Tag className={`de-card de-card--${treatment} ${className}`}>{children}</Tag>;
}

export function DesignMediaFrame({ children, aspect = "wide", caption, className = "" }: {
  children: ReactNode;
  aspect?: "wide" | "square" | "portrait";
  caption?: string;
  className?: string;
}) {
  return <figure className={`de-media-frame de-media-frame--${aspect} ${className}`}>
    <div className="de-media-frame__content">{children}</div>
    {caption ? <figcaption>{caption}</figcaption> : null}
  </figure>;
}

type ImageMedia = {
  playback?: VideoPlayback;
  kind: "image";
  src: string;
  alt: string;
  srcSet?: string;
  sizes?: string;
  loading?: "eager" | "lazy";
  fit?: "cover" | "contain";
};
type VideoMedia = {
  playback?: VideoPlayback;
  kind: "video";
  src: string;
  label: string;
  poster?: string;
  fit?: "cover" | "contain";
};

/** Portable media element: the containing frame reserves its aspect ratio. */
export function DesignMedia(props: ImageMedia | VideoMedia) {
  if (props.kind === "video" || isVideoAsset({src:props.src})) {
    return <VideoPlayer asset={{ src: props.src, alt: props.kind === "video" ? props.label : props.alt, width:1280,height:720,mediaType:"video",playback:{...props.playback,poster:props.kind === "video" ? props.poster : props.playback?.poster} }} imageClassName={`de-media de-media--${props.fit ?? "auto"}`}/>;
  }
  // A native image keeps this package portable across client projects with different image hosts.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`de-media de-media--${props.fit ?? "auto"}`} src={props.src} alt={props.alt} srcSet={props.srcSet} sizes={props.sizes} loading={props.loading ?? "lazy"} decoding="async" />;
}

export function DesignDivider({ className = "" }: { className?: string }) {
  return <hr className={`de-divider ${className}`} />;
}
