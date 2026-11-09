import { useId, type ReactNode } from "react";
import type { journeyStages } from "./journey-stages";
import styles from "./process-objects.module.css";

type Stage = (typeof journeyStages)[number]["name"];
type Point = [x: number, y: number, z: number];

const project = ([x, y, z]: Point) => [260 + (x - y) * .866, 278 + (x + y) * .5 - z];
const outline = (...vertices: Point[]) => vertices.map((point) => project(point).join(",")).join(" ");
const line = (...vertices: Point[]) => "M" + vertices.map((point) => project(point).join(" ")).join("L");

function Solid({ x, y, z, width, depth, height, className }: {
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  className?: string;
}) {
  const right = x + width, front = y + depth, top = z + height;
  return (
    <g className={className}>
      <polygon className={styles.left} points={outline([x, front, z], [right, front, z], [right, front, top], [x, front, top])} />
      <polygon className={styles.right} points={outline([right, y, z], [right, front, z], [right, front, top], [right, y, top])} />
      <polygon className={styles.top} points={outline([x, y, top], [right, y, top], [right, front, top], [x, front, top])} />
    </g>
  );
}

function DrawingDesk() {
  return (
    <>
      <Solid x={-102} y={-56} z={0} width={14} depth={14} height={103} />
      <Solid x={84} y={-56} z={0} width={14} depth={14} height={103} />
      <Solid x={-102} y={47} z={0} width={14} depth={14} height={103} />
      <Solid x={84} y={47} z={0} width={14} depth={14} height={103} />
      <path className={styles.detail} d={line([-96, 61, 34], [90, 61, 34], [90, -49, 34])} />
      <Solid x={-115} y={-71} z={100} width={226} depth={143} height={12} />
      <Solid x={-92} y={-43} z={112} width={145} depth={91} height={2} />
      <g className={styles.blueprint}>
        <polygon className={styles.paper} points={outline([-82,-48,117], [75,-48,117], [75,42,117], [-82,42,117])} />
        <path className={styles.ink} d={line([-69,-35,117],[62,-35,117],[62,29,117],[-69,29,117],[-69,-35,117]) + line([-69,-21,117],[62,-21,117]) + line([-25,-21,117],[-25,29,117]) + line([-58,-9,117],[-37,-9,117]) + line([-58,2,117],[-42,2,117])} />
        <path className={styles.signal} pathLength={1} d={line([-11,15,117], [8,-1,117], [22,7,117], [43,-12,117], [52,-12,117])} />
      </g>
      <g className={styles.ruler}>
        <Solid x={-87} y={45} z={119} width={157} depth={10} height={3} />
        <path className={styles.ink} d={[-67,-48,-29,-10,9,28,47].map((x) => line([x,46,122], [x,51,122])).join("")} />
      </g>
      <Solid x={83} y={-47} z={112} width={15} depth={49} height={6} />
      <path className={styles.signal} d={line([89,-41,119],[89,-10,119])} />
    </>
  );
}

function LaunchPad() {
  return (
    <>
      <Solid x={-104} y={-76} z={0} width={208} depth={152} height={10} />
      <Solid x={-73} y={-51} z={10} width={148} depth={103} height={12} />
      <ellipse className={styles.guide} cx="260" cy="256" rx="72" ry="32" />
      <ellipse className={styles.ink} cx="260" cy="256" rx="49" ry="21" />
      <Solid x={-81} y={-55} z={21} width={16} depth={17} height={129} />
      <path className={styles.ink} d={line([-81,-37,29],[-65,-37,55],[-81,-37,83],[-65,-37,111],[-81,-37,139])} />
      <Solid x={-77} y={-55} z={123} width={61} depth={12} height={7} />
      <path className={styles.detail} d={line([-76,-45,119],[-13,-45,119],[-69,-45,89])} />
      <g className={styles.rocket}>
        <path className={styles.signal} d="M249 233l3 20m6-24 2 34m6-33 2 17" />
        <path className={styles.left} d="M239 194c-12 7-21 22-23 42l24-12m41-30c12 7 21 22 23 42l-24-12" />
        <path className={styles.paper} d="M238 219v-70c0-32 10-56 22-76 13 19 23 44 23 76v70c0 15-45 15-45 0Z" />
        <path className={styles.right} d="M260 74c15 21 23 48 23 76v69c-2 7-9 10-15 10v-83c0-27-2-51-8-72Z" />
        <path className={styles.ink} d="M242 123c11 8 26 8 37 0M238 203c14 8 30 8 45 0" />
        <ellipse className={styles.left} cx="256" cy="161" rx="10" ry="13" />
        <ellipse className={styles.signal} cx="256" cy="161" rx="6" ry="9" />
      </g>
      <path className={styles.signal} d={line([-96,65,10],[-68,65,10]) + line([72,65,10],[96,65,10])} />
    </>
  );
}

