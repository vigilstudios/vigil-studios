import { CalendarDays, Globe2, Inbox, LineChart, Package, PanelsTopLeft } from "lucide-react";

export const journeyStages = [
  {
    name: "Build", id: "how-it-works", icon: PanelsTopLeft, label: "01 / Project workspace",
    title: "Your ambition.", accent: "Made visible.", kicker: "First, make your mark.",
    note: "Choose your build + an ongoing Vigil plan.",
    body: "You bring the vision. We turn it into a website that feels like you. Share your brief, see it take shape, and make it yours before the world sees it.",
    href: "/products/websites", link: "Compare website packages",
  },
  {
    name: "Launch", id: "process-launch", icon: Globe2, label: "02 / Website status",
    title: "Your next chapter.", accent: "Now live.", kicker: "Then, open your doors.",
    note: "Your domain. Managed hosting. SSL included.",
    body: "That idea is now a place people can find you. Approve your site, connect your domain with our help, and let Vigil look after the everyday running.",
    href: "/products/vigil#outcomes", link: "See what Vigil manages",
  },
  {
    name: "Respond", id: "process-respond", icon: Inbox, label: "03 / Lead Hub",
    title: "A simple hello.", accent: "A new possibility.", kicker: "Give interest somewhere to go.",
    note: "Inquiries arrive through your connected website form.",
    body: "Someone likes what they see. Now the conversation can begin. Lead Hub brings their inquiry, your follow-up, and the next step into one clear view.",
    href: "/products/vigil#lead-hub", link: "Explore Lead Hub",
  },
  {
    name: "Book", id: "process-book", icon: CalendarDays, label: "04 / Bookings",
    title: "From interested.", accent: "To booked.", kicker: "Make the next step effortless.",
    note: "Available with setup on compatible Care-and-higher sites.",
    body: "A conversation. A consultation. A table for two. Give people a way to book, then manage your availability and confirmations in one place.",
    href: "/products/vigil#bookings", link: "Explore Bookings",
  },
  {
    name: "Products", id: "process-products", icon: Package, label: "05 / Product catalog",
    title: "What you offer.", accent: "In its best light.", kicker: "Give your products a place to shine.",
    note: "Catalog availability and setup depend on your website.",
    body: "Bring your collection into focus. Organize your products, shape each listing, and show customers what makes every piece worth a closer look.",
    href: "/products/vigil", link: "Explore the business platform",
  },
  {
    name: "Improve", id: "process-improve", icon: LineChart, label: "06 / Your business, in view",
    title: "Your business.", accent: "Understood.", kicker: "Your website is the foundation.",
    note: "Tools and support depend on your setup and plan.",
    body: "A business platform for your customers, bookings, and products. A team that knows your business, understands your goals, and helps you take the next step.",
    href: "/products/vigil", link: "Discover the Vigil platform",
  },
] as const;
