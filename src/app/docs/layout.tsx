import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "API docs",
  description: "Swagger UI for the user-management JSON APIs.",
};

export default function DocsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
