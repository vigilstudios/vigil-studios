process.env.DESIGN_ENGINE_QA_OUTPUT = "/tmp/vigil-creator-sections-qa";
process.env.DESIGN_ENGINE_QA_ENTRY = "scripts/design-engine-creator-sections-qa.tsx";
await import("./design-engine-pass008-qa.mjs");
const { cp } = await import("node:fs/promises");
for (const folder of ["design-engine-creators", "design-engine-study-003b"]) await cp(`public/${folder}`, `${process.env.DESIGN_ENGINE_QA_OUTPUT}/${folder}`, { recursive: true });
