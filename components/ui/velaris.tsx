"use client";

import { useEffect, useRef } from "react";
import { clsx } from "clsx";

/**
 * Velaris: an animated simplex-noise field with colour blending, vignette
 * glow and film grain (owner-supplied component, 21st.dev). Kept faithful to
 * the original shader; additions are only about the page around it: pause
 * when scrolled out of view, a single still frame under
 * prefers-reduced-motion, a capped device pixel ratio, palette changes
 * applied in place, and a lost context restored instead of left blank.
 */
const vertexShaderGLSL = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderGLSL = `
precision highp float;
varying vec2 vUv;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_grain;
uniform vec3  u_colors[4];
uniform vec3  u_bg;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  float ratio = u_resolution.x / u_resolution.y;
  vec2 p = uv - 0.5;
  p.x *= ratio;

  float t = u_time * 0.1;

  float n1 = snoise(p * 0.4 + vec2(t * 0.2, -t * 0.3));
  float n2 = snoise(p * 0.55 + vec2(-t * 0.15, t * 0.25) + n1 * 0.25);
  float n3 = snoise(p * 0.75 + vec2(t * 0.1, -t * 0.2) + n2 * 0.2);

  vec3 col = u_bg;

  float dist = length(p) * 1.5;
  float vignette = 1.0 - smoothstep(0.3, 1.2, dist);

  col = mix(col, u_colors[0], smoothstep(-0.2, 0.5, n1) * 0.85);
  col = mix(col, u_colors[1], smoothstep(-0.1, 0.6, n2) * 0.7);
  col = mix(col, u_colors[2], smoothstep(-0.3, 0.4, n3) * 0.6);
  col = mix(col, u_colors[3], smoothstep(0.0, 0.7, n1 * n2) * 0.5);

  float glow = smoothstep(0.8, 0.0, dist) * 0.3;
  col += u_colors[1] * glow;

  col = mix(col * 0.2, col, vignette);

  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + u_time);
  col += (grain - 0.5) * u_grain * 0.1;

  gl_FragColor = vec4(col, 1.0);
}
`;

export interface VelarisProps {
  bg?: string;
  colors?: string[];
  speed?: number;
  grain?: number;
  height?: string;
  className?: string;
  children?: React.ReactNode;
}

export const DEFAULT_COLORS = ["#86efac", "#4ade80", "#059669", "#000000"];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}

type GlState = {
  gl: WebGLRenderingContext;
  lose: WEBGL_lose_context | null;
  locs: { res: WebGLUniformLocation | null; time: WebGLUniformLocation | null; grain: WebGLUniformLocation | null; colors: WebGLUniformLocation | null; bg: WebGLUniformLocation | null } | null;
  /** Deferred loseContext() from the last cleanup; cancelled if the same canvas mounts again. */
  pendingLose: number;
};

const Velaris = ({ bg = "#000000", colors = DEFAULT_COLORS, speed = 2.0, grain = 0.3, height = "100vh", className, children }: VelarisProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const colorsKey = colors.join(",");

  // A canvas only ever has one WebGL context: once it is lost, getContext()
  // keeps handing back the dead one. So the context lives in a ref for the
  // life of the canvas, palette changes update its uniforms in place, and
  // the deliberate loseContext() on unmount is deferred a tick so a remount
  // of the same canvas (StrictMode) can cancel it.
  const stateRef = useRef<GlState | null>(null);
  const paletteRef = useRef({ bg, colorsKey, grain, speed });
  const applyRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let st = stateRef.current;
    if (st) {
      clearTimeout(st.pendingLose);
      st.pendingLose = 0;
    } else {
      const gl = canvas.getContext("webgl", { antialias: false, powerPreference: "low-power" });
      if (!gl) return;
      st = { gl, lose: gl.getExtension("WEBGL_lose_context"), locs: null, pendingLose: 0 };
      stateRef.current = st;
    }
    const { gl } = st;

    let raf = 0;
    let visible = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const render = (t: number) => {
      raf = 0;
      if (!st.locs || gl.isContextLost()) return;
      gl.uniform1f(st.locs.time, t * 0.001 * paletteRef.current.speed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (visible && !reduce.matches) raf = requestAnimationFrame(render);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    const resize = () => {
      if (!st.locs) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(container.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(container.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(st.locs.res, canvas.width, canvas.height);
    };

    // Colours and grain do not change per frame; set them when they change.
    const applyPalette = () => {
      if (!st.locs) return;
      const p = paletteRef.current;
      gl.uniform1f(st.locs.grain, p.grain);
      gl.uniform3f(st.locs.bg, ...hexToRgb(p.bg));
      gl.uniform3fv(st.locs.colors, new Float32Array(p.colorsKey.split(",").slice(0, 4).flatMap(hexToRgb)));
      kick();
    };
    applyRef.current = applyPalette;

    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    // Everything that lives on the context: once per context, and again
    // after the browser restores a lost one.
    const setup = () => {
      const program = gl.createProgram()!;
      gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexShaderGLSL));
      gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentShaderGLSL));
      gl.linkProgram(program);
      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

      const pos = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

      st.locs = {
        res: gl.getUniformLocation(program, "u_resolution"),
        time: gl.getUniformLocation(program, "u_time"),
        grain: gl.getUniformLocation(program, "u_grain"),
        colors: gl.getUniformLocation(program, "u_colors"),
        bg: gl.getUniformLocation(program, "u_bg"),
      };
      applyPalette();
      resize();
      kick();
    };

    const onLost = (e: Event) => {
      // Let the browser hand the context back when it can (it will not
      // unless the loss event is cancelled).
      e.preventDefault();
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      st.locs = null;
    };
    const onRestored = () => setup();
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    if (st.locs && !gl.isContextLost()) {
      applyPalette();
      resize();
      kick();
    } else if (!gl.isContextLost()) {
      setup();
    }

    const ro = new ResizeObserver(() => {
      resize();
      kick();
    });
    ro.observe(container);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(container);
    reduce.addEventListener("change", kick);

    return () => {
      ro.disconnect();
      io.disconnect();
      reduce.removeEventListener("change", kick);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      if (raf) cancelAnimationFrame(raf);
      applyRef.current = null;
      st.pendingLose = window.setTimeout(() => {
        if (!gl.isContextLost()) st.lose?.loseContext();
        if (stateRef.current === st) stateRef.current = null;
      }, 0);
    };
  }, []);

  useEffect(() => {
    paletteRef.current = { bg, colorsKey, grain, speed };
    applyRef.current?.();
  }, [bg, colorsKey, grain, speed]);

  return (
    <div ref={containerRef} style={{ height }} className={clsx("relative w-full overflow-hidden", className)}>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
};

export default Velaris;