function CorrespondenceCabinet() {
  const id = useId();
  const trayClip = `${id}-tray`;
  const sideClip = `${id}-side`;
  return (
    <>
      <Solid x={-91} y={-52} z={0} width={177} depth={111} height={13} />
      <Solid x={-82} y={-50} z={13} width={159} depth={102} height={143} />
      <Solid x={-86} y={-54} z={156} width={168} depth={111} height={8} />
      {[21, 64].map((z) => (
        <g key={z}>
          <Solid x={-73} y={50} z={z} width={137} depth={5} height={32} />
          <path className={styles.ink} d={line([-19,55,z+14],[-19,60,z+14],[17,60,z+14],[17,55,z+14])} />
        </g>
      ))}
      {/* Fixed clips hide the parts of the moving drawer behind the cabinet face. */}
      <defs>
        <clipPath id={sideClip}>
          <polygon points={outline([64,55,104],[64,110,104],[64,110,135],[64,55,135])} />
        </clipPath>
        <clipPath id={trayClip}>
          <polygon points={outline([-73,55,135],[64,55,135],[64,110,135],[-73,110,135])} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${sideClip})`}>
        <polygon className={`${styles.right} ${styles.drawer}`} points={outline([64,17,104],[64,83,104],[64,83,135],[64,17,135])} />
      </g>
      <g clipPath={`url(#${trayClip})`}>
        <g className={styles.drawer}>
          <polygon className={styles.top} points={outline([-73,17,135],[64,17,135],[64,83,135],[-73,83,135])} />
          <polygon className={styles.recess} points={outline([-64,27,135],[55,27,135],[55,74,135],[-64,74,135])} />
          <path className={styles.detail} d={line([-30,27,135],[-30,74,135]) + line([14,27,135],[14,74,135])} />
        </g>
      </g>
      <g className={styles.drawer}>
        <polygon className={styles.left} points={outline([-73,83,104],[64,83,104],[64,83,135],[-73,83,135])} />
        <path className={styles.ink} d={line([-20,83,119],[-20,88,119],[18,88,119],[18,83,119])} />
      </g>
      <g className={styles.letter}>
        <polygon className={styles.paper} points={outline([-32,25,171],[41,25,171],[41,69,171],[-32,69,171])} />
        <path className={styles.signal} d={line([-32,25,171],[5,54,171],[41,25,171])} />
        <path className={styles.detail} d={line([-32,69,171],[-7,48,171]) + line([41,69,171],[17,48,171])} />
      </g>
    </>
  );
}

