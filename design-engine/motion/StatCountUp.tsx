"use client";
import { useEffect, useRef } from "react";
import { useMotionPolicy } from "./MotionPolicy";
import { countUpDefaults, observeCountUp, type CountUpSettings } from "./count-up";

export function StatCountUp({ value, settings = {}, index = 0, disabled = false }: { value: string; settings?: CountUpSettings; index?: number; disabled?: boolean }) {
  const display = useRef<HTMLSpanElement>(null), policy = useMotionPolicy();
  const { effect = countUpDefaults.effect, duration = countUpDefaults.duration, delay = countUpDefaults.delay, stagger = countUpDefaults.stagger, easing = countUpDefaults.easing, replay = countUpDefaults.replay } = settings;
  useEffect(() => {
    if (!display.current) return;
    return observeCountUp(display.current, value, { effect, duration, delay: delay + index * stagger, easing, replay }, disabled || policy.reduced);
  }, [value, effect, duration, delay, stagger, easing, replay, index, disabled, policy.reduced]);
  return <span className="de-stat-count-up"><span className="de-stat-count-up-reserve" aria-hidden="true">{value}</span><span className="de-stat-count-up-display" aria-hidden="true" ref={display}>{value}</span><span className="de-visually-hidden">{value}</span></span>;
}
