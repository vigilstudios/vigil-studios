"use client";

import { useEffect } from "react";

/** Last-resort boundary for the product routes. Never shows internals. */
export default function VigilError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6 text-center">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
          The page could not be loaded. Try again, and if it keeps happening, email{" "}
          <a className="underline" href="mailto:hello@vigilstudios.co">hello@vigilstudios.co</a>
          {error.digest ? <> and mention <code className="text-xs">{error.digest}</code></> : null}.
        </p>
        <button type="button" onClick={reset} className="btn-primary mt-5 text-sm">
          Try again
        </button>
      </div>
    </main>
  );
}
