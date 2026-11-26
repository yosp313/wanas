# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Customers in Cairo planning an event who want event decor and may also want catering. They choose and provide their own venue and use the site to describe their event, request a quote, and manage the response and any resulting booking.
- Invitation-only WANAS staff review requests, check supplier availability internally, send quotes, manage booking dates, and handle customer change requests.

## Product Purpose

WANAS helps customers plan event decor and optional catering in Cairo, request a tailored quote, and manage the quote and booking online. Success means customers can submit a clear event brief and understand the status and terms of their request, while staff can manage requests and confirmed dates reliably.

## Positioning

No distinct market positioning beyond the documented Cairo event decor and optional catering service has been confirmed. Do not invent comparative claims.

## Operating Context

- Customers describe event type, guest count, date, venue, and budget in Egyptian pounds (EGP). They may let WANAS choose decor or customize it, and may request catering.
- Customers can complete the planner before signing in. They must authenticate with Clerk before submission and return to their completed review. Email magic links and Google sign-in are supported.
- Customers can review requests, quotes, bookings, and booking change requests in My requests.
- Staff use an admin inbox and calendar. Quote acceptance confirms a booking without payment; staff and customers coordinate price changes directly.
- Quote holds last 48 hours. New requests generally require 10 calendar days' notice. Calendar rules use Cairo time.
- Arabic is the default language; Arabic and English are supported across the site and customer notifications. Arabic pages use right-to-left direction.

## Capabilities and Constraints

- The planner supports weddings, katb al-kitab, engagements, birthdays, anniversaries, private dinners, corporate events, and other event types. Customers can add details for an “Other” selection.
- Decor can be curated by WANAS or customized using a moodboard, palette, and decor elements; individual choices may be left to WANAS. Notes and inspiration links are optional.
- Catering is optional. The launch catalog is limited to WANAS-approved options; catalog content and translations remain an operational input.
- Staff can decline requests or send and replace quotes with a total, offered date, included services, and an explanation of scope changes. Supplier availability is checked internally.
- Customers can accept or decline the current quote and request booking changes, cancellation, or rescheduling. Booking changes and rescheduling are subject to date availability and the documented 10-day cutoff.
- The app uses Next.js, Clerk, Supabase Postgres with Drizzle, and Resend for email notifications. The database enforces date capacity.
- Prices and budgets use EGP. Event dates are handled as Cairo calendar dates.
- The project documents a production hosting choice as undecided.

## Brand Commitments

- The product name is WANAS; the repository also uses “WANAS Atelier.”
- The product must support Arabic and English, with Arabic as the default language.

## Evidence on Hand

- Product and workflow requirements: [docs/v1-product-scope.md](docs/v1-product-scope.md).
- Technical and operational design: [docs/v1-technical-design.md](docs/v1-technical-design.md) and the ADRs in `docs/adr/`.
- The repository contains event and decor imagery in `public/atelier/` and `public/decor-fixtures/`, plus planner and request layout references in `stitch-exports/`. Their presence does not establish customer endorsements or independently verified case studies.
- No confirmed testimonials, customer results, or third-party endorsements are documented. Do not fabricate them.

## Product Principles

- Let customers describe their event before requiring sign-in; authenticate at submission.
- Give customers control over decor detail while allowing them to delegate choices to WANAS.
- Keep catering optional and use only approved catalog options.
- Preserve a clear record of requests, quote terms, and booking changes.
- Provide equivalent customer workflows in Arabic and English, and honor the customer's chosen language in notifications.
