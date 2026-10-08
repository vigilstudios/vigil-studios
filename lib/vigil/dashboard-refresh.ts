/** Coalesce updates, catch up after hiding a tab, and poll only without Realtime. */
export function createDashboardRefreshController({ refresh, isVisible, isOnline }: {
  refresh: () => void;
  isVisible: () => boolean;
  isOnline: () => boolean;
}) {
  let live = false;
  let dirty = false;
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const schedule = () => {
    if (disposed || timer || !dirty || !isVisible() || !isOnline()) return;
    timer = setTimeout(() => {
      timer = null;
      if (disposed || !isVisible() || !isOnline()) return;
      dirty = false;
      refresh();
    }, 250);
  };

  return {
    changed() {
      dirty = true;
      schedule();
    },
    connection(connected: boolean) {
      // Changes can be missed between disconnect and resubscribe.
      if (live && !connected) dirty = true;
      if (connected && !live) schedule();
      live = connected;
    },
    wake() {
      if (!live) dirty = true;
      schedule();
    },
    poll() {
      if (!live) dirty = true;
      schedule();
    },
    dispose() {
      disposed = true;
      if (timer) clearTimeout(timer);
    },
  };
}

/** The standalone Lab owns a browser draft, so dashboard events cannot refresh it. */
export function dashboardAutoRefreshEnabled(pathname: string): boolean {
  return pathname !== "/admin/lab" && !pathname.startsWith("/admin/lab/");
}
