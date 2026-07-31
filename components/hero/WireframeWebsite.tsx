"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";

/** Fraction of the canvas the frame occupies, leaving headroom for the tilt. */
const FILL = 0.9;

export type WireframeVariant = "desktop" | "phone";

export type FrameRect = {
  /** Frame width as a fraction of canvas width. */
  widthPct: number;
  /** Frame height as a fraction of canvas height. */
  heightPct: number;
  /** Distance from frame top to the content area, as a fraction of frame height. */
  contentTopPct: number;
};

type BuildElement =
  | { kind: "rule"; x: number; y: number; w: number; accent?: boolean; opacity: number; start: number }
  | { kind: "fill"; x: number; y: number; w: number; h: number; accent?: boolean; opacity: number; start: number }
  | { kind: "outline"; x: number; y: number; w: number; h: number; accent?: boolean; opacity: number; start: number }
  | { kind: "card"; x: number; y: number; w: number; h: number; start: number };

type Layout = {
  frameW: number;
  frameH: number;
  /** Y of the divider between chrome and content. */
  dividerY: number;
  elements: BuildElement[];
};

const LAYOUTS: Record<WireframeVariant, Layout> = {
  desktop: {
    frameW: 4.4,
    frameH: 2.9,
    dividerY: 1.16,
    elements: [
      // Nav
      { kind: "fill", x: -1.85, y: 0.98, w: 0.18, h: 0.18, accent: true, opacity: 0.7, start: 0 },
      { kind: "rule", x: 0.95, y: 0.98, w: 0.32, opacity: 0.6, start: 0.04 },
      { kind: "rule", x: 1.4, y: 0.98, w: 0.32, opacity: 0.6, start: 0.07 },
      { kind: "rule", x: 1.85, y: 0.98, w: 0.32, accent: true, opacity: 0.75, start: 0.1 },
      // Headline
      { kind: "rule", x: -0.5, y: 0.58, w: 2.7, opacity: 0.85, start: 0.18 },
      { kind: "rule", x: -0.75, y: 0.34, w: 1.9, accent: true, opacity: 0.9, start: 0.24 },
      // Paragraph
      { kind: "rule", x: -0.4, y: 0.04, w: 3.1, opacity: 0.35, start: 0.33 },
      { kind: "rule", x: -0.55, y: -0.14, w: 2.6, opacity: 0.35, start: 0.38 },
      // CTAs
      { kind: "fill", x: -1.35, y: -0.46, w: 0.95, h: 0.28, accent: true, opacity: 0.85, start: 0.47 },
      { kind: "outline", x: -0.25, y: -0.46, w: 0.85, h: 0.28, opacity: 0.5, start: 0.53 },
      // Card row
      { kind: "card", x: -1.35, y: -1.0, w: 1.15, h: 0.75, start: 0.66 },
      { kind: "card", x: 0, y: -1.0, w: 1.15, h: 0.75, start: 0.72 },
      { kind: "card", x: 1.35, y: -1.0, w: 1.15, h: 0.75, start: 0.78 },
    ],
  },
  phone: {
    frameW: 2.6,
    frameH: 4.6,
    dividerY: 2.0,
    elements: [
      // Nav: logo + hamburger
      { kind: "fill", x: -1.05, y: 1.78, w: 0.17, h: 0.17, accent: true, opacity: 0.7, start: 0 },
      { kind: "rule", x: 1.05, y: 1.84, w: 0.24, opacity: 0.6, start: 0.04 },
      { kind: "rule", x: 1.05, y: 1.78, w: 0.24, opacity: 0.6, start: 0.06 },
      { kind: "rule", x: 1.05, y: 1.72, w: 0.24, accent: true, opacity: 0.75, start: 0.08 },
      // Headline
      { kind: "rule", x: -0.2, y: 1.4, w: 1.9, opacity: 0.85, start: 0.18 },
      { kind: "rule", x: -0.4, y: 1.16, w: 1.5, opacity: 0.85, start: 0.23 },
      { kind: "rule", x: -0.55, y: 0.92, w: 1.2, accent: true, opacity: 0.9, start: 0.28 },
      // Paragraph
      { kind: "rule", x: -0.1, y: 0.6, w: 2.1, opacity: 0.35, start: 0.35 },
      { kind: "rule", x: -0.25, y: 0.42, w: 1.8, opacity: 0.35, start: 0.39 },
      // CTAs stack on a phone
      { kind: "fill", x: -0.3, y: 0.06, w: 1.6, h: 0.26, accent: true, opacity: 0.85, start: 0.47 },
      { kind: "outline", x: -0.3, y: -0.28, w: 1.6, h: 0.26, opacity: 0.5, start: 0.53 },
      // Cards stack too, clearing the home indicator at the bottom
      { kind: "card", x: 0, y: -0.7, w: 2.1, h: 0.48, start: 0.66 },
      { kind: "card", x: 0, y: -1.26, w: 2.1, h: 0.48, start: 0.72 },
      { kind: "card", x: 0, y: -1.82, w: 2.1, h: 0.48, start: 0.78 },
    ],
  },
};

