import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startVirtueArrival } from "../onboarding/virtue-arrival";

describe("Virtue welcome arrival", () => {
  let frames: Map<number, FrameRequestCallback>;
  let nextFrame: number;
  beforeEach(() => {
    frames = new Map(); nextFrame = 0;
    vi.stubGlobal("window", {
      requestAnimationFrame: (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; },
      cancelAnimationFrame: (id: number) => frames.delete(id),
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  const flushFrame = () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(0)); };
  const centred = { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 };

  it("centres the orb before showing speech, after animation subscriptions mount", async () => {
    let finish!: () => void;
    const controls = { set: vi.fn(), stop: vi.fn(), start: vi.fn(() => new Promise<void>(resolve => { finish = resolve; })) };
    const arrived = vi.fn(() => expect(controls.set).toHaveBeenLastCalledWith(centred));
    startVirtueArrival(controls, { x: 780, y: 540 }, false, arrived);
    expect(controls.start).not.toHaveBeenCalled();
    flushFrame(); expect(arrived).not.toHaveBeenCalled();
    finish(); await Promise.resolve();
    expect(arrived).toHaveBeenCalledOnce();
  });

  it("replays safely after effect cleanup without accepting the interrupted arrival", async () => {
    const finishes: (() => void)[] = [];
    const controls = { set: vi.fn(), stop: vi.fn(), start: vi.fn(() => new Promise<void>(resolve => finishes.push(resolve))) };
    const arrived = vi.fn();
    const cleanup = startVirtueArrival(controls, { x: 780, y: 540 }, false, arrived);
    flushFrame(); cleanup();
    startVirtueArrival(controls, { x: 780, y: 540 }, false, arrived);
    flushFrame(); finishes[0](); await Promise.resolve();
    expect(arrived).not.toHaveBeenCalled();
    finishes[1](); await Promise.resolve();
    expect(arrived).toHaveBeenCalledOnce();
    expect(controls.set).toHaveBeenLastCalledWith(centred);
  });

  it("cancels a queued arrival before mount and honours reduced motion", () => {
    const controls = { set: vi.fn(), stop: vi.fn(), start: vi.fn(async () => {}) }, arrived = vi.fn();
    startVirtueArrival(controls, { x: 10, y: 20 }, false, arrived)();
    flushFrame(); expect(controls.start).not.toHaveBeenCalled(); expect(arrived).not.toHaveBeenCalled();
    startVirtueArrival(controls, { x: 10, y: 20 }, true, arrived);
    flushFrame(); expect(controls.start).not.toHaveBeenCalled();
    expect(controls.set).toHaveBeenLastCalledWith(centred); expect(arrived).toHaveBeenCalledOnce();
  });
});
