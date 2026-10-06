/**
 * Marketing copy that is not a price, a plan or a template (those come from
 * the database and lib/constants). One place to tune the voice: plain, warm,
 * no exclamation marks.
 */
import { WEBSITE_TIERS } from "@/lib/vigil/site-tiers";

export const TAGLINE = "Keeping watch over your business online.";

/** The hero says one thing; the mark and the notifications around it show the rest. `secondary` opens the Calendly popup. */
export const HERO = {
  title: TAGLINE,
  line: "Websites built for you · kept running by Vigil · guided by Virtue",
  primary: { label: "Find your starting point", href: "#start" },
  secondary: { label: "Book a call" },
};

/** The Products menu, in the order a customer buys them: build, plan, upgrade; the catalogue last. */
export const PRODUCT_LINKS = [
  { label: "Websites", blurb: "Express, tailored Professional, bespoke Custom: find your fit", href: "/products/websites" },
  { label: "Vigil", blurb: "The platform under every website: hosting, domain, updates, plans", href: "/products/vigil" },
  { label: "Virtue", blurb: "The AI employee inside it", href: "/products/virtue" },
  { label: "Express Catalogue", blurb: "Curated industry designs, customized around your brand", href: "/express" },
];

export const PILLARS = [
  {
    key: "websites",
    tone: "accent" as const,
    title: "A website built for you",
    body: "Express for a polished single page, Professional for a tailored multi-page experience, Custom for bespoke design and advanced functionality. Built for your business.",
    href: "/products/websites",
    cta: "Websites",
  },
  {
    key: "vigil",
    tone: "teal" as const,
    title: "Vigil keeps it running",
    body: "Hosting, domain, security, updates and a dashboard that says plainly what is live, what is connected and what is next. You ask; we handle it.",
    href: "/products/vigil",
    cta: "The Vigil platform",
  },
  {
    key: "virtue",
    tone: "violet" as const,
    title: "Virtue works inside it",
    body: "Virtue guides setup for every customer. Lead follow-up, missed-call text-back and reviews are in development for eligible Growth and Priority subscriptions.",
    href: "/products/virtue",
    cta: "Meet Virtue",
  },
];

/** The five steps of "How it works", each tagged with whose step it is. The scenes that illustrate them live in sections/HowItWorksSection.tsx. */
export const HOW_IT_WORKS = [
  { n: 1, who: "Yours", title: "Choose your website and plan", body: "Express, Professional or Custom, plus a separate recurring plan to keep it running. Choose a curated single page, tailored multi-page site or bespoke build." },
  { n: 2, who: "Yours · with Virtue", title: "Choose how to onboard", body: "A kickoff call with a person, or Virtue\u2019s guided brief. Either way, everything you tell us is saved as you go." },
  { n: 3, who: "Ours", title: "We build", body: "We customize Express, compose Professional around your brand, or develop your scoped Custom build. Express gets a first look within two business days of completed onboarding." },
  { n: 4, who: "Yours", title: "You review", body: "Say what to change, in a sentence, from your dashboard. One round on Express, two on Professional." },
  { n: 5, who: "Ours · from then on", title: "Live, and growing", body: "Your site goes live on your domain. Vigil keeps it running; ongoing changes and additional features depend on your subscription." },
];

export const HOW_IT_WORKS_HEAD = {
  eyebrow: "How it works",
  title: "From the website you choose to a site that is looked after.",
  lead: "Five steps. Two of them are yours, Virtue is with you for both, and the last one never ends.",
};

export const COMPARISON = [
  { dimension: "Website", builder: "You build and configure it", vigil: "Built for you by a person" },
  { dimension: "Operations", builder: "You operate the platform", vigil: "Vigil runs hosting, domain, security and updates" },
  { dimension: "Changes", builder: "You edit the site yourself", vigil: "You send a request; Care and up handle it" },
  { dimension: "Automation", builder: "You configure the tools", vigil: "Virtue automation is in development for Growth and Priority subscriptions" },
  { dimension: "Support", builder: "Help articles and a ticket queue", vigil: "A team that knows your site" },
  { dimension: "Leaving", builder: "Often tied to the builder", vigil: "Your code and your domain go with you" },
];

