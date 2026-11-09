import { CalendarDays, Globe2, Inbox, LineChart, PanelsTopLeft } from "lucide-react";

export const journeyStages = [
  {
    name: "Build", id: "how-it-works", icon: PanelsTopLeft, label: "01 / Project workspace",
    title: "Start with a site that fits.",
    body: "Choose a website and ongoing plan. Tell us about your business through Virtue’s guided setup, or start with a kickoff call where offered. We build it and share a preview for your review.",
    signals: [["Website package", "Selected"], ["Business details", "Ready"], ["Design preview", "In review"]],
    href: "/products/websites", link: "Compare website packages",
  },
  {
    name: "Launch", id: "process-launch", icon: Globe2, label: "02 / Website status",
    title: "Go live on your own domain.",
    body: "Approve the preview and connect your domain with our help. We publish your site and look after hosting, SSL, and platform maintenance. You can see its status in your dashboard.",
    signals: [["Design approval", "Approved"], ["Domain", "Connected"], ["Website", "Live"]],
    href: "/products/vigil#outcomes", link: "See what Vigil manages",
  },
  {
    name: "Respond", id: "process-respond", icon: Inbox, label: "03 / Lead Hub",
    title: "Give every inquiry a next step.",
    body: "When Vigil connects your website’s contact form, new inquiries land in Lead Hub. Read the message, follow up, add an internal note, and track the outcome from one place.",
    signals: [["New inquiry", "Unread"], ["Consultation request", "In progress"], ["Website inquiry", "Replied"]],
    href: "/products/vigil#lead-hub", link: "Explore Lead Hub",
  },
  {
    name: "Book", id: "process-book", icon: CalendarDays, label: "04 / Bookings",
    title: "Turn interest into time on the calendar.",
    body: "On compatible Care and higher sites, Vigil can set up appointment scheduling or restaurant reservations. Set availability and manage requests and confirmed bookings in your dashboard.",
    signals: [["Availability", "Open"], ["Booking request", "Needs review"], ["Appointment", "Confirmed"]],
    href: "/products/vigil#bookings", link: "Explore Bookings",
  },
  {
    name: "Improve", id: "process-improve", icon: LineChart, label: "05 / Website overview",
    title: "See what’s working and keep moving.",
    body: "Overview brings connected traffic, inquiry activity, and site health into view. On Care and above, request changes from the team. Eligible Professional and Growth sites can also get self-service Content Hub editing.",
    signals: [["Traffic", "Connected"], ["Website check", "Passing"], ["Content update", "Ready"]],
    href: "/products/vigil#overview", link: "Explore reporting and care",
  },
] as const;
