import { Instagram, Youtube, Twitch, Facebook, Linkedin, Github } from "lucide-react";
export const socialIconNames = ["instagram","tiktok","youtube","twitch","x","threads","facebook","linkedin","pinterest","snapchat","bluesky","discord","reddit","spotify","patreon","substack","whatsapp","telegram","github","website"] as const;
export type SocialIconName = typeof socialIconNames[number];
const platformIcons = { instagram:Instagram, youtube:Youtube, twitch:Twitch, facebook:Facebook, linkedin:Linkedin, github:Github };
/** Brand symbols are a separate selectable pack; platform names stay visible to assistive technology. */
export function SocialIcon({ name, size = 24 }: { name: SocialIconName; size?: number }) {
  if (name in platformIcons) { const Icon = platformIcons[name as keyof typeof platformIcons]; return <Icon size={size} aria-hidden="true" strokeWidth={1.6}/>; }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "x" && <><path d="M4 3h4l12 18h-4Z"/><path d="m20 3-7 8M4 21l7-8"/></>}
    {name === "tiktok" && <><path d="M14 3v13a4.5 4.5 0 1 1-4-4.5M14 3c0 4 3 6 6 6"/><path d="M17 3v3"/></>}
    {name === "threads" && <><path d="M19 7c-1-3-4-4-7-4-6 0-9 4-9 9s3 9 9 9c5 0 8-3 8-6s-3-5-7-5c-3 0-5 1-5 3s1 4 4 4c4 0 4-7 1-10"/></>}
    {name === "pinterest" && <><circle cx="12" cy="11" r="8"/><path d="m9 22 3-14c1-2 5-1 5 2s-3 6-5 3"/></>}
    {name === "snapchat" && <path d="M12 3c-4 0-5 3-5 6v3l-3 2 3 2-1 2 3 1 3 2 3-2 3-1-1-2 3-2-3-2V9c0-3-1-6-5-6Z"/>}
    {name === "bluesky" && <path d="M12 12C8 7 3 3 3 6c0 4 1 7 5 7-5 0-5 3-2 5 3 2 5-1 6-4 1 3 3 6 6 4 3-2 3-5-2-5 4 0 5-3 5-7 0-3-5 1-9 6Z"/>}
    {name === "discord" && <><path d="m5 5 4-1 1 2h4l1-2 4 1 3 13-5 2-1-3H8l-1 3-5-2Z"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/></>}
    {name === "reddit" && <><ellipse cx="12" cy="14" rx="9" ry="6"/><path d="m12 8 2-5 5 1M8 17c2 1 6 1 8 0"/><circle cx="20" cy="4" r="1.5"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/></>}
    {name === "spotify" && <><circle cx="12" cy="12" r="9"/><path d="M6 9c4-2 8-2 12 0M7 12c3-1 7-1 10 0M8 15c3-1 5-1 8 0"/></>}
    {name === "patreon" && <><path d="M5 3v18"/><circle cx="15" cy="9" r="6"/></>}
    {name === "substack" && <><path d="M5 4h14M5 7h14M5 10h14v11l-7-4-7 4Z"/></>}
    {name === "whatsapp" && <><path d="M21 12a9 9 0 1 0-16 6l-2 4 5-2a9 9 0 0 0 13-8Z"/><path d="M8 7c-2 3 2 8 6 9l2-3-3-1-1 1-3-3 1-1Z"/></>}
    {name === "telegram" && <path d="m3 10 18-7-4 18-6-6-4 3 1-7 9-6-10 8Z"/>}
    {name === "website" && <><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></>}
  </svg>;
}
export function socialIconFor(platform: string): SocialIconName {
  const key = platform.toLowerCase().replace(/[^a-z]/g,"");
  if (key === "twitter") return "x";
  return socialIconNames.find(name => key.includes(name)) ?? "website";
}
