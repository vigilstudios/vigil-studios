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
  line: "Websites built for you · kept running by Vigil · grown by Virtue",
  primary: { label: "Find your starting point", href: "#start" },
  secondary: { label: "Book a call" },
};

/** The Products menu, in the order a customer buys them: build, plan, upgrade; the catalogue last. */
export const PRODUCT_LINKS = [
  { label: "Websites", blurb: "Express, Professional, Custom: pick where you are starting", href: "/products/websites" },
  { label: "Vigil", blurb: "The platform under every website: hosting, domain, updates, plans", href: "/products/vigil" },
  { label: "Virtue", blurb: "The AI employee inside it", href: "/products/virtue" },
  { label: "Express Catalogue", blurb: "Finished templates by industry, ready to buy", href: "/express" },
];

export const PILLARS = [
  {
    key: "websites",
    tone: "accent" as const,
    title: "A website built for you",
    body: "Express when you are just getting online, Professional when you are established, Custom when you have something bigger in mind. Built by people, not generated.",
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
    body: "Virtue sets every customer up. On Growth and Priority she keeps going: following up leads, texting back missed calls, asking for reviews.",
    href: "/products/virtue",
    cta: "Meet Virtue",
  },
];

export const HOW_IT_WORKS = [
  { n: 1, title: "Choose your website", body: "Express starts with an industry template. Professional starts with a two-minute fit guide, then lets you buy online or speak with our team. Custom work starts with a scope call." },
  { n: 2, title: "Choose how to onboard", body: "After payment, book a kickoff call with us or continue with Virtue's guided brief. Everything saves as you go, including your ideas, files and domain." },
  { n: 3, title: "We build", body: "A person builds your site from what you told Virtue. Express gets a first look within two business days; Professional and Custom follow the timeline agreed with you." },
  { n: 4, title: "You review", body: "Say what to change. One revision round is included on Express, two on Professional; Custom is agreed in the scope." },
  { n: 5, title: "Live, and looked after", body: "Your site goes live on your domain with SSL and monitoring. From then on Vigil hosts it, updates it and reports on it. Cancel any time and take your site with you." },
];

export const COMPARISON = [
  { dimension: "Website", builder: "You build and configure it", vigil: "Built for you by a person" },
  { dimension: "Operations", builder: "You operate the platform", vigil: "Vigil runs hosting, domain, security and updates" },
  { dimension: "Changes", builder: "You edit the site yourself", vigil: "You send a request; Care and up handle it" },
  { dimension: "Automation", builder: "You configure the tools", vigil: "Virtue arrives configured on Growth and Priority" },
  { dimension: "Support", builder: "Help articles and a ticket queue", vigil: "A team that knows your site" },
  { dimension: "Leaving", builder: "Often tied to the builder", vigil: "Your code and your domain go with you" },
];

export const PLAN_COPY: Record<string, { headline: string; bullets: string[]; virtue: boolean }> = {
  basic: {
    headline: "The floor every Vigil website stands on.",
    bullets: ["Managed hosting and deployments", "Uptime, SSL and security handled", "Domain status and management", "Your dashboard and billing", "Automated support"],
    virtue: false,
  },
  care: {
    headline: "You never touch the website again.",
    bullets: ["Everything in Basic", "Content and design changes on request", "A monthly change allowance", "Maintenance and support from the team", "A simple request workflow in your dashboard"],
    virtue: false,
  },
  growth: {
    headline: "Turn the website into a customer engine.",
    bullets: ["Everything in Care", "Virtue, your AI employee", "Lead follow-up and recovery", "Missed-call text-back", "Reviews and reputation", "Lead Hub and Insights"],
    virtue: true,
  },
  priority: {
    headline: "An outsourced digital growth department.",
    bullets: ["Everything in Growth", "The most capable Virtue", "Higher automation and messaging allowances", "Custom workflows", "Bigger change allowance", "Priority support"],
    virtue: true,
  },
};

