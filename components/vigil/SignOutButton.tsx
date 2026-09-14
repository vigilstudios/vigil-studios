export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action="/auth/signout" method="post">
      <button type="submit" className={className ?? "text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"}>
        Sign out
      </button>
    </form>
  );
}
