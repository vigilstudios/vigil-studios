process.env.DESIGN_ENGINE_QA_OUTPUT="/tmp/vigil-readiness-qa";
process.env.DESIGN_ENGINE_QA_ENTRY="scripts/design-engine-readiness-qa.tsx";
process.env.DESIGN_ENGINE_AXE="/tmp/vigil-pass008-qa/axe.js";
await import("./design-engine-pass008-qa.mjs");