/** Editorial plan positioning only. Prices, limits and enabled features are catalog rows. */
export const PLAN_COPY: Record<string, { headline: string }> = {
  basic: { headline: "Managed hosting for your Vigil website." },
  care: { headline: "Website care with changes handled by the team." },
  growth: { headline: "Website care with growth tools in development." },
  priority: { headline: "A higher service tier; confirm allowances with the team." },
};

export const RECURRING_SERVICE_NOTE = "Your website build is paid once. Every Vigil-hosted site also needs an active recurring plan. Virtue guides setup on every plan; ongoing Virtue, Lead Hub and Insights are in development for eligible Growth and Priority subscriptions. Allowances are confirmed in your plan, not included in the website build.";

export const BUILD_COPY = {
  express: { tagline: WEBSITE_TIERS.express.summary, bullets: [...WEBSITE_TIERS.express.included, "First look within two business days of onboarding", "One design direction, one revision round"] },
  professional: { tagline: WEBSITE_TIERS.professional.summary, bullets: [...WEBSITE_TIERS.professional.included] },
  custom: { tagline: WEBSITE_TIERS.custom.summary, bullets: [...WEBSITE_TIERS.custom.included, "Quoted after a scope call", "You own the site-specific code"] },
};

/** "Start where you are": one card per build, keyed by build_prices.kind. Names and prices come from the database. */
export const START = {
  eyebrow: "Start where you are",
  title: "Every business starts somewhere. Pick the website that fits today.",
  lead: "Just opening, established, or building something bigger: there is a Vigil website for each stage, all on the same platform with guided setup.",
  stages: {
    express: { stage: "Just getting online", tone: "accent" as const, body: "A polished single page from a curated industry design, customized with your brand and content.", bullets: ["One proven industry design, made yours", "Your words, photos and colours", "First look within two business days of onboarding"], cta: { label: "Explore the designs", href: "/express" }, primary: true },
    professional: { stage: "Established and growing", tone: "teal" as const, body: "A premium multi-page experience composed from our design systems and art-directed around your brand.", bullets: ["Up to 8 tailored primary pages", "Standard booking, payment and third-party integrations", "CMS where appropriate, two revision rounds"], cta: { label: "Start Professional", href: "/professional" }, primary: false },
    custom: { stage: "Something bigger in mind", tone: "violet" as const, body: "Bespoke visual direction, original interactions or advanced functionality beyond our existing design systems.", bullets: ["Original components, motion and visual direction", "Custom apps, commerce and complex integrations as scoped", "Scoped and quoted after a short call"], cta: { label: "Book a call", href: "#get-started" }, primary: false },
  },
  note: "Choose Express for speed, Professional for tailored multi-page depth, or Custom when your project needs original design or advanced functionality.",
};

/** The close: one line, three ways in, and the good news that pops up around the viewport while the reader decides. */
export const GET_STARTED = {
  title: "Ready when you are.",
  line: "No builders to learn · no settings to babysit · someone always watching",
  primary: { label: "Find your starting point", href: "#start" },
  call: "Book a call",
  email: "hello@vigilstudios.co",
  emailLabel: "Email us",
  note: "Fifteen minutes with a person, no pitch. Email gets a reply within one business day.",
  notes: [
    "Managed hosting and security",
    "Express first look within two business days of onboarding",
    "Your domain stays in your name",
    "Cancel any time and keep your site",
    "A person replies within one business day",
    "Managed hosting, SSL and security on every plan",
    "Virtue sets up every customer",
    "The build is paid once, not rented",
    "No builders, no plugins, nothing to learn",
    "Export your site whenever you like",
    "One team, one dashboard, one receipt",
    "Requests answered in plain words",
    "Built by people, in New York",
    "Missed-call automation in development for Growth plans",
  ],
};