function ReservationPress() {
  const [dateX, dateY] = project([0, 40, 45]);
  const [handleX, handleY] = project([105, -28, 123]);
  return (
    <>
      <Solid x={-92} y={-69} z={0} width={185} depth={125} height={13} />
      <Solid x={-66} y={-44} z={13} width={132} depth={87} height={31} />
      <path className={styles.detail} d={line([-58,43,26],[56,43,26])} />
      <Solid x={-63} y={-44} z={44} width={25} depth={34} height={112} />
      <g className={styles.ticket}>
        <polygon className={styles.paper} points={outline([-38,6,45],[36,6,45],[36,102,45],[-38,102,45])} />
        <path className={styles.guide} d={line([-37,70,45],[35,70,45])} />
        <g transform={`matrix(.866 .5 -.866 .5 ${dateX} ${dateY})`}>
          <text className={styles.dateInk} textAnchor="middle">
            <tspan x="0" y="-5" fontSize="14">NOV</tspan>
            <tspan x="0" y="18" fontSize="28">18</tspan>
          </text>
        </g>
      </g>
      {/* The ram overlaps the stamp head. The right pillar and beam cover the assembly. */}
      <g className={styles.stamp}>
        <Solid x={-33} y={-23} z={89} width={68} depth={42} height={12} />
        <Solid x={-5} y={-17} z={99} width={11} depth={10} height={56} />
      </g>
      <Solid x={-8} y={-20} z={108} width={17} depth={16} height={48} />
      <Solid x={41} y={-44} z={44} width={24} depth={34} height={112} />
      <Solid x={-65} y={-48} z={155} width={132} depth={45} height={14} />
      <path className={styles.detail} d={line([-55,-49,163],[58,-49,163])} />
      <path className={styles.ink} d={line([61,-21,145],[95,-28,117],[105,-28,123])} />
      <circle className={styles.signalDot} cx={handleX} cy={handleY} r="4" />
    </>
  );
}

function Lookout() {
  return (
    <>
      <Solid x={-78} y={-59} z={0} width={160} depth={116} height={10} />
      <Solid x={-28} y={-30} z={10} width={63} depth={57} height={11} />
      <path className={styles.ink} d="M258 165 221 263m40-98 29 101m-31-101 3 109m-22-63 23 19 18-12" strokeWidth="3" />
      <circle className={styles.left} cx="260" cy="165" r="20" />
      <circle className={styles.paper} cx="260" cy="165" r="12" />
      <g className={styles.scope}>
        <path className={styles.right} d="M182 150h34v33h-34c-13 0-13-33 0-33Z" />
        <path className={styles.paper} d="M210 140h134v53H210c-21 0-21-53 0-53Z" />
        <path className={styles.left} d="M211 181h133v12H211c-5 0-10-5-13-12Z" />
        <path className={styles.detail} d="M218 143c-10 10-11 38 0 48m12-48c-10 10-11 38 0 48m82-49c-11 11-12 39 0 49" />
        <ellipse className={styles.top} cx="344" cy="166.5" rx="14" ry="26.5" />
        <ellipse className={styles.recess} cx="344" cy="166.5" rx="9" ry="19" />
        <path className={styles.signal} d="M346 151c4 8 4 16 1 22" />
      </g>
      <g className={styles.constellation}>
        <path className={styles.guide} d="M356 115 384 96 403 103 425 67 453 74" />
        {[ [356,115], [384,96], [403,103], [425,67], [453,74] ].map(([x,y]) => <circle className={styles.signalDot} key={x} cx={x} cy={y} r={3} />)}
        <path className={styles.signal} d="M425 55v24m-12-12h24" />
      </g>
    </>
  );
}

const objects: Record<Stage, { name: string; draw: () => ReactNode }> = {
  Build: { name: "The drafting table", draw: DrawingDesk },
  Launch: { name: "The launch pad", draw: LaunchPad },
  Respond: { name: "The correspondence cabinet", draw: CorrespondenceCabinet },
  Book: { name: "The reservation press", draw: ReservationPress },
  Improve: { name: "The lookout", draw: Lookout },
};

export function ProcessObject({ stage, active }: { stage: Stage; active: boolean }) {
  const { name, draw: ObjectDrawing } = objects[stage];
  return (
    <figure className={styles.figure} data-active={active} aria-hidden="true">
      <svg className={styles.svg} viewBox="64 18 392 380" fill="none">
        <path className={styles.guide} d={line([-125,97,0],[133,97,0],[133,-94,0]) + line([-125,97,0],[-125,-94,0],[133,-94,0])} />
        <ObjectDrawing />
      </svg>
      <figcaption>{name}</figcaption>
    </figure>
  );
}
