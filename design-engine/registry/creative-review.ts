/** Authoritative human creative review. Follow-ups dated below; not lifecycle promotion. */
export type CreativeReview = { status: "Approved" | "Promising / Revision Required" | "Rejected"; note: string; revision?: string };
export const collection004Review: Record<string, CreativeReview> = {
  S01: { status: "Approved", note: "Strong visual preference over S05; components and structure are more appealing. Preserve." },
  S02: { status: "Approved", note: "Distinct aesthetic works for the right customer. Preserve independently from S06." },
  S03: { status: "Approved", note: "Strong customer-specific fit. Explore text animation and a client-selected, opt-in audio layer in the future Motion phase; retain the readable transcript." },
  S04: { status: "Promising / Revision Required", note: "Visual direction approved; circle arrow misaligned.", revision: "Arrow tip now sits exactly on the circle at the upper-right 30-degree position, pointing along the clockwise tangent and clear of the station label. Revised detail awaits visual confirmation." },
  S05: { status: "Rejected", note: "Basic and static relative to S01. Retain as a historical creative study; exclude from production consideration. No cosmetic rescue requested." },
  S06: { status: "Approved", note: "Distinct aesthetic works for the right customer. Preserve independently from S02." },
  S07: { status: "Approved", note: "Positive visual aesthetic and structure. Preserve; this is creative acceptance, not production readiness." },
  S08: { status: "Approved", note: "Strong visual direction suited to a different customer from S04. Preserve." },
};

/** Human visual feedback, distinct from implementation readiness / registry lifecycle. */
export const collection005Review: Record<string, { status: "Approved" | "Revision required" | "Pending review"; note: string }> = Object.fromEntries(
  Array.from({ length: 13 }, (_, index) => {
    const id = `M${String(index + 1).padStart(2, "0")}`;
    return [id, id === "M03"
      ? { status: "Revision required", note: "Lines / pointers need actual semantic meaning. The current decorative constellation is not accepted." }
      : id === "M13"
        ? { status: "Approved", note: "User explicitly approved M13 and requested its addition to Composition Lab. Preserve two columns, image-count-driven rows and floating item details." }
        : { status: "Approved", note: "User: All of these look good except for M03. Visual acceptance of the reviewed urban apparel adaptation; no production promotion." }];
  }),
);

/** User approval, 1 October 2026. All twelve concepts approved; implementation remains separate. */
export const collection006Review: Record<string, CreativeReview> = Object.fromEntries(
  Array.from({ length: 12 }, (_, index) => {
    const id = `C${String(index + 1).padStart(2, "0")}`;
    return [id, {
      status: "Approved",
      note: id === "C03" || id === "C10"
        ? "User approved Collection 006 and especially likes this concept for its image usage and animation potential to make the page feel more alive. Preserve and prioritize these qualities in future implementation."
        : "User approved Collection 006: these look very good. Creative acceptance only; no production promotion or migration performed.",
    }];
  }),
);

/** User approval, 1 October 2026. All fourteen concepts pass; user will productionize separately. */
export const collection007Review: Record<string, CreativeReview> = Object.fromEntries(
  Array.from({ length: 14 }, (_, index) => {
    const id = `P${String(index + 1).padStart(2, "0")}`;
    return [id, {
      status: "Approved",
      note: id === "P08"
        ? "User approved all Collection 007 concepts and especially likes P08's close-up imagery showing product details. Preserve this as imagery / art-direction guidance, not a foundation change. Productionization is reserved for the user's next pass."
        : "User approved all Collection 007 concepts: every single one is good. Creative review passed; productionization is reserved for the user's next pass.",
    }];
  }),
);

/** Explicitly reaffirmed by the user, 1 October 2026. Approval only; migration is reserved for another model. */
export const heroApprovalFollowup: Record<"H09" | "H16", CreativeReview> = {
  H09: { status: "Approved", note: "User loves Object Study and explicitly reaffirmed approval. Preserve the contextual copy/object placement and rounded image relationship. Do not migrate to Composition Lab in this approval pass; another model will handle migration." },
  H16: { status: "Approved", note: "User loves The Vertical Record and explicitly reaffirmed approval. Preserve the central image spine and left-to-middle reveal potential. Do not migrate to Composition Lab in this approval pass; another model will handle migration." },
};

/** Explicit productionization brief, 2 October 2026; earlier pending proposal records are historical. */
export const heroExpansionReview:Record<"H12"|"HX01"|"HX02",CreativeReview>={H12:{status:"Approved",note:"User approved modified H12: compact independently aligned comparison context. Preserve existing ID and payload compatibility."},HX01:{status:"Approved",note:"User explicitly approves Full Scene and requests first-class productionization."},HX02:{status:"Approved",note:"User explicitly approves Scene Poster and requests first-class productionization."}};

/** Ongoing creative direction from the user's 1 October 2026 review. */
export const immersiveCreativeDirection = "Sections and components should feel immersive and invite interaction through purposeful animation, compelling imagery, graphics, functional icons and visual attraction. C03 and C10 are strong references for image usage and animation potential. Preserve meaningful content, keyboard/touch access and readable reduced-motion states.";


/** Explicit user approval, 1 October 2026. Creative approval is separate from productionization. */
export const collection003BReview: Record<string, CreativeReview> = Object.fromEntries(
  Array.from({ length: 12 }, (_, index) => {
    const id = `NX${String(index + 1).padStart(2, "0")}`;
    return [id, {
      status: "Approved",
      note: id === "NX04"
        ? "All twelve approved. NX04 is especially important as a true floater: expand styles/customization, support every Hero, and retain zero layout displacement with all scroll effects."
        : "User approved every Collection 003B concept and its flexibility. All need sticky, reveal and Hero-centric transparent-to-solid behavior; dropdowns must overlay page content. Mobile refinement is deferred.",
      revision: "Requested behavior refinements implemented in the creative review workspace. Production migration remains a separate phase.",
    }];
  }),
);

/** Explicit user Productionization Pass 008 approval, 5 October 2026. No further selection gate. */
export const collection008Review:Record<string,CreativeReview> = Object.fromEntries(Array.from({length:12},(_,i)=>[`E${String(i+1).padStart(2,"0")}`,{status:"Approved",note:i===5?"All Collection 008 designs approved. E06 is a priority: preserve continuous loop and expand meaningful visual/motion configuration.":"All Collection 008 studies explicitly human-approved; preserve each evidence/storytelling strategy in its own production system."}]));
