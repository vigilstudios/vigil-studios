import type { SectionInstance } from "./schemas";
export function configurationValue(
  section: SectionInstance,
  name: string,
): string {
  const record = section as unknown as Record<string, unknown>;
  if (name.startsWith("settings."))
    return String((record.settings as Record<string, unknown>)[name.slice(9)]);
  return String(record[name] ?? "left");
}
export function configurationPatch(
  section: SectionInstance,
  name: string,
  value: string,
): Record<string, unknown> {
  if (!name.startsWith("settings.")) return { [name]: value };
  if (!("settings" in section)) return {};
  const key = name.slice(9),
    settings = {
      ...section.settings,
      [key]: key === "cta" || key === "utilities" ? value === "true" : value,
    };
  if (key === "scroll" && value === "solidify" && settings.position === "flow")
    settings.position = "overlay";
  if (key === "position" && value === "flow" && settings.scroll === "solidify")
    settings.scroll = "sticky";
  return { settings };
}
export function configurationVisible(section: SectionInstance, name: string) {
  if (!configurationChoiceVisible(section.component, section as unknown as Record<string,unknown>, name)) return false;
  if (name === "settings.cta")
    return "action" in section.content && !!section.content.action;
  if (name === "settings.utilities")
    return (
      "utilities" in section.content && !!section.content.utilities?.length
    );
  return (
    name !== "settings.heroContrast" ||
    ("settings" in section && section.settings.scroll === "solidify")
  );
}

/** Shared finite-choice visibility for Design and Composition; inactive authored values persist. */
export function configurationChoiceVisible(component:string,values:Readonly<Record<string,unknown>>,name:string){
 if(component === "proof.moving-chorus" && name === "columns" && values.layout === "ribbon") return false;
 if(component === "work.gallery-hanging" && values.layout === "hanging" && ["ratio","captions","density"].includes(name)) return false;
 if(component === "proof.moving-chorus" && values.motion === "none" && ["layout","columns","direction","speed","intensity","pauseOnHover","pauseOnFocus","edgeFade","gap"].includes(name)) return false;
 if(["hero.image-marquee","work.image-sphere"].includes(component) && values.motion === "none" && ["direction","speed","tilt"].includes(name)) return false;
 return true;
}
