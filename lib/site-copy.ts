/**
 * Marketing copy that is not a price, a plan or a template (those come from
 * the database and lib/constants). One place to tune the voice: plain, warm,
 * no exclamation marks.
 */
export const TAGLINE = "You run the business. Vigil runs the digital side of it.";

export const HERO = {
  eyebrow: "Websites, hosting, updates, leads and follow-up. One platform, one team.",
  title: TAGLINE,
  lead: "Vigil builds your website, then keeps it running, updated and working for you. No builders to learn, no settings to babysit, and Virtue, our AI employee, guides you from the first minute.",
  primary: { label: "Find your starting point", href: "#start" },
  secondary: { label: "See how it works", href: "#how-it-works" },
};

export const PILLARS = [
  {
    key: "websites",
    tone: "accent" as const,
    title: "A website built for you",
    body: "Express when you are just getting online, Professional when you are established, Custom when you have something bigger in mind. Built by people, not generated.",
    href: "/products#websites",
    cta: "Websites",
  },
  {
    key: "vigil",
    tone: "teal" as const,
    title: "Vigil keeps it running",
    body: "Hosting, domain, security, updates and a dashboard that says plainly what is live, what is connected and what is next. You ask; we handle it.",
    href: "/products#vigil",
    cta: "The Vigil platform",
  },
  {
    key: "virtue",
    tone: "violet" as const,
    title: "Virtue works inside it",
    body: "Virtue sets every customer up. On Growth and Priority she keeps going: following up leads, texting back missed calls, asking for reviews.",
    href: "/virtue",
    cta: "Meet Virtue",
  },
];

export const HOW_IT_WORKS = [
  { n: 1, title: "Choose your website", body: "Express if you are just getting online, Professional when you are established, Custom when you have something bigger in mind. Express checks out online with the plan you pick; Professional and Custom start with a short call and a checkout link made for you." },
  { n: 2, title: "Virtue asks about your business", body: "About ten minutes: your hours, what you offer, your story, photos and your domain. It saves as you go; she walks you through the domain step at your registrar." },
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
  express: { tagline: "Pick a template, live in days.", bullets: ["Single-page site from an industry template", "Your words, photos and colours", "Mobile responsive", "Tap-to-call and email contact", "Basic SEO", "One to two business days", "One design direction, one revision round"] },
  professional: { tagline: "Multi-page, designed around you.", bullets: ["Multi-page website", "Custom design", "Advanced SEO", "Analytics setup", "Blog support", "One design direction, two revision rounds"] },
  custom: { tagline: "Anything with a scope.", bullets: ["Web apps, portals, e-commerce, integrations", "Quoted after a short call", "The same Vigil platform underneath", "You own the site-specific code"] },
};

/** "Start where you are": one card per build, keyed by build_prices.kind. Names and prices come from the database. */
export const START = {
  eyebrow: "Start where you are",
  title: "Every business starts somewhere. Pick the website that fits today.",
  lead: "Just opening, established, or building something bigger: there is a Vigil website for each stage, all on the same platform, with Virtue.",
  stages: {
    express: { stage: "Just getting online", tone: "accent" as const, body: "A finished template for your industry, made yours in one to two business days.", bullets: ["Single-page site from an industry template", "Your words, photos and colours", "Live in one to two business days"], cta: { label: "Choose a template", href: "/express" }, primary: true },
    professional: { stage: "Established and growing", tone: "teal" as const, body: "Multi-page and designed around your business, with room for everything you have to say.", bullets: ["Multi-page website, custom design", "Advanced SEO and analytics setup", "Blog support, two revision rounds"], cta: { label: "Talk to us", href: "#get-started" }, primary: false },
    custom: { stage: "Something bigger in mind", tone: "violet" as const, body: "A portal, a shop, a booking system, an integration: anything with a scope.", bullets: ["Web apps, portals, e-commerce, integrations", "Scoped and quoted after a short call", "You own the site-specific code"], cta: { label: "Book a call", href: "#get-started" }, primary: false },
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

export const FAQ = [
  { q: "Do I own my website?", a: "Yes. The site-specific code, content and assets built for you are yours under the service agreement. Vigil's platform, shared templates and Virtue stay ours; your site does not depend on them to exist." },
  { q: "What happens if I cancel?", a: "Hosting and the dashboard end at the close of your billing period. You get a clean export of your site and keep your domain. No lock-in, no ransom." },
  { q: "Do I have to deal with DNS or my registrar?", a: "Only if you already own a domain, and even then Virtue gives you the exact records for your registrar with copy buttons and checks them for you. If you need a domain, we register it in your name." },
  { q: "How fast is an Express site?", a: "A first look within two business days of finishing onboarding; live shortly after your review." },
  { q: "What does Virtue actually do today?", a: "She runs onboarding for every customer: sets up your sign-in, collects your business details, photos and domain, and hands them to the team. Lead follow-up, missed-call text-back and reviews are coming to Growth and Priority." },
  { q: "Why do I need a plan as well as the build?", a: "The build pays for the work. The plan pays for the site to stay online, secure, updated and supported, month after month. Every Vigil-hosted site needs one; Basic is the floor." },
  { q: "Is sales tax included?", a: "Sales tax is calculated and added at checkout where it applies." },
];
