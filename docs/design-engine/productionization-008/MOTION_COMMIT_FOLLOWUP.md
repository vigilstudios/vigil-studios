# E06 committed-motion correction — 5 October 2026

The selected E06 loop could remain paused after switching from motion-none or OS reduced motion to restrained/expressive. Hover audition mounted a fresh instance and moved, concealing the defect. The original Lab checks covered selection and static-mode controls, but did not cover resuming the committed instance after static mode.

`MovingChorus` previously recorded every native details `toggle` as visitor reading intent. Automatically opening the complete static wall therefore latched `reading=true`; leaving static mode retained that pause. Nested source disclosures also emit bubbling toggle events.

Reading intent now changes only through direct activation of the reading summary. In moving mode, summary activation explicitly toggles controlled React state and prevents the native default. Enter and Space retain native summary activation semantics. Automatic policy changes and nested disclosures cannot create a persistent visitor pause. The OS preference still takes precedence; explicit Pause and a deliberately opened reading wall remain independent reasons to pause. No loop geometry, observer, per-frame work, registry contract or original study changed.

Verification:

- `motion-commit.json`: 19 passing browser checks of the real Composition and Design Lab renderer. Covers hover-to-commit, initial site-none, explicit section-none, behavior-none, inherited site motion, page motion, visitor reading persistence, reading close/resume, live OS reduction/resume and explicit pause preservation after audition dismissal.
- Existing interaction suite: 30 passing keyboard/motion checks and 40 passing responsive loop geometry cases; identical period-boundary screenshots; zero DOM mutations during continuous animation; reduced motion removes loop observers.
- Existing Lab suite: 24 passing inventory, creative-study, configuration, composition and audition checks.
- Full unit suite: 1,063 tests across 66 files. A subsequent focused suite passes all 20 evidence production tests after fixing their React createElement children argument to satisfy lint.
- Typecheck, lint and production build pass. Logs are under `evidence/motion-followup-*` and `evidence/motion-commit.log`.
- Isolated E06 bundle: 8,428 bytes minified / 3,319 gzip, React external. The correction adds no dependency or animation work.
- Actual Chrome Lab: committed restrained and inherited restrained both run with the dropdown closed; successive computed transforms differ while the reading wall remains closed and the loop reports running. The working tab is retained. Fresh harness runs report no browser errors; Chrome's historical logs include extension message-channel errors during the development-server restart.

Reproduce with `scripts/design-engine-pass008-qa.mjs`, a loopback server for `/tmp/vigil-pass008-qa` on port 4288, then `scripts/design-engine-pass008-motion-commit.mjs`. The regression harness switches from Select on canvas to Interact with preview before testing visitor controls, so canvas inspection cannot consume their clicks.

Collection 009 remains out of scope; the existing concise Astra context and all creative studies remain preserved.