/** How long each element takes to draw itself in, in build-progress units. */
const REVEAL_DURATION = 0.14;

/**
 * Where the frame lands inside the canvas, derived purely from the canvas aspect
 * ratio. The scene fits itself with the same math, so the HTML overlay can be
 * positioned before the (dynamically imported) canvas has even mounted.
 */
export function computeFrameRect(aspect: number, variant: WireframeVariant): FrameRect {
  const { frameW, frameH, dividerY } = LAYOUTS[variant];
  const scale = Math.min((aspect * FILL) / frameW, FILL / frameH);
  return {
    widthPct: (frameW * scale) / aspect,
    heightPct: frameH * scale,
    contentTopPct: (frameH / 2 - dividerY) / frameH,
  };
}

type SceneColors = {
  line: string;
  accent: string;
};

type WireframeWebsiteProps = {
  /** 0 → 1 across the "website builds itself" phase. */
  buildProgress: MotionValue<number>;
  reducedMotion: boolean;
  colors: SceneColors;
  variant: WireframeVariant;
};

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

type MaybeMaterial = THREE.Object3D & { material?: THREE.Material };

/**
 * Scales + fades its children in as buildProgress passes [start, end].
 * Position lives on this group so elements grow from their own center.
 */
function Reveal({
  start,
  end,
  progress,
  position,
  mode = "grow",
  children,
}: {
  start: number;
  end: number;
  progress: MotionValue<number>;
  position: [number, number, number];
  mode?: "grow" | "draw";
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    const group = ref.current;
    if (!group) return;

    const t = smoothstep(start, end, progress.get());

    if (mode === "draw") {
      group.scale.set(Math.max(t, 0.0001), 1, 1);
    } else {
      group.scale.setScalar(Math.max(t, 0.0001));
    }

    group.traverse((object) => {
      const material = (object as MaybeMaterial).material;
      if (!material || !("opacity" in material)) return;
      const target = material as THREE.Material & { opacity: number };
      if (target.userData.baseOpacity === undefined) {
        target.userData.baseOpacity = target.opacity;
      }
      target.opacity = (target.userData.baseOpacity as number) * t;
    });
  });

  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
}

function RectOutline({
  width,
  height,
  color,
  opacity = 0.9,
}: {
  width: number;
  height: number;
  color: string;
  opacity?: number;
}) {
  const line = useMemo(() => {
    const w = width / 2;
    const h = height / 2;
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-w, -h, 0),
      new THREE.Vector3(w, -h, 0),
      new THREE.Vector3(w, h, 0),
      new THREE.Vector3(-w, h, 0),
      new THREE.Vector3(-w, -h, 0),
    ]);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    return new THREE.Line(geometry, material);
  }, [width, height, color, opacity]);

  return <primitive object={line} />;
}

/** A horizontal rule centered on its own origin. */
function Rule({ width, color, opacity = 0.9 }: { width: number; color: string; opacity?: number }) {
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-width / 2, 0, 0),
      new THREE.Vector3(width / 2, 0, 0),
    ]);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    return new THREE.Line(geometry, material);
  }, [width, color, opacity]);

  return <primitive object={line} />;
}

