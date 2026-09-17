import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton, ActionForm, SelectApply, TransitionSelect } from "@/components/vigil/ActionControls";
import { Card, DefinitionList, PageHeader, StatusPill, Table, inputClass, tdClass, thClass } from "@/components/vigil/ui";
import {
  addDomainForOrganization,
  archiveOrganization,
  attachDomainToWebsite,
  createProject,
  createSubscription,
  deleteOrganizationPermanently,
  inviteToOrganization,
  removeEntitlementOverride,
  restoreOrganization,
  setDomainStatus,
  setEntitlementOverride,
  setOrganizationStatus,
  setProjectStatus,
  setSubscriptionStatus,
  setWebsiteStatus,
  viewAsOrganization,
} from "@/lib/vigil/actions/admin";
import { requireStaff } from "@/lib/vigil/auth/session";
import { describePrice } from "@/lib/vigil/billing-periods";
import { formatDate, formatDateTime, formatMoney, humanizeAction, titleCase } from "@/lib/vigil/format";
import { domainTransitions, projectTransitions, subscriptionTransitions, websiteTransitions } from "@/lib/vigil/lifecycle";
import { getCatalog, getOrganizationDetail } from "@/lib/vigil/queries/admin";
import { getProjectAssets } from "@/lib/vigil/queries/onboarding";
import { parseBrief } from "@/lib/vigil/onboarding/brief";
import { BriefSummary } from "@/components/vigil/BriefSummary";
import { Constants } from "@/types/database.types";
import { AVAILABLE_EXPRESS_TEMPLATES } from "@/lib/constants";

export const metadata: Metadata = { title: "Customer" };

