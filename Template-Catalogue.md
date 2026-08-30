# The Express Site Catalogue
### You don't build a website. We hand you one.

---

## The Core Idea

Most website tools sell **freedom** — endless drag-and-drop options, a thousand templates, total control.

Small business owners don't want freedom. They want it *handled*. They're already the accountant, the marketer, the scheduler, and the technician for their business — the last thing they want is one more app to learn.

**That's the entire pitch.** Every piece of copy, every page on the sales site, every cold email should reinforce one idea:

> "You already know your trade. We already know your website. You don't have to think about this — just tell us who you are, and it's done."

This is not "pick a template and customize it." It's **"here's your business, already online, built by people who've done this for a hundred businesses just like yours."**

---

## How to Present the Catalogue (don't skip this)

**Don't show a generic grid of templates.** A gallery of interchangeable-looking websites undercuts the entire pitch — it makes it look like they're picking from a pile, which reintroduces the exact decision fatigue you're selling them out of.

Instead, organize the catalogue **by trade, not by "style."** A visitor should land on their specific business type in one click or one scroll — not browse.

Language to use throughout:
- ✅ "Built for [trade]" — not "customizable for any business"
- ✅ "We already know what a great [trade] website needs" — not "hundreds of options"
- ✅ "Answer a few questions. We do the rest." — not "easy to use" or "DIY"
- ❌ Avoid: "flexible," "endless options," "you're in control," "build it yourself" — these are DIY-tool language and work against you

Every template's demo/preview should show **real trade-specific detail** — service lists, before/after photos, an actual-looking quote form, real-sounding business names — never generic stock placeholder content. The prospect needs to see themselves immediately, not imagine themselves.

---

## The Catalogue

### 🏠 Home Services — *Lead Capture (Quote Request)*
*"Get more calls without lifting a finger."*
1. HVAC
2. Plumbing
3. Electrical
4. Roofing & Exterior *(siding, gutters, windows)*
5. Landscaping & Lawn Care

### 🚗 Auto Repair — *Booking Widget*
*"Let customers book their own appointment — even at 11pm."*
1. General Repair / Mechanic
2. Auto Body & Collision
3. Tire & Quick Lube
4. Specialty / Import / Performance

### 💈 Salon, Spa & Barber — *Booking Widget*
*"Your chair, filled — without a single phone call."*
1. Hair Salon
2. Barbershop
3. Nail Salon
4. Day Spa / Esthetics / Massage

### 🍽️ Restaurant — *Reservation Widget + Menu*
*"Your menu, your hours, your table — all in one place."*
1. Casual & Family Dining
2. Cafe / Coffee Shop
3. Bar / Pub
4. Food Truck / Quick Service *(menu + location, no reservations)*

### 🩺 Medical (Solo & Small Practice) — *Booking Widget*
*"Patients book themselves. You just show up."*
1. Chiropractic
2. Massage Therapy
3. Med Spa / Aesthetics
4. Dental — *small/solo only, evaluate compliance scope before offering*

### 💍 Retail & Jewelry — *Inquiry Form*
*"Look established online, even if you're just getting started."*
1. Jewelry Store
2. Boutique / Apparel
3. Gift Shop / Specialty Retail

---

## Behind the Scenes (build system, not client-facing)

24 templates on the surface, but built from **6 shared layout systems** — one per industry — with swappable content blocks (hero, services/menu, gallery, about, contact/CTA) and industry-specific components layered on top:

| Layout System | Key Component |
|---|---|
| Home Services | Quote/estimate request form |
| Auto Repair | Appointment booking widget |
| Salon/Spa/Barber | Appointment booking widget |
| Restaurant | Reservation widget + menu display |
| Medical | Booking widget + external intake link (keep intake off-site) |
| Retail/Jewelry | Contact/inquiry form, no cart/inventory |

This keeps true build effort to 6 systems, not 24 — the catalogue's *breadth* is a sales asset; the *system underneath it* is what keeps it low-effort to maintain.

---

## The One-Line Pitch (use everywhere: emails, landing page, demo video)

> **"We already built the website your business needs. You just have to say yes."**

---

# Engineering reconciliation

