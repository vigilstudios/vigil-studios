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
type QueryResult = { data: Row[] | null; error: { code?: string; message: string } | null; count?: number | null };
type Filter = (r: Row) => boolean;

export class FakeAdmin {
  tables = new Map<string, Row[]>();
  audit: Row[] = [];
  private seq = 0;

  constructor(seed: Record<string, Row[]> = {}) {
    for (const [name, rows] of Object.entries(seed)) this.tables.set(name, rows.map((r) => ({ ...r })));
  }

  rows(table: string): Row[] {
    if (!this.tables.has(table)) this.tables.set(table, []);
    return this.tables.get(table)!;
  }

  from(table: string) {
    const rows = this.rows(table);
    const filters: Filter[] = [];
    const apply = (list: Row[]) => list.filter((r) => filters.every((f) => f(r)));
    const nextId = () => `id_${++this.seq}`;
    const uniqueKeys: Record<string, string[][]> = {
      provisioning_jobs: [["idempotency_key"]],
      provider_links: [["provider", "resource_kind", "external_id"]],
      webhook_events: [["provider", "event_id"]],
      domains: [["organization_id", "hostname"]],
      organizations: [["slug"]],
    };
    // Column defaults the real schema applies on insert.
    const defaults: Record<string, () => Row> = {
      provisioning_jobs: () => ({ attempts: 0, status: "queued" }),
      orders: () => ({ status: "pending", checkout_token: `tok_${++this.seq}`, metadata: {}, currency: "usd" }),
      webhook_events: () => ({ status: "received", received_at: new Date().toISOString() }),
      projects: () => ({ status: "draft", brief: {} }),
      websites: () => ({ status: "provisioning" }),
      domains: () => ({ status: "pending" }),
      subscriptions: () => ({ status: "incomplete" }),
    };
    const conflictsWith = (payload: Row, ignore?: Row) =>
      (uniqueKeys[table] ?? []).some((cols) => cols.every((c) => payload[c] !== undefined) && rows.some((r) => r !== ignore && cols.every((c) => r[c] === payload[c])));

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
        filters.push((r) => r[col] === val);
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
      not(col: string, op: string, val: string) {
        if (op === "in") {
          const list = val.replace(/^\(|\)$/g, "").split(",").map((s) => s.trim());
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
        builder._conflict = opts?.onConflict?.split(",").map((s) => s.trim()) ?? null;
        return builder;
      },
      delete() {
        builder._mode = "delete";
        return builder;
      },
      run(): QueryResult {
        if (builder._mode === "insert" && builder._payload) {
          if (conflictsWith(builder._payload)) return { data: null, error: { code: "23505", message: "duplicate key" } };
          const row = { id: nextId(), ...(defaults[table]?.() ?? {}), created_at: new Date().toISOString(), ...builder._payload };
          rows.push(row);
          return { data: [row], error: null };
        }
        if (builder._mode === "upsert" && builder._payload) {
          const cols = builder._conflict ?? ["id"];
          const hit = rows.find((r) => cols.every((c) => r[c] === builder._payload![c]));
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
            if (conflictsWith({ ...r, ...builder._payload }, r)) return { data: null, error: { code: "23505", message: "duplicate key" } };
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
        return { data, error: null, count: builder._count ? data.length : null };
      },
      async maybeSingle() {
        const r = builder.run();
        return { data: r.data?.[0] ?? null, error: r.error };
      },
      async single() {
        const r = builder.run();
        return { data: r.data?.[0] ?? null, error: r.error ?? (r.data?.length ? null : { message: "no rows" }) };
      },
      // Awaiting the builder directly resolves to the query result, as supabase-js does.
      then<T>(resolve: (v: QueryResult) => T) {
        return Promise.resolve(resolve(builder.run()));
      },
    };
    return builder;
  }

  async rpc(name: string, args: Record<string, unknown>) {
    if (name === "claim_jobs") {
      const now = Date.now();
      const due = this.rows("provisioning_jobs")
        .filter((j) => j.status === "queued" && new Date(String(j.scheduled_for ?? 0)).getTime() <= now)
        .slice(0, Number(args.p_limit ?? 10));
      for (const j of due) {
        j.status = "running";
        j.locked_by = args.p_worker;
        j.attempts = Number(j.attempts ?? 0) + 1;
      }
      return { data: due.map((j) => ({ ...j })), error: null };
    }
    if (name === "log_audit_event") {
      this.audit.push({ ...args });
      // Also visible as a row, the way reconciliation reads it back.
      this.rows("audit_events").push({ id: ++this.seq, action: args.p_action, entity_type: args.p_entity_type, entity_id: args.p_entity_id ?? null, organization_id: args.p_org ?? null, after: args.p_after ?? null, created_at: new Date().toISOString() });
      return { data: null, error: null };
    }
    return { data: null, error: { message: `unknown rpc ${name}` } };
  }

  asClient(): DbClient {
    return this as unknown as DbClient;
  }
}
