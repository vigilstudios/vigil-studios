"use client";
/* eslint-disable @next/next/no-img-element -- Private, expiring image URLs are normalized by the upload service. */
import { useState, useTransition } from "react";
import {useRouter} from "next/navigation";
import {setBlogPostDeleted} from "@/lib/vigil/actions/blog";
import Link from "next/link";
import {
  LayoutList,
  Table2,
  Image as ImageIcon,
  ArrowUpRight,
} from "lucide-react";
import { Card, inputClass } from "./ui";
export type LibraryPost = {
  id: string;
  website_id: string;
  title: string;
  excerpt: string;
  status: string;
  updated_at: string;
  deleted_at: string | null;
  coverUrl?: string;
  coverAlt?: string;
};
type Site = { id: string; name: string; status: string };
const modified = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
export function BlogLibrary({
  sites,
  posts,
  canWrite,
}: {
  sites: Site[];
  posts: LibraryPost[];
  canWrite: boolean;
}) {
  const router=useRouter();const [pending,start]=useTransition();const [error,setError]=useState("");const [trash,setTrash]=useState(false);
  const [view, setView] = useState<"table" | "feed">("table"),
    [search, setSearch] = useState("");
  const visible = posts.filter((post) =>
    Boolean(post.deleted_at)===trash && `${post.title} ${post.excerpt}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const status = (post: LibraryPost) => post.deleted_at ? "In trash" : post.status === "published" ? "Published" : "Draft";
  const restore=(post:LibraryPost)=>start(async()=>{setError("");const result=await setBlogPostDeleted(post.website_id,post.id,post.updated_at,false);if(!result.ok){setError(result.error);return;}router.refresh();});
  const href = (post: LibraryPost) =>
    `/dashboard/blog/${post.id}?website=${post.website_id}`;
  return (
    <>
      {error&&<p role="alert" className="mb-4 text-sm text-red-500">{error}</p>}
      <div className="mb-4 flex gap-4" role="group" aria-label="Post collection"><button aria-pressed={!trash} onClick={()=>setTrash(false)}>All posts</button><button aria-pressed={trash} onClick={()=>setTrash(true)}>Trash ({posts.filter(p=>p.deleted_at).length})</button></div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <label className="w-full max-w-sm">
          <span className="sr-only">Find a post</span>
          <input
            type="search"
            className={inputClass.replace("text-[13px]", "text-base")}
            placeholder="Find a post…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div
          className="flex rounded-xl border border-[color:var(--border)] p-1"
          role="group"
          aria-label="Blog layout"
        >
          {(["table", "feed"] as const).map((mode) => (
            <button
              key={mode}
              aria-pressed={view === mode}
              onClick={() => setView(mode)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${view === mode ? "bg-[color:var(--bg-surface-soft)] font-semibold" : "text-[color:var(--text-secondary)]"}`}
            >
              {mode === "table" ? (
                <Table2 size={16} />
              ) : (
                <LayoutList size={16} />
              )}{" "}
              {mode === "table" ? "Table" : "Post feed"}
            </button>
          ))}
        </div>
      </div>
      {sites.map((site) => {
        const items = visible.filter((p) => p.website_id === site.id);
        return (
          <section
            key={site.id}
            className="mb-8"
            aria-labelledby={`blog-site-${site.id}`}
          >
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2
                  id={`blog-site-${site.id}`}
                  className="text-xl font-semibold"
                >
                  {site.name}
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-[color:var(--text-secondary)]">
                  {site.status === "live"
                    ? "Published posts appear on your website as soon as you save."
                    : "Published articles appear in the site review. Drafts stay private. Your articles become public after launch."}
                </p>
              </div>
              {canWrite && (
                <Link
                  className="btn-primary text-sm"
                  href={`/dashboard/blog/new?website=${site.id}`}
                >
                  Write a post
                </Link>
              )}
            </div>
            {!items.length ? (
              <Card>
                <p className="py-5 text-sm text-[color:var(--text-secondary)]">
                  {search
                    ? "No posts match your search."
                    : "Your journal starts here. Write your first post when you’re ready."}
                </p>
              </Card>
            ) : trash ? <Card>{items.map(post=><div key={post.id} className="flex items-center justify-between gap-4 py-4"><div><h3 className="font-medium">{post.title}</h3><p className="text-sm text-[color:var(--text-secondary)]">Removed from your website. Restoring keeps its previous publishing status and photos.</p></div>{canWrite&&<button className="btn-secondary text-sm" disabled={pending} onClick={()=>restore(post)}>Restore post</button>}</div>)}</Card> : view === "table" ? (
              <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)]">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">{site.name} blog posts</caption>
                  <thead className="bg-[color:var(--bg-surface-soft)] text-xs text-[color:var(--text-secondary)]">
                    <tr>
                      <th className="px-5 py-3 font-medium">Post</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">
                        Last edited
                      </th>
                      <th className="px-5 py-3">
                        <span className="sr-only">Manage</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--border)]">
                    {items.map((post) => (
                      <tr key={post.id}>
                        <td className="min-w-64 px-5 py-4">
                          <Link
                            href={href(post)}
                            className="font-medium hover:underline"
                          >
                            {post.title}
                          </Link>
                          <p className="mt-1 line-clamp-1 max-w-lg text-xs text-[color:var(--text-secondary)]">
                            {post.excerpt}
                          </p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="rounded-full bg-[color:var(--bg-surface-soft)] px-2.5 py-1 text-xs">
                            {status(post)}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-[color:var(--text-secondary)]">
                          {modified(post.updated_at)}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={href(post)}
                            aria-label={`Open ${post.title}`}
                          >
                            <ArrowUpRight size={18} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((post) => (
                  <Link
                    key={post.id}
                    href={href(post)}
                    className="group overflow-hidden rounded-2xl border border-[color:var(--border)] transition-colors hover:border-[color:var(--text-secondary)]"
                  >
                    {post.coverUrl ? (
                      <img
                        src={post.coverUrl}
                        alt={post.coverAlt ?? ""}
                        width={600}
                        height={400}
                        className="h-52 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-52 items-center justify-center bg-[color:var(--bg-surface-soft)] text-[color:var(--text-secondary)]">
                        <ImageIcon size={32} aria-hidden />
                      </div>
                    )}
                    <div className="p-5">
                      <p className="text-xs text-[color:var(--text-secondary)]">
                        {status(post)} · {modified(post.updated_at)}
                      </p>
                      <h3 className="mt-3 text-lg font-semibold leading-snug">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                        {post.excerpt}
                      </p>
                      <p className="mt-4 flex items-center gap-1 text-sm font-medium">
                        {canWrite ? "Edit post" : "Open post"}{" "}
                        <ArrowUpRight size={15} />
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
