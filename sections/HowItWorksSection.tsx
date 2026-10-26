import { StoryScene } from "@/components/site/story/StoryScene";
import { HOW_IT_WORKS, HOW_IT_WORKS_HEAD } from "@/lib/site-copy";

/** Keep all story copy in the initial HTML; initialize the decorative SVG scene
 * as scrolling begins, well before the second act is visible. */
export function HowItWorksSection() {
  return (
    <StoryScene>
      <div className="hiw absolute inset-0 z-[1] text-[color:var(--text-primary)] opacity-0" style={{ pointerEvents: "none" }}>
        <div className="hiw-head">
          <p className="hiw-eyebrow">{HOW_IT_WORKS_HEAD.eyebrow}</p>
          <h2>{HOW_IT_WORKS_HEAD.title}</h2>
          <p className="hiw-lead">{HOW_IT_WORKS_HEAD.lead}</p>
        </div>
        <ol>
          {HOW_IT_WORKS.map((step) => (
            <li key={step.n}>
              <p>Step 0{step.n} · {step.who}</p>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </StoryScene>
  );
}