export const BUILD_COPY: Record<string, { tagline: string; bullets: string[] }> = {
  express: { tagline: "Pick a template, live in days.", bullets: [...WEBSITE_TIERS.express.included, "One to two business days", "One design direction, one revision round"] },
  professional: { tagline: "Up to 8 pages, fully custom to your business.", bullets: [...WEBSITE_TIERS.professional.included] },
  custom: { tagline: "Complex software with a written scope.", bullets: [...WEBSITE_TIERS.custom.included, "Quoted after a scope call", "You own the site-specific code"] },
};

/** "Start where you are": one card per build, keyed by build_prices.kind. Names and prices come from the database. */
export const START = {
  eyebrow: "Start where you are",
  title: "Every business starts somewhere. Pick the website that fits today.",
  lead: "Just opening, established, or building something bigger: there is a Vigil website for each stage, all on the same platform, with Virtue.",
  stages: {
    express: { stage: "Just getting online", tone: "accent" as const, body: "A finished template for your industry, made yours in one to two business days.", bullets: ["Single-page site from an industry template", "Your words, photos and colours", "Live in one to two business days"], cta: { label: "Choose a template", href: "/express" }, primary: true },
    professional: { stage: "Established and growing", tone: "teal" as const, body: "Up to eight fully custom pages with booking, forms, integrations, analytics and SEO foundations.", bullets: ["Up to 8 custom primary pages", "Standard booking, payment and third-party integrations", "CMS where appropriate, two revision rounds"], cta: { label: "Start Professional", href: "/professional" }, primary: false },
    custom: { stage: "Something bigger in mind", tone: "violet" as const, body: "A portal, custom booking platform, advanced store or complex integration: anything that needs a written scope.", bullets: ["Custom apps, portals and advanced ecommerce", "Custom APIs and complex workflows", "Scoped and quoted after a short call"], cta: { label: "Book a call", href: "#get-started" }, primary: false },
  },
  note: "Not sure? Start with Express. Moving up later is a conversation, not a migration.",
};

export const GET_STARTED = {
  title: "Ready when you are.",
  lead: "Whether you need your first website, a bigger one, or something built to a scope, the next step is the same size: pick a starting point, or talk to a person first.",
  primary: { label: "Find your starting point", href: "#start" },
  call: "Book a call",
  email: "hello@vigilstudios.co",
  emailLabel: "Email us",
  note: "Fifteen minutes with a person, no pitch. Email gets a reply within one business day.",
};