/** /products/websites: what each build is for. Names and prices stay in build_prices; this page points at /pricing for numbers. */
export const WEBSITES_PAGE = {
  title: "Three ways to get a website from Vigil.",
  lead: "Every one is built by a person from what you tell Virtue, runs on the Vigil platform, and is yours to keep. Which one you start with depends on where your business is today.",
  packages: {
    express: {
      stage: "Just getting online",
      tone: "accent" as const,
      what: WEBSITE_TIERS.express.description,
      goodFor: ["Opening soon and need to be findable", "A Facebook page or a listing, but no website", "Replacing a do-it-yourself builder site", "One location and one clear next step: call, book or visit"],
      notFor: "Multi-page architecture, unrestricted layout changes, bespoke art direction or customer accounts.",
      timeline: "First look within two business days of completed onboarding; one revision round.",
      cta: { label: "Explore the designs", href: "/express" },
    },
    professional: {
      stage: "Established and growing",
      tone: "teal" as const,
      what: WEBSITE_TIERS.professional.description,
      goodFor: ["Tailored art direction, typography and page hierarchy", "Booking through Calendly, Acuity, Square, Vagaro, Fresha or similar", "Forms, simple payments, analytics, maps, reviews and marketing tools", "Blogs, portfolios, case studies, teams, services or locations"],
      notFor: "New bespoke components or interaction systems, custom apps, portals, native booking, advanced ecommerce or complex integrations without a separate scope.",
      timeline: "Purchase online, then book a kickoff call or complete the guided brief; two revision rounds.",
      cta: { label: "Start Professional", href: "/professional" },
    },
    custom: {
      stage: "Something bigger in mind",
      tone: "violet" as const,
      what: WEBSITE_TIERS.custom.description,
      goodFor: ["Original visual direction, components or motion", "Native booking or operational workflows", "A members area, dashboard or customer portal", "Advanced ecommerce or marketplace functionality", "Custom APIs and multi-system automation"],
      notFor: "Projects that fit Express or Professional without bespoke design or advanced development.",
      timeline: "Timeline and revisions agreed in the scope.",
      cta: { label: "Book a call", href: "#get-started" },
    },
  },
  glance: [
    { label: "Pages", express: "One", professional: "Up to 8 primary pages", custom: "As scoped" },
    { label: "Design", express: WEBSITE_TIERS.express.design, professional: WEBSITE_TIERS.professional.design, custom: WEBSITE_TIERS.custom.design },
    { label: "Composition", express: "One proven layout, brand and content customization", professional: "Selected sections, layouts, typography, art direction and media", custom: "New design systems and components as scoped" },
    { label: "Page architecture", express: "One page with section navigation", professional: "Independent and nested pages with contextual CTAs", custom: "As scoped for the experience" },
    { label: "Motion", express: "Design-supported behavior", professional: "Compatible motion and interactions", custom: "Original motion and interaction systems as scoped" },
    { label: "Integrations", express: "Design-supported links and embeds", professional: WEBSITE_TIERS.professional.integrations, custom: WEBSITE_TIERS.custom.integrations },
    { label: "Booking", express: WEBSITE_TIERS.express.booking, professional: WEBSITE_TIERS.professional.booking, custom: WEBSITE_TIERS.custom.booking },
    { label: "Commerce", express: "Supported payment links", professional: "Simple payments and deposits; product presentation", custom: "Advanced ecommerce as scoped" },
    { label: "Ongoing service", express: "Separate Vigil plan required", professional: "Separate Vigil plan required", custom: "Separate Vigil plan required" },
    { label: "First look", express: WEBSITE_TIERS.express.firstLook, professional: WEBSITE_TIERS.professional.firstLook, custom: WEBSITE_TIERS.custom.firstLook },
    { label: "Revision rounds", express: "One", professional: "Two", custom: "As scoped" },
    { label: "How you start", express: "Choose a design, check out", professional: "Fit guide, then online checkout", custom: "Scope call, then a quote" },
  ],
  platformNote: "Every Vigil-hosted website needs a separate recurring plan. Hosting, domain connection and security are managed by Vigil; website changes and additional tools depend on the plan you choose. The build does not include a subscription.",
};