export default async function OrganizationDetailPage({ params }: { params: Promise<{ orgId: string }> }) {
  const staff = await requireStaff();
  const { orgId } = await params;
  const [detail, catalog] = await Promise.all([getOrganizationDetail(orgId), getCatalog()]);
  if (!detail) notFound();
  const { organization: org, members, invites, websites, domains, subscriptions, projects, overrides, audit, jobs, orders } = detail;
  const isAdmin = staff.staffRole === "admin";
  const briefProject = projects.find((p) => !["closed", "cancelled"].includes(p.status)) ?? projects[0] ?? null;
  const brief = briefProject ? parseBrief(briefProject.brief) : null;
  const briefAssets = briefProject ? await getProjectAssets(briefProject.id) : [];
  const briefDomain = brief?.domain?.domainId ? domains.find((d) => d.id === brief.domain?.domainId) ?? null : null;
  const openInvites = invites.filter((i) => !i.accepted_at && !i.revoked_at);

  return (
    <div>
      <PageHeader
        eyebrow="Customer"
        title={org.name}
        description={
          <>
            <code className="text-xs">{org.slug}</code> · created {formatDate(org.created_at)}
          </>
        }
        actions={
          <form action={viewAsOrganization.bind(null, org.id)}>
            <button className="btn-secondary !px-3 text-sm">Open client view</button>
          </form>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Profile</h2>
            <StatusPill tone={org.status === "active" ? "good" : org.status === "suspended" ? "bad" : "warn"}>{titleCase(org.status)}</StatusPill>
          </div>
          <DefinitionList
            items={[
              { label: "Legal name", value: org.legal_name ?? "Not provided" },
              { label: "Billing email", value: org.billing_email ?? "Not provided" },
              { label: "Phone", value: org.phone ?? "Not provided" },
              { label: "Time zone", value: org.timezone },
            ]}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {Constants.public.Enums.organization_status
              .filter((s) => s !== org.status)
              .map((s) => (
                <ActionButton key={s} action={setOrganizationStatus.bind(null, org.id, s)} confirmText={`Set ${org.name} to ${s}?`}>
                  Mark {s}
                </ActionButton>
              ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold">People</h2>
          <ul className="mt-2 divide-y divide-[color:var(--border)] text-sm">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between py-2">
                <span>
                  {m.profile?.full_name ?? "Not provided"} <span className="text-[color:var(--text-secondary)]">· {m.profile?.email}</span>
                </span>
                <span className="text-xs">{titleCase(m.role)}</span>
              </li>
            ))}
            {members.length === 0 ? <li className="py-2 text-[color:var(--text-secondary)]">No members yet.</li> : null}
          </ul>
          {openInvites.length > 0 ? (
            <p className="mt-2 text-xs text-[color:var(--text-secondary)]">
              Pending: {openInvites.map((i) => `${i.email} (${i.role})`).join(", ")}
            </p>
          ) : null}
          <ActionForm action={inviteToOrganization.bind(null, org.id)} submitLabel="Invite" className="mt-3 grid gap-2 sm:grid-cols-[1fr_8rem]">
            <input name="email" type="email" placeholder="email" className={inputClass} required />
            <select name="role" className={inputClass} defaultValue="owner">
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="member">Member</option>
            </select>
          </ActionForm>
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="text-base font-semibold">Projects and websites</h2>
        <Table className="mt-3">
          <thead>
            <tr>
              <th className={thClass}>Project</th>
              <th className={thClass}>Kind</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Transition</th>
              <th className={thClass}>Review</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td className={tdClass}>{p.name}</td>
                <td className={tdClass}>{titleCase(p.kind)}{p.template_slug ? ` · ${p.template_slug}` : ""}</td>
                <td className={tdClass}>{titleCase(p.status)}</td>
                <td className={tdClass}>
                  <TransitionSelect current={p.status} options={projectTransitions[p.status]} action={setProjectStatus.bind(null, p.id)} />
                </td>
                <td className={tdClass}>
                  {p.kind === "professional" ? <Link href={`/admin/reviews/${p.id}`} className="underline">Workspace</Link> : "Not applicable"}
                </td>
              </tr>
            ))}
            {projects.length === 0 ? (
              <tr>
                <td className={tdClass} colSpan={5}>No projects.</td>
              </tr>
            ) : null}
          </tbody>
        </Table>
        <Table className="mt-3">
          <thead>
            <tr>
              <th className={thClass}>Website</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Live URL</th>
              <th className={thClass}>Transition</th>
            </tr>
          </thead>
          <tbody>
            {websites.map((w) => (
              <tr key={w.id}>
                <td className={tdClass}>
                  <Link href={`/admin/websites/${w.id}`} className="underline">{w.name}</Link>
                </td>
                <td className={tdClass}>{titleCase(w.status)}</td>
                <td className={tdClass}>{w.live_url ?? "Not set"}</td>
                <td className={tdClass}>
                  <TransitionSelect current={w.status} options={websiteTransitions[w.status]} action={setWebsiteStatus.bind(null, w.id)} withReason />
                </td>
              </tr>
            ))}
            {websites.length === 0 ? (
              <tr>
                <td className={tdClass} colSpan={4}>No websites.</td>
              </tr>
            ) : null}
          </tbody>
        </Table>
        <ActionForm action={createProject.bind(null, org.id)} submitLabel="Create project" className="mt-4 grid gap-2 sm:grid-cols-4">
          <input name="name" placeholder="Project name" className={inputClass} required />
          <select name="kind" className={inputClass} defaultValue="express">
            <option value="express">Express</option>
            <option value="professional">Professional</option>
            <option value="custom">Custom</option>
          </select>
          <select name="template_slug" aria-label="Template slug" className={inputClass} defaultValue="">
            <option value="">No template</option>
            {AVAILABLE_EXPRESS_TEMPLATES.map((template) => (
              <option key={template.slug} value={template.slug}>
                {template.slug} · {template.industry}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="create_website" defaultChecked /> Also create website
          </label>
        </ActionForm>
      </Card>

      <Card className="mt-4">
        <h2 className="text-base font-semibold">Domains</h2>
        <Table className="mt-3">
          <thead>
            <tr>
              <th className={thClass}>Hostname</th>
              <th className={thClass}>Source</th>
              <th className={thClass}>Website</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Transition</th>
            </tr>
          </thead>
          <tbody>
            {domains.map((d) => (
              <tr key={d.id}>
                <td className={tdClass}>
                  {d.hostname}
                  {(d.metadata as { onboarding_delegate?: boolean } | null)?.onboarding_delegate ? (
                    <div className="text-xs font-medium text-[color:var(--status-warn)]">Assisted cutover requested</div>
                  ) : null}
                </td>
                <td className={tdClass}>{titleCase(d.source)}{d.registrar ? ` · ${titleCase(d.registrar)}` : ""}</td>
                <td className={tdClass}>
                  <SelectApply
                    placeholder="Not attached"
                    current={d.website_id}
                    options={websites.map((w) => ({ value: w.id, label: w.name }))}
                    action={attachDomainToWebsite.bind(null, d.id)}
                  />
                </td>
                <td className={tdClass}>{titleCase(d.status)}{d.status_reason ? <div className="text-xs text-[color:var(--text-secondary)]">{d.status_reason}</div> : null}</td>
                <td className={tdClass}>
                  <TransitionSelect current={d.status} options={domainTransitions[d.status]} action={setDomainStatus.bind(null, d.id)} withReason />
                </td>
              </tr>
            ))}
            {domains.length === 0 ? (
              <tr>
                <td className={tdClass} colSpan={5}>No domains.</td>
              </tr>
            ) : null}
          </tbody>
        </Table>
        {/* Keyed on the website list: an uncontrolled select keeps its first default, so remount when websites change. */}
        <ActionForm key={`domains-${websites.map((w) => w.id).join(",")}`} action={addDomainForOrganization.bind(null, org.id)} submitLabel="Add domain" className="mt-4 grid gap-2 sm:grid-cols-3">
          <input name="hostname" placeholder="example.com" className={inputClass} required />
          <select name="website_id" className={inputClass} defaultValue={websites[0]?.id ?? ""}>
            <option value="">No website</option>
            {websites.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <select name="source" className={inputClass} defaultValue="customer_owned">
            <option value="customer_owned">Customer owned</option>
            <option value="purchased_via_vigil">Purchased via Vigil</option>
            <option value="vigil_managed">Vigil managed</option>
          </select>
        </ActionForm>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold">Subscriptions</h2>
          <ul className="mt-2 divide-y divide-[color:var(--border)] text-sm">
            {subscriptions.map((s) => (
              <li key={s.id} className="py-2">
                <div className="flex items-center justify-between gap-2">
                  <span>
                    {s.plan?.name ?? "Plan"} · {s.price ? describePrice(s.price, formatMoney) : "no price"}
                  </span>
                  <StatusPill tone={s.status === "active" ? "good" : s.status === "canceled" ? "neutral" : "warn"}>{titleCase(s.status)}</StatusPill>
                </div>
                <div className="mt-1">
                  <TransitionSelect current={s.status} options={subscriptionTransitions[s.status]} action={setSubscriptionStatus.bind(null, s.id)} />
                </div>
              </li>
            ))}
            {subscriptions.length === 0 ? <li className="py-2 text-[color:var(--text-secondary)]">No subscriptions.</li> : null}
          </ul>
          <ActionForm key={`subs-${websites.map((w) => w.id).join(",")}`} action={createSubscription.bind(null, org.id)} submitLabel="Add subscription" className="mt-3 grid gap-2 sm:grid-cols-3">
            <select name="plan_id" className={inputClass} required defaultValue="">
              <option value="" disabled>Plan…</option>
              {catalog.plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select name="status" className={inputClass} defaultValue="active">
              {Constants.public.Enums.subscription_status.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select name="website_id" className={inputClass} defaultValue="">
              <option value="">Whole organization</option>
              {websites.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </ActionForm>
          <p className="mt-2 text-xs text-[color:var(--text-secondary)]">Manual for now. Stripe-driven subscriptions arrive through the billing webhook in a later phase.</p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold">Entitlement overrides</h2>
          <ul className="mt-2 divide-y divide-[color:var(--border)] text-sm">
            {overrides.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 py-2">
                <span>
                  <code className="text-xs">{o.feature_code}</code> = <code className="text-xs">{JSON.stringify(o.value)}</code>
                  {o.reason ? <span className="text-[color:var(--text-secondary)]"> · {o.reason}</span> : null}
                </span>
                {isAdmin ? (
                  <ActionButton variant="danger" action={removeEntitlementOverride.bind(null, org.id, o.feature_code)}>Remove</ActionButton>
                ) : null}
              </li>
            ))}
            {overrides.length === 0 ? <li className="py-2 text-[color:var(--text-secondary)]">None.</li> : null}
          </ul>
          {isAdmin ? (
            <ActionForm action={setEntitlementOverride.bind(null, org.id)} submitLabel="Set override" className="mt-3 grid gap-2 sm:grid-cols-3">
              <select name="feature_code" className={inputClass} required defaultValue="">
                <option value="" disabled>Feature…</option>
                {catalog.features.map((f) => (
                  <option key={f.code} value={f.code}>{f.code}</option>
                ))}
              </select>
              <input name="value" placeholder='true / 5 / "advanced"' className={inputClass} required />
              <input name="reason" placeholder="Reason" className={inputClass} />
            </ActionForm>
          ) : (
            <p className="mt-2 text-xs text-[color:var(--text-secondary)]">Admins can grant exceptions here.</p>
          )}
        </Card>
      </div>

      {briefProject && brief ? (
        <Card className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Customer brief</h2>
            <StatusPill tone={briefProject.intake_completed_at ? "good" : "warn"}>
              {briefProject.intake_completed_at ? `Sent ${formatDateTime(briefProject.intake_completed_at)}` : `In progress · last step ${brief.progress.lastStep}`}
            </StatusPill>
          </div>
          <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
            {briefProject.name}. {briefAssets.length} file{briefAssets.length === 1 ? "" : "s"} uploaded{briefAssets.length ? " (links valid 30 minutes)" : ""}.
          </p>
          {briefAssets.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {briefAssets.map((a) => (
                <li key={a.id}>
                  <a href={a.url ?? "#"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-[color:var(--border)] px-2 py-1 text-xs hover:border-[color:var(--accent)]">
                    <span className="uppercase text-[10px] text-[color:var(--text-secondary)]">{a.kind}</span> {a.file_name}{a.caption ? `: ${a.caption}` : ""}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3">
            <BriefSummary brief={brief} projectKind={briefProject.kind} assets={briefAssets} domain={briefDomain ? { hostname: briefDomain.hostname, status: briefDomain.status } : null} />
          </div>
        </Card>
      ) : null}

      <Card className="mt-4">
        <h2 className="text-base font-semibold">Orders</h2>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">None. <Link href="/admin/orders" className="underline">Send a checkout link</Link>.</p>
        ) : (
          <Table className="mt-2">
            <thead>
              <tr>
                <th className={thClass}>Created</th>
                <th className={thClass}>Kind</th>
                <th className={thClass}>Plan</th>
                <th className={thClass}>Build</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Paid</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className={tdClass}>{formatDateTime(o.created_at)}</td>
                  <td className={tdClass}>{titleCase(o.project_kind)}{o.template_slug ? ` · ${o.template_slug}` : ""}</td>
                  <td className={tdClass}>{o.plan?.name ?? "No plan"}{o.plan_amount_cents != null ? ` · ${describePrice({ amount_cents: o.plan_amount_cents, currency: o.currency, interval: o.price?.interval ?? "month", interval_count: o.price?.interval_count ?? 1 }, formatMoney)}` : ""}</td>
                  <td className={tdClass}>{o.build_amount_cents != null ? formatMoney(o.build_amount_cents, o.currency) : "Quoted"}</td>
                  <td className={tdClass}><StatusPill tone={o.status === "provisioned" ? "good" : o.status === "paid" ? "info" : o.status === "pending" ? "warn" : "neutral"}>{titleCase(o.status)}</StatusPill></td>
                  <td className={tdClass}>{o.paid_at ? formatDateTime(o.paid_at) : "Not paid"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold">Recent jobs</h2>
          <ul className="mt-2 divide-y divide-[color:var(--border)] text-sm">
            {jobs.map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 truncate">
                  {j.kind} <span className="text-xs text-[color:var(--text-secondary)]">· {j.attempts}/{j.max_attempts}</span>
                </span>
                <StatusPill tone={j.status === "succeeded" ? "good" : j.status === "failed" ? "bad" : "info"}>{j.status}</StatusPill>
              </li>
            ))}
            {jobs.length === 0 ? <li className="py-2 text-[color:var(--text-secondary)]">None.</li> : null}
          </ul>
        </Card>
        <Card>
          <h2 className="text-base font-semibold">Audit trail</h2>
          <ul className="mt-2 divide-y divide-[color:var(--border)] text-sm">
            {audit.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 truncate">
                  {humanizeAction(a.action)} <span className="text-xs text-[color:var(--text-secondary)]">· {a.actor_kind}</span>
                </span>
                <span className="shrink-0 text-xs text-[color:var(--text-secondary)]">{formatDateTime(a.created_at)}</span>
              </li>
            ))}
            {audit.length === 0 ? <li className="py-2 text-[color:var(--text-secondary)]">None.</li> : null}
          </ul>
          <Link href={`/admin/audit?org=${org.id}`} className="mt-2 inline-block text-xs underline">Full log</Link>
        </Card>
      </div>

      {org.notes ? (
        <Card className="mt-4">
          <h2 className="text-base font-semibold">Internal notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{org.notes}</p>
        </Card>
      ) : null}

      {isAdmin ? (
        <Card className="mt-4 border-[#ef4444]/40">
          <h2 className="text-base font-semibold">Customer removal</h2>
          {org.archived_at ? (
            <>
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                Archived {formatDateTime(org.archived_at)}. This customer is hidden from active dashboards and its subscriptions were cancelled. Restoring reopens the customer, projects, and websites, but billing stays cancelled until you create a new subscription.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <ActionButton action={restoreOrganization.bind(null, org.id)}>Restore customer</ActionButton>
                <ActionButton
                  variant="danger"
                  action={deleteOrganizationPermanently.bind(null, org.id)}
                  redirectTo="/admin/organizations?archived=1"
                  confirmText={`Permanently delete ${org.name}, including its GitHub repositories, Vercel projects, uploaded files, database records, and login accounts not used by another organization? This cannot be undone.`}
                >
                  Permanently delete
                </ActionButton>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                Archiving immediately cancels active subscriptions, closes the customer, and hides it from active dashboards. External sites and repositories remain until permanent deletion.
              </p>
              <div className="mt-3">
                <ActionButton
                  variant="danger"
                  action={archiveOrganization.bind(null, org.id)}
                  confirmText={`Archive ${org.name} and immediately cancel all active subscriptions?`}
                >
                  Archive customer
                </ActionButton>
              </div>
            </>
          )}
        </Card>
      ) : null}
    </div>
  );
}
