import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Business-Wissensplattform | Markus Coenen", description: "Privates Recherchearchiv mit belegten und versionierten Videoanalysen.", icons: { icon: "/favicon.svg" }, robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="de"><body>{children}</body></html>; }