*Added 28 Aug 2026, after reading the spec above against the code. The spec is
the owner's; this section is where it meets the build, in the same way
`vigil-leadgen/BUILD-CONTEXT.md` pairs with `EXPRESS.md`.*

## Adopt immediately, costs nothing

The positioning, the language rules, and "organise by trade, not by style" are
free and should land in the storefront copy, the `/express` page and the
outreach drafts now. They also settle an argument the project already had: a
structural-variant axis was built and removed in August because three mediocre
layouts are not better than one excellent one. "Pick your trade, not your look"
is the same conclusion, better expressed.

The rule that every demo shows real trade detail — real service lists, real
prices, real-sounding names, never placeholder — is **already how the showcases
are built** (Northgate Plumbing & Heating, Halstead Motor Works, priced service
lists). Keep it.

## The blocker: every "key component" needs a server

| Layout system | Key component in the spec | What it actually needs |
|---|---|---|
| Home Services | Quote/estimate request form | A POST endpoint and somewhere to put submissions |
| Auto Repair | Appointment booking widget | Availability, confirmations, cancellations |
| Salon/Spa/Barber | Appointment booking widget | Same |
| Restaurant | Reservation widget | Same, plus covers and sittings |
| Medical | Booking widget | Same, and see the compliance note below |
| Retail/Jewelry | Contact/inquiry form | A POST endpoint |

**Express pages are static, self-contained HTML on R2.** `check_no_external_scripts`
in `preflight/checks.py` rejects any script tag at all, inline included, and
`test_the_page_is_self_contained` asserts nothing is fetched. There is no form
endpoint in the project.

This promise was made once and deliberately withdrawn: the old Starter card
offered a "Contact form", the templates had none, and the card was reworded to
"Tap-to-call and email contact" with a note in `EXPRESS-STOREFRONT.md` — *"Do
not put the claim back without building the thing."* The spec reintroduces it
across all six verticals, so the note applies six times over.

**A form is reachable; booking is a different product.** The Cloudflare Worker
already takes authenticated POSTs and writes to KV — that is exactly what the
Stripe webhook does — and `express/orders.py` already pulls from KV into SQLite.
A quote or enquiry form could reuse that whole path: form posts to the Worker,
lands in KV, syncs down with the orders. That is days, not weeks, and it uses
machinery already proven in production.

Booking and reservation widgets are not that. They need availability, state and
two-way confirmation. Realistically they are a third-party embed (Calendly,
Square, OpenTable, Resy), which means **a script tag on a client's page** — and
that breaks the self-contained invariant the whole publishing model rests on.
That is a deliberate architectural decision, not a component choice, and it
should be taken explicitly rather than arrived at by building a catalogue that
assumes it.

**Suggested split:** ship forms (home services, retail) first on the Worker
path; treat booking as its own milestone with the embed decision made up front.
Until then, a template that cannot book should not be sold as one — the catalogue
copy can say "tap to call" without weakening the pitch.

## Medical needs a second look

The spec already flags dental for compliance review. The concern is wider: a
booking widget collects a name, a phone number and often a reason for visiting,
which is arguably PHI regardless of where the intake form lives. This codebase is
deliberately conservative about medical — the fabrication rules refuse to name a
procedure, claim an outcome, or state availability — and a booking widget is a
larger step here than for a barbershop. Worth pricing separately, or shipping
medical without one.

## 24 templates is cheaper than it sounds, but not free

The 24 are **sub-trades, not layouts** — HVAC, plumbing and electrical are the
home-services system with different copy, service lists and photography. The
engine already works that way. So the cost is not 24 designs; it is 24 sets of
showcase content and roughly 50–70 licensed photographs, each needing the checks
`express/assets/SOURCES.md` records: free for commercial use, no attribution, no
identifiable faces, and no rival business's branding visible.

Finding two usable photographs for one vertical took a real slice of a session.
Budget accordingly, and note that photographs are embedded as data URIs, so page
weight scales with them.

## Sequencing

The six base templates are mid-rebuild and are not yet at the quality bar the
tier is priced at — that work started because the templates did not feel like
$599. Finishing those six is what makes the catalogue's breadth worth having.
Expanding to 24 sub-trades before the six read as premium multiplies a problem
rather than solving one.
