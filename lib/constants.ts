import {
  Globe,
  Zap,
  Search,
  ShoppingCart,
  Wrench,
  BarChart3,
  ArrowRight,
  Code,
  Smartphone,
  Rocket,
  Shield,
  Headphones,
  Paintbrush
} from "lucide-react";

export const SERVICES = [
  {
    id: "custom-websites",
    title: "Custom Websites",
    description:
      "Fully custom-coded websites built from scratch with your brand in mind.",
    icon: Globe,
  },
  {
    id: "landing-pages",
    title: "Landing Pages",
    description:
      "High-converting landing pages designed to turn visitors into customers.",
    icon: Zap,
  },
  {
    id: "seo",
    title: "SEO Optimization",
    description:
      "On-page and technical SEO to help your site rank higher in search results.",
    icon: Search,
  },
  {
    id: "ecommerce",
    title: "E-Commerce",
    description:
      "Fully functional online stores with payment processing and inventory management.",
    icon: ShoppingCart,
  },
  {
    id: "maintenance",
    title: "Website Maintenance",
    description:
      "Ongoing support, updates, and maintenance to keep your site secure and fast.",
    icon: Wrench,
  },
  {
    id: "performance",
    title: "Performance Optimization",
    description:
      "Speed optimization and Core Web Vitals improvement for better rankings.",
    icon: BarChart3,
  },
];

export const PORTFOLIO_PROJECTS = [
  {
    id: 1,
    title: "Local Roofing Co.",
    industry: "Roofing",
    description:
      "Custom website with lead generation forms and service showcase.",
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&h=300&fit=crop",
    techStack: ["Next.js", "Tailwind CSS", "React Hook Form"],
    results: "150+ leads in first month",
  },
  {
    id: 2,
    title: "Fitness Coach Studio",
    industry: "Health & Fitness",
    description: "Membership portal with class scheduling and client management.",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=300&fit=crop",
    techStack: ["Next.js", "Firebase", "Tailwind CSS"],
    results: "50+ active members",
  },
];

export const PROCESS_STEPS = [
  {
    number: "01",
    title: "Discovery",
    description:
      "We learn about your business, goals, target audience, and competitors.",
    icon: Search,
  },
  {
    number: "02",
    title: "Creative Direction",
    description:
      "We create detailed wireframes and designs tailored to your brand.",
    icon: Paintbrush,
  },
  {
    number: "03",
    title: "Development",
    description:
      "We build your site with clean code, performance, and SEO in mind.",
    icon: Code,
  },
  {
    number: "04",
    title: "Launch",
    description:
      "We deploy your site, set up analytics, and ensure everything works perfectly.",
    icon: Rocket,
  },
];

// The Express tier replaces the old manually built Starter. Same deliverable —
// single page, responsive, basic SEO, one revision — but produced from a
// per-industry template rather than a bespoke build, which is what makes the
// lower price and the 1-2 day turnaround possible.
export const EXPRESS_PRICE = "599";

// The Stripe payment link. Empty until the link exists; the catalogue falls
// back to the contact form rather than rendering a button that goes nowhere.
//
// DELIBERATELY EMPTY as of 28 Aug 2026. The link is live and works, but nothing
// catches the payment yet — no webhook, no order record, no intake form — so a
// purchase would take the money and leave the buyer with silence. Restore it
// only once the checkout.session.completed webhook writes to `orders` and the
// intake form is reachable (vigil-leadgen HANDOFF.md, "Where to start next
// session"). The live link, for when that day comes:
//   https://buy.stripe.com/eVq4gyezB6T5gZK1dxfIs04
export const EXPRESS_CHECKOUT_URL = "";

// One finished example per industry, each built from the exact template a real
// order is produced from. The businesses are fictional and each page says so.
export const EXPRESS_TEMPLATES = [
  {
    slug: "home-services",
    variant: "Variant 1",
    industry: "Home services",
    example: "Northgate Plumbing & Heating",
    description:
      "Trade-forward and direct. Services with prices, recent work, and a call button that follows you down the page.",
    accent: "#f15e18",
  },
  {
    slug: "auto-services",
    variant: "Variant 1",
    industry: "Auto repair",
    example: "Torque & Theory",
    description:
      "Editorial and motion-rich, with a transparent brake inspection, service ledger, and a review rail that stays alive.",
    accent: "#dcf763",
  },
  {
    slug: "restaurant",
    variant: "Variant 1",
    industry: "Restaurant and cafe",
    example: "Marlow & Fen",
    description:
      "An all-day menu, warm food photography, and an invitation to stay. Designed for neighborhood restaurants and cafes.",
    accent: "#ad3827",
  },
  {
    slug: "retail",
    variant: "Variant 1",
    industry: "Retail and boutique",
    example: "Quillon Supply",
    description:
      "Product-forward. Portrait tiles for each range, and a get-directions button, because a shop converts on a visit.",
    accent: "#5c6b3c",
  },
  {
    slug: "salon-spa",
    variant: "Variant 1",
    industry: "Salon and spa",
    example: "Ashcombe Studio",
    description:
      "Soft and editorial, with a treatment list that shows how long each appointment takes as well as the price.",
    accent: "#8c5b78",
  },
  {
    slug: "medical",
    variant: "Variant 1",
    industry: "Medical and dental",
    example: "Trelawn Dental Practice",
    description:
      "Calm and restrained. What the practice offers, written plainly, with no prices and no claims about outcomes.",
    accent: "#2f8f9d",
  },
];

