"use client";
import { useEffect, useState } from "react";
import { Link2, ShieldCheck } from "lucide-react";
import { DomainSectionHeading } from "./DomainSetupUI";
import type { ExpectedDnsRecord } from "@/lib/vigil/domain-engine/contracts";
import styles from "./domain-workspace.module.css";

type Plan = {
  status?: string;
  id: string;
  expiresAt: string;
  records: ExpectedDnsRecord[];
  changes: number;
};
export function ManagedDomainConnection({
  live = false,
  contactVerified = false,
  registrationId,
  websites,
}: {
  live?: boolean;
  contactVerified?: boolean;
  registrationId: string;
  websites: { id: string; label: string }[];
}) {
  const [websiteId, setWebsiteId] = useState(
    websites.length === 1 ? websites[0].id : "",
  );
  const [bound, setBound] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endpoint = live
    ? "/api/domain-engine/live/connection"
    : "/api/domain-engine/test/connection";
  useEffect(() => {
    const controller = new AbortController();
    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", registrationId }),
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw Error(body.error);
        return body.result;
      })
      .then((result) => {
        setBound(result.bound);
        if (result.websiteId) setWebsiteId(result.websiteId);
        setMessage(result.reason);
        if (
          result.plan?.approvable &&
          ["planned", "claimed", "review"].includes(result.plan.status)
        )
          setPlan(result.plan);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("The website connection could not be restored.");
      });
    return () => controller.abort();
  }, [registrationId, endpoint]);
  async function action(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.ok)
        throw Error(data.error ?? "The connection needs a retry.");
      return data.result;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The connection needs a retry.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className={`${styles.manage} ${styles.connection}`}
      aria-label={live ? "Connect your website" : "Connect the test website"}
    >
      <DomainSectionHeading
        icon={Link2}
        title={live ? "Connect your website" : "Connect the test website"}
      >
        Choose your website, then review and approve its connection. Your email
        settings stay in place.
      </DomainSectionHeading>
      {!bound ? (
        <>
          <label htmlFor="managed-domain-website">Website</label>
          <select
            id="managed-domain-website"
            value={websiteId}
            disabled={busy}
            onChange={(event) => {
              setWebsiteId(event.target.value);
              setPlan(null);
              setConsent(false);
            }}
          >
            <option value="">Choose a website</option>
            {websites.map((website) => (
              <option key={website.id} value={website.id}>
                {website.label}
              </option>
            ))}
          </select>
          {!websites.length ? (
            <p>
              {live
                ? "Your website must be prepared before connecting this domain."
                : "Create the isolated test website preview before connecting this domain."}
            </p>
          ) : null}
          <button
            className={styles.secondary}
            disabled={busy || !websiteId}
            onClick={async () => {
              const result = await action({
                action: "bind",
                registrationId,
                websiteId,
              });
              if (result) {
                setBound(true);
                setMessage(
                  "Website selected. Review the connection changes next.",
                );
              }
            }}
          >
            Use this website
          </button>
        </>
      ) : (
        <p>
          Website selected:{" "}
          {websites.find((website) => website.id === websiteId)?.label ??
            "Your saved website"}
        </p>
      )}
      {bound ? (
        <button
          className={styles.secondary}
          disabled={busy}
          onClick={async () => {
            setConsent(false);
            setPlan(null);
            const result = await action({ action: "plan", registrationId });
            if (result) setPlan(result);
          }}
        >
          {live ? "Review connection" : "Review test DNS plan"}
        </button>
      ) : null}
      {plan ? (
        <div>
          <p>
            These settings tell the internet where to find your website.
            {plan.changes === 0
              ? "These website records are already present."
              : `${plan.changes} website record${plan.changes === 1 ? "" : "s"} will be added.`}{" "}
            Approval expires at {new Date(plan.expiresAt).toLocaleTimeString()}.
          </p>
          <ul className={styles.records}>
            {plan.records.map((record, index) => (
              <li key={index}>
                <code>
                  {record.type} {record.name} → {record.value}
                </code>
              </li>
            ))}
          </ul>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={consent}
              disabled={busy}
              onChange={(event) => setConsent(event.target.checked)}
            />{" "}
            I approve these exact website records
            {live ? "." : " in the Name.com sandbox."}
          </label>
          <button
            className={styles.primary}
            disabled={busy || !consent || (live && !contactVerified)}
            onClick={async () => {
              const result = await action({
                action: "apply",
                planId: plan.id,
                consent,
              });
              if (result?.applied) {
                setMessage(
                  live
                    ? "Website records saved. Email records preserved. Vigil is checking DNS and HTTPS for your approved launch."
                    : "Sandbox DNS saved. Email records preserved. Public DNS, HTTPS and Vigil’s approved website deployment are still pending.",
                );
                setPlan(null);
                setConsent(false);
              } else if (result?.working)
                setMessage(
                  "The existing DNS submission is still being checked. No duplicate write was submitted.",
                );
            }}
          >
            {plan.status === "claimed" || plan.status === "review"
              ? "Recheck existing DNS submission"
              : live
                ? "Approve & connect website"
                : "Apply approved test records"}
          </button>
        </div>
      ) : null}
      <p className={styles.note}>
        <ShieldCheck size={15} aria-hidden="true" />
        {live
          ? "We check the address and secure HTTPS connection before marking your site connected. Connecting prepares the approved launch; it does not approve publishing."
          : "Sandbox only. Public DNS, HTTPS and Vigil’s website deployment remain unverified."}
      </p>
      {live && !contactVerified ? (
        <p role="status">
          Verify the registrar email, then recheck your domain status before
          applying website records.
        </p>
      ) : null}
      {message && !plan ? <p role="status">{message}</p> : null}
      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
      {busy ? <p role="status">Checking the connection…</p> : null}
    </section>
  );
}
