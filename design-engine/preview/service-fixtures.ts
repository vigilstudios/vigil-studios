import { parseSection, type SectionInstance } from "../composition/schemas";
import type { ServiceSectionId } from "../composition/service-schemas";
import { serviceSectionIds } from "../composition/service-contracts";
import { serviceContexts, serviceFixture } from "./collection-006/fixtures";
import type { ServiceStudyId } from "./collection-006/contracts";
/** Creative assets belong only to this Lab bridge. Runtime imports no fixture or client data. */
export function makeServiceSection<K extends ServiceSectionId>(
  component: K,
  id: string,
  adaptation = "professional",
  length = "standard",
  motion = "none",
  scale = "authored",
): SectionInstance<K> {
  const index = serviceSectionIds.indexOf(component),
    context =
      serviceContexts[
        adaptation === "platform" ? 1 : adaptation === "program" ? 2 : 0
      ];
  const model = serviceFixture(
    `C${String(index + 1).padStart(2, "0")}` as ServiceStudyId,
    context,
  );
  const { brand, ...content } = model.content;
  const rewrite = (value: unknown, key = ""): unknown => {
    if (Array.isArray(value)) return value.map((item) => rewrite(item));
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([name, item]) => [
          name,
          rewrite(item, name),
        ]),
      );
    if (key === "href" && typeof value === "string")
      return `https://example.com/offerings/${value.slice(1)}`;
    if (
      length === "long" &&
      ["summary", "description", "introduction"].includes(key) &&
      typeof value === "string"
    )
      return `${value} Context, responsibilities and intended outcomes remain explicit.`.slice(
        0,
        key === "introduction"
          ? 600
          : key === "summary" && index === 3
            ? 120
            : 220,
      );
    return value;
  };
  const productionContent = rewrite(content) as Record<string, unknown>;
  if (scale === "minimum" || scale === "maximum") {
    const fields = [
      "entries",
      "principles",
      "capabilities",
      "services",
      "situations",
      "stages",
      "groups",
      "layers",
      "plates",
      "cases",
      "paths",
      "offerings",
    ];
    const ranges = [
      [3, 7],
      [3, 5],
      [4, 8],
      [5, 10],
      [3, 5],
      [3, 6],
      [3, 4],
      [3, 5],
      [3, 5],
      [2, 4],
      [3, 5],
      [2, 3],
    ];
    const count = ranges[index][scale === "minimum" ? 0 : 1];
    const source = productionContent[fields[index]] as Record<
      string,
      unknown
    >[];
    productionContent[fields[index]] = Array.from({ length: count }, (_, i) => {
      const row = { ...source[i % source.length] };
      if ("id" in row) row.id = `record-${i}`;
      if ("title" in row) row.title = `${row.title} ${i + 1}`;
      if (index === 1) row.verb = `${String(row.verb).slice(0, 20)} ${i + 1}`;
      if (index === 4) row.need = `${String(row.need).slice(0, 110)} ${i + 1}`;
      if (index === 6) {
        row.name = `Group ${i + 1}`;
        const capabilities = row.capabilities as Record<string, unknown>[];
        row.capabilities = Array.from(
          { length: scale === "minimum" ? 2 : 5 },
          (_, j) => ({
            ...capabilities[j % capabilities.length],
            id: `capability-${i}-${j}`,
          }),
        );
      }
      return row;
    });
    if (index === 11) {
      const criteria = productionContent.criteria as string[];
      productionContent.criteria = Array.from(
        { length: scale === "minimum" ? 5 : 10 },
        (_, i) => `${criteria[i % criteria.length]} ${i + 1}`,
      );
      const offerings = productionContent.offerings as { values: string[] }[];
      for (const offering of offerings)
        offering.values = Array.from(
          { length: (productionContent.criteria as string[]).length },
          (_, i) => offering.values[i % offering.values.length],
        );
    }
  }
  return parseSection({
    id,
    component,
    structure: "authored",
    motion,
    content: { ...productionContent, eyebrow: brand },
    ...([2, 8, 9].includes(index)
      ? { treatment: { geometry: "contained", tone: "natural" } }
      : {}),
  }) as SectionInstance<K>;
}