function FillRect({
  width,
  height,
  color,
  opacity = 0.8,
}: {
  width: number;
  height: number;
  color: string;
  opacity?: number;
}) {
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

function Dot({ radius, color, opacity = 0.7 }: { radius: number; color: string; opacity?: number }) {
  return (
    <mesh>
      <circleGeometry args={[radius, 16]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

/** A wireframe content card: outlined box with an icon and two text rules. */
function Card({
  w,
  h,
  line,
  accent,
}: {
  w: number;
  h: number;
  line: string;
  accent: string;
}) {
  const icon = Math.min(h * 0.32, w * 0.16);
  const margin = icon * 0.6;
  const rule1 = w * 0.62;
  const rule2 = w * 0.44;

  return (
    <>
      <RectOutline width={w} height={h} color={line} opacity={0.55} />
      <group position={[-w / 2 + margin + icon / 2, h / 2 - margin - icon / 2, 0]}>
        <FillRect width={icon} height={icon} color={accent} opacity={0.5} />
      </group>
      <group position={[-w / 2 + margin + rule1 / 2, -h * 0.05, 0]}>
        <Rule width={rule1} color={line} opacity={0.4} />
      </group>
      <group position={[-w / 2 + margin + rule2 / 2, -h * 0.28, 0]}>
        <Rule width={rule2} color={line} opacity={0.3} />
      </group>
    </>
  );
}

export function WireframeWebsite({
  buildProgress,
  reducedMotion,
  colors,
  variant,
}: WireframeWebsiteProps) {
  const outerRef = useRef<THREE.Group>(null);
  const rotation = useRef({ y: 0, x: 0 });
  const viewport = useThree((state) => state.viewport);

  const layout = LAYOUTS[variant];
  const { frameW, frameH, dividerY } = layout;

  // Scale the frame to fill the canvas without ever cropping. Must stay in sync
  // with computeFrameRect(), which positions the HTML overlay.
  const fitScale = useMemo(
    () => Math.min((viewport.width * FILL) / frameW, (viewport.height * FILL) / frameH),
    [viewport.width, viewport.height, frameW, frameH]
  );

  useFrame((state, delta) => {
    if (!outerRef.current) return;

    // The frame sits perfectly face-on while the hero copy is overlaid on it,
    // then gains depth and life once the build phase takes over.
    const build = THREE.MathUtils.clamp(buildProgress.get(), 0, 1);
    const life = reducedMotion ? 0 : smoothstep(0, 0.25, build);

    const pointerX = THREE.MathUtils.clamp(state.pointer.x, -1, 1);
    const pointerY = THREE.MathUtils.clamp(state.pointer.y, -1, 1);

    const idle = Math.sin(state.clock.elapsedTime * 0.35) * 0.05;
    const targetY = life * (idle + pointerX * 0.1 - build * 0.16);
    const targetX = life * (0.06 - pointerY * 0.05);

    rotation.current.y = THREE.MathUtils.damp(rotation.current.y, targetY, 4, delta);
    rotation.current.x = THREE.MathUtils.damp(rotation.current.x, targetX, 4, delta);

    outerRef.current.rotation.y = rotation.current.y;
    outerRef.current.rotation.x = rotation.current.x;
    outerRef.current.position.y = life * Math.sin(state.clock.elapsedTime * 0.5) * 0.04;
  });

  const { line, accent } = colors;
  const halfH = frameH / 2;
  const chromeMid = (halfH + dividerY) / 2;

  return (
    <group ref={outerRef} scale={fitScale}>
      {/* Device frame */}
      <RectOutline width={frameW} height={frameH} color={line} opacity={0.85} />

      {/* Chrome divider */}
      <group position={[0, dividerY, 0]}>
        <Rule width={frameW} color={line} opacity={0.5} />
      </group>

      {variant === "desktop" ? (
        <>
          {/* Traffic lights */}
          <group position={[-1.95, chromeMid, 0.01]}>
            <Dot radius={0.035} color={accent} opacity={0.8} />
          </group>
          <group position={[-1.79, chromeMid, 0.01]}>
            <Dot radius={0.035} color={line} opacity={0.4} />
          </group>
          <group position={[-1.63, chromeMid, 0.01]}>
            <Dot radius={0.035} color={line} opacity={0.4} />
          </group>
          {/* Address bar */}
          <group position={[0.55, chromeMid, 0]}>
            <RectOutline width={2.2} height={0.24} color={line} opacity={0.35} />
          </group>
        </>
      ) : (
        <>
          {/* Notch / speaker pill */}
          <group position={[0, chromeMid, 0.01]}>
            <FillRect width={0.62} height={0.075} color={line} opacity={0.35} />
          </group>
          {/* Home indicator */}
          <group position={[0, -halfH + 0.16, 0.01]}>
            <FillRect width={0.7} height={0.045} color={line} opacity={0.35} />
          </group>
        </>
      )}

      {/* --- Build sequence --- */}
      {layout.elements.map((element, index) => {
        const key = `${variant}-${index}`;
        const reveal = {
          progress: buildProgress,
          start: element.start,
          end: element.start + REVEAL_DURATION,
        };
        const color = element.kind !== "card" && element.accent ? accent : line;

        if (element.kind === "rule") {
          return (
            <Reveal key={key} {...reveal} position={[element.x, element.y, 0]} mode="draw">
              <Rule width={element.w} color={color} opacity={element.opacity} />
            </Reveal>
          );
        }

        if (element.kind === "fill") {
          return (
            <Reveal key={key} {...reveal} position={[element.x, element.y, 0]}>
              <FillRect
                width={element.w}
                height={element.h}
                color={color}
                opacity={element.opacity}
              />
            </Reveal>
          );
        }

        if (element.kind === "outline") {
          return (
            <Reveal key={key} {...reveal} position={[element.x, element.y, 0]}>
              <RectOutline
                width={element.w}
                height={element.h}
                color={color}
                opacity={element.opacity}
              />
            </Reveal>
          );
        }

        return (
          <Reveal key={key} {...reveal} position={[element.x, element.y, 0]}>
            <Card w={element.w} h={element.h} line={line} accent={accent} />
          </Reveal>
        );
      })}
    </group>
  );
}
