"use client";

import Link from "next/link";
import { Bell, ChevronRight, EyeOff, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markNotificationRead } from "@/lib/vigil/actions/notifications";
import { VirtueOrb } from "./VirtueOrb";

export type AttentionItem = {
  key: string;
  title: string;
  body: string;
  href: string;
  notificationId?: string;
};

export function FloatingAttentionCenter({ portal, items }: { portal: "customer" | "admin"; items: AttentionItem[] }) {
  const router = useRouter();
  const storageKey = `vigil:${portal}:virtue-hidden`;
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [toastDismissed, setToastDismissed] = useState(false);
  const [, startTransition] = useTransition();
  useEffect(() => {
    const frame = requestAnimationFrame(() => setHidden(localStorage.getItem(storageKey) === "1"));
    return () => cancelAnimationFrame(frame);
  }, [storageKey]);
  const visibleItems = useMemo(() => items.slice(0, 12), [items]);
  const first = visibleItems[0] ?? null;

  const markRead = (item: AttentionItem) => {
    if (!item.notificationId) return;
    startTransition(async () => {
      await markNotificationRead(item.notificationId!);
      router.refresh();
    });
  };

  const hideVirtue = () => {
    localStorage.setItem(storageKey, "1");
    setHidden(true);
    setOpen(false);
  };
  const showVirtue = () => {
    localStorage.removeItem(storageKey);
    setHidden(false);
    setToastDismissed(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      {open ? (
        <section className="w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-primary)] shadow-2xl" aria-label="Notifications">
          <div className="flex items-center justify-between border-b border-[color:var(--border)] px-4 py-3">
            <div>
              <p className="font-semibold">Needs attention</p>
              <p className="text-[11px] text-[color:var(--text-secondary)]">{visibleItems.length ? `${visibleItems.length} open item${visibleItems.length === 1 ? "" : "s"}` : "Nothing is waiting on you"}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[color:var(--bg-surface-soft)]" aria-label="Close notifications"><X className="h-4 w-4" /></button>
          </div>
          <div className="max-h-[min(55vh,460px)] overflow-y-auto p-2">
            {visibleItems.length ? visibleItems.map((item) => (
              <Link key={item.key} href={item.href} onClick={() => markRead(item)} className="group flex gap-3 rounded-xl p-3 hover:bg-[color:var(--bg-surface-soft)]">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[color:var(--accent)]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{item.title}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-[color:var(--text-secondary)]">{item.body}</span>
                </span>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[color:var(--text-secondary)] transition-transform group-hover:translate-x-0.5" />
              </Link>
            )) : (
              <div className="px-4 py-8 text-center text-sm text-[color:var(--text-secondary)]">Virtue will let you know when something needs attention.</div>
            )}
          </div>
          {!hidden ? <button type="button" onClick={hideVirtue} className="flex w-full items-center justify-center gap-2 border-t border-[color:var(--border)] px-4 py-2.5 text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"><EyeOff className="h-3.5 w-3.5" /> Hide Virtue</button> : null}
        </section>
      ) : null}

      {!hidden && first && !toastDismissed && !open ? (
        <div className="relative w-[min(330px,calc(100vw-2rem))] rounded-xl border border-[color:var(--accent)]/40 bg-[color:var(--bg-primary)] p-3 pr-9 shadow-xl">
          <button type="button" onClick={() => setToastDismissed(true)} className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-[color:var(--bg-surface-soft)]" aria-label="Dismiss alert"><X className="h-3.5 w-3.5" /></button>
          <p className="text-xs font-semibold text-[color:var(--accent)]">Virtue</p>
          <p className="mt-0.5 text-sm font-semibold">{first.title}</p>
          <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">{first.body}</p>
          <button type="button" onClick={() => setOpen(true)} className="mt-2 text-xs font-semibold text-[color:var(--accent)]">View notifications</button>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        {hidden ? <button type="button" onClick={showVirtue} className="inline-flex h-10 items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-3 shadow-lg"><Bell className="h-4 w-4" /> <span className="text-xs">{visibleItems.length || "Alerts"}</span></button> : null}
        {!hidden ? (
          <button type="button" onClick={() => setOpen((value) => !value)} className="relative rounded-full bg-[color:var(--bg-primary)] p-1 shadow-xl" aria-label="Open Virtue notifications" aria-expanded={open}>
            <VirtueOrb size="md" state={visibleItems.length ? "working" : "idle"} label="" />
            {visibleItems.length ? <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--accent)] px-1 text-[10px] font-bold text-black">{visibleItems.length}</span> : null}
          </button>
        ) : null}
      </div>
    </div>
  );
}
