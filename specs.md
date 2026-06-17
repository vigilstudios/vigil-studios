# Vigil Studios Website Specification

## Project Overview

Build a premium, high-converting marketing website for **Vigil Studios**, a modern web development agency focused on custom-coded websites for small businesses.

The website must immediately communicate:

* Premium quality
* Technical expertise
* Attention to detail
* Modern design
* Fast performance
* Trustworthiness

The experience should feel more like a modern SaaS landing page than a traditional agency website.

The design language should be minimal, elegant, responsive, and interactive.

Primary goal:

* Generate qualified leads through the contact form

Secondary goals:

* Showcase development capability
* Establish credibility
* Display pricing transparently
* Convert visitors into discovery calls

---

## Brand Guidelines

### Brand Name

Vigil Studios

### Domain

vigilstudios.co

### Logo Usage

* Primary wordmark: "vigil studios*"
* Secondary mark: "V*"

### Visual Identity

* Typography-first branding
* Minimalistic
* Premium
* Technical
* Sophisticated

### Color Palette

Background:

* #0A0A0A

Primary Text:

* #F5F5F3

Secondary Text:

* #A1A1AA

Accent Color:

* #166534

Accent Hover:

* #15803D

Border Color:

* rgba(255,255,255,0.08)

### Typography

Headings:

* Space Grotesk

Body:

* Inter

Font Weights:

* 400
* 500
* 600
* 700

---

## Tech Stack

Framework:

* Next.js 15
* React
* TypeScript

Styling:

* Tailwind CSS

Animations:

* Framer Motion

Icons:

* Lucide React

Forms:

* React Hook Form
* Zod validation
* Resend integration

Deployment:

* Vercel

Analytics:

* Vercel Analytics

SEO:

* Next.js Metadata API
* Dynamic OG images
* robots.txt
* sitemap.xml
* Structured data JSON-LD

Performance Goals:

* Lighthouse score above 95
* Core Web Vitals optimized
* Server components by default
* Image optimization enabled

---

## Design Principles

The site must feel:

* Dynamic
* Fluid
* Interactive
* Responsive
* Lightweight

Avoid:

* Generic templates
* Heavy gradients
* Excessive glassmorphism
* Overly complex animations
* Large blocks of text

Use:

* Smooth scroll animations
* Subtle hover effects
* Animated section reveals
* Micro-interactions
* Layered backgrounds
* Cursor-follow effects (subtle)
* Grid patterns
* Noise textures
* Animated accent lines

Animations should enhance the experience without hurting performance.

---

## Navigation

Sticky navigation bar with transparent background that transitions on scroll.

Navigation items:

* Services
* Portfolio
* Pricing
* Process
* About
* Contact

Right side CTA button:

"Book a Call"

Mobile navigation:

* Full-screen animated menu

---

## Homepage Structure

### Hero Section

Full viewport height.

Content:

Eyebrow:

"Custom Websites for Modern Businesses"

Headline:

"Websites engineered to convert."

Subheadline:

"Custom-coded websites built for speed, SEO, and growth."

Primary CTA:

"Book a Call"

Secondary CTA:

"View Portfolio"

Hero background:

* Animated grid
* Subtle motion effects
* Floating UI elements
* Minimal geometric accents

Optional stats:

* 100+ performance scores
* SEO optimized
* Fully responsive

---

### Services Section

Cards with hover animations.

Services:

* Custom Websites
* Landing Pages
* E-Commerce
* SEO Optimization
* Website Maintenance
* Performance Optimization

Each card should include:

* Icon
* Title
* Short description

---

### Portfolio Section

Grid layout with interactive cards.

Include placeholder projects.

Each card should contain:

* Project image
* Industry
* Brief summary
* Tech stack
* Results

Examples:

* Roofing company
* Auto detailing business
* Restaurant
* Fitness coach

Hover effects:

* Image zoom
* Overlay details
* Animated cursor

---

### Process Section

Four-step timeline.

1. Discovery
2. Design
3. Development
4. Launch

Each step should have:

* Number
* Icon
* Description

---

### Why Vigil Section

Highlight differentiators.

Examples:

* Custom coded
* No templates
* SEO first
* Mobile optimized
* Lightning fast
* Ongoing support

Use comparison layout:

Vigil Studios vs Traditional Website Builders

---

### Pricing Section

Display transparent pricing.

#### Starter

$499

* Single-page website
* Mobile responsive
* Contact form
* Basic SEO

#### Professional

$1,499

* Multi-page website
* Advanced SEO
* Custom design
* Analytics setup

#### Growth

Starting at $2,999

* E-commerce
* Integrations
* Advanced functionality
* Custom solutions

Maintenance:

$49/month

Include CTA:

"Request a Quote"

---

### Testimonials Section

Use placeholder testimonials.

Include:

* Name
* Business
* Role
* Quote

Design:

* Carousel or grid

---

### FAQ Section

Accordion layout.

Questions:

* How long does a website take?
* Do I own the website?
* Do you offer maintenance?
* Can you redesign my existing site?
* Do you help with SEO?

---

### Contact Section

Two-column layout.

Left:

* Headline
* Email
* Service area
* Calendly link placeholder

Right:

Form fields:

* Name
* Email
* Company
* Service Needed
* Budget
* Message

Validation:

* Client-side
* Server-side

Submission:

* Send email using Resend

Success state:

* Animated confirmation message

---

### Footer

Include:

* Logo
* Navigation
* Social links
* Email address
* Copyright

Footer text:

"Building websites that drive growth."

---

## SEO Requirements

SEO is a foundational requirement.

Implement:

* Metadata API
* Dynamic titles
* Dynamic descriptions
* Canonical URLs
* Open Graph tags
* Twitter cards
* robots.txt
* sitemap.xml

Create structured data:

* Organization schema
* LocalBusiness schema
* Service schema

Metadata example:

Title:

Vigil Studios | Custom Web Development Agency

Description:

Custom-coded websites built for speed, SEO, and growth.

Keywords:

* web design
* web development
* Long Island web developer
* custom websites
* SEO services

Optimize:

* Semantic HTML
* Proper heading hierarchy
* Accessibility
* Alt text
* Internal linking

---

## Accessibility Requirements

Meet WCAG AA standards.

Requirements:

* Keyboard navigation
* Focus states
* Proper contrast ratios
* ARIA labels
* Screen reader support

---

## Performance Requirements

Target:

* First Contentful Paint under 1.5 seconds
* Largest Contentful Paint under 2.5 seconds

Requirements:

* Lazy load images
* Optimize fonts
* Minimize JavaScript
* Use server components where possible
* Use dynamic imports when needed

---

## File Structure

src/

* app/
* components/
* sections/
* lib/
* hooks/
* types/
* styles/

components/

* ui/
* layout/

sections/

* hero
* services
* portfolio
* process
* pricing
* testimonials
* faq
* contact

lib/

* seo
* analytics
* email

public/

* images
* icons
* logos

---

## Deliverables

Generate:

* Fully responsive homepage
* Reusable components
* Tailwind utility classes
* TypeScript interfaces
* Placeholder content
* SEO foundation
* Animations
* Contact form integration points

Prioritize:

1. Design quality
2. Responsiveness
3. Performance
4. Accessibility
5. SEO

The final result should feel like a premium digital agency capable of delivering world-class websites.
