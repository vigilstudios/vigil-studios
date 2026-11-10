import type { DbClient } from "@/lib/vigil/types";

/**
 * A very small in-memory stand-in for the supabase-js query builder, covering
 * the calls the job runner, the order service and the onboarding actions
 * make: select/eq/neq/in/is/not/maybeSingle/single, insert, update, upsert
 * (with onConflict), delete, count, and rpc("claim_jobs" | "log_audit_event").
 * Enough to test orchestration without a database; the SQL itself is
 * covered by supabase/test/rls.test.sql.
 */
type Row = Record<string, unknown>;
type QueryResult = {
  data: Row[] | null;
  error: { code?: string; message: string } | null;
  count?: number | null;
};
type Filter = (r: Row) => boolean;

export class FakeAdmin {
  tables = new Map<string, Row[]>();
  audit: Row[] = [];
  private seq = 0;

  constructor(seed: Record<string, Row[]> = {}) {
    for (const [name, rows] of Object.entries(seed))
      this.tables.set(
        name,
        rows.map((r) => ({ ...r })),
      );
  }

  rows(table: string): Row[] {
    if (!this.tables.has(table)) this.tables.set(table, []);
    return this.tables.get(table)!;
  }

  from(table: string) {
    const rows = this.rows(table);
    const filters: Filter[] = [];
    const apply = (list: Row[]) =>
      list.filter((r) => filters.every((f) => f(r)));
    const nextId = () => `id_${++this.seq}`;
    const uniqueKeys: Record<string, string[][]> = {
      orders: [["id"], ["checkout_token"]],
      provisioning_jobs: [["idempotency_key"]],
      provider_links: [["provider", "resource_kind", "external_id"]],
      webhook_events: [["provider", "event_id"]],
      domains: [["organization_id", "hostname"]],
      organizations: [["slug"]],
      creative_workspaces: [["website_id"]],
    };
    // Column defaults the real schema applies on insert.
    const defaults: Record<string, () => Row> = {
      provisioning_jobs: () => ({ attempts: 0, status: "queued" }),
      orders: () => ({
        status: "pending",
        checkout_token: `tok_${++this.seq}`,
        metadata: {},
        currency: "usd",
      }),
      webhook_events: () => ({
        status: "received",
        received_at: new Date().toISOString(),
      }),
      projects: () => ({ status: "draft", brief: {} }),
      websites: () => ({ status: "provisioning" }),
      domains: () => ({ status: "pending" }),
      subscriptions: () => ({ status: "incomplete" }),
      creative_workspaces: () => ({
        status: "not_started",
        generated_files: {},
        warnings: [],
        asset_counts: {},
        workflow_version: 1,
      }),
    };
    const conflictsWith = (payload: Row, ignore?: Row) =>
      (uniqueKeys[table] ?? []).some(
        (cols) =>
          cols.every((c) => payload[c] !== undefined) &&
          rows.some(
            (r) => r !== ignore && cols.every((c) => r[c] === payload[c]),
          ),
      );

    const builder = {
      _mode: "select" as "select" | "insert" | "update" | "upsert" | "delete",
      _payload: null as Row | null,
      _conflict: null as string[] | null,
      _count: false,
      select(_cols?: string, opts?: { count?: string; head?: boolean }) {
        if (opts?.count) builder._count = true;
        return builder;
      },
      eq(col: string, val: unknown) {
        const [field, key] = col.split("->>");
        filters.push((r) => (key ? (r[field] as Row | undefined)?.[key] : r[field]) === val);
        return builder;
      },
      neq(col: string, val: unknown) {
        filters.push((r) => r[col] !== val);
        return builder;
      },
      in(col: string, vals: unknown[]) {
        filters.push((r) => vals.includes(r[col]));
        return builder;
      },
      is(col: string, val: unknown) {
        filters.push((r) => (val === null ? r[col] == null : r[col] === val));
        return builder;
      },
      gt(col: string, val: string) {
        filters.push((r) => r[col] != null && String(r[col]) > val);
        return builder;
      },
      gte(col: string, val: string) {
        filters.push((r) => r[col] != null && String(r[col]) >= val);
        return builder;
      },
      lt(col: string, val: string) {
        filters.push((r) => r[col] != null && String(r[col]) < val);
        return builder;
      },
      lte(col: string, val: string) {
        filters.push((r) => r[col] != null && String(r[col]) <= val);
        return builder;
      },
      not(col: string, op: string, val: unknown) {
        if (op === "is")
          filters.push((r) => (val === null ? r[col] != null : r[col] !== val));
        if (op === "in") {
          const list = String(val)
            .replace(/^\(|\)$/g, "")
            .split(",")
            .map((s) => s.trim());
          filters.push((r) => !list.includes(String(r[col])));
        }
        return builder;
      },
      order() {
        return builder;
      },
      limit() {
        return builder;
      },
      insert(payload: Row) {
        builder._mode = "insert";
        builder._payload = payload;
        return builder;
      },
      update(payload: Row) {
        builder._mode = "update";
        builder._payload = payload;
        return builder;
      },
      upsert(payload: Row, opts?: { onConflict?: string }) {
        builder._mode = "upsert";
        builder._payload = payload;
        builder._conflict =
          opts?.onConflict?.split(",").map((s) => s.trim()) ?? null;
        return builder;
      },
      delete() {
        builder._mode = "delete";
        return builder;
      },
      run(): QueryResult {
        if (builder._mode === "insert" && builder._payload) {
          if (conflictsWith(builder._payload))
            return {
              data: null,
              error: { code: "23505", message: "duplicate key" },
            };
          const row = {
            id: nextId(),
            ...(defaults[table]?.() ?? {}),
            created_at: new Date().toISOString(),
            ...builder._payload,
          };
          rows.push(row);
          return { data: [row], error: null };
        }
        if (builder._mode === "upsert" && builder._payload) {
          const cols = builder._conflict ?? ["id"];
          const hit = rows.find((r) =>
            cols.every((c) => r[c] === builder._payload![c]),
          );
          if (hit) {
            Object.assign(hit, builder._payload);
            return { data: [hit], error: null };
          }
          const row = { id: nextId(), ...builder._payload };
          rows.push(row);
          return { data: [row], error: null };
        }
        if (builder._mode === "update" && builder._payload) {
          const hit = apply(rows);
          for (const r of hit) {
            if (conflictsWith({ ...r, ...builder._payload }, r))
              return {
                data: null,
                error: { code: "23505", message: "duplicate key" },
              };
            Object.assign(r, builder._payload);
          }
          return { data: hit, error: null };
        }
        if (builder._mode === "delete") {
          const hit = apply(rows);
          for (const r of hit) rows.splice(rows.indexOf(r), 1);
          return { data: hit, error: null };
        }
        const data = apply(rows);
        return {
          data,
          error: null,
          count: builder._count ? data.length : null,
        };
      },
      async maybeSingle() {
        const r = builder.run();
        return { data: r.data?.[0] ?? null, error: r.error };
      },
      async single() {
        const r = builder.run();
        return {
          data: r.data?.[0] ?? null,
          error: r.error ?? (r.data?.length ? null : { message: "no rows" }),
        };
      },
      // Awaiting the builder directly resolves to the query result, as supabase-js does.
      then<T>(resolve: (v: QueryResult) => T) {
        return Promise.resolve(resolve(builder.run()));
      },
    };
    return builder;
  }

