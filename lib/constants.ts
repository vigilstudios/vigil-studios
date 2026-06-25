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

export const PRICING_TIERS = [
  {
    name: "Starter",
    price: "799",
    description: "Perfect for small businesses",
    features: [
      { label: "Single-page website", type: "check" },
      { label: "Mobile responsive", type: "check" },
      { label: "Contact form", type: "check" },
      { label: "Basic SEO", type: "check" },
      { label: "Design Direction", type: "number", value: 1 },
      { label: "Revision Round", type: "number", value: 1 },
    ],
    cta: "Get Started",
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
