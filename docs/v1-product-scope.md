# WANAS v1 product scope

WANAS offers event decor and optional catering in Cairo. Prices and customer budget ranges are in Egyptian pounds (EGP). Venue sourcing is deferred. The site launches in Arabic and English, with Arabic as the default.

## Customer planner

- The homepage shows examples of WANAS decor and links to **Plan your event**. The [Stitch exports](../stitch-exports/) guide the planner and moodboard layouts.
- Collect event type, estimated guest count, event date, venue name, street address, venue type, and one budget range for decor and any requested catering.
- Start with Wedding, Katb El-Ketab, Engagement, Birthday, Anniversary, Private Dinner, Corporate Event, and Other. Venue types are Apartment, Villa, Garden, Hall, Hotel, and Other. Require a written description when the customer selects Other in either list.
- Offer **Curate it for me** and **Customize my decor**. In the second mode, let the customer choose a moodboard, palette, and decor elements such as the backdrop, florals, and table styling. Customers can leave individual choices to WANAS. Both modes accept optional notes and inspiration links.
- Catering is optional in both modes. Customers can choose canapés, buffet, or plated dining, or ask WANAS to recommend a format. Launch with a fixed catalog of WANAS-approved options.
- Customers can complete the planner as guests. Final review collects a name and mobile number. Before submission, customers sign in with a Supabase email code and return to their completed review. **My requests** shows their requests, quotes, bookings, and booking change requests.

## Review and booking

- The admin inbox contains requests that need action. Admins can decline a request or send a quote with one total, the offered date, and the services included. They can adjust the scope and explain the change alongside the original request. WANAS checks supplier availability internally.
- Sending a quote opens a 48-hour hold. A customer can accept or decline the current quote. An acceptance confirms the booking without payment. A decline or expiry releases the date. Admins can replace or resend a quote if the date is available.
- New requests require 10 calendar days' notice. The public date picker marks booked dates unavailable and shows held dates as open to requests. When a hold becomes a booking, the admin inbox flags competing requests so WANAS can discuss an alternative date or close them.
- Apply the 10-day minimum when an admin offers a different date or reschedules a booking. A quote for the original requested date can go out closer to the event if its full 48-hour hold expires before the event day begins in Cairo.
- Invitation-only admins use a month calendar with confirmed bookings visible by default. They can show pending requests and click an entry to open its details.
- Customers can request changes, cancellation, or rescheduling after confirmation. Admins apply agreed changes through the end of the Cairo calendar day 10 days before the booking. Cancellation frees the original date and rescheduling requires an available new date. WANAS agrees on price changes directly with the customer and records the outcome.
- Email the customer after submission, when a quote is ready, if WANAS declines the request, when a booking is confirmed, and when WANAS cancels or reschedules it. Use the customer's chosen language and link quote emails to the signed-in request page.