export const PRICING_TIERS = [
  {
    name: "Express Sites",
    price: EXPRESS_PRICE,
    description: "Pick a template, launch in days",
    features: [
      { label: "Single-page website", type: "check" },
      { label: "Mobile responsive", type: "check" },
      { label: "Tap-to-call and email contact", type: "check" },
      { label: "Basic SEO", type: "check" },
      { label: "1-2 day turnaround", type: "check" },
      { label: "Design Direction", type: "number", value: 1 },
      { label: "Revision Round", type: "number", value: 1 },
    ],
    cta: "Browse templates",
    href: "/express",
  },
  {
    name: "Professional",
    price: "1,499",
    description: "For growing businesses",
    features: [
      { label: "Multi-page website", type: "check" },
      { label: "Advanced SEO", type: "check" },
      { label: "Custom design", type: "check" },
      { label: "Analytics setup", type: "check" },
      { label: "Blog support", type: "check" },
      { label: "Design Direction", type: "number", value: 1 },
      { label: "Revision Round", type: "number", value: 2 }
    ],
    cta: "Get Started",
    highlighted: true,
  },
  {
    name: "Growth",
    price: "2,499+",
    description: "For established companies",
    features: [
      { label: "E-commerce functionality", type: "check" },
      { label: "Custom integrations", type: "check" },
      { label: "Advanced features", type: "check" },
      { label: "Custom solutions", type: "check" },
      { label: "Priority support", type: "check" },
      { label: "Design Direction", type: "number", value: 2 },
      { label: "Revision Round", type: "number", value: 3 }
    ],
    cta: "Request Quote",
  },
];

export const TESTIMONIALS = [
  {
    name: "Sarah Johnson",
    business: "Johnson Roofing",
    role: "Owner",
    quote:
      "Vigil Studios transformed our online presence. We went from no leads to 150+ qualified leads in the first month.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  {
    name: "Michael Chen",
    business: "Premium Auto Details",
    role: "Manager",
    quote:
      "The website not only looks incredible but it's also incredibly fast. Our customers always comment on how smooth it is.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  },
  {
    name: "Emily Rodriguez",
    business: "Urban Fitness",
    role: "Founder",
    quote:
      "Best investment we made for the business. The booking system is seamless and our conversion rate doubled.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  },
];

export const FAQ_ITEMS = [
  {
    question: "How long does it take to build a website?",
    answer:
      "Most websites are completed within 2–4 weeks, depending on the size and complexity of the project. After our discovery call, we'll provide a clear timeline with milestones so you always know what to expect.",
  },
  {
    question: "Do I own the website?",
    answer:
      "Absolutely. You own your domain, website code, content, and assets from day one. We build custom-coded websites with no platform lock-in, so you're free to host or manage your site however you'd like.",
  },
  {
    question: "Do you offer ongoing maintenance?",
    answer:
      "Yes. Our maintenance plans start at $49/month and include security updates, performance monitoring, backups, and ongoing support to keep your website running smoothly.",
  },
  {
    question: "Can you redesign my existing website?",
    answer:
      "Definitely. Whether your current site needs a visual refresh or a complete rebuild, we can modernize your online presence while preserving your existing content and SEO wherever possible.",
  },
  {
    question: "Is SEO included?",
    answer:
      "SEO is built into every website we create. Every project includes technical SEO fundamentals such as fast load times, mobile optimization, semantic markup, metadata, image optimization, and search engine best practices.",
  },
  {
    question: "How many revisions are included?",
    answer:
      "Each package includes a set number of revision rounds to keep projects efficient and on schedule. Additional revisions or requests outside the original scope can always be added at an hourly rate.",
  },
  {
    question: "What happens after my website launches?",
    answer:
      "Once your website is live, we'll ensure everything is running smoothly and provide any necessary guidance. You can choose to manage the site yourself or continue working with us through one of our maintenance plans.",
  },
];

export const DIFFERENTIATORS = [
  {
    title: "Custom Coded",
    description: "No templates. Every site is built from scratch.",
    highlight: "vigil",
  },
  {
    title: "No Templates",
    description: "Unique design that reflects your brand.",
    highlight: "vigil",
  },
  {
    title: "SEO First",
    description: "Built with search engine rankings in mind.",
    highlight: "vigil",
  },
  {
    title: "Mobile Optimized",
    description: "Perfect experience on all devices.",
    highlight: "vigil",
  },
  {
    title: "Lightning Fast",
    description: "Average load time under 1.5 seconds.",
    highlight: "vigil",
  },
  {
    title: "Ongoing Support",
    description: "We're here when you need us.",
    highlight: "vigil",
  },
];
