"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import styles from "@/app/(site)/creators/creators.module.css";

/** A recording of the real project intro, loaded only when visible. The still preview always remains available. */
export function CreatorSpotlightPreview({ image, imageAlt, video: source }: { image: string; imageAlt: string; video?: string | null }) {
  const host = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<"idle" | "playing" | "paused" | "ended" | "failed">("idle");
  useEffect(() => {
    const element = video.current;
    if (!element || !source) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = (restart = false) => {
      if (restart) userPaused.current = false;
      if (!visible || motion.matches || document.hidden || userPaused.current) { element.pause(); return; }
      if (element.ended && !restart) return;
      if (!element.getAttribute("src")) { element.src = source; element.load(); }
      if (restart) element.currentTime = 0;
      void element.play().catch(() => setState("paused"));
    };
    const observer = new IntersectionObserver(([entry]) => {
      const inView = entry.isIntersecting && entry.intersectionRatio >= .35;
      const entering = !visible && inView;
      visible = inView;
      sync(entering);
    }, { threshold: .35 });
    if (host.current) observer.observe(host.current);
    const change = () => sync();
    motion.addEventListener("change", change);
    document.addEventListener("visibilitychange", change);
    return () => { observer.disconnect(); element.pause(); motion.removeEventListener("change", change); document.removeEventListener("visibilitychange", change); };
  }, [source]);

  const toggle = () => {
    const element = video.current;
    if (!element || !source) return;
    if (!element.paused) { userPaused.current = true; element.pause(); return; }
    userPaused.current = false;
    if (!element.getAttribute("src")) { element.src = source; element.load(); }
    if (element.ended || state === "idle") element.currentTime = 0;
    void element.play().catch(() => setState("paused"));
  };
  const label = state === "playing" ? "Pause project animation" : state === "paused" ? "Resume project animation" : state === "ended" ? "Replay project animation" : "Play project animation";
  return <div ref={host} className={styles.projectPreview} data-creator-preview data-playback={state}>
    <div className={styles.projectWindow}>
      <div className={styles.projectToolbar}><span aria-hidden="true"><i /><i /><i /></span><span>Scarlen López / Website preview</span><span aria-hidden="true">↗</span></div>
      <div className={styles.projectScreen}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={imageAlt} width={1445} height={900} loading="lazy" className={styles.image} />
        {source ? <video ref={video} muted playsInline preload="none" poster={image} aria-label="Scarlen López’s website startup animation" data-ready={ready} onLoadedData={() => setReady(true)} onPlay={() => setState("playing")} onPause={() => setState(current => current === "ended" || current === "failed" ? current : "paused")} onEnded={() => setState("ended")} onError={() => { setReady(false); setState("failed"); }} /> : null}
      </div>
    </div>
    {source && state !== "failed" ? <button type="button" className={styles.projectPlayback} onClick={toggle}>{state === "playing" ? <Pause size={13} /> : state === "ended" ? <RotateCcw size={13} /> : <Play size={13} />}{label}</button> : null}
  </div>;
}
