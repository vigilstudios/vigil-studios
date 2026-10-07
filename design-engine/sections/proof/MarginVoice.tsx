
import type { SectionPayload } from "../../composition/schemas";
import { EvidenceShell, Attribution, Voice } from "./shared";
import { EvidenceMediaReveal } from "./EvidenceMediaReveal";


export function MarginVoice({id,content,motion,evidenceMode}:SectionPayload<"proof.margin-voice"> & {id:string}) {
const c = content;
      return (<EvidenceShell id={id} content={content} evidenceMode={evidenceMode} concept="E01">
        <div className="de-proof-margin">
          <div className="de-proof-witness">
            <EvidenceMediaReveal
              image={c.testimony.portrait} motion={motion}
              label="Speaker portrait"
            />
            <Attribution value={c.testimony.author} />
          </div>
          <div className="de-proof-margin-quote">
            <Voice voice={c.testimony} />
            <p className="de-proof-margin-note">
              <span aria-hidden="true">↳</span>
              {c.annotation}
            </p>
          </div>
        </div>
      </EvidenceShell>);
}