/** /products/websites: what each build is for. Names and prices stay in build_prices; this page points at /pricing for numbers. */
export const WEBSITES_PAGE = {
  title: "Three ways to get a website from Vigil.",
  lead: "Every one is built by a person from what you tell Virtue, runs on the Vigil platform, and is yours to keep. Which one you start with depends on where your business is today.",
  packages: {
    express: {
      stage: "Just getting online",
      tone: "accent" as const,
      what: "A finished, single-page website for your industry, made yours with your words, photos and colours. You see the whole example site before you buy, and a person builds yours from it in one to two business days.",
      goodFor: ["Opening soon and need to be findable", "A Facebook page or a listing, but no website", "Replacing a do-it-yourself builder site", "One location and one clear next step: call, book or visit"],
      notFor: "More than a page of content, a custom look, or anything a customer has to log in to.",
      timeline: "First look within two business days; one revision round.",
      cta: { label: "Browse the templates", href: "/express" },
    },
    professional: {
      stage: "Established and growing",
      tone: "teal" as const,
      what: "A fully custom website designed around your business and brand: up to eight primary pages, advanced forms, standard booking and payment integrations, analytics, SEO foundations and CMS-driven content where appropriate.",
      goodFor: ["A custom look and content hierarchy", "Booking through Calendly, Acuity, Square, Vagaro, Fresha or similar", "Forms, simple payments, analytics, maps, reviews and marketing tools", "Blogs, portfolios, case studies, teams, services or locations"],
      notFor: "Custom applications, customer portals, native booking platforms, advanced ecommerce, custom APIs or complex automation.",
      timeline: "Purchase online, then book a kickoff call or complete the guided brief; two revision rounds.",
      cta: { label: "Start Professional", href: "/professional" },
    },
    custom: {
      stage: "Something bigger in mind",
      tone: "violet" as const,
      what: "Software and systems that go beyond a standard business website: native booking, customer portals, advanced ecommerce, custom APIs and complex automation. Quoted after a scope call and built on the same Vigil platform.",
      goodFor: ["Native booking or operational workflows", "A members area, dashboard or customer portal", "Advanced ecommerce or marketplace functionality", "Custom APIs and multi-system automation"],
      notFor: "A first website; start with Express or Professional and grow into this.",
      timeline: "Timeline and revisions agreed in the scope.",
      cta: { label: "Book a call", href: "#get-started" },
    },
  },
  glance: [
    { label: "Pages", express: "One", professional: "Up to 8 primary pages", custom: "As scoped" },
    { label: "Design", express: "Industry template, made yours", professional: "Custom", custom: "Custom" },
    { label: "First look", express: "1–2 business days", professional: "Confirmed after intake", custom: "Agreed in the scope" },
    { label: "Revision rounds", express: "One", professional: "Two", custom: "As scoped" },
    { label: "How you start", express: "Pick a template, check out", professional: "Fit guide, then online checkout", custom: "Scope call, then a quote" },
  ],
  platformNote: "Every Vigil website, whichever build, comes with the Vigil platform underneath: hosting, domain, security, updates and a dashboard that says plainly what is live. You choose how much we take off your plate with a plan.",
};

export const VIGIL_PAGE = {
  title: "The platform under every website.",
  lead: "Vigil is the dashboard you sign into and the team behind it. It hosts your website, keeps the domain connected and the certificate current, applies updates, takes your requests and sends one receipt. You see outcomes in plain words, never a hosting console.",
  primary: { label: "Find your starting point", href: "/#start" },
  secondary: { label: "See the plans", href: "/pricing?tab=subscriptions" },
  experience: [
    { title: "You sign in, you do not configure", body: "There are no settings to get wrong. Every page tells you what is true right now and, if something needs you, what to do next." },
    { title: "You ask, a person does it", body: "Changes are a request, not a project. Say it in a sentence, attach a photo if it helps, and watch it move to done." },
    { title: "Virtue is already inside", body: "She set you up on day one and stays in the dashboard. On Growth and Priority she keeps working: leads, missed calls, reviews." },
    { title: "You can always leave", body: "Your site's code and content are yours; download them from the dashboard any time. Your domain never leaves your name." },
  ],
};

export const FAQ = [
  { q: "Do I own my website?", a: "Yes. The site-specific code, content and assets built for you are yours under the service agreement. Vigil's platform, shared templates and Virtue stay ours; your site does not depend on them to exist." },
  { q: "What happens if I cancel?", a: "Hosting and the dashboard end at the close of your billing period. You get a clean export of your site and keep your domain. No lock-in, no ransom." },
  { q: "Do I have to deal with DNS or my registrar?", a: "Only if you already own a domain, and even then Virtue gives you the exact records for your registrar with copy buttons and checks them for you. If you need a domain, we register it in your name." },
  { q: "How fast is an Express site?", a: "A first look within two business days of finishing onboarding; live shortly after your review." },
  { q: "What does Virtue actually do today?", a: "She runs onboarding for every customer: sets up your sign-in, collects your business details, photos and domain, and hands them to the team. Lead follow-up, missed-call text-back and reviews are coming to Growth and Priority." },
  { q: "Why do I need a plan as well as the build?", a: "The build pays for the work. The plan pays for the site to stay online, secure, updated and supported, month after month. Every Vigil-hosted site needs one; Basic is the floor." },
];
