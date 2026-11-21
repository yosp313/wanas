# Require an account at request submission

Customers can complete the planner as guests. Submitting an event request requires a customer account through Clerk. This keeps the planner open for browsing and gives customers a signed-in place to review and respond to their quotes.

Customers sign in with an email magic link or Google. The planner preserves their choices and returns them to final review so they can submit. Quote notification emails link to the signed-in request page.

Final review collects a name and mobile number for event coordination. Customers can find their quotes, bookings, and change requests on the My requests page.

WANAS grants staff access by invitation. One admin role covers request review, quoting, and calendar management. Staff sign in through Clerk. Postgres stores grants and revocations against the application UUID and checks access on every protected operation.
