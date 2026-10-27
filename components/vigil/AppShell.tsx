import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { DraftNavigationProvider } from "./DraftNavigation";
import { AppFrame } from "./AppFrame";
import { SIDEBAR_COOKIE, type NavGroup, type WorkspaceBrand } from "./nav";

/** Server wrapper: reads the persisted sidebar state so the first paint is right. */
export async function AppShell({
  groups,
  homeHref,
  workspace,
  account,
  workspaceBrand,
  children,
}: {
  groups: NavGroup[];
  homeHref: string;
  workspace: ReactNode;
  account: ReactNode;
  workspaceBrand?: WorkspaceBrand;
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const initialCollapsed =
    cookieStore.get(SIDEBAR_COOKIE)?.value === "collapsed";
  return (
    <DraftNavigationProvider>
      <AppFrame
        groups={groups}
        homeHref={homeHref}
        workspace={workspace}
        workspaceBrand={workspaceBrand}
        account={account}
        initialCollapsed={initialCollapsed}
      >
        {children}
      </AppFrame>
    </DraftNavigationProvider>
  );
}