  async rpc(name: string, args: Record<string, unknown>) {
    if (name === "apply_provider_subscription") {
      const links = this.rows("provider_links");
      const lookup = (kind: string, ref: unknown, type: string) => links.find(
        (link) => link.provider === args.p_provider && link.resource_kind === kind &&
          link.external_id === ref && link.entity_type === type,
      );
      const rows = this.rows("subscriptions");
      const link = lookup("subscription", args.p_external_id, "subscription");
      let row = link && rows.find((sub) => sub.id === link.entity_id);
      const created = !row;
      if (!row) {
        const customer = lookup("customer", args.p_customer_ref, "organization");
        const priceLink = lookup("price", args.p_price_ref, "plan_price");
        const price = this.rows("plan_prices").find((item) => item.id === priceLink?.entity_id);
        if (!customer || !price) return { data: { subscriptionId: null, created: false }, error: null };
        row = { id: `rpc_subscription_${rows.length + 1}`, organization_id: customer.entity_id, plan_id: price.plan_id, plan_price_id: price.id };
        rows.push(row);
        links.push({ provider: args.p_provider, resource_kind: "subscription", external_id: args.p_external_id, entity_type: "subscription", entity_id: row.id });
      }
      Object.assign(row, args.p_snapshot);
      return { data: { subscriptionId: row.id, created }, error: null };
    }
    if (name === "claim_checkout_order") {
      const order = this.rows("orders").find(
        (o) => o.id === args.p_order && o.status === "pending",
      );
      if (
        !order ||
        (order.buyer_user_id && order.buyer_user_id !== args.p_buyer)
      )
        return { data: null, error: { code: "42501", message: "Wrong buyer" } };
      order.buyer_user_id = args.p_buyer;
      return { data: null, error: null };
    }
    if (name === "allocate_order_project") {
      // Orchestration fake only. Auth, tenant, locking and capacity guarantees are exercised against PostgreSQL.
      const order = this.rows("orders").find((o) => o.id === args.p_order_id);
      if (!order || !["paid", "provisioned"].includes(String(order.status)))
        return { data: null, error: { message: "Paid order required" } };
      let organization = this.rows("organizations").find(
        (o) => o.id === order.organization_id,
      );
      if (!organization && order.buyer_user_id)
        organization = this.rows("organizations").find(
          (o) =>
            String(o.name).trim().toLowerCase() ===
              String(order.business_name).trim().toLowerCase() &&
            this.rows("organization_members").some(
              (m) =>
                m.organization_id === o.id &&
                m.user_id === order.buyer_user_id &&
                m.role === "owner" &&
                m.status === "active",
            ),
        );
      if (!organization) {
        organization = {
          id: `id_${++this.seq}`,
          name: order.business_name,
          slug: `${args.p_slug}-${String(order.id).replace(/[^a-z0-9]/g, "")}`,
          billing_email: order.email,
        };
        this.rows("organizations").push(organization);
        if (order.buyer_user_id)
          this.rows("organization_members").push({
            organization_id: organization.id,
            user_id: order.buyer_user_id,
            role: "owner",
            status: "active",
          });
      }
      if (
        !order.buyer_user_id &&
        !this.rows("organization_invites").some(
          (i) =>
            i.organization_id === organization.id && i.email === order.email,
        )
      )
        this.rows("organization_invites").push({
          id: `id_${++this.seq}`,
          organization_id: organization.id,
          email: order.email,
          role: "owner",
        });
      let project = this.rows("projects").find(
        (p) =>
          p.id === order.project_id || p.source_ref === `order:${order.id}`,
      );
      if (!project) {
        project = {
          id: `id_${++this.seq}`,
          organization_id: organization.id,
          name: `${order.business_name} website`,
          kind: order.project_kind,
          status: "intake",
          template_slug: order.template_slug,
          source_ref: `order:${order.id}`,
          brief: {},
        };
        this.rows("projects").push(project);
      }
      let website = this.rows("websites").find(
        (w) => w.project_id === project.id,
      );
      if (!website) {
        website = {
          id: `id_${++this.seq}`,
          organization_id: organization.id,
          project_id: project.id,
          name: `${order.business_name} website`,
          template_slug: order.template_slug,
          hosting_mode: "dedicated",
          status: "provisioning",
        };
        this.rows("websites").push(website);
      }
      order.organization_id = organization.id;
      order.project_id = project.id;
      return {
        data: {
          organizationId: organization.id,
          projectId: project.id,
          websiteId: website.id,
        },
        error: null,
      };
    }
    if (name === "save_content_design_workspace") {
      const workspace = this.rows("design_workspaces").find(
        (r) =>
          r.project_id === args.p_project && r.revision === args.p_expected,
      );
      if (!workspace)
        return {
          data: null,
          error: { code: "40001", message: "Stale workspace" },
        };
      workspace.site_definition = args.p_site;
      workspace.revision = Number(workspace.revision) + 1;
      return { data: workspace.revision, error: null };
    }
    if (name === "claim_jobs") {
      const now = Date.now();
      const due = this.rows("provisioning_jobs")
        .filter(
          (j) =>
            j.status === "queued" &&
            new Date(String(j.scheduled_for ?? 0)).getTime() <= now,
        )
        .slice(0, Number(args.p_limit ?? 10));
      for (const j of due) {
        j.status = "running";
        j.locked_by = args.p_worker;
        j.locked_at = new Date().toISOString();
        j.attempts = Number(j.attempts ?? 0) + 1;
      }
      return { data: due.map((j) => ({ ...j })), error: null };
    }
    if (name === "log_audit_event") {
      this.audit.push({ ...args });
      // Also visible as a row, the way reconciliation reads it back.
      this.rows("audit_events").push({
        id: ++this.seq,
        action: args.p_action,
        entity_type: args.p_entity_type,
        entity_id: args.p_entity_id ?? null,
        organization_id: args.p_org ?? null,
        after: args.p_after ?? null,
        created_at: new Date().toISOString(),
      });
      return { data: null, error: null };
    }
    return { data: null, error: { message: `unknown rpc ${name}` } };
  }

  asClient(): DbClient {
    return this as unknown as DbClient;
  }
}
