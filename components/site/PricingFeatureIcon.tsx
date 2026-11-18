import { CalendarDays, Clock3, Code2, FilePenLine, Globe2, Image, Layers3, LineChart, Palette, PanelsTopLeft, Plug, ShieldCheck, Sparkles } from "lucide-react";

export function PricingFeatureIcon({ label }: { label: string }) {
  const text = label.toLowerCase();
  const Icon = /hosting|ssl|security/.test(text) ? ShieldCheck
    : /domain/.test(text) ? Globe2
    : /booking/.test(text) ? CalendarDays
    : /insight|report/.test(text) ? LineChart
    : /virtue|automat/.test(text) ? Sparkles
    : /first look|business days/.test(text) ? Clock3
    : /code/.test(text) ? Code2
    : /integrat|payment/.test(text) ? Plug
    : /revision|update|content|cms/.test(text) ? FilePenLine
    : /photo|image/.test(text) ? Image
    : /design|brand/.test(text) ? Palette
    : /pages/.test(text) ? Layers3 : PanelsTopLeft;
  return <Icon className="mt-1 h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" aria-hidden />;
}
