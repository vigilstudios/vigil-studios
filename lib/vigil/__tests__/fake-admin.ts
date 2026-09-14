import type { AdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * A very small in-memory stand-in for the supabase-js query builder, covering
 * the calls the job runner makes: select/eq/maybeSingle/single, insert,
 * update/eq, and rpc("claim_jobs"). Enough to test orchestration without a
 * database; the SQL itself is covered by supabase/test/rls.test.sql.
 */
type Row = Record<string, unknown>;
type QueryResult = { data: Row[] | null; error: { code?: string; message: string } | null };

export class FakeAdmin {
  tables = new Map<string, Row[]>();
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
    const filters: [string, unknown][] = [];
    const apply = (list: Row[]) => list.filter((r) => filters.every(([k, v]) => r[k] === v));
    const nextId = () => `id_${++this.seq}`;

    const builder = {
      _mode: "select" as "select" | "insert" | "update",
      _payload: null as Row | null,
      select() {
        return builder;
      },
      eq(col: string, val: unknown) {
        filters.push([col, val]);
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
      upsert(payload: Row) {
        builder._mode = "insert";
        builder._payload = payload;
        return builder;
      },
      run(): QueryResult {
        let result: QueryResult;
        if (builder._mode === "insert" && builder._payload) {
          const key = builder._payload.idempotency_key;
          if (key && rows.some((r) => r.idempotency_key === key)) {
            result = { data: null, error: { code: "23505", message: "duplicate key" } };
          } else {
            const row = { id: nextId(), attempts: 0, status: "queued", ...builder._payload };
            rows.push(row);
            result = { data: [row], error: null };
          }
        } else if (builder._mode === "update" && builder._payload) {
          const hit = apply(rows);
          for (const r of hit) Object.assign(r, builder._payload);
          result = { data: hit, error: null };
        } else {
          result = { data: apply(rows), error: null };
        }
        return result;
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
    return { data: null, error: { message: `unknown rpc ${name}` } };
  }

  asClient(): AdminSupabaseClient {
    return this as unknown as AdminSupabaseClient;
  }
}