export const VIGIL_PAGE = {
  title: "The platform under every website.",
  lead: "Vigil is the dashboard you sign into and the team behind it. It hosts your website, keeps the domain connected and the certificate current, applies updates, takes your requests and sends one receipt. You see outcomes in plain words, never a hosting console.",
  primary: { label: "Find your starting point", href: "/#start" },
  secondary: { label: "See the plans", href: "/pricing?tab=subscriptions" },
  experience: [
    { title: "You sign in, you do not configure", body: "There are no settings to get wrong. Every page tells you what is true right now and, if something needs you, what to do next." },
    { title: "You ask, a person does it", body: "Changes are a request, not a project. Say it in a sentence, attach a photo if it helps, and watch it move to done." },
    { title: "Virtue is already inside", body: "She guides setup on every plan. Ongoing lead follow-up, missed-call text-back and reviews are in development for eligible Growth and Priority subscriptions." },
    { title: "You can always leave", body: "Your site's code and content are yours; download them from the dashboard any time. Your domain never leaves your name." },
  ],
};

export const FAQ = [
  { q: "Which website package should I choose?", a: "Express is a polished single page with a curated design direction. Professional is a premium multi-page composition tailored around your brand. Custom is for original components, bespoke interactions or advanced functionality beyond our existing design systems. Each build needs a separate Vigil plan for hosting." },
  { q: "How is Professional designed for my business?", a: "We compose your site from Vigil’s premium design systems, selecting navigation, heroes, story, services, media, product presentation and social proof to suit your brand. Typography, art direction, imagery, page layouts, nested navigation and contextual calls to action make the experience your own. Compatible motion is configured where supported. New component invention is scoped under Custom." },
  { q: "Do you use templates?", a: "Express uses a curated industry foundation with a proven layout, customized with your brand and content. Professional offers much broader section selection and page composition from our premium design systems. Custom adds bespoke design and development when a project needs something beyond those systems." },
  { q: "How many pages and revisions are included?", a: "Express includes one page and one consolidated revision round. Professional includes up to eight primary pages and two rounds. Legal and simple utility pages do not count toward those eight; extra primary pages are quoted separately. Nested pages use the same primary-page allowance. Custom pages, revisions and timeline follow the written scope." },
  { q: "Can you add booking, payments or custom functionality?", a: "Express supports links and embeds compatible with its chosen design. Professional includes standard booking embeds, advanced forms, simple payments, analytics and third-party integrations, plus CMS where appropriate. Native booking, complex commerce, custom APIs, portals and new bespoke components need an agreed add-on or Custom scope before purchase." },
  { q: "Do I own my website?", a: "Yes. The site-specific code, content and assets built for you are yours under the service agreement. Vigil's platform, shared templates and Virtue stay ours; your site does not depend on them to exist." },
  { q: "What happens if I cancel?", a: "Hosting and the dashboard end at the close of your billing period. You get a clean export of your site and keep your domain. No lock-in, no ransom." },
  { q: "Do I have to deal with DNS or my registrar?", a: "Only if you already own a domain, and even then Virtue gives you the exact records for your registrar with copy buttons and checks them for you. If you need a domain, we register it in your name." },
  { q: "How fast is an Express site?", a: "A first look within two business days of finishing onboarding; launch follows your review, approval and domain setup." },
  { q: "What does Virtue actually do today?", a: "She runs onboarding for every customer: sets up your sign-in, collects your business details, photos and domain, and hands them to the team. Lead follow-up, missed-call text-back and reviews are coming to Growth and Priority." },
  { q: "Why do I need a plan as well as the build?", a: "The build pays for the work. The plan pays for the site to stay online, secure, updated and supported, month after month. Every Vigil-hosted site needs one; Basic is the floor." },
];
