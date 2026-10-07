import type { ComponentType, SVGProps } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronDown,
  CircleHelp, Download, ExternalLink, Mail, MapPin, Menu, Minus, Phone,
  Play, Plus, Search, Upload, UserRound, X,
} from "lucide-react";
import type { VigilIconName } from "./names";

export type IconVisualProps = Omit<SVGProps<SVGSVGElement>, "strokeWidth"> & {
  size?: number | string;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
};
export type IconRenderer = ComponentType<IconVisualProps>;

/** Static imports keep the core pack tree-shakable. Names are the public contract. */
export const coreIcons = {
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up-right": ArrowUpRight,
  calendar: CalendarDays,
  check: Check,
  "chevron-down": ChevronDown,
  close: X,
  download: Download,
  "external-link": ExternalLink,
  help: CircleHelp,
  mail: Mail,
  map: MapPin,
  menu: Menu,
  minus: Minus,
  phone: Phone,
  play: Play,
  plus: Plus,
  search: Search,
  upload: Upload,
  user: UserRound,
} as const satisfies Record<VigilIconName, IconRenderer>;

export type VigilIconPack = Partial<Record<VigilIconName, IconRenderer>>;

/** Caller-supplied packs stay with a client project; they never mutate the core registry. */
export function resolveIcon(name: VigilIconName, pack?: VigilIconPack): IconRenderer {
  return pack?.[name] ?? coreIcons[name];
}
