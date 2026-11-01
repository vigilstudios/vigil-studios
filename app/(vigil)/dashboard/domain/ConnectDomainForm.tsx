"use client";

import { useActionState, useState } from "react";
import {
  startDomainConnection,
  type DomainState,
} from "@/lib/vigil/actions/domain";
import { ArrowRight, LockKeyhole } from "lucide-react";
import styles from "@/components/vigil/domain-engine/domain-workspace.module.css";
import { FormError, inputClass, labelClass } from "@/components/vigil/ui";

export function ConnectDomainForm({
  websites,
  initialHostname = "",
  initialWebsiteId,
  registrar = "other",
}: {
  websites: { id: string; name: string }[];
  initialHostname?: string;
  initialWebsiteId?: string;
  registrar?: "vercel" | "other";
}) {
  const [state, action, pending] = useActionState<DomainState, FormData>(
    startDomainConnection,
    null,
  );
  const [website, setWebsite] = useState(
    initialWebsiteId ?? websites[0]?.id ?? "",
  );
  const [choosingSite, setChoosingSite] = useState(
    websites.length > 1 && !initialWebsiteId,
  );
  if (choosingSite)
    return (
      <div className="mt-4 space-y-4">
        <label className={labelClass} htmlFor="domain-website">
          Which website is this for?
        </label>
        <select
          id="domain-website"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          className={inputClass}
        >
          {websites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-primary min-h-11 text-sm"
          onClick={() => setChoosingSite(false)}
        >
          Continue
        </button>
      </div>
    );
  return (
    <form action={action} className={styles.ownedForm}>
      <label htmlFor="hostname" className={styles.field}>
        {initialHostname ? "Confirm your domain" : "Your website address"}
      </label>
      <input
        id="hostname"
        name="hostname"
        type="text"
        inputMode="url"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="yourbusiness.com"
        defaultValue={initialHostname}
        className={inputClass}
        required
        disabled={pending}
      />
      <input type="hidden" name="website_id" value={website} />
      <input type="hidden" name="registrar" value={registrar} />
      <p className={styles.note}>
        <LockKeyhole size={15} aria-hidden="true" />
        Enter an address you own, such as yourbusiness.com. We’ll verify
        ownership before connecting it.
      </p>
      <button type="submit" className={styles.primary} disabled={pending}>
        {pending ? "Preparing setup…" : "Continue to setup"}
        <ArrowRight size={15} aria-hidden="true" />
      </button>
      {websites.length > 1 ? (
        <div>
          <button
            type="button"
            className={styles.textButton}
            onClick={() => setChoosingSite(true)}
          >
            Change website
          </button>
        </div>
      ) : null}
      <FormError message={state && !state.ok ? state.error : null} />
    </form>
  );
}
