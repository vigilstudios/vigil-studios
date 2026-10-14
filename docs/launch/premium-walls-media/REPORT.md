# Premium wall and media preview release — 2026-10-14

The Content Hub download button is hidden when the selected site lacks access. The same crown upgrade dialog now appears over a brief illustrative preview on Content Hub, Requests, and plan-gated Insights/Virtue. The preview becomes heavily blurred before the dialog fades upward. Navigation stays accessible and the illustration is inert; no customer records are loaded for the locked preview. Reduced motion presents the finished wall immediately. Already-entitled coming-soon features keep their existing availability notice.

Premium sidebar indicators use crowns in expanded and collapsed navigation. Requests retains its server entitlement check. Professional/Growth Care eligibility and Express/Basic restrictions are unchanged.

Scar’s saved media paths are relative to her website. Previously the dashboard interpreted them against the Vigil domain. Standalone image, video and poster presentation URLs now use the registered Preview origin while building and live origin after launch. Private upload signatures take precedence. Authoring records remain unchanged; there are no backfills, data writes, migrations or Scar source/deployment changes.

## Validation

- Local typecheck and production build pass.
- Full test suite: 104 files / 2,247 tests pass, including locked download/private-record regression coverage and website media origin tests.
- Dependency security: 4 tests pass.
- Lint: no errors; two existing native-image warnings (private signed media rendering).
- Browser fixture: desktop/mobile centered dialog, 16px final blur, inert illustrative layer, crown navigation, Requests shared wall and no locked content download. Mobile layout has no horizontal overflow and its CTA stays visible. A real static Scar photo loads from her Preview origin in both card and draft preview (natural width 1320).
- Temporary fixture removed before production build and commit.

Hosted CI and live acceptance are required before final release closeout. Scar remains Preview pending her second-review approval.
