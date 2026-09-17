"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import type { ActionResult } from "@/lib/vigil/auth/errors";

/**
 * Thin client wrappers around bound server actions. They show the returned
 * error inline and refresh the route on success; nothing else lives here.
 */
export function ActionButton({
  action,
  children,
  confirmText,
  variant = "secondary",
  className,
  onDone,
  redirectTo,
  disabled = false,
  disabledReason,
}: {
  action: () => Promise<ActionResult<unknown>>;
  children: React.ReactNode;
  confirmText?: string;
  variant?: "primary" | "secondary" | "link" | "danger";
  className?: string;
  onDone?: (result: ActionResult<unknown>) => void;
  redirectTo?: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const base =
    variant === "primary"
      ? "btn-primary text-sm"
      : variant === "secondary"
        ? "btn-secondary text-sm !px-3 !py-1.5"
        : variant === "danger"
          ? "text-xs text-[#ef4444] underline"
          : "text-xs text-[color:var(--text-secondary)] underline hover:text-[color:var(--text-primary)]";
  return (
    <span className="inline-flex flex-col items-start gap-1" title={disabled ? disabledReason : undefined}>
      <button
        type="button"
        disabled={pending || disabled}
        className={clsx(base, "disabled:cursor-not-allowed disabled:opacity-45", className)}
        onClick={() => {
          if (confirmText && !confirm(confirmText)) return;
          setError(null);
          start(async () => {
            const res = await action();
            if (!res.ok) setError(res.error);
            else if (redirectTo) router.push(redirectTo);
            else router.refresh();
            onDone?.(res);
          });
        }}
      >
        {pending ? "…" : children}
      </button>
      {disabled && disabledReason ? <span className="max-w-52 text-[11px] leading-4 text-[color:var(--text-secondary)]">{disabledReason}</span> : null}
      {error ? <span className="text-xs text-[#ef4444]">{error}</span> : null}
    </span>
  );
}

export function TransitionSelect({
  current,
  options,
  action,
  withReason = false,
}: {
  current: string;
  options: readonly string[];
  action: (next: string, reason?: string) => Promise<ActionResult<unknown>>;
  withReason?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [next, setNext] = useState<string>("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (options.length === 0) return <span className="text-xs text-[color:var(--text-secondary)]">Final state</span>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Next status"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        disabled={pending}
        className="rounded-md border border-[color:var(--border)] bg-transparent px-2 py-1 text-xs"
      >
        <option value="">Move from {current}…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {withReason ? (
        <input
          aria-label="Reason shown to the customer"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (customer-visible, optional)"
          className="w-56 rounded-md border border-[color:var(--border)] bg-transparent px-2 py-1 text-xs"
          disabled={pending}
        />
      ) : null}
      <button
        type="button"
        disabled={pending || !next}
        className="btn-secondary !px-3 !py-1 text-xs"
        onClick={() => {
          setError(null);
          start(async () => {
            const res = await action(next, withReason ? reason : undefined);
            if (!res.ok) setError(res.error);
            else {
              setNext("");
              setReason("");
              router.refresh();
            }
          });
        }}
      >
        Apply
      </button>
      {error ? <span className="text-xs text-[#ef4444]">{error}</span> : null}
    </div>
  );
}

export function ActionForm({
  action,
  children,
  submitLabel,
  className,
}: {
  action: (formData: FormData) => Promise<ActionResult<unknown>>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        setError(null);
        setOk(false);
        start(async () => {
          const res = await action(data);
          if (!res.ok) setError(res.error);
          else {
            setOk(true);
            form.reset();
            router.refresh();
          }
        });
      }}
    >
      {children}
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" className="btn-primary text-sm" disabled={pending}>
          {pending ? "Working…" : submitLabel}
        </button>
        {error ? <span className="text-xs text-[#ef4444]">{error}</span> : null}
        {ok ? <span className="text-xs text-[color:var(--accent)]">Done.</span> : null}
      </div>
    </form>
  );
}

export function SelectApply({
  options,
  action,
  placeholder,
  current,
}: {
  options: { value: string; label: string }[];
  action: (value: string) => Promise<ActionResult<unknown>>;
  placeholder: string;
  current?: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, setValue] = useState<string>(current ?? "");
  const [error, setError] = useState<string | null>(null);
  const dirty = value !== (current ?? "");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={pending}
        className="rounded-md border border-[color:var(--border)] bg-transparent px-2 py-1 text-xs"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {dirty ? (
        <button
          type="button"
          disabled={pending}
          className="btn-secondary !px-3 !py-1 text-xs"
          onClick={() => {
            setError(null);
            start(async () => {
              const res = await action(value);
              if (!res.ok) setError(res.error);
              else router.refresh();
            });
          }}
        >
          Apply
        </button>
      ) : null}
      {error ? <span className="text-xs text-[#ef4444]">{error}</span> : null}
    </div>
  );
}
