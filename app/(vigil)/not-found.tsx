import Link from "next/link";

export default function VigilNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6 text-center">
        <h1 className="text-lg font-semibold">Not found</h1>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">That page does not exist or you do not have access to it.</p>
        <Link href="/dashboard" className="btn-primary mt-5 text-sm">
          Back to your dashboard
        </Link>
      </div>
    </main>
  );
}
