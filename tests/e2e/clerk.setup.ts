import { clerkSetup } from "@clerk/testing/playwright";

export default async function setup() {
  if (process.env.E2E_FULL_FLOW === "1") await clerkSetup({ dotenv: false });
}
