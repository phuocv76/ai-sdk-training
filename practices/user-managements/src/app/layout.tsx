import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// Components
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";

// Constants
import { APP_METADATA_MESSAGES } from "@/constants/messages";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Site-wide title and meta description sourced from centralized copy. */
export const metadata: Metadata = {
  title: APP_METADATA_MESSAGES.TITLE,
  description: APP_METADATA_MESSAGES.DESCRIPTION,
};

/**
 * Root HTML shell wrapping all routes with global fonts and auth provider.
 */
const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
};

export default RootLayout;
