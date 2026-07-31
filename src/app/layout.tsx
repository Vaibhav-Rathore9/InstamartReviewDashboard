import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Instamart Category Discovery Engine",
  description:
    "AI-powered review discovery + basket-gap agent for Swiggy Instamart growth",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold text-brand-navy">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange text-sm text-white">
                IM
              </span>
              Instamart Discovery
            </Link>
            <nav className="flex gap-4 text-sm font-medium text-slate-600">
              <Link href="/workflow" className="hover:text-brand-orange">
                Workflow
              </Link>
              <Link href="/agent" className="hover:text-brand-orange">
                Basket-Gap Agent
              </Link>
              <Link href="/research" className="hover:text-brand-orange">
                Research
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
