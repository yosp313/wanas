import { Suspense, type ReactNode } from "react";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
