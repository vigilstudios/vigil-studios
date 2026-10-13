import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { WIRE_EDGES, wireRotation, projectWireVertex } from "@/components/site/hero/wire-geometry";

// Independent reference: the geometry and camera used by the previous WebGL renderer.
const v: [number, number][] = [[292.1, 130.44], [339.48, 0.04], [471.68, 0], [296.29, 420.45], [174.58, 420.45], [0.5, 0.5], [132.86, 0.03], [180.42, 132.1], [236.17, 274.69]];
const starNumbers = "488.85 412.76 448.48 412.8 449.91 377.59 419.48 396.62 399.29 361.38 430.03 344.52 399.28 328.33 419.47 292.72 449.93 312.15 448.48 276.64 488.86 276.63 487.78 311.79 517.86 292.74 538.42 328.36 507.26 344.48 538.44 361.37 517.86 396.65 487.77 377.93".split(" ").map(Number);
const star: [number, number][] = [];
for (let i = 0; i < starNumbers.length; i += 2) star.push([starNumbers[i], starNumbers[i + 1]]);

describe("wire mark visual parity", () => {
  it("retains every original extrusion edge", () => {
    [v, star].forEach((points, index) => {
      const shape = new THREE.Shape();
      points.forEach(([x, y], i) => shape[i ? "lineTo" : "moveTo"]((x - 538.44 / 2) / 100, -(y - 420.45 / 2) / 100));
      shape.closePath();
      const solid = new THREE.ExtrudeGeometry(shape, { depth: 0.95, bevelEnabled: false, curveSegments: 1 });
      solid.translate(0, 0, -0.95 / 2);
      const edges = new THREE.EdgesGeometry(solid, 20);
      const original = edges.attributes.position.array;
      expect(WIRE_EDGES[index]).toHaveLength(original.length);
      original.forEach((value, i) => expect(WIRE_EDGES[index][i]).toBeCloseTo(value, 6));
      solid.dispose(); edges.dispose();
    });
  });

  it.each([[1440, 900, 0.34, 0.9], [390, 844, 0.7, 0.7], [1440, 900, 0.24, 1.6]])("matches Three.js perspective through rotation and scroll exit at %s x %s", (width, height, share, lift) => {
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    camera.position.z = 16; camera.updateMatrixWorld();
    const scale = 2 * 16 * Math.tan(Math.PI / 12) * width / height * share / 5.38;
    const focal = height / (2 * Math.tan(Math.PI / 12));
    for (let t = 0; t < 30; t += 3) {
      const exit = t / 30;
      const x = 0.1 + Math.sin(t * 0.35) * 0.08 + 0.4 * 0.14, y = t * 0.22 + 0.3 * 0.22 + exit * 2.4, z = exit * 0.5;
      const transform = new THREE.Matrix4().compose(new THREE.Vector3(0.3 * 0.18, lift - 0.4 * 0.12, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)), new THREE.Vector3(scale, scale, scale));
      for (const edges of WIRE_EDGES) for (let i = 0; i < edges.length; i += 3) {
        // A deterministic scattered vertex also verifies the breakup projection, not just the intact logo.
        const vertex = [edges[i] + exit ** 2 * Math.sin(i), edges[i + 1] + exit ** 2 * Math.cos(i), edges[i + 2] + exit ** 2];
        const reference = new THREE.Vector3(...vertex).applyMatrix4(transform).project(camera);
        const projected = projectWireVertex(vertex, 0, wireRotation(x, y, z), scale, 0.3 * 0.18, lift - 0.4 * 0.12, width, height, focal);
        expect(projected[0]).toBeCloseTo((reference.x + 1) * width / 2, 6);
        expect(projected[1]).toBeCloseTo((1 - reference.y) * height / 2, 6);
      }
    }
  });
});
