/** Loopback-only production media/width fixture; no deployed route or auth changes. */
import { createRoot } from "react-dom/client";
import { ProfessionalLab } from "../design-engine/preview/editor/ProfessionalLab";
import { CompositionPreview } from "../design-engine/composition/render";
import { makeSection } from "../design-engine/preview/composition/fixtures";
import {
  parseSection,
  type SectionId,
} from "../design-engine/composition/schemas";
import { editableMedia, patchMediaValue } from "../design-engine/media/editing";
import { makeComplexSiteFixture } from "../design-engine/preview/composition/site-fixture";
import "../design-engine/styles.css";
import "../design-engine/composition/styles.css";
import "../design-engine/preview/editor/editor.css";
import "../design-engine/preview/composition/lab.css";
import "../design-engine/preview/calibration/calibration.css";
const p = new URLSearchParams(location.search),
  id = (p.get("component") ?? "work.image-expansion") as SectionId;
let section = makeSection(id, "media-qa");
if (p.has("video")) {
  const fields = editableMedia(section).filter(
    (f) => !f.path.includes("poster"),
  );
  for (const field of p.has("all") ? fields : fields.slice(0, 1))
    section = patchMediaValue(section, field.path, {
      src: "/design-engine-study-005/selvedge.mp4",
      ...(!field.videoRecord ? { mediaType: "video" } : {}),
      playback: {
        loop: true,
        controls: p.has("controls"),
        enlarge: true,
        autoplay: p.has("autoplay"),
        poster: field.videoRecord ? undefined : field.value.src,
      },
    });
}
section = parseSection({
  ...section,
  sectionWidth: p.get("width") ?? "default",
});
createRoot(document.getElementById("root")!).render(
  p.has("lab") ? (
    <ProfessionalLab
      initialWorkspace={p.get("lab") === "design" ? "design" : "composition"}
    />
  ) : (
    <CompositionPreview
      composition={{
        id: "media-width-qa",
        label: "Media and width QA",
        site: makeComplexSiteFixture().settings,
        sections: [section],
      }}
      embedded={false}
    />
  ),
);
