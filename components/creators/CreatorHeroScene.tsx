"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Heart, MessageCircle, ThumbsUp } from "lucide-react";
import styles from "@/app/(site)/creators/creators.module.css";

type Popup = { id: number; type: number; x: number; y: number; emoji: string };
const emojis = ["💗", "😍", "✨", "🔥", "💬", "👀", "🥰", "💕"];

/** Random decorative reactions; no invented metrics, timers stop offscreen or with reduced motion. */
export function CreatorHeroScene() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cancel = () => { if (timer) clearTimeout(timer); };
    const schedule = () => {
      cancel();
      if (motion.matches || !visible || document.hidden) return;
      timer = setTimeout(() => {
        const zone = Math.floor(Math.random() * 4);
        const x = zone === 0 ? 5 + Math.random() * 8 : zone === 1 ? 87 + Math.random() * 8 : 16 + Math.random() * 68;
        const y = zone === 2 ? 5 + Math.random() * 10 : zone === 3 ? 82 + Math.random() * 7 : 22 + Math.random() * 48;
        const popup = { id: ++nextId.current, type: Math.floor(Math.random() * 5), x, y, emoji: emojis[Math.floor(Math.random() * emojis.length)] };
        setPopups(current => [...current.slice(-5), popup]);
        schedule();
      }, 500 + Math.random() * 650);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); });
    if (ref.current) observer.observe(ref.current);
    motion.addEventListener("change", schedule);
    document.addEventListener("visibilitychange", schedule);
    schedule();
    return () => { cancel(); observer.disconnect(); motion.removeEventListener("change", schedule); document.removeEventListener("visibilitychange", schedule); };
  }, []);
  return <div ref={ref} className={styles.scene} data-creator-scene>
    <div className={styles.engagement} aria-hidden="true" data-creator-reactions>
      {popups.map(popup => <span key={popup.id} data-reaction={popup.id} className={`${styles.reaction} ${popup.type === 0 ? styles.emoji : styles.bubble}`} style={{ left: `${popup.x}%`, top: `${popup.y}%` }} onAnimationEnd={() => setPopups(current => current.filter(item => item.id !== popup.id))}>
        {popup.type === 0 ? popup.emoji : popup.type === 1 ? <><Heart size={16} fill="currentColor" />Love this</> : popup.type === 2 ? <><ThumbsUp size={16} />Likes</> : popup.type === 3 ? <><MessageCircle size={16} />Comments</> : <><Eye size={17} />Views</>}
      </span>)}
    </div>
    <div className={styles.staticReactions} aria-hidden="true" data-creator-static-reactions><span>💗</span><span>✨</span></div>
  </div>;
}
