# Lead Hub design alignment — 2026-10-22

Implemented on `codex/lead-hub-design`, based on production `26e7410bece87b2b65bc4b94979c72b3c7908e54`, in an isolated worktree. The shared dirty Vigil checkout and Scar’s local promo preview were left intact. This work has not been deployed or pushed to production.

## Result

Lead Hub now uses Content Hub’s compact heading, token colors, selected-tab treatment, standalone search toolbar, restrained borders and rounded table. Inbox, unread inquiries and contact settings have separate navigation. Inquiry details provide a readable message, contact facts, internal activity/notes, status/read controls, direct email link and honest notification-delivery status. Empty, filtered, unread and out-of-range results have distinct messages and useful actions. Phone/tablet layouts use compact inquiry rows and stacked detail/settings panels.

Existing server actions, organization scoping and role checks remain in place. Unread is now a real server-side filter. Pagination and detail/back navigation preserve search, status, source and view. Query parameters are bounded and validated; external back destinations are rejected. Preferences remain editable only by staff, owners or managers. No schema changes, activation changes, production leads or outgoing messages.

## Scar’s actual connection

The saved contact notification recipient is configured, but capture is disabled and automation is waiting for launch. The website is still building, with domain launch pending. The public contact configuration currently returns 503. Therefore this is not an end-to-end verified live inbox; design work does not activate it or bypass launch/domain/CAPTCHA gates. The new interface distinguishes this waiting state from a connected live website. Notification `sent` means accepted by the email provider, not confirmed inbox delivery.

## Verification

- 85 focused tests passed across Lead Hub queries/actions/presentation and existing contact capture, connection and automation suites. Includes tenant isolation, inaccessible writes, note RPC, role-restricted preferences, booking validation, unread filtering, stable pagination, safe return navigation and connection/empty states.
- Type checking and focused ESLint passed without warnings.
- Optimized Next.js production build passed, including runtime generation and static-page generation.
- Chrome browser checks: populated inbox, empty inbox, settings and detail at 320, 390, 768 and 1440px; light mode at 390 and 1440px. No horizontal document or main-panel overflow in these 24 checks. Tablet detail stacking rechecked after breakpoint adjustment.
- Browser interactions with sample data: search/status filtering retains unread view, detail return retains filters, status/read updates, internal note creation, preference saving and failed-save feedback with entered values retained.
- No physical iOS browser or live email submission was tested. Backend behavior was checked with test doubles; no customer record was modified.

## Local review

Run `node scripts/preview-lead-hub.mjs` from this worktree. Preview: http://127.0.0.1:4187/ . It renders the real new view components, actual dashboard frame and ActionForm with local Next navigation/image stand-ins. All contacts use example.com. Changes are in memory and reset on navigation/reload. There are no credentials or API calls, and no public/authenticated app route was added. The sample preview is not included in production routing.

Use the tabs and inquiry rows to review the UI; the top strip can display an empty inbox, switch theme or simulate failed saves. Scar’s separate promo preview remains at http://127.0.0.1:4185/ .
