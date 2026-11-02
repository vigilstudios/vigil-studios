import { parseSection } from "../composition/schemas";
export function makeTeamSection(id: string, structure = "cards", config: Readonly<Record<string, string>> = {}) {
  return parseSection({ id, component: "about.team", content: { title: "The team", introduction: "Meet the people behind the work. Replace these example profiles with your team.", members: [{ id: "member-one", name: "Alex Morgan", role: "Founder", bio: "Introduce this person's experience and approach." }, { id: "member-two", name: "Sam Taylor", role: "Creative Director", bio: "Share what they bring to the team." }, { id: "member-three", name: "Jordan Lee", role: "Client Experience", bio: "A short introduction in their own words." }] }, structure, motion: "none", ...config });
}
