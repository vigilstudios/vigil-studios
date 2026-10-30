"use client";
import { useEffect, useState, type ReactNode } from "react";
import { inputClass } from "@/components/vigil/ui";
type Plan = {
  id: string;
  status: string;
  expiresAt: string;
  changes: {
    operation: string;
    before: { type: string; name: string; content: string } | null;
    after: { type: string; name: string; content: string } | null;
  }[];
  records: { type: string; name: string; value: string }[];
};
export function AuthorizedExistingDomain({
  domainId,
  children,
}: {
  domainId: string;
  children: ReactNode;
}) {
  const [automatic, setAutomatic] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={
            automatic
              ? "btn-secondary min-h-11 text-sm"
              : "btn-primary min-h-11 text-sm"
          }
          onClick={() => setAutomatic(false)}
        >
          Guided setup
        </button>
        <button
          type="button"
          className={
            automatic
              ? "btn-primary min-h-11 text-sm"
              : "btn-secondary min-h-11 text-sm"
          }
          onClick={() => setAutomatic(true)}
        >
          Connect Cloudflare automatically
        </button>
      </div>
      {automatic ? (
        <CloudflareDomainConnection domainId={domainId} />
      ) : (
        children
      )}
    </div>
  );
}
function CloudflareDomainConnection({ domainId }: { domainId: string }) {
  const [token, setToken] = useState(""),
    [access, setAccess] = useState(false),
    [consent, setConsent] = useState(false),
    [plan, setPlan] = useState<Plan | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  async function call(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/domain-engine/cloudflare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw Error(data.error);
      return data.result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "The connection needs review.");
      return null;
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    const abort = new AbortController();
    void fetch("/api/domain-engine/cloudflare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", domainId }),
      cache: "no-store",
      signal: abort.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error();
        if (d.result) setPlan(d.result);
      })
      .catch(() => {
        if (!abort.signal.aborted)
          setError("The saved connection could not be loaded.");
      });
    return () => abort.abort();
  }, [domainId]);
  return (
    <section aria-label="Authorize Cloudflare DNS" className="space-y-4">
      <h2 className="font-semibold">
        Let Vigil connect your Cloudflare domain
      </h2>
      <p className="text-sm">
        Use a Cloudflare API token restricted to this domain, with Zone Read and
        DNS Edit permissions. You will review the exact changes before Vigil
        submits them. Email and unrelated records are preserved.
      </p>
      {!plan || ["expired", "canceled"].includes(plan.status) ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void call({
              action: "prepare",
              domainId,
              token,
              consent: access,
            }).then((result) => {
              setToken("");
              if (result) {
                setPlan(result);
                setConsent(false);
              }
            });
          }}
        >
          <a
            href="https://dash.cloudflare.com/profile/api-tokens"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-sm underline"
          >
            Create a token limited to this zone
          </a>
          <label className="block space-y-2 text-sm">
            <span>Cloudflare API token</span>
            <input
              className={inputClass}
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              maxLength={500}
            />
          </label>
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              required
              checked={access}
              onChange={(e) => setAccess(e.target.checked)}
            />
            <span>
              I own this domain and authorize Vigil to inspect its DNS and
              prepare website changes using this scoped token. Preparing a plan
              does not change DNS.
            </span>
          </label>
          <p className="text-xs">
            The token is encrypted server-side for this short-lived connection
            plan and cleared after successful use. An uncertain submission
            retains it for up to 24 hours for read-only recovery. Revoke the
            token in Cloudflare after setup if you no longer need it.
          </p>
          <button
            className="btn-primary min-h-11 text-sm"
            disabled={busy || !access || !token}
          >
            Review connection plan
          </button>
        </form>
      ) : plan.status === "applied" ? (
        <p role="status" className="text-sm">
          Website records saved. Vigil checks public DNS, HTTPS and the approved
          deployment before marking the domain connected.
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm">
            Review each change. Approval expires at{" "}
            {new Date(plan.expiresAt).toLocaleTimeString()}.
          </p>
          <ul className="space-y-2 text-sm">
            {plan.changes.map((c, i) => (
              <li
                key={i}
                className="break-words rounded-lg border border-[color:var(--border)] p-3"
              >
                <strong>{c.operation}</strong>{" "}
                {c.before ? (
                  <code>
                    {c.before.type} {c.before.name} → {c.before.content}
                  </code>
                ) : null}
                {c.after ? (
                  <>
                    <span> to </span>
                    <code>
                      {c.after.type} {c.after.name} → {c.after.content}
                    </code>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
          {plan.changes.length === 0 ? (
            <p className="text-sm">The required records are already present.</p>
          ) : null}
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              I approve these exact website changes. They may move website
              traffic to the approved Vigil site.
            </span>
          </label>
          <button
            className="btn-primary min-h-11 text-sm"
            disabled={busy || !consent}
            onClick={() =>
              void call({
                action: "apply",
                planId: plan.id,
                consent: true,
              }).then((result) => {
                if (result?.applied) {
                  setPlan({ ...plan, status: "applied" });
                  setMessage(
                    "Website records saved. DNS and HTTPS checks are queued.",
                  );
                } else if (result?.working)
                  setMessage(
                    "The existing submission is being checked; no duplicate batch was sent.",
                  );
              })
            }
          >
            {["claimed", "review"].includes(plan.status)
              ? "Recheck existing submission"
              : "Apply approved changes"}
          </button>
        </div>
      )}
      {busy ? (
        <p role="status" className="text-sm">
          Checking your authorized connection…
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-[color:var(--status-bad)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
