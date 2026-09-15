/**
 * Marketing copy that is not a price, a plan or a template (those come from
 * the database and lib/constants). One place to tune the voice: plain, warm,
 * no exclamation marks.
 */
export const TAGLINE = "You run the business. Vigil runs the online presence.";

export const HERO = {
  eyebrow: "Websites, hosting, updates, leads and follow-up. One platform, one team.",
  title: TAGLINE,
  lead: "Vigil builds your website, then keeps it running, updated and working for you. No builders to learn, no settings to babysit, and Virtue, our AI employee, guides you from the first minute.",
  primary: { label: "Find your starting point", href: "#start" },
  secondary: { label: "See how it works", href: "#how-it-works" },
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
      what: "A multi-page website designed around your business rather than a template: your services, your locations, your people, with room for a blog and the pages that help customers find you.",
      goodFor: ["More than one service line or location", "A look that is yours, not a template's", "Content that keeps growing: news, guides, longer pages", "Search matters for how customers find you"],
      notFor: "Ordering, booking systems, portals or integrations; those are a Custom build.",
      timeline: "Scoped with you in a short call; two revision rounds.",
      cta: { label: "Talk to us about Professional", href: "#get-started" },
    },
    custom: {
      stage: "Something bigger in mind",
      tone: "violet" as const,
      what: "Anything with a scope: a booking or ordering system, a customer portal, a shop, an integration with the tools you already use. Quoted after a short call, built on the same Vigil platform.",
      goodFor: ["Online ordering, booking or scheduling", "A members area or customer portal", "E-commerce", "Connecting the website to the systems you already run"],
      notFor: "A first website; start with Express or Professional and grow into this.",
      timeline: "Timeline and revisions agreed in the scope.",
      cta: { label: "Book a call", href: "#get-started" },
    },
  },
  glance: [
    { label: "Pages", express: "One", professional: "Several", custom: "As scoped" },
    { label: "Design", express: "Industry template, made yours", professional: "Custom", custom: "Custom" },
    { label: "First look", express: "1–2 business days", professional: "Agreed in the call", custom: "Agreed in the scope" },
    { label: "Revision rounds", express: "One", professional: "Two", custom: "As scoped" },
    { label: "How you start", express: "Pick a template, check out", professional: "Short call, then a checkout link", custom: "Short call, then a quote" },
  ],
  platformNote: "Every Vigil website, whichever build, comes with the Vigil platform underneath: hosting, domain, security, updates and a dashboard that says plainly what is live. You choose how much we take off your plate with a plan.",
};

/** /products/vigil: the dashboard tour (screenshots in public/site/dashboard, captured by scripts/capture-dashboard.mjs). */
export const DASHBOARD_TOUR = [
  { key: "overview", path: "/dashboard", title: "Overview", caption: "Hello, then three plain statuses: Website, Domain, Subscription. If something needs you, it says so in a sentence." },
  { key: "website", path: "/dashboard/website", title: "Website", caption: "What is live, a preview at desktop and phone size, and a download of your site whenever you want it." },
  { key: "domain", path: "/dashboard/domain", title: "Domain", caption: "Your domain stays yours. Virtue works out where it is managed, shows the exact records with copy buttons, and Vigil checks until it connects." },
  { key: "requests", path: "/dashboard/requests", title: "Requests", caption: "On Care and up: say what to change, in a sentence or with a photo. A person makes the change and you watch the progress here." },
  { key: "billing", path: "/dashboard/billing", title: "Billing", caption: "One plan, one receipt. Invoices, your card and the period you chose, in a portal you do not have to think about." },
];

export const VIGIL_PAGE = {
  title: "The platform under every website.",
  lead: "Vigil is the dashboard you sign into and the team behind it. It hosts your website, keeps the domain connected and the certificate current, applies updates, takes your requests and sends one receipt. You see outcomes in plain words, never a hosting console.",
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
  { q: "Is sales tax included?", a: "Sales tax is calculated and added at checkout where it applies." },
];
